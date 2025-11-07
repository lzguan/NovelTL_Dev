from ..auth.models import User
from ..novels.models import *
from . import models
from . import schemas
from sqlalchemy.orm import Session, defer
from sqlalchemy.orm.attributes import flag_modified
from typing import List
from .utils import process_op

def get_label_groups_of_user(current_user : User, db : Session) -> List[models.LabelGroup]:
    label_groups = db.query(models.LabelGroup).filter(models.LabelGroup.user_id == current_user.user_id).all()
    return label_groups

def get_label_group(label_group_id : int, current_user : User, db : Session) -> models.LabelGroup | None:

    label_group =  db.query(models.LabelGroup).filter(models.LabelGroup.label_group_id == label_group_id).first()
    if not label_group:
        return None
    if label_group.user_id != current_user.user_id:
        # should throw exception
        return None
    return label_group

def get_label_data_of_chapters(label_group_id : int, raw_chapter_revision_ids : List[int], current_user : User, db : Session) -> List[models.LabelData] | None:
    label_group = get_label_group(label_group_id, current_user, db)
    if not label_group:
        return None
    label_datas = db.query(models.LabelData).options(
        defer(models.LabelData.label_data_entities)
    ).join(
        models.LabelGroup,
        models.LabelData.label_group_id == models.LabelGroup.label_group_id
    ).filter(
        models.LabelData.label_group_id == label_group_id
    ).filter(
        models.LabelData.raw_chapter_revision_id.in_(raw_chapter_revision_ids)
    ).all()
    return label_datas

def create_label_group(request : schemas.CreateLabelGroup, current_user : User, db : Session) -> models.LabelGroup | None:
    if current_user.user_id != request.user_id:
        return None
    label_group = models.LabelGroup(label_group_name=request.label_group_name, user_id=request.user_id, novel_id=request.novel_id)
    try:
        db.add(label_group)
        db.commit()
    except Exception as e:
        db.rollback()
        return None
    return label_group

def update_label_group(request : schemas.UpdateLabelGroup, current_user : User, db : Session) -> models.LabelGroup | None:
    label_group = db.query(models.LabelGroup).filter(models.LabelGroup.label_group_id == request.label_group_id).first()
    if not label_group:
        return None
    if label_group.user_id != current_user.user_id:
        return None
    try:
        label_group.label_group_name = request.label_group_name
        db.commit()
    except Exception as e:
        db.rollback()
        return None
    return label_group

def create_label_data(request : schemas.CreateLabelData, current_user : User, db : Session) -> models.LabelData | None:
    label_group = db.query(models.LabelGroup).filter(models.LabelGroup.label_group_id == request.label_group_id).first()
    if label_group.user_id != current_user.user_id:
        return None
    label_data = models.LabelData(label_group_id=request.label_group_id, raw_chapter_revision_id=request.raw_chapter_revision_id, label_data_entities=[])
    try:
        db.add(label_data)
        db.commit()
    except Exception as e:
        db.rollback()
        return None
    return label_data

def update_label_data_stream(request : schemas.UpdateLabelDataStream, current_user : User, db : Session) -> bool:
    label_data = db.query(models.LabelData).join(models.LabelGroup, models.LabelGroup.label_group_id == models.LabelData.label_group_id).filter(models.LabelGroup.user_id == current_user.user_id).filter(models.LabelData.label_data_id == request.label_data_id).first()
    if not label_data:
        return False
    chapter = db.query(RawChapterRevision).filter(RawChapterRevision.raw_chapter_revision_id == label_data.raw_chapter_revision_id).first()
    chapter_text = chapter.raw_chapter_revision_text
    entities = label_data.label_data_entities
    ops = request.ops
    for op in ops:
        result = process_op(entities, chapter_text, op)
        flag_modified(label_data, 'label_data_entities')
        if not result:
            db.rollback()
            return False
    db.commit()
    return True