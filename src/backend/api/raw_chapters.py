from ...database.models import raw_chapter, novel
from sqlalchemy.orm import Session
from typing import List

def create_raw_chapter(novel_id : int, pos : int, session : Session):
    """Create a raw chapter corresponding to novel_id at chapter number pos
        requires: 0 < pos <= # of chapters of novel + 1, will raise exception if this requirement not met
    """
    pass

def get_raw_chapter_text_by_raw_chapter_id(raw_chapter_id : int, session : Session) -> str:
    """Get the text of the chapter raw_chapter_id"""
    pass

def get_raw_chapter_text_by_novel_chapter_num(novel_id : int, chapter_num : int, session : Session) -> str:
    """Get the text of the chapter in novel novel_id with chapter number chapter_num"""
    pass

