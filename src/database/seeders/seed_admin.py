# seed admin account
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from ..models import *
from ...config import *

engine = create_engine(DB_URL)
with Session(engine) as session:
    admin = User(user_name=ADMIN_USERNAME)
    session.add(admin)
    session.commit()