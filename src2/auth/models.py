from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column, relationship
from sqlalchemy import String, CheckConstraint
from sqlalchemy.dialects.postgresql import JSONB
from typing import List
from .constants import *
from ..models import Base

class User(Base):
    __tablename__ = "users"

    user_id: Mapped[int] = mapped_column(primary_key=True)
    user_name : Mapped[str] = mapped_column(
        String(MAX_USER_NAME_LEN), 
        unique=True,
        nullable=False
    )
    user_hashed_password : Mapped[str] = mapped_column(
        String(256)
    )
    user_type : Mapped[str] = mapped_column(
        String(10)
    )

    label_groups_with_user : Mapped[List["LabelGroup"]] = relationship(back_populates='user_of_label_group')
    translations_with_user : Mapped[List["Translation"]] = relationship(back_populates='user_of_translation')

    __table_args__ = (
        CheckConstraint("user_type IN ('admin', 'user')", name='chk_user_type'),
    )