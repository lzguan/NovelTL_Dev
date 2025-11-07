"""
This module provides global db models.
"""

from sqlalchemy import DateTime, UniqueConstraint, String
from sqlalchemy.orm import DeclarativeBase, Mapped
from sqlalchemy.orm import mapped_column, relationship
from datetime import datetime
from typing import List

class Base(DeclarativeBase):
    """
    Class for base model.

    Attributes:
        created_at: Date and time object was created in db.
        updated_at: Date and time object was last updated in db.
    """
    created_at : Mapped[datetime] = mapped_column(DateTime, default=datetime.now(), nullable=False)
    updated_at : Mapped[datetime] = mapped_column(DateTime, default=datetime.now(), onupdate=datetime.now(), nullable=False)

class Language(Base):
    """
    Database model for a language.

    Attributes:
        language_id: Identifier.
        language_name: Name of language. For example, English, French, Chinese. These are unique in the database.
        language_code: An ISO 639-1 language code identifier for the corresponding language. These are unique in the database.
    """
    __tablename__ = 'languages'

    language_id : Mapped[int] = mapped_column(primary_key=True)
    language_name : Mapped[str] = mapped_column(String(31), nullable=False)
    language_code: Mapped[str] = mapped_column(String(2), nullable=False)

    novels_with_language : Mapped[List["Novel"]] = relationship(back_populates="language_of_novel")
    translations_with_language : Mapped[List["Translation"]] = relationship(back_populates='language_of_translation')

    __table_args__ = (
        UniqueConstraint('language_name', name='language_name_unique'),
        UniqueConstraint('language_code', name='language_code_unique')
    )

# imports for other models
from .auth.models import *
from .novels.models import *
from .translations.models import *
from .labels.models import *