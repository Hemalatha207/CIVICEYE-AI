import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

logger = logging.getLogger("civiceye.database")

from app.core.config import settings

def get_engine():
    # Attempt MySQL first
    try:
        engine = create_engine(
            settings.DATABASE_URL,
            pool_pre_ping=True,
            pool_recycle=3600,
            connect_args={"connect_timeout": 3} if "mysql" in settings.DATABASE_URL else {}
        )
        # Test connection
        with engine.connect() as conn:
            pass
        logger.info(f"Connected to primary database: {settings.DATABASE_URL.split('@')[-1] if '@' in settings.DATABASE_URL else settings.DATABASE_URL}")
        return engine
    except Exception as e:
        logger.warning(f"Could not connect to primary database ({e}). Falling back to SQLite: {settings.SQLITE_FALLBACK_URL}")
        engine = create_engine(
            settings.SQLITE_FALLBACK_URL,
            connect_args={"check_same_thread": False}
        )
        return engine

engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
