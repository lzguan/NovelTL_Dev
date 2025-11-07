from pydantic import BaseModel
from typing import List, Literal

class LabelGroup(BaseModel):
    label_group_id : int
    label_group_name : str

    user_id : int

    novel_id : int

class CreateLabelGroup(BaseModel):
    label_group_name : str
    user_id : int
    novel_id : int

class UpdateLabelGroup(BaseModel):
    label_group_id : int
    label_group_name : str

class Label(BaseModel):
    """
    Schema for a single label
    """
    entity_group : str | None
    score : float
    word : str
    start : int
    end : int
    dirty : bool

class LabelData(BaseModel):
    """
    LabelData pydantic schema
    """
    label_data_id : int
    label_data_entities : List[Label]

    label_group_id : int
    raw_chapter_revision_id : int

class LabelDataMeta(BaseModel):
    label_data_id : int
    label_group_id : int
    raw_chapter_revision_id : int

class CreateLabelData(BaseModel):
    label_group_id : int
    raw_chapter_revision_id : int

class LabelOp(BaseModel):
    """
    LabelOp pydantic schema

    When a user wants to update LabelData, can send LabelOp data
    For an add operation:
        start_pos : start position to new label
        end_pos : end position to new label
        word : word of label to add (for validation purposes)
        dirty : dirtyness of label to add
        entity_group : entity group of label to add
        score : score of label to add
    For a delete operation:
        start_pos : start position of label to delete
        end_pos : end position of label to delete
        word : word of label to delete (for validation purposes)
    For an update operation:
        start_pos : original start position to update
        end_pos : original end position of label to update
        word : original word of label to update (for validation purposes)
        new_start_pos : start position to update to
        end_pos : end position to update to
        new_word : new word (for validation purposes)
        dirty : dirtyness of updated label
        entity_group : entity group of updated label
        score : score of updated label
    """
    label_op : Literal["add", "delete", "update"]

    start_pos : int
    end_pos : int
    word : str

    new_start_pos : int | None = None
    new_end_pos : int | None = None
    new_word : str | None = None

    dirty : bool | None = None
    entity_group : str | None = None
    score : float | None = None

class UpdateLabelDataStream(BaseModel):
    """
    UpdateLabelStream pydantic schema
    Contains a stream of LabelOps 
    """
    label_data_id : int
    ops : List[LabelOp]

class UpdateLabelDataStreamResponse(BaseModel):
    """Response to an UpdateLabelDataStream"""
    success : bool
    message : str | None = None