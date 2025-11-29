from . import models
from sqlalchemy.orm import Session
from src.auth.models import User

def autogenerate_labels_for_chapter_revision(db : Session, current_user : User, raw_chapter_revision_id : int) -> models.AutoLabel: # type: ignore
    pass