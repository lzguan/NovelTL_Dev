from sqlalchemy import create_engine
from sqlalchemy import text
from sqlalchemy import insert
from ...src import config
from ..database import models

engine = create_engine(config.DB_URL)
with engine.connect() as conn:
    result = conn.execute(text("select 'hello world'"))
    print(result.all())