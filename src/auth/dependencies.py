from fastapi.security import OAuth2PasswordBearer
from fastapi import Depends, HTTPException, status
from typing import Annotated
from .config import *
from .schemas import *
from .service import *
import jwt
from jwt.exceptions import InvalidTokenError

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def get_current_user(db : Annotated[Session, Depends(get_db)], token : Annotated[str, Depends(oauth2_scheme)]) -> schemas.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(user_name=username)
    except InvalidTokenError:
        raise credentials_exception
    user = get_user(db, token_data.user_name)
    if not user:
        raise credentials_exception
    return user

