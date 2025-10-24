from ...database.models import *
from sqlalchemy.orm import Session
from typing import List, Dict

def create_label_group(novel_id : int, user_id : int, session : Session) -> int:
    """Creates label group and returns its id"""
    pass

def create_label_data(label_group_id : int, raw_chapter_id : int, session : Session) -> int:
    pass

def get_label_groups_for_novel_user(novel_id : int, user_id : int, session : Session) -> List[LabelGroup]:
    pass

def get_label_data_for_label_group(label_group_id : int, session : Session) -> Dict[int, int]:
    """Return a map chapter_num : label_data_id"""
    pass

def get_label_data(label_data_id : int, session : Session) -> dict:
    pass

def update_label_data(data : dict, label_data_id : int, session : Session):
    pass