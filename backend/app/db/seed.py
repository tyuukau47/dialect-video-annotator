from app.db.init_db import run_seed
from app.db.session import SessionLocal


def main() -> None:
    db = SessionLocal()
    try:
        run_seed(db)
        print("Seed completed.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
