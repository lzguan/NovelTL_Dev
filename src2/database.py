from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from .config import *

engine = create_engine(DB_URL)
SessionLocal = sessionmaker(autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()