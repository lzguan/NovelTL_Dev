from ...database.models import User
from sqlalchemy.orm import Session

def create_user(user : User, session : Session):
    session.add(user)

def get_user_by_id(user_id : int, session : Session) -> User:
    return session.query(User).filter(User.user_id == user_id).first()

