"""
Exceptions used in the autolabeling service
"""

class ChunkTooLargeException(Exception):
    """
    Exception raised when a text chunk exceeds the maximum allowed size.
    """
    pass

class TokenDoesNotExistException(Exception):
    """
    Exception raised when a token is expected but not found in text.
    """