from . import models
from . import schemas
from ..auth.schemas import User
from sqlalchemy.orm import Session, defer
from typing import List

def get_novels_by_title(db : Session, novel_title : str) -> List[models.Novel]:
    search_term = f"%{novel_title}%"
    return db.query(models.Novel).filter(models.Novel.novel_title.ilike(search_term)).all()

def get_novel_by_id(db : Session, novel_id : int) -> models.Novel:
    return db.query(models.Novel).filter_by(novel_id=novel_id).first()

def get_raw_chapters_of_novel(db : Session, novel_id : int, start : int | None = None, end : int | None = None) -> List[models.RawChapter]:
    q = db.query(models.RawChapter).filter_by(novel_id=novel_id)
    if start is not None:
        q = q.filter(models.RawChapter.raw_chapter_num >= start)
    if end is not None:
        q = q.filter(models.RawChapter.raw_chapter_num < end)
    return q.all()

# try not to call unless necessary, probably inefficient
def get_raw_chapter_by_id(db : Session, raw_chapter_id : int) -> models.RawChapter:
    return db.query(models.RawChapter).filter_by(raw_chapter_id=raw_chapter_id).first()

def get_raw_chapter_revisions_of_raw_chapter(db : Session, raw_chapter_id : int) -> List[models.RawChapterRevision]:
    return db.query(models.RawChapterRevision).filter_by(raw_chapter_id=raw_chapter_id).all()

def get_raw_chapter_revision_by_id(db : Session, raw_chapter_revision_id : int) -> models.RawChapterRevision:
    return db.query(models.RawChapterRevision).filter_by(raw_chapter_revision_id=raw_chapter_revision_id).first()

def get_primary_raw_chapter_revisions_of_novel(db : Session, novel_id : int, start : int | None = None, end : int | None = None) -> List[models.RawChapterRevision]:
    q = db.query(models.RawChapterRevision).options(
        defer(models.RawChapterRevision.raw_chapter_revision_text)
    ).join(
        models.RawChapter, # The table to join with
        models.RawChapter.raw_chapter_id == models.RawChapterRevision.raw_chapter_id
    ).filter(
        models.RawChapter.novel_id == novel_id # Filter on the joined table
    ).filter(
        models.RawChapterRevision.raw_chapter_revision_is_primary == True # Filter on the main table
    )
    if start is not None:
        q = q.filter(models.RawChapter.raw_chapter_num >= start)
    if end is not None:
        q = q.filter(models.RawChapter.raw_chapter_num < end)
    return q.all()

def get_public_raw_chapter_revisions_of_novel(db : Session, novel_id : int, start : int | None = None, end : int | None = None) -> List[models.RawChapterRevision]:
    q = db.query(models.RawChapterRevision).options(
        defer(models.RawChapterRevision.raw_chapter_revision_text)
    ).join(
        models.RawChapter, # The table to join with
        models.RawChapter.raw_chapter_id == models.RawChapterRevision.raw_chapter_id
    ).filter(
        models.RawChapter.novel_id == novel_id # Filter on the joined table
    ).filter(
        models.RawChapterRevision.raw_chapter_revision_is_public == True # Filter on the main table
    )
    if start is not None:
        q = q.filter(models.RawChapter.raw_chapter_num >= start)
    if end is not None:
        q = q.filter(models.RawChapter.raw_chapter_num < end)
    return q.all()

def create_novel(db : Session, novel : schemas.CreateNovel, current_user : User) -> models.Novel | None:
    db_novel = models.Novel(**novel.model_dump())
    try:
        db.add(db_novel)
        db.commit()
    except Exception as e:
        db.rollback()
        return None
    return db_novel

def update_novel(db : Session, update : schemas.UpdateNovel, novel_id : int, current_user : User) -> models.Novel | None:
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

def create_raw_chapter(db : Session, raw_chapter : schemas.CreateRawChapter, current_user : User, novel_id : int) -> models.RawChapter | None:
    new_chapter = models.RawChapter(raw_chapter_num=raw_chapter.raw_chapter_num, novel_id=novel_id)
    try:
        db.add(new_chapter)
        db.commit()
    except Exception as e:
        db.rollback()
        return None
    return new_chapter

def create_raw_chapter_revision(db : Session, rcr : schemas.CreateRawChapterRevision, current_user : User, raw_chapter_id : int) -> models.RawChapterRevision | None:
    new_revision = models.RawChapterRevision(raw_chapter_revision_title=rcr.raw_chapter_revision_title, raw_chapter_id=raw_chapter_id, raw_chapter_revision_is_primary=False, raw_chapter_revision_is_public=False, raw_chapter_revision_text=rcr.raw_chapter_revision_text)
    try:
        db.add(new_revision)
        db.commit()
    except Exception as e:
        db.rollback()
        return None
    return new_revision

def update_raw_chapter_revision(db : Session, rcr : schemas.UpdateRawChapterRevision, current_user : User, revision_id : int) -> models.RawChapterRevision | None:
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

def delete_raw_chapter_revision(db : Session, raw_chapter_revision_id : int, current_user : User) -> schemas.DeleteRawChapterRevision:
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