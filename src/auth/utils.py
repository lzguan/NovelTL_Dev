from pwdlib import PasswordHash
from datetime import datetime, timedelta, timezone
from .config import *
import jwt

password_hash = PasswordHash.recommended()

def verify_password(plain_password : str, hashed_password : str) -> bool:
    return password_hash.verify(plain_password, hashed_password)

def hash_password(password : str) -> str:
    return password_hash.hash(password)

def create_access_token(data : dict, expires_delta : timedelta) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp" : expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

