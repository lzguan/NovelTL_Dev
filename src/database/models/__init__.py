"""
    Class for Base

    Naming conventions:
    - Names of things should be lower_case_with_underscores
    - Tables should describe the thing stored in each row as plural e.g. fruits, houses, etc.
    - Columns of properties of x in table {x}s should be called {x}_field_name e.g. fruit_name in table fruits
    - If {x} has a ForeignKey to {y}, the corresponding relationships should be defined by {y}_of_{x} in {x} and  {x}s_of_{y} in {y} e.g. fruits_with_colour and colour_of_fruit
    - If {x} has a ForeignKey to {y}, the ForeignKey column name should be called {y}_id in {x} e.g. colour_id in fruit
    - Convention may be broken in the case that breaking a naming convention gives a more descriptive column
"""

from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column
from sqlalchemy import DateTime
from datetime import datetime

class Base(DeclarativeBase):
    created_at : Mapped[datetime] = mapped_column(DateTime, default=datetime.now(), nullable=False)
    updated_at : Mapped[datetime] = mapped_column(DateTime, default=datetime.now(), onupdate=datetime.now(), nullable=False)

from .user import User
from .language import Language
from .novel import Novel
from .raw_chapter import RawChapter
from .translation import Translation
from .translated_chapter import TranslatedChapter
from .label_group import LabelGroup
from .label_data import LabelData