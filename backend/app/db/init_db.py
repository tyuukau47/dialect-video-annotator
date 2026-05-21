from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import VocabularyEntry


DEFAULT_GENDERS = ["Female", "Male", "Non-binary", "Unknown"]
DEFAULT_EMOTIONS = ["Neutral", "Happy", "Sad", "Angry", "Excited", "Other"]


def seed_vocabularies(db: Session) -> None:
    existing = {
        (entry.type, entry.value)
        for entry in db.scalars(select(VocabularyEntry)).all()
    }

    for value in DEFAULT_GENDERS:
        key = ("gender", value)
        if key not in existing:
            db.add(VocabularyEntry(type="gender", value=value, is_active=True))

    for value in DEFAULT_EMOTIONS:
        key = ("emotion", value)
        if key not in existing:
            db.add(VocabularyEntry(type="emotion", value=value, is_active=True))

    db.commit()


def run_seed(db: Session) -> None:
    seed_vocabularies(db)
