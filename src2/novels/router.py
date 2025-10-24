from ..database import get_db
from fastapi import APIRouter, Depends, HTTPException, status
from .dependencies import *
from ..auth.dependencies import get_current_user
from .service import *
from .schemas import *
from typing import Annotated

router = APIRouter()

@router.get('/novels/{novel_id}', response_model=schemas.Novel)
async def retriev_novel_by_id(novel_id : int, db : Annotated[Session, Depends(get_db)]):
    novel = get_novel_by_id(db, novel_id)
    if not novel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="novel not found"
        )
    return novel

@router.get('/search/novels', response_model=List[schemas.Novel])
async def search_novels(keyword : str, db : Annotated[Session, Depends(get_db)]):
    novels = get_novels_by_title(db, keyword)
    return novels

@router.get('/novels/{novel_id}/chapters', response_model=List[schemas.RawChapter])
async def get_novel_chapters(db : Annotated[Session, Depends(get_db)], novel_id : int, start : int | None = None, end : int | None = None):
    chapters = get_raw_chapters_of_novel(db, novel_id, start, end)
    return chapters

@router.get('/novels/{novel_id}/chapters/public', response_model=List[schemas.RawChapterRevision])
async def get_novel_public_chapter_revisions(db : Annotated[Session, Depends(get_db)], novel_id : int, start : int | None = None, end : int | None = None):
    chapters = get_public_raw_chapter_revisions_of_novel(db, novel_id, start, end)
    return chapters

@router.get('/novels/{novel_id}/chapters/primary', response_model=List[schemas.RawChapterRevision])
async def get_novel_primary_chapter_revisions(db : Annotated[Session, Depends(get_db)], novel_id : int, start : int | None = None, end : int | None = None):
    chapters = get_primary_raw_chapter_revisions_of_novel(db, novel_id, start, end)
    return chapters

@router.post('/novels/create', response_model=schemas.Novel)
async def post_new_novel(request : schemas.CreateNovel, db : Annotated[Session, Depends(get_db)], current_user : Annotated[User, Depends(get_current_user)]):
    db_novel = create_novel(db, request, current_user)
    if not db_novel:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Create novel failed'
        )
    return db_novel

@router.patch('/novel/{novel_id}/update', response_model=schemas.Novel)
async def patch_novel(novel_id : int, params : schemas.UpdateNovel, db : Annotated[Session, Depends(get_db)], current_user : Annotated[User, Depends(get_current_user)]):
    db_novel = update_novel(db, params, novel_id, current_user)
    if not db_novel:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Update failed"
        )
    return db_novel

@router.post('/novel/{novel_id}/chapter/create', response_model=schemas.RawChapter)
async def post_new_chapter(novel_id : int, params : schemas.CreateRawChapter, db : Annotated[Session, Depends(get_db)], current_user : Annotated[User, Depends(get_current_user)]):
    db_raw_chapter = create_raw_chapter(db, params, current_user, novel_id)
    if not db_raw_chapter:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Create failed"
        )
    return db_raw_chapter

@router.post('/chapter/{chapter_id}/revision/create', response_model=schemas.RawChapterRevision)
async def post_new_chapter_revision(chapter_id : int, params : CreateRawChapterRevision, db : Annotated[Session, Depends(get_db)], current_user : Annotated[User, Depends(get_current_user)]):
    db_revision = create_raw_chapter_revision(db, params, current_user, chapter_id)
    if not db_revision:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Create failed"
        )
    return db_revision

@router.patch('/revision/{revision_id}/update', response_model=schemas.RawChapterRevision)
async def update_chapter_revision(revision_id : int, params : schemas.UpdateRawChapterRevision, db : Annotated[Session, Depends(get_db)], current_user : Annotated[User, Depends(get_current_user)]):
    db_revision = update_raw_chapter_revision(db, params, current_user, revision_id)
    if not db_revision:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Update failed"
        )
    return db_revision

@router.patch('/revision/{revision_id}/publish', response_model=schemas.RawChapterRevision)
async def publish_chapter_revision(revision_id : int, db : Annotated[Session, Depends(get_db)], current_user : Annotated[User, Depends(get_current_user)]):
    db_revision = publicize_raw_chapter_revision(db, revision_id, current_user)
    if not db_revision:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Failed to publish"
        )
    return db_revision

@router.patch('/revision/{revision_id}/make_primary', response_model=schemas.RawChapterRevision)
async def make_primary_chapter_revision(revision_id : int, db : Annotated[Session, Depends(get_db)], current_user : Annotated[User, Depends(get_current_user)]):
    db_revision = make_primary_raw_chapter_revision(db, revision_id, current_user)
    if not db_revision:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Failed to make primary"
        )
    return db_revision

@router.delete('/revision/{revision_id}/delete', response_model=schemas.DeleteRawChapterRevision)
async def delete_chapter_revision(revision_id : int, db : Annotated[Session, Depends(get_db)], current_user : Annotated[User, Depends(get_current_user)]):
    return delete_raw_chapter_revision(db, revision_id, current_user)