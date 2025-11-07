"""
Pydantic models for novels and chapters.
"""

from pydantic import BaseModel

class Novel(BaseModel):
    novel_id : int
    novel_title : str
    novel_description : str | None = None
    novel_author : str | None = None

    language_id : int

class CreateNovel(BaseModel):
    novel_title : str
    novel_description : str | None = None
    novel_author : str | None = None

    language_id : int

class UpdateNovel(BaseModel):
    novel_title : str | None = None
    novel_description : str | None = None
    novel_author : str | None = None

class RawChapter(BaseModel):
    raw_chapter_id : int
    raw_chapter_num : int
    
    novel_id : int

class CreateRawChapter(BaseModel):
    raw_chapter_num : int

class RawChapterRevision(BaseModel):
    raw_chapter_revision_id : int
    raw_chapter_revision_title : str
    raw_chapter_revision_is_primary : bool
    raw_chapter_revision_is_public : bool

    raw_chapter_id : int
    raw_chapter_revision_text : str

class RawChapterRevisionMeta(BaseModel):
    raw_chapter_revision_id : int
    raw_chapter_revision_title : str
    raw_chapter_revision_is_primary : bool
    raw_chapter_revision_is_public : bool

    raw_chapter_id : int

class CreateRawChapterRevision(BaseModel):
    raw_chapter_revision_title : str
    raw_chapter_revision_text : str | None = None

class UpdateRawChapterRevision(BaseModel):
    raw_chapter_revision_title : str | None = None
    raw_chapter_revision_text : str | None = None

class DeleteRawChapterRevisionStatus(BaseModel):
    status : int
    detail : str | None = None