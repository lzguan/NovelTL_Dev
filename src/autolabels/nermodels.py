from typing import Dict, Protocol, TypeVar, List, Generator, Tuple
from . import schemas
from .exceptions import *
from .utils import Priority, _chunk_text
import logging

my_logger = logging.getLogger(__name__)
my_logger.propagate = True

class Tokenizer(Protocol):
    """
    Abstract class for a tokenizer for use in NER models.
    """
    def tokenize(self, text : str) -> List[str]:
        """
        Returns a list of token strings.

        Args:
            text: Text to tokenize.
        """
        ...
    
    def tokenize_words(self, text : str) -> List[Tuple[str, int]]:
        """
        Returns a list of tuples (word, num_tokens).

        Args:
            text: Text to tokenize.
        """
        ...
    
    def _chunk_paragraph(self, text : str, max_chunk_size : int, start_pos : int, words : List[Tuple[str, int]]) -> Generator[Tuple[str, int], None, None]:
        """
        Returns a generator that yields chunks of the original text, each chunk having no more than max_chunk_size tokens. Used as a helper function for chunk_text.

        Args:
            text: Text to chunk.
            max_chunk_size: Maximum number of tokens in a chunk.
            start_pos: Starting position in the original text.
        """
        chunk_start_offset = 0
        chunk_cur_offset = 0
        chunk_size = 0
        for word, sz in words:
            if chunk_size + sz > max_chunk_size:
                yield text[chunk_start_offset : chunk_cur_offset], start_pos + chunk_start_offset
                chunk_start_offset = chunk_cur_offset
                chunk_size = 0
            chunk_cur_offset = text.find(word, chunk_cur_offset)
            if chunk_cur_offset == -1:
                raise ValueError("Better return message")
            chunk_cur_offset += len(word)
            chunk_size += sz
        if chunk_size > 0:
            yield text[chunk_start_offset : ], start_pos + chunk_start_offset

    
    def chunk_text(self, text : str, separators : Dict[str, Priority], max_chunk_size : int, force_chunk : bool = False) -> Generator[Tuple[str, int], None, None]:
        """
        Return a generator that returns chunks of the original text, each chunk having no more than max_chunk_size tokens. 

        Args:
            text: Text to chunk.
            separators: A dictionary of separator characters, each associated with some priority. Whenever possible, chunk_text will attempt to make chunks ending with a separator of highest priority.
            max_chunk_size: Maximum number of tokens in a chunk.
            force_chunk: When set to True, may chunk even when a chunk does not end in a separator. When set to False, will throw an error if it is impossible to chunk text in a way that each non-final chunk has a separator at the end.
        
        Raises:
            ChunkTooLargeException: In the case that force_chunk == False, there is a chunk of text between two separators that has more tokens than max_chunk_size. In the case that force_chunk == True, only raise when there is a word that has more tokens than max_chunk_size.
        """
        priority_buffers : Dict[Priority, Tuple[int, int, int]] = { priority : (0, 0, 0) for priority in Priority} # priority : (index in all_buffer, size in tokens of buffer, end pos of buffer)
        all_buffer : List[str] = [] # buffer of lines
        all_buffer_size = 0
        all_buffer_start = 0
        all_buffer_end = 0
        yielded = True
        # Invariant: all_buffer contains only lines ending with separators

        for line, start_pos, priority in _chunk_text(text, separators):
            add_to_buffer = True
            words = self.tokenize_words(line)
            line_size = sum(sz for _, sz in words)
            while all_buffer_size + line_size > max_chunk_size:
                yielded = False
                for prio in Priority:
                    idx, p_size, p_end = priority_buffers[prio]
                    if idx > 0:
                        yield ''.join(all_buffer[:idx]), all_buffer_start
                        yielded = True
                        for prio2 in Priority:
                            priority_buffers[prio2] = (
                                max(priority_buffers[prio2][0] - idx, 0), 
                                max(priority_buffers[prio2][1] - p_size, 0),
                                max(priority_buffers[prio2][2], p_end)
                            )
                        
                        all_buffer = all_buffer[idx:]
                        all_buffer_size = all_buffer_size - p_size
                        all_buffer_start = p_end
                        break
                if not yielded:
                    if not force_chunk:
                        raise ChunkTooLargeException()
                    # try to chunk this line
                    yield from self._chunk_paragraph(line, max_chunk_size, start_pos, words)
                    all_buffer_start = start_pos + len(line)
                    all_buffer_end = all_buffer_start
                    all_buffer = []
                    all_buffer_size = 0
                    for prio in Priority:
                        priority_buffers[prio] = (0, 0, all_buffer_start)
                    add_to_buffer = False
                    break
            if not add_to_buffer:
                continue
            all_buffer.append(line)
            all_buffer_size = all_buffer_size + line_size
            all_buffer_end = start_pos + len(line)
            if priority is None:
                # no lines left
                continue
            for prio in Priority:
                if prio >= priority:
                    priority_buffers[prio] = (len(all_buffer), all_buffer_size, all_buffer_end)
        yield ''.join(all_buffer), all_buffer_start

P = TypeVar('P', contravariant=True, bound=schemas.NERModelParamsBase)
class NERModel(Protocol[P]):
    """
    Abstract class for a NER model.

    Attributes:
        model_name: Name of the NER model.
        is_deterministic: Whether the model is deterministic.
    """

    model_name : str
    is_deterministic : bool

    def model_predict(self, text : str, params : P) -> List[Dict]:
        """
        Returns a list of named entities in text in the format 
            ```
            {
                'entity_group' : ...
                'score' : ...
                'word' : ...
                'start' : ...
                'end' : ...
            }
            ```
        Acts mostly as a wrapper for an underlying model predict call.
        
        Args:
            text: Text to predict on.
            params: Parameters for the NER model.
        """
        ...
    
    def predict(self, text : str, params : P) -> List[Dict]:
        """
        Returns a list of named entities in text in the format 
            ```
            {
                'entity_group' : ...
                'score' : ...
                'word' : ...
                'start' : ...
                'end' : ...
            }
            ```
        Acts as a wrapper for calling model_predict.
        
        Args:
            text: Text to predict on.
            params: Parameters for the NER model.
        """
        ...
    
    def get_tokenizer(self) -> Tokenizer:
        """
        Returns the tokenizer used by this NER model.
        """
        ...