from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column, relationship
from sqlalchemy import String, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from typing import List
from .constants import *
from ..models import Base

class LabelGroup(Base):
    """
    Class for grouping labels for each chapter for a given novel and user
    
    Attributes:
        user_id     user that owns this label group
        novel_id    novel this label group is referring to
    """
    __tablename__ = 'label_groups'
    label_group_id : Mapped[int] = mapped_column(primary_key=True)
    label_group_name : Mapped[str] = mapped_column(String(MAX_LABEL_GROUP_NAME_LEN))
    
    user_id : Mapped[int] = mapped_column(ForeignKey('users.user_id'), nullable=False)
    user_of_label_group : Mapped["User"] = relationship(back_populates='label_groups_with_user')

    novel_id : Mapped[int] = mapped_column(ForeignKey('novels.novel_id'), nullable=False)
    novel_of_label_group : Mapped["Novel"] = relationship(back_populates='label_groups_with_novel')

    label_datas_with_label_group : Mapped[List["LabelData"]] = relationship(back_populates='label_group_of_label_data')

    __table_args__ = (
        UniqueConstraint('label_group_name', 'user_id', 'novel_id', name="one_label_group_with_name_per_user_novel"),
    )

class LabelData(Base):
    """
    Class for storing label data for a given chapter
    
    Attributes:
        label_group_id      label group that label_data belongs to

    """
    __tablename__ = 'label_datas'

    label_data_id : Mapped[int] = mapped_column(primary_key=True)
    label_data_entities : Mapped[dict] = mapped_column(JSONB)

    label_group_id : Mapped[int] = mapped_column(ForeignKey('label_groups.label_group_id'), nullable=False)
    label_group_of_label_data : Mapped[LabelGroup] = relationship(back_populates='label_datas_with_label_group')

    raw_chapter_revision_id : Mapped[int] = mapped_column(ForeignKey('raw_chapter_revisions.raw_chapter_revision_id'), nullable=False)
    raw_chapter_revision_of_label_data : Mapped["RawChapterRevision"] = relationship(back_populates='label_datas_with_raw_chapter_revision')

    __table_args__ = (
        UniqueConstraint('label_group_id', 'raw_chapter_revision_id', name='one_label_group_per_chapter'),
    )