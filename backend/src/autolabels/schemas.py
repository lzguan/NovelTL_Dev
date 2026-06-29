"""
Pydantic schemas for autolabels.
"""

import uuid

from pydantic import ConfigDict, Field

from src.autolabels.params import NERParams

from ..labels.schemas import LabelBase
from ..schemas import Model
from .constants import AutoLabelProgress


class AutoLabel(Model):
    """
    Pydantic schema for an auto-labeled data entry.

    Attributes:
        auto_label_id: UUID identifier for this AutoLabel.
        auto_label_data: Dictionary containing the auto-labeled data.
        auto_label_model_params: Parameters used for the model to generate the auto labels.
        auto_label_status: Labeling progress for this autolabel.
        auto_label_message: Details on status.
        chapter_content_id: UUID of chapter content this AutoLabel is associated with.
        auto_label_last_job_id: Job id of last job that was run on this AutoLabel.
    """

    model_config = ConfigDict(from_attributes=True)
    auto_label_id: uuid.UUID
    auto_label_data: list[LabelBase] | None
    auto_label_model_params: NERParams
    auto_label_status: AutoLabelProgress
    auto_label_message: str | None = None
    chapter_content_id: uuid.UUID
    auto_label_last_job_id: str


class AutoLabelMeta(Model):
    """
    Pydantic schema for auto-label metadata.

    Attributes:
        auto_label_id: UUID identifier for this AutoLabel.
        auto_label_model_params: Parameters used for the model to generate the auto labels.
        auto_label_status: Labeling progress for this autolabel.
        auto_label_message: Details on status.
        chapter_content_id: UUID of chapter content this AutoLabel is associated with.
        auto_label_last_job_id: Job id of last job that was run on this AutoLabel.
    """

    model_config = ConfigDict(from_attributes=True)

    auto_label_id: uuid.UUID
    auto_label_model_params: NERParams
    auto_label_status: AutoLabelProgress
    auto_label_message: str | None = None
    chapter_content_id: uuid.UUID
    auto_label_last_job_id: str


class CreateAutoLabels(Model):
    """
    Pydantic schema for creating an auto-labeled data entry.

    Attributes:
        novel_id: UUID of novel to create auto labels for.
        params: Parameters for the NER model. Disciminated by model_name attribute.
        chapter_ids: Optional parameter. Restrict to revisions with specific chapter UUIDs.
        start: Optional parameter. Restrict to revisions with chapter num >= start.
        end: Optional parameter. Restrict to revisions with chapter num < end.
        is_public: Optional parameter. Restrict to revisions with this specific public flag.
    """

    novel_id: uuid.UUID
    params: NERParams = Field(discriminator="model_name")
    chapter_ids: list[uuid.UUID] | None = None
    start: int | None = None
    end: int | None = None
    is_public: bool | None = None
