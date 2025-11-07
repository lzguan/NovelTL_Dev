from pydantic import BaseModel
from typing import Literal

class User(BaseModel):
    user_id : int
    user_name : str
    user_type : Literal['user', 'admin']

class UserCreate(BaseModel):
    user_name : str
    user_password : str

class UserDelete(BaseModel):
    status : int
    detail : str | None = None

class Token(BaseModel):
    access_token : str
    token_type : str

class TokenData(BaseModel):
    user_name : str | None = None