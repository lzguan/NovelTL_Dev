from typing import List
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column, relationship
from sqlalchemy import String, Text, ForeignKey
from . import Base
from .language import *
from ...config import *
from .novel import *

# bundles translated chapters into groups called translations
class Translation(Base):
    __tablename__ = 'translations'

    translation_id : Mapped[int] = mapped_column(primary_key=True)

    language_of_translation : Mapped[Language] = relationship(back_populates='translations_with_language')
    language_id = mapped_column(ForeignKey('languages.language_id'), nullable=False)

    novel_of_translation : Mapped[Novel] = relationship(back_populates='translations_with_novel')
    novel_id = mapped_column(ForeignKey('novels.novel_id'), nullable=False)

    translated_chapters_with_translation : Mapped[List["TranslatedChapter"]] = relationship(back_populates='translation_of_translated_chapter')