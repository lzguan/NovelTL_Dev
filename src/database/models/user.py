from . import Base
from typing import List
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column, relationship
from sqlalchemy import String
from ...config import *

class User(Base):
    __tablename__ = "users"

    user_id: Mapped[int] = mapped_column(primary_key=True)
    user_name : Mapped[str] = mapped_column(
        String(MAX_USER_NAME_LEN), 
        unique=True,
        nullable=False
    )

    label_groups_with_user : Mapped[List["LabelGroup"]] = relationship(back_populates='user_of_label_group')
