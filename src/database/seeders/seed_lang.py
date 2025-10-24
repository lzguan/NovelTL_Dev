# seed languages
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from ..models import *
from ...config import *

engine = create_engine(DB_URL)
with Session(engine) as session:
    english = Language(language_name = 'English', language_code = 'en')
    chinese = Language(language_name = 'Chinese', language_code = 'zh')
    japanese = Language(language_name = 'Japanese', language_code = 'jp')
    korean = Language(language_name = 'Korean', language_code = 'kr') 
    session.add(english)
    session.add(chinese)
    session.add(japanese)
    session.add(korean)
    session.commit()