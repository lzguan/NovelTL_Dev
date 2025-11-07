from ..database import get_db
from fastapi import APIRouter, Depends, HTTPException, status
from .dependencies import *
from ..auth.dependencies import get_current_user
from .service import *
from .schemas import *
from typing import Annotated

router = APIRouter()

@router.get('/my_label_groups', response_model=List[schemas.LabelGroup])
def retrieve_label_groups_by_current_user(db : Annotated[Session, Depends(get_db)], current_user : Annotated[User, Depends(get_current_user)]):
    label_groups = get_label_groups_of_user(current_user, db)
    return label_groups

@router.get('/label_group/{label_group_id}', response_model=schemas.LabelGroup)
def retrieve_label_group_by_id(label_group_id : int, db : Annotated[Session, Depends(get_db)], current_user : Annotated[User, Depends(get_current_user)]):
    label_group = get_label_group(label_group_id, current_user, db)
    if not label_group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="label group not found"
        )
    return label_group

@router.get('/label_data', response_model=List[schemas.LabelDataMeta])
def retrieve_label_datas_by_group_chapters(label_group_id : int, raw_chapter_revision_id : int, db : Annotated[Session, Depends(get_db)], current_user : Annotated[User, Depends(get_current_user)]):
    label_datas = get_label_data_of_chapters(label_group_id, [raw_chapter_revision_id,], current_user, db)
    if label_datas is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="bad request"
        )
    return label_datas

@router.post('/new_label_group', response_model=schemas.LabelGroup)
def post_label_group(request : schemas.CreateLabelGroup, current_user : Annotated[User, Depends(get_current_user)], db : Annotated[Session, Depends(get_db)]):
    label_group = create_label_group(request, current_user, db)
    if not label_group:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="create label group failed"
        )
    return label_group

@router.patch('/update_label_group', response_model=schemas.LabelGroup)
def patch_label_group(request : schemas.UpdateLabelGroup, current_user : Annotated[User, Depends(get_current_user)], db : Annotated[Session, Depends(get_db)]):
    label_group = update_label_group(request, current_user, db)
    if not label_group:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="update label group failed"
        )
    return label_group

@router.post('/create_label_data', response_model=schemas.LabelData)
def post_label_data(request : schemas.CreateLabelData, current_user : Annotated[User, Depends(get_current_user)], db : Annotated[Session, Depends(get_db)]):
    label_data = create_label_data(request, current_user, db)
    if not label_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="create label data failed"
        )
    return label_data

@router.patch('/update_label_data', response_model=schemas.UpdateLabelDataStreamResponse)
def patch_label_data_stream(request : schemas.UpdateLabelDataStream, current_user : Annotated[User, Depends(get_current_user)], db : Annotated[Session, Depends(get_db)]):
    response = update_label_data_stream(request, current_user, db)
    if not response:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="update failed"
        )
    return schemas.UpdateLabelDataStreamResponse(success=True, message="update success")