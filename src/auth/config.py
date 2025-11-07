import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY : str = os.getenv('SECRET_KEY')
ACCESS_TOKEN_EXPIRE_MINUTES = 30
ALGORITHM = "HS256"