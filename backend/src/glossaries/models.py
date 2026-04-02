"""
Database models for glossaries.
"""

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Enum, ForeignKey, String, Text, UniqueConstraint, func
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..models import Base
from .constants import (
    MAX_ENTITY_TYPE_LEN,
    MAX_GLOSSARY_NAME_LEN,
    MAX_SOURCE_TERM_LEN,
    MAX_TRANSLATED_TERM_LEN,
    GlossaryRole,
)

if TYPE_CHECKING:
    from src.auth.models import User
    from src.languages.models import Language
    from src.novels.models import Novel


class Glossary(Base):
    """
    Database model for a glossary scoped to a novel.

    Attributes:
        glossary_id: UUID primary key.
        glossary_name: Name of the glossary.
        glossary_description: Optional description of the glossary.
        novel_id: Foreign key to the novel this glossary belongs to.
        source_language_code: ISO 639-1 code for the source language.
        target_language_code: ISO 639-1 code for the target language.
    """

    __tablename__ = "glossaries"

    glossary_id: Mapped[uuid.UUID] = mapped_column(
        postgresql.UUID, primary_key=True, server_default=func.gen_random_uuid()
    )
    glossary_name: Mapped[str] = mapped_column(String(MAX_GLOSSARY_NAME_LEN), nullable=False)
    glossary_description: Mapped[str | None] = mapped_column(Text, nullable=True)

    novel_id = mapped_column(ForeignKey("novels.novel_id", name="fk_glossaries_novel_id_novels"), nullable=False)
    novel_of_glossary: Mapped["Novel"] = relationship(back_populates="glossaries_with_novel")

    source_language_code = mapped_column(
        ForeignKey("languages.language_code", name="fk_glossaries_source_language_code_languages"), nullable=False
    )
    source_language_of_glossary: Mapped["Language"] = relationship(foreign_keys=[source_language_code])

    target_language_code = mapped_column(
        ForeignKey("languages.language_code", name="fk_glossaries_target_language_code_languages"), nullable=False
    )
    target_language_of_glossary: Mapped["Language"] = relationship(foreign_keys=[target_language_code])

    entries_with_glossary: Mapped[list["GlossaryEntry"]] = relationship(
        back_populates="glossary_of_entry", cascade="all, delete-orphan"
    )
    contributors_with_glossary: Mapped[list["GlossaryContributor"]] = relationship(
        back_populates="glossary_of_contributor", cascade="all, delete-orphan"
    )


class GlossaryEntry(Base):
    """
    Database model for a single term mapping in a glossary.

    Attributes:
        glossary_entry_id: UUID primary key.
        glossary_id: Foreign key to parent glossary.
        source_term: The original term.
        translated_term: The translated term (optional).
        context_notes: Optional notes about usage context.
        entity_type: Entity category (e.g. PER, LOC, ORG). Defaults to 'MISC'.
    """

    __tablename__ = "glossary_entries"

    glossary_entry_id: Mapped[uuid.UUID] = mapped_column(
        postgresql.UUID, primary_key=True, server_default=func.gen_random_uuid()
    )
    source_term: Mapped[str] = mapped_column(String(MAX_SOURCE_TERM_LEN), nullable=False)
    translated_term: Mapped[str | None] = mapped_column(String(MAX_TRANSLATED_TERM_LEN), nullable=True)
    context_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    entity_type: Mapped[str] = mapped_column(String(MAX_ENTITY_TYPE_LEN), nullable=False, default="MISC")

    glossary_id = mapped_column(
        ForeignKey("glossaries.glossary_id", name="fk_glossary_entries_glossary_id_glossaries", ondelete="CASCADE"),
        nullable=False,
    )
    glossary_of_entry: Mapped["Glossary"] = relationship(back_populates="entries_with_glossary")

    __table_args__ = (
        UniqueConstraint("glossary_id", "source_term", "entity_type", name="uq_glossary_entry_term_type"),
    )


class GlossaryContributor(Base):
    """
    Association table for many-to-many relationship between Glossary and Users.

    Attributes:
        glossary_contributor_role: Role of the user in this glossary.
        glossary_id: Foreign key to the glossary.
        user_id: Foreign key to the user.
    """

    __tablename__ = "glossary_contributors"

    glossary_contributor_role: Mapped[GlossaryRole] = mapped_column(
        Enum(GlossaryRole, native_enum=False, length=10, values_callable=lambda x: [str(e.value) for e in x]),
        nullable=False,
    )  # type: ignore

    glossary_id = mapped_column(
        ForeignKey("glossaries.glossary_id", name="fk_glossary_contributors_glossary_id_glossaries", ondelete="CASCADE"),
        primary_key=True,
    )
    glossary_of_contributor: Mapped["Glossary"] = relationship(back_populates="contributors_with_glossary")

    user_id = mapped_column(
        ForeignKey("users.user_id", name="fk_glossary_contributors_user_id_users"), primary_key=True
    )
    user_of_contributor: Mapped["User"] = relationship(back_populates="glossary_contributors_with_user")
