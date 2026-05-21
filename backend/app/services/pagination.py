from math import ceil

from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session


def paginate(db: Session, statement: Select, page: int, page_size: int):
    total_items = db.scalar(select(func.count()).select_from(statement.subquery())) or 0
    items = db.execute(statement.offset((page - 1) * page_size).limit(page_size)).all()
    total_pages = ceil(total_items / page_size) if total_items else 0
    return {
        "items": items,
        "page": page,
        "page_size": page_size,
        "total_items": total_items,
        "total_pages": total_pages,
    }

