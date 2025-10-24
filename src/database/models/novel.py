from typing import List
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column, relationship
from sqlalchemy import String, Text, ForeignKey, UniqueConstraint
from . import Base
from .language import Language
from ...config import *
from .user import User

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
    language_of_novel : Mapped[Language] = relationship(back_populates="novels_with_language")

    raw_chapters_with_novel : Mapped[List["RawChapter"]] = relationship(back_populates='novel_of_raw_chapter')
    translations_with_novel : Mapped[List["Translation"]] = relationship(back_populates='novel_of_translation')
    label_groups_with_novel : Mapped[List["LabelGroup"]] = relationship(back_populates='novel_of_label_group')