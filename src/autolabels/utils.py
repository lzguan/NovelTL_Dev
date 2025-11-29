from typing import Dict, Generator, Tuple
from .exceptions import *
from enum import IntEnum

class Priority(IntEnum):
    HIGH = 1
    MED = 2
    LOW = 3

def _chunk_text(text : str, separators : Dict[str, Priority]) -> Generator[Tuple[str, int, Priority | None], None, None]:
    """
    Separates text into chunks ending with an element in separators. Only supports single character separators. Return format is a generator yielding tuples of (chunk_text, chunk_start_pos, separator_priority).

    Args:
        text: Text to chunk.
        separators: Dictionary of separator characters to split chunks on, along with their priority levels.
    
    """
    pos_last_sep = 0
    pos = 0
    while pos < len(text):
        if text[pos] in separators:
            yield text[pos_last_sep:pos + 1], pos_last_sep, separators[text[pos]]
            pos_last_sep = pos + 1
        pos += 1
    if pos > pos_last_sep:
        yield text[pos_last_sep:pos], pos_last_sep, None