"""
Exceptions for novels and chapters
"""

from ..exceptions import *

class NovelIDNotFoundException(IDNotFoundException):
    pass

class RawChapterIDNotFoundException(IDNotFoundException):
    pass

class RawChapterRevisionIDNotFoundException(IDNotFoundException):
    pass