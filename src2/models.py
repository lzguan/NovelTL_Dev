from sqlalchemy import DateTime, UniqueConstraint, String
from sqlalchemy.orm import DeclarativeBase, Mapped
from sqlalchemy.orm import mapped_column, relationship
from datetime import datetime
from typing import List

class Base(DeclarativeBase):
    created_at : Mapped[datetime] = mapped_column(DateTime, default=datetime.now(), nullable=False)
    updated_at : Mapped[datetime] = mapped_column(DateTime, default=datetime.now(), onupdate=datetime.now(), nullable=False)

class Language(Base):
    __tablename__ = 'languages'

    language_id : Mapped[int] = mapped_column(primary_key=True)
    language_name : Mapped[str] = mapped_column(String(31), nullable=False)
    language_code: Mapped[str] = mapped_column(String(2), nullable=False) # ISO 639-1

    novels_with_language : Mapped[List["Novel"]] = relationship(back_populates="language_of_novel")
    translations_with_language : Mapped[List["Translation"]] = relationship(back_populates='language_of_translation')

    __table_args__ = (
        UniqueConstraint('language_name', name='language_name_unique'),
        UniqueConstraint('language_code', name='language_code_unique')
    )

from .auth.models import *
from .novels.models import *
from .translations.models import *
from .labels.models import *