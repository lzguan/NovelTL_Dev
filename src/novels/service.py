"""
Service functions for novels/chapters.
"""

from . import models
from . import schemas
from .exceptions import *
from ..auth.schemas import User
from sqlalchemy.orm import Session, defer
from typing import List
from sqlalchemy.exc import IntegrityError
from sqlalchemy import select

def query_novels_by_title(db : Session, novel_title : str) -> List[models.Novel]:
    """
    Queries novels with novel_title as substring.

    Args:
        db: Database from which we are querying.
        novel_title: substring we wish to search for.
    """
    search_term = f"%{novel_title}%"

    return db.query(models.Novel).filter(models.Novel.novel_title.ilike(search_term)).all()

def query_novel_by_id(db : Session, novel_id : int) -> models.Novel:
    """
    Queries a novel by id

    Args:
        db: Database from which we are querying.
        novel_id: id of novel in database.
    
    Raises:
        NovelIDNotFoundException: Novel not found in database.
    """
    response = db.query(models.Novel).filter_by(novel_id=novel_id).first()
    if response is None:
        raise NovelIDNotFoundException
    return response

def query_raw_chapters_by_novel(db : Session, novel_id : int, start : int | None = None, end : int | None = None) -> List[models.RawChapter]:
    """
    Query all chapters of a specific novel satisfying certain conditions.

    Args:
        db: Database from which we are querying.
        novel_id: id of novel we are querying chapters from.
        start: If not none, then only query chapters with chapter_num >= start
        end: If not none, then only query chapters with chapter_num < end
    """
    q = db.query(models.RawChapter).filter_by(novel_id=novel_id)
    if start is not None:
        q = q.filter(models.RawChapter.raw_chapter_num >= start)
    if end is not None:
        q = q.filter(models.RawChapter.raw_chapter_num < end)
    return q.all()

def query_raw_chapter_by_id(db : Session, raw_chapter_id : int) -> models.RawChapter:
    """
    Query a chapter by id.

    Args:
        db: Database from which we are querying.
        raw_chapter_id: id of chapter we are querying from.
    
    Raises:
        RawChapterIDNotFoundException: Chapter not found in database.
    """
    response = db.query(models.RawChapter).filter_by(raw_chapter_id=raw_chapter_id).first()
    if response is None:
        raise RawChapterIDNotFoundException
    return response

def query_raw_chapter_revisions_by_raw_chapter(db : Session, raw_chapter_id : int) -> List[models.RawChapterRevision]:
    """
    Query all chapter revisions corresponding to a chapter id.

    Args:
        db: Database from which we are querying.
        raw_chapter_id: id of chapter we are finding revisions of.
    
    Raises:
        RawChapterIDNotFoundException: If the raw_chapter_id does not correspond to a raw chapter.
    """
    response = db.query(models.RawChapterRevision).filter_by(raw_chapter_id=raw_chapter_id).all()
    if len(response) == 0:
        # throw a RawChapterIDNotFoundException if raw_chapter_id does not exist 
        query_raw_chapter_by_id(db, raw_chapter_id)
    return response

def query_raw_chapter_revision_by_id(db : Session, raw_chapter_revision_id : int) -> models.RawChapterRevision:
    """
    Query a chapter revision by id.

    Args:
        db: Database from which we are querying.
        raw_chapter_revision_id: id of chapter revision we are querying.
    
    Raises:
        RawChapterRevisionIDNotFoundException: If raw_chapter_revision_id does not correspond to a chapter revision.
    """
    response = db.query(models.RawChapterRevision).filter_by(raw_chapter_revision_id=raw_chapter_revision_id).first()
    if response is None:
        raise RawChapterRevisionIDNotFoundException
    return response

def query_raw_chapter_revisions_with_primary_by_novel(db : Session, novel_id : int, start : int | None = None, end : int | None = None) -> List[models.RawChapterRevision]:
    """
    Query all chapter revisions marked as primary satisfying certain restrictions.

    Args:
        db: Database from which we are querying from.
        novel_id: id of novel we are querying chapter revisions from.
        start: If not None, then only query chapter revisions that have chapter_num >= start.
        end: If not None, then only query chapter revisions that have chapter_num < end.
    
    Raises:
        NovelIDNotFoundException: novel with corresponding novel_id is not in database
    """
    q = db.query(models.RawChapterRevision).options(
        defer(models.RawChapterRevision.raw_chapter_revision_text)
    ).join(
        models.RawChapter,
        models.RawChapter.raw_chapter_id == models.RawChapterRevision.raw_chapter_id
    ).filter(
        models.RawChapter.novel_id == novel_id
    ).filter(
        models.RawChapterRevision.raw_chapter_revision_is_primary == True
    )
    if start is not None:
        q = q.filter(models.RawChapter.raw_chapter_num >= start)
    if end is not None:
        q = q.filter(models.RawChapter.raw_chapter_num < end)
    response = q.all()
    if len(response) == 0:
        # will throw NovelIDNotFoundException if novel with novel_id does not exist
        query_novel_by_id(db, novel_id)
    return response

def query_raw_chapter_revisions_with_public_by_novel(db : Session, novel_id : int, start : int | None = None, end : int | None = None) -> List[models.RawChapterRevision]:
    """
    Query all chapter revisions marked as public satisfying certain restrictions.

    Args:
        db: Database from which we are querying from.
        novel_id: id of novel we are querying chapter revisions from.
        start: If not None, then only query chapter revisions that have chapter_num >= start.
        end: If not None, then only query chapter revisions that have chapter_num < end.
    
    Raises:
        NovelIDNotFoundException: novel with corresponding novel_id is not in database
    """
    q = db.query(models.RawChapterRevision).options(
        defer(models.RawChapterRevision.raw_chapter_revision_text)
    ).join(
        models.RawChapter,
        models.RawChapter.raw_chapter_id == models.RawChapterRevision.raw_chapter_id
    ).filter(
        models.RawChapter.novel_id == novel_id
    ).filter(
        models.RawChapterRevision.raw_chapter_revision_is_public == True
    )
    if start is not None:
        q = q.filter(models.RawChapter.raw_chapter_num >= start)
    if end is not None:
        q = q.filter(models.RawChapter.raw_chapter_num < end)
    response = q.all()
    if len(response) == 0:
        # will throw NovelIDNotFoundException if novel with novel_id does not exist
        query_novel_by_id(db, novel_id)
    return response

def insert_novel(db : Session, current_user : User, novel : schemas.CreateNovel) -> models.Novel | None:
    """
    Insert a novel into the database.

    Args:
        db: Database which we are inserting into.
        current_user: User performing the insert. Exact user validation protocol has yet to be determined.
        novel: Metadata of novel.
    
    Raises:
        LanguageNotFoundException: 
    """
    db_novel = models.Novel(**novel.model_dump())
    try:
        db.add(db_novel)
        db.commit()
    except IntegrityError as e:
        db.rollback()
        
    return db_novel

def modify_novel(db : Session, current_user : User, update : schemas.UpdateNovel, novel_id : int) -> models.Novel | None:
    try:
        db_novel = db.query(models.Novel).filter_by(novel_id=novel_id).first()
        if not db_novel:
            return None
        if update.novel_title is not None:
            db_novel.novel_title = update.novel_title 
        if update.novel_author is not None:
            db_novel.novel_author = update.novel_author
        if update.novel_description is not None:
            db_novel.novel_description = update.novel_description
        db.commit()
    except Exception as e:
        db.rollback()
        return None
    return db_novel

def insert_raw_chapter(db : Session, raw_chapter : schemas.CreateRawChapter, current_user : User, novel_id : int) -> models.RawChapter | None:
    new_chapter = models.RawChapter(raw_chapter_num=raw_chapter.raw_chapter_num, novel_id=novel_id)
    try:
        db.add(new_chapter)
        db.commit()
    except Exception as e:
        db.rollback()
        return None
    return new_chapter

def insert_raw_chapter_revision(db : Session, rcr : schemas.CreateRawChapterRevision, current_user : User, raw_chapter_id : int) -> models.RawChapterRevision | None:
    new_revision = models.RawChapterRevision(raw_chapter_revision_title=rcr.raw_chapter_revision_title, raw_chapter_id=raw_chapter_id, raw_chapter_revision_is_primary=False, raw_chapter_revision_is_public=False, raw_chapter_revision_text=rcr.raw_chapter_revision_text)
    try:
        db.add(new_revision)
        db.commit()
    except Exception as e:
        db.rollback()
        return None
    return new_revision

def modify_raw_chapter_revision(db : Session, rcr : schemas.UpdateRawChapterRevision, current_user : User, revision_id : int) -> models.RawChapterRevision | None:
    try:
        revision = db.query(models.RawChapterRevision).filter_by(raw_chapter_revision_id=revision_id).first()
        if not revision or revision.raw_chapter_revision_is_public:
            return None
        if rcr.raw_chapter_revision_title is not None:
            revision.raw_chapter_revision_title = rcr.raw_chapter_revision_title
        if rcr.raw_chapter_revision_text is not None:
            revision.raw_chapter_revision_text = rcr.raw_chapter_revision_text
        db.commit()
    except Exception as e:
        db.rollback()
        return None
    return revision

def publicize_raw_chapter_revision(db : Session, raw_chapter_revision_id : int, current_user : User) -> models.RawChapterRevision | None:
    try:
        revision = db.query(models.RawChapterRevision).filter_by(raw_chapter_revision_id=raw_chapter_revision_id).first()
        if not revision:
            return None
        if not revision.raw_chapter_revision_is_public:
            revision.raw_chapter_revision_is_public = True
            db.commit()
    except Exception as e:
        db.rollback()
        return None
    return revision

def make_primary_raw_chapter_revision(db : Session, raw_chapter_revision_id : int, current_user : User) -> models.RawChapterRevision | None:
    try:
        revision = db.query(models.RawChapterRevision).filter_by(raw_chapter_revision_id=raw_chapter_revision_id).first()
        if not revision or not revision.raw_chapter_revision_is_public:
            return None
        current_primary = db.query(models.RawChapterRevision).filter_by(raw_chapter_id=revision.raw_chapter_id).filter_by(raw_chapter_revision_is_primary=True).first()
        if not current_primary:
            revision.raw_chapter_revision_is_primary = True
            db.commit()
        elif current_primary != revision:
            current_primary.raw_chapter_revision_is_primary = False
            revision.raw_chapter_revision_is_primary = True
            db.commit()
    except Exception as e:
        db.rollback()
        return None
    return revision

def remove_raw_chapter_revision(db : Session, raw_chapter_revision_id : int, current_user : User) -> schemas.DeleteRawChapterRevisionStatus:
    try:
        revision = db.query(models.RawChapterRevision).filter_by(raw_chapter_revision_id=raw_chapter_revision_id).first()
        if not revision or revision.raw_chapter_revision_is_public:
            return schemas.DeleteRawChapterRevision(status=400, detail="Delete failed: chapter is public")
        db.delete(revision)
        db.commit()
    except Exception as e:
        db.rollback()
        return schemas.DeleteRawChapterRevision(status=400, detail="Delete failed: unknown")
    return schemas.DeleteRawChapterRevision(status=204, detail="Delete succeeded")