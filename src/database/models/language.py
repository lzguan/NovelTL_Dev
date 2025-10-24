from . import Base
from typing import List
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column, relationship
from sqlalchemy import String, UniqueConstraint
from ...config import *

class Language(Base):
    __tablename__ = 'languages'

    language_id : Mapped[int] = mapped_column(primary_key=True)
    language_name : Mapped[str] = mapped_column(String(MAX_LANG_NAME_LEN), nullable=False)
    language_code: Mapped[str] = mapped_column(String(MAX_LANG_CODE_LEN), nullable=False) # ISO 639-1

    novels_with_language : Mapped[List["Novel"]] = relationship(back_populates="language_of_novel")
    translations_with_language : Mapped[List["Translation"]] = relationship(back_populates='language_of_translation')

    __table_args__ = (
        UniqueConstraint('language_name', name='language_name_unique'),
        UniqueConstraint('language_code', name='language_code_unique')
    )