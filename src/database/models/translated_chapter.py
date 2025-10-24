from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column, relationship
from sqlalchemy import ForeignKey, UniqueConstraint
from . import Base
from .raw_chapter import *
from ...config import *
from .novel import *
from .translation import *

class TranslatedChapter(Base):
    __tablename__ = 'translated_chapters'

    translated_chapter_id : Mapped[int] = mapped_column(primary_key=True)
    translated_chapter_text : Mapped[str] = mapped_column(Text)

    translation_of_translated_chapter : Mapped[Translation] = relationship(back_populates='translated_chapters_with_translation')
    translation_id = mapped_column(ForeignKey('translations.translation_id'))

    raw_chapter_of_translated_chapter : Mapped[RawChapter] = relationship(back_populates='translated_chapters_with_raw_chapter')
    raw_chapter_id = mapped_column(ForeignKey('raw_chapters.raw_chapter_id'))

    __table_args__ = (
        UniqueConstraint('translation_id', 'raw_chapter_id', name='tl_chapter_unique'), # todo: naming conventions? for name
    )