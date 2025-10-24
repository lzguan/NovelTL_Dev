from ..database import get_db
from sqlalchemy.orm import Session
from typing import Annotated
from . import models, schemas
from fastapi import Depends
from .utils import *

def get_user(db : Session, username : str) -> models.User | None:
    db_user = db.query(models.User).filter_by(user_name = username).first()
    if not db_user:
        return None
    return db_user

def authenticate_user(db : Session, username : str, password : str) -> models.User | None:
    db_user = get_user(db, username)
    if not db_user:
        return None
    if not verify_password(password, db_user.user_hashed_password):
        return None
    
    return db_user

def create_user(db : Session, username : str, password : str) -> models.User | None:
    hashed_password = hash_password(password)
    new_user = models.User(user_name=username, user_hashed_password=hashed_password, user_type='user')
    try:
        db.add(new_user)
        db.commit()
    except Exception as e:
        db.rollback()
        return None
    return new_user

def delete_user(db : Session, current_user : schemas.User) -> schemas.UserDelete | None:
    try:
        db.query(models.User).filter_by(user_id=current_user.user_id).delete()
        db.commit()
    except Exception:
        return schemas.UserDelete(status=400, detail="delete failed")
    return schemas.UserDelete(status=204, detail="delete success")

def create_admin(db : Session, current_user : schemas.User, user_data : schemas.UserCreate) -> models.User | None:
    if current_user.user_type != 'admin':
        return None
    hashed_password = hash_password(user_data.user_password)
    new_user = models.User(user_name=user_data.user_name, user_hashed_password=hashed_password, user_type='admin')
    try:
        db.add(new_user)
        db.commit()
    except Exception as e:
        db.rollback()
        return None
    return new_user