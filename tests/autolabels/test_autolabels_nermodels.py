"""
Todo: Refactor AI generated tests.
"""

from typing import List, Tuple
import pytest
from src.autolabels.nermodels import Tokenizer
from src.autolabels.utils import Priority, _chunk_text
from src.autolabels.exceptions import ChunkTooLargeException


def test_chunk_text_helper():
    separators = {
        '.': Priority.HIGH, 
        ',': Priority.MED, 
        ' ': Priority.LOW
    }
    text = "Hello, world. This is a test"
    chunks = list(_chunk_text(text, separators))
    expected_chunks = [
        ("Hello,", 0, Priority.MED),
        (" ", 6, Priority.LOW),
        ("world.", 7, Priority.HIGH),
        (" ", 13, Priority.LOW),
        ("This ", 14, Priority.LOW),
        ("is ", 19, Priority.LOW),
        ("a ", 22, Priority.LOW),
        ("test", 24, None)
    ]
    assert chunks == expected_chunks

    text2 = "NoSeparatorsHere"
    chunks2 = list(_chunk_text(text2, separators))
    expected_chunks2 = [
        ("NoSeparatorsHere", 0, None)
    ]
    assert chunks2 == expected_chunks2

class TokenizerTest1(Tokenizer):
    def tokenize(self, text: str) -> List[str]:
        return text.strip().split(' ')
    
    def tokenize_words(self, text: str) -> List[Tuple[str, int]]:
        return [(word, 1) for word in self.tokenize(text)]

class TokenizerTest2(Tokenizer):
    def tokenize(self, text: str) -> List[str]:
        split_text = text.strip().split(' ')
        merge_text : List[str] = []
        for txt in split_text:
            if len(merge_text) > 0 and merge_text[-1] in ['a', 'the']:
                merge_text[-1] = merge_text[-1] + ' ' + txt
            else:
                merge_text.append(txt)
        return merge_text
    
    def tokenize_words(self, text: str) -> List[Tuple[str, int]]:
        return [(word, word.count(' ') + 1) for word in self.tokenize(text)]

def test_priority_enum():
    assert Priority.HIGH < Priority.MED
    assert Priority.MED < Priority.LOW
    assert Priority.HIGH < Priority.LOW

def test_tokenizer_tokenize_simple():
    tokenizer1 = TokenizerTest1()
    text = "This is a test."
    tokens = tokenizer1.tokenize(text)
    assert tokens == ["This", "is", "a", "test."]

    text2 = "Word1\tWord2\nWord3 Word4 Word5"
    tokens_words_2 = tokenizer1.tokenize_words(text2)
    assert tokens_words_2 == [("Word1\tWord2\nWord3", 1), ("Word4", 1), ("Word5", 1)]

    tokenizer2 = TokenizerTest2()
    tokens_3 = tokenizer2.tokenize(text)
    assert tokens_3 == ["This", "is", "a test."]
    tokens_words_3 = tokenizer2.tokenize_words(text)
    assert tokens_words_3 == [("This", 1), ("is", 1), ("a test.", 2)]

    text3 = "the quick brown fox jumps over the lazy dog"
    tokens_4 = tokenizer2.tokenize(text3)
    assert tokens_4 == ["the quick", "brown", "fox", "jumps", "over", "the lazy", "dog"]
    tokens_words_4 = tokenizer2.tokenize_words(text3)
    assert tokens_words_4 == [("the quick", 2), ("brown", 1), ("fox", 1), ("jumps", 1), ("over", 1), ("the lazy", 2), ("dog", 1)]


def test_chunk_paragraph_behaviour():
    tokenizer1 = TokenizerTest1()
    text = "This is a test paragraph to check chunking behavior."
    max_chunk_size = 5  # in tokens
    chunks = list(tokenizer1._chunk_paragraph(text, max_chunk_size, 0, tokenizer1.tokenize_words(text)))
    chunks_text = [chunk for chunk, _ in chunks]
    assert text == ''.join(chunks_text)
    assert all(chunk == text[start:start+len(chunk)] for chunk, start in chunks)

    tokenizer2 = TokenizerTest2()
    text2 = "the quick brown fox jumps over the lazy dog"
    max_chunk_size2 = 4  # in tokens
    chunks2 = list(tokenizer2._chunk_paragraph(text2, max_chunk_size2, 0, tokenizer2.tokenize_words(text2)))
    chunks_text2 = [chunk for chunk, _ in chunks2]
    assert text2 == ''.join(chunks_text2)
    assert all(chunk == text2[start:start+len(chunk)] for chunk, start in chunks2)

def test_chunk_text_basic():
    tokenizer1 = TokenizerTest1()
    text = "Hello, world. This is a test"
    max_chunk_size = 4  # in tokens
    separators = {
        '.': Priority.HIGH, 
        ',': Priority.MED, 
    }
    chunks = list(tokenizer1.chunk_text(text, separators, max_chunk_size, force_chunk=False))
    chunks_text = [chunk for chunk, _ in chunks]
    assert text == ''.join(chunks_text)
    assert all(chunk == text[start:start+len(chunk)] for chunk, start in chunks)

    tokenizer2 = TokenizerTest2()
    text2 = "the quick brown fox jumps over the lazy dog"
    max_chunk_size2 = 5  # in tokens
    separators2 = {
        '.': Priority.HIGH, 
        ',': Priority.MED
    }
    with pytest.raises(ChunkTooLargeException):
        chunks_2 = list(tokenizer2.chunk_text(text2, separators2, max_chunk_size2, force_chunk=False))
    
    chunks_2 = list(tokenizer2.chunk_text(text2, separators2, max_chunk_size2, force_chunk=True))
    assert ''.join(chunk for chunk, _ in chunks_2) == text2
    assert all(chunk == text2[start:start+len(chunk)] for chunk, start in chunks_2)

class MockTokenizer(Tokenizer):
    def tokenize(self, text: str) -> List[str]:
        return list(text)
    
    def tokenize_words(self, text: str) -> List[Tuple[str, int]]:
        return [(c, 1) for c in text]

@pytest.fixture
def char_tokenizer():
    return MockTokenizer()

def test_priority_backtracking(char_tokenizer):
    separators = {
        '\n': Priority.HIGH,
        '.': Priority.MED,
        ',': Priority.LOW
    }
    text = "a,b\nc," 
    chunks = list(char_tokenizer.chunk_text(
        text, 
        separators, 
        max_chunk_size=5, 
        force_chunk=True
    ))

    assert ''.join(chunk for chunk, _ in chunks) == text
    assert len(chunks) == 2
    assert chunks[0][0] == "a,b\n"
    assert chunks[1][0] == "c,"

    text2 = "a\nb,c.d,e"
    chunks2 = list(char_tokenizer.chunk_text(
        text2, 
        separators, 
        max_chunk_size=6, 
        force_chunk=True
    ))
    assert ''.join(chunk for chunk, _ in chunks2) == text2
    assert len(chunks2) == 3
    assert chunks2[0][0] == "a\n"
    assert chunks2[1][0] == "b,c."
    assert chunks2[2][0] == "d,e"

def test_flush_buffer_before_massive_unit(char_tokenizer):
    separators = {' ': Priority.LOW}
    text = "Hi MassiveBlock" 
    max_size = 5
    
    chunks = list(char_tokenizer.chunk_text(
        text, 
        separators, 
        max_chunk_size=max_size, 
        force_chunk=True
    ))
    
    assert chunks[0][0] == "Hi "
    joined_result = "".join(c[0] for c in chunks)
    assert joined_result == text

def test_no_valid_separator_in_buffer(char_tokenizer):
    separators = {'.': Priority.HIGH}
    text = "ABCDEF"
    max_size = 3
    
    with pytest.raises(ChunkTooLargeException):
        list(char_tokenizer.chunk_text(text, separators, max_size, force_chunk=False))

    chunks = list(char_tokenizer.chunk_text(text, separators, max_size, force_chunk=True))
    
    assert chunks[0][0] == "ABC"
    assert chunks[1][0] == "DEF"
    assert "".join(c[0] for c in chunks) == text

def test_chunk_paragraph_find_error():
    class BadTokenizer(Tokenizer):
        def tokenize_words(self, text: str) -> List[Tuple[str, int]]:
            # RETURNS LOWERCASE tokens ("a")
            # Text is UPPERCASE ("A")
            return [("a", 1)]
            
        def tokenize(self, text): return []
        def _chunk_paragraph(self, *args, **kwargs):
            # We are testing the logic inside your abstract class, 
            # effectively testing the implementation provided in the prompt
            return Tokenizer._chunk_paragraph(self, *args, **kwargs)

    tokenizer = BadTokenizer()
    text = "A" 
    
    # Logic: chunk_size=0. "a" (size 1) > 0. Triggers split.
    # text.find("a") will fail on "A".
    
    gen = tokenizer._chunk_paragraph(text, max_chunk_size=0, start_pos=0, words=[("a", 1)])
    
    with pytest.raises(ValueError) as e:
        list(gen)
    
    assert "Better return message" in str(e.value)

@pytest.fixture
def separators():
    return {
        "\n": Priority.HIGH,
        ".": Priority.MED,
        ",": Priority.LOW,
        " ": Priority.LOW
    }

# --- 2. The Stress Tests ---

def test_zero_token_infinite_loop(separators):
    """
    Scenario: Input text exists, but tokenizer says it has 0 tokens.
    Expected: Should still chunk/yield based on characters or line logic, 
    NOT hang forever in the while loop.
    """
    class ZeroTokenizer(MockTokenizer):
        def tokenize(self, t): return []
        def count_tokens(self, t): return 0
        def tokenize_words(self, t): return [(t, 0)]

    # Use the instance
    zero_tok = ZeroTokenizer()
    max_chunk_size = 5
    
    text = "InvisibleContent" * 5
    
    # CALL YOUR METHOD DIRECTLY
    chunks = list(zero_tok.chunk_text(
        text, 
        separators, 
        max_chunk_size, 
        force_chunk=True
    ))
    
    assert len(chunks) > 0
    assert "".join(c[0] for c in chunks) == text

def test_buffer_maximization(char_tokenizer, separators):
    """
    Scenario: 10 chars. Max size 10.
    Expected: 1 chunk of size 10. NOT 2 chunks of size 9 and 1.
    Catches off-by-one errors ( > vs >= ).
    """
    max_chunk_size = 10
    text = "a" * 10 
    
    # We rely on force_chunk=True to flush the buffer at the end
    chunks = list(char_tokenizer.chunk_text(
        text, 
        separators, 
        max_chunk_size, 
        force_chunk=True
    ))
    
    assert len(chunks) == 1
    assert len(chunks[0][0]) == 10

def test_unicode_safety(char_tokenizer, separators):
    """
    Scenario: Multi-byte characters (Emojis).
    Expected: Splits respect character boundaries, not byte boundaries.
    """
    text = "😊" * 20
    max_chunk_size = 2 
    
    # Python strings handle unicode natively, so len("😊") is usually 1.
    # This checks that our math doesn't accidentally use byte-len.
    chunks = list(char_tokenizer.chunk_text(
        text, 
        separators, 
        max_chunk_size, 
        force_chunk=True
    ))
    
    reconstructed = "".join(c[0] for c in chunks)
    assert reconstructed == text