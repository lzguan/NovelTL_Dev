from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column, relationship
from sqlalchemy import String, Text, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from . import Base
from .language import *
from ...config import *
from .novel import *

class RawChapter(Base):
    __tablename__ = 'raw_chapters'

    raw_chapter_id : Mapped[int] = mapped_column(primary_key=True)
    raw_chapter_num : Mapped[int] = mapped_column(Integer, nullable=False)
    raw_chapter_title : Mapped[str] = mapped_column(String(MAX_CHAPTER_TITLE_LEN))
    raw_chapter_text : Mapped[str] = mapped_column(Text)

    novel_id = mapped_column(ForeignKey('novels.novel_id'))
    novel_of_raw_chapter : Mapped[Novel] = relationship(back_populates='raw_chapters_with_novel')

    translated_chapters_with_raw_chapter : Mapped[List["TranslatedChapter"]] = relationship(back_populates='raw_chapter_of_translated_chapter')

    label_datas_with_raw_chapter : Mapped[List["LabelData"]] = relationship(back_populates='raw_chapter_of_label_data')

    __table_args__ = (
        UniqueConstraint('raw_chapter_num', 'novel_id', name="raw_chapter_per_novel"),
    )