from .database import get_db
from . import models
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from .config import *

username = 'leo'
db = Session(bind=create_engine(DB_URL))
db_user = db.query(models.User).filter_by(user_name = username).first()
if not db_user:
    print("none")
print("a")