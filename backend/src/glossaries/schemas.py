"""
Pydantic schemas for glossaries.
"""

import uuid

from pydantic import BaseModel, ConfigDict, Field

from .constants import (
    MAX_ENTITY_TYPE_LEN,
    MAX_GLOSSARY_NAME_LEN,
    MAX_SOURCE_TERM_LEN,
    MAX_TRANSLATED_TERM_LEN,
    GlossaryRole,
)


class Glossary(BaseModel):
    """
    Pydantic schema for a glossary.
    """

    model_config = ConfigDict(from_attributes=True)

    glossary_id: uuid.UUID
    glossary_name: str = Field(max_length=MAX_GLOSSARY_NAME_LEN)
    glossary_description: str | None = None
    novel_id: uuid.UUID
    source_language_code: str
    target_language_code: str


class CreateGlossary(BaseModel):
    """
    Pydantic schema for creating a glossary.
    """

    glossary_name: str = Field(max_length=MAX_GLOSSARY_NAME_LEN)
    glossary_description: str | None = None
    novel_id: uuid.UUID
    source_language_code: str
    target_language_code: str


class UpdateGlossary(BaseModel):
    """
    Pydantic schema for updating a glossary.
    """

    glossary_name: str | None = Field(default=None, max_length=MAX_GLOSSARY_NAME_LEN)
    glossary_description: str | None = None


class GlossaryEntry(BaseModel):
    """
    Pydantic schema for a glossary entry.
    """

    model_config = ConfigDict(from_attributes=True)

    glossary_entry_id: uuid.UUID
    glossary_id: uuid.UUID
    source_term: str = Field(max_length=MAX_SOURCE_TERM_LEN)
    translated_term: str | None = Field(default=None, max_length=MAX_TRANSLATED_TERM_LEN)
    context_notes: str | None = None
    entity_type: str = Field(default="MISC", max_length=MAX_ENTITY_TYPE_LEN)


class CreateGlossaryEntry(BaseModel):
    """
    Pydantic schema for creating a glossary entry.
    """

    glossary_id: uuid.UUID
    source_term: str = Field(max_length=MAX_SOURCE_TERM_LEN)
    translated_term: str | None = Field(default=None, max_length=MAX_TRANSLATED_TERM_LEN)
    context_notes: str | None = None
    entity_type: str = Field(default="MISC", max_length=MAX_ENTITY_TYPE_LEN)


class UpdateGlossaryEntry(BaseModel):
    """
    Pydantic schema for updating a glossary entry.
    """

    translated_term: str | None = Field(default=None, max_length=MAX_TRANSLATED_TERM_LEN)
    context_notes: str | None = None
    entity_type: str | None = Field(default=None, max_length=MAX_ENTITY_TYPE_LEN)


class GlossaryContributor(BaseModel):
    """
    Pydantic schema for a glossary contributor.
    """

    model_config = ConfigDict(from_attributes=True)

    glossary_id: uuid.UUID
    user_id: uuid.UUID
    glossary_contributor_role: GlossaryRole


class AddGlossaryContributor(BaseModel):
    """
    Pydantic schema for adding a contributor to a glossary.
    """

    user_id: uuid.UUID
    glossary_contributor_role: GlossaryRole


class UpdateGlossaryContributor(BaseModel):
    """
    Pydantic schema for updating a glossary contributor's role.
    """

    glossary_contributor_role: GlossaryRole


class ImportFromLabels(BaseModel):
    """
    Pydantic schema for importing glossary entries from a label group.
    """

    label_group_id: uuid.UUID
    entity_types: list[str] | None = None
    overwrite_existing: bool = False


class ImportResult(BaseModel):
    """
    Pydantic schema for the result of an import-from-labels operation.
    """

    entries_created: int
    entries_updated: int
    entries_skipped: int
