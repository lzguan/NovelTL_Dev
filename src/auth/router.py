from ..database import get_db
from fastapi import APIRouter, Depends, HTTPException, status
from .dependencies import *
from .service import *
from .schemas import *
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from typing import Annotated

router = APIRouter()

@router.post("/token", response_model=schemas.Token)
async def login_for_access_token(form_data : Annotated[OAuth2PasswordRequestForm, Depends()], db : Annotated[Session, Depends(get_db)]):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate" : "Bearer"}
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        {"sub" : user.user_name},
        access_token_expires
    )
    return schemas.Token(access_token=access_token, token_type='bearer')

@router.post("/new_user", response_model=schemas.User)
async def post_new_user(user_data : schemas.UserCreate, db :  Annotated[Session, Depends(get_db)]):
    new_user = create_user(db, user_data.user_name, user_data.user_password)
    if not new_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Unable to create new user",
            headers={"WWW-Authenticate" : "Bearer"}
        )
    return new_user

@router.get("/users/me", response_model=schemas.User)
async def read_users_me(
    current_user : Annotated[schemas.User, Depends(get_current_user)]
):
    return current_user

@router.delete("/delete/me", response_model=schemas.UserDelete)
async def delete_users_me(
    current_user : Annotated[schemas.User, Depends(get_current_user)], db : Annotated[Session, Depends(get_db)]
):
    return delete_user(db, current_user)

@router.post("/new_admin", response_model=schemas.User)
async def post_new_admin(user_data : schemas.UserCreate, db : Annotated[Session, Depends(get_db)], current_user : Annotated[schemas.User, Depends(get_current_user)]):
    new_user = create_admin(db, current_user, user_data)
    if not new_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Unable to create new admin",
            headers={"WWW-Authenticate" : "Bearer"}
        )
    return new_user