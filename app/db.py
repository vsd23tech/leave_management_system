from contextlib import contextmanager

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, scoped_session, sessionmaker


class Base(DeclarativeBase):
    """Declarative base for all ORM models."""

    pass


_engine = None
_Session = None


def init_engine(db_url: str):
    global _engine, _Session
    if _engine is None:
        _engine = create_engine(db_url, future=True, pool_pre_ping=True)
        _Session = scoped_session(sessionmaker(bind=_engine, autoflush=False, autocommit=False))
    return _engine


def get_engine():
    return _engine


def get_session():
    if _Session is None:
        raise RuntimeError("Database not initialized. Call init_engine(db_url) first.")
    return _Session


@contextmanager
def session_scope():
    """Provide a transactional scope around a series of operations."""
    session = get_session()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.remove()
