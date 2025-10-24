from typing import List
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column, relationship
from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from . import Base
from .raw_chapter import RawChapter
from .label_group import LabelGroup

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

    raw_chapter_id : Mapped[int] = mapped_column(ForeignKey('raw_chapters.raw_chapter_id'), nullable=False)
    raw_chapter_of_label_data : Mapped[RawChapter] = relationship(back_populates='label_datas_with_raw_chapter')

    __table_args__ = (
        UniqueConstraint('label_group_id', 'raw_chapter_id', name='one_label_group_per_chapter'),
    )