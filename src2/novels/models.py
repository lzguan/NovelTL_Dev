from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column, relationship
from sqlalchemy import String, UniqueConstraint, ForeignKey, Integer, Text, Boolean, Index, CheckConstraint, or_, not_
from typing import List
from .constants import *
from ..models import Base


class Novel(Base):
    """
    Class for novel entry in database
    """
    __tablename__ = "novels"

    novel_id : Mapped[int] = mapped_column(primary_key=True)
    novel_title : Mapped[str] = mapped_column(String(MAX_NOVEL_TITLE_LEN), nullable=False)
    novel_description : Mapped[str] = mapped_column(Text)
    novel_author : Mapped[str] = mapped_column(String(MAX_AUTHOR_LENGTH))

    language_id = mapped_column(ForeignKey("languages.language_id"), nullable=False)
    language_of_novel : Mapped["Language"] = relationship(back_populates="novels_with_language")

    raw_chapters_with_novel : Mapped[List["RawChapter"]] = relationship(back_populates='novel_of_raw_chapter')
    translations_with_novel : Mapped[List["Translation"]] = relationship(back_populates='novel_of_translation')
    label_groups_with_novel : Mapped[List["LabelGroup"]] = relationship(back_populates='novel_of_label_group')

class RawChapter(Base):
    __tablename__ = 'raw_chapters'

    raw_chapter_id : Mapped[int] = mapped_column(primary_key=True)
    raw_chapter_num : Mapped[int] = mapped_column(Integer, nullable=False)

    novel_id = mapped_column(ForeignKey('novels.novel_id'))
    novel_of_raw_chapter : Mapped[Novel] = relationship(back_populates='raw_chapters_with_novel')

    translated_chapters_with_raw_chapter : Mapped[List["TranslatedChapter"]] = relationship(back_populates='raw_chapter_of_translated_chapter')

    raw_chapter_revisions_with_raw_chapter : Mapped[List["RawChapterRevision"]] = relationship(back_populates='raw_chapter_of_raw_chapter_revision')

    __table_args__ = (
        UniqueConstraint('raw_chapter_num', 'novel_id', name="raw_chapter_per_novel"),
    )

class RawChapterRevision(Base):
    __tablename__ = 'raw_chapter_revisions'

    raw_chapter_revision_id : Mapped[int] = mapped_column(primary_key=True)
    raw_chapter_revision_text : Mapped[str] = mapped_column(Text)
    raw_chapter_revision_title : Mapped[str] = mapped_column(String(MAX_CHAPTER_TITLE_LEN))
    raw_chapter_revision_is_primary : Mapped[bool] = mapped_column(Boolean, nullable=False)
    raw_chapter_revision_is_public : Mapped[bool] = mapped_column(Boolean, nullable=False)

    raw_chapter_of_raw_chapter_revision : Mapped["RawChapter"] = relationship(back_populates="raw_chapter_revisions_with_raw_chapter")
    raw_chapter_id = mapped_column(ForeignKey('raw_chapters.raw_chapter_id'))

    label_datas_with_raw_chapter_revision : Mapped[List["LabelData"]] = relationship(back_populates='raw_chapter_revision_of_label_data')

    __table_args__ = (
        Index('ix_one_primary_revision_per_chapter', 'raw_chapter_id', unique=True, postgresql_where=(raw_chapter_revision_is_primary.is_(True))),
        CheckConstraint(or_(raw_chapter_revision_is_public, not_(raw_chapter_revision_is_primary)))
    )