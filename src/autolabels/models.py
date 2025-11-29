from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column, relationship
from sqlalchemy.dialects.postgresql import JSONB
from typing import TYPE_CHECKING
from ..models import Base
from .constants import *
if TYPE_CHECKING:
    from src.novels.models import RawChapterRevision

class AutoLabel(Base):
    """
    Database model for storing automatically labeled data.

    Attributes:
        auto_label_id: Integer identifier for this AutoLabel.
        auto_label_data: JSONB column containing the auto-labeled data.
        auto_label_model_name: Name of the model used to generate the auto labels.
        auto_label_model_params: Parameters used for the model to generate the auto labels.
        raw_chapter_revision_id: Chapter this AutoLabel is associated with.
    """
    __tablename__ = 'auto_labels'

    auto_label_id : Mapped[int] = mapped_column(primary_key=True)
    auto_label_data : Mapped[dict] = mapped_column(JSONB, nullable=False)
    auto_label_model_name : Mapped[str] = mapped_column(String(MAX_MODEL_NAME_LEN), nullable=True)
    auto_label_model_params : Mapped[dict] = mapped_column(JSONB, nullable=True)
    raw_chapter_revision_id : Mapped[int] = mapped_column(ForeignKey('raw_chapter_revisions.raw_chapter_revision_id'), nullable=False)
    raw_chapter_revision_of_auto_label : Mapped["RawChapterRevision"] = relationship(back_populates='auto_labels_with_raw_chapter_revision')

    