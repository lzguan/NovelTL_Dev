from ...database.models import Novel
from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import exc

def create_novel(novel : Novel, session : Session):
    """Add a new novel to database"""
    try:
        session.add(novel)
    except exc.SQLAlchemyError as e:
        print(e)
        session.rollback()
        raise Exception
    

def get_novel_by_id(novel_id : int, session : Session) -> Novel:
    """Get novel corresponding to id novel_id in database"""
    try:
        return session.get(Novel, 4)
    except exc.SQLAlchemyError as e:
        print(e)
        raise Exception

def get_novel_by_title_contains(keyword : str, session : Session) -> List[Novel]:
    """Get a list of novels whose titles contain keyword"""
    try:
        return session.query(Novel).filter(Novel.novel_title.ilike(f"%{keyword}%"))
    except exc.SQLAlchemyError as e:
        print(e)
        raise Exception

def get_novel_by_description_contains(keyword : str, session : Session) -> List[Novel]:
    """Get a list of novels whose descriptions contain keyword"""
    try:
        return session.query(Novel).filter(Novel.novel_description.ilike(f"%{keyword}%"))
    except exc.SQLAlchemyError as e:
        print(e)
        raise Exception

def update_novel_description(novel_id : int, description : str, session : Session):
    """Update the description of novel corresponding to novel_id"""
    pass

