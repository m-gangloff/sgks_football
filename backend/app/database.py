import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from .models import Base

# Load .env here so FOOTBALL_DB_URL is available regardless of import order
# (this module is imported before main.py calls load_dotenv). No-op on Render,
# where env vars come from the dashboard.
load_dotenv()

# Allow override via environment variable. Local dev defaults to a SQLite file;
# in production set FOOTBALL_DB_URL to a managed Postgres (e.g. Neon):
#   postgresql+psycopg://USER:PASSWORD@HOST/DBNAME?sslmode=require
SQLALCHEMY_DATABASE_URL = os.getenv("FOOTBALL_DB_URL", "sqlite:///./football.db")

if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    # check_same_thread is a SQLite-only flag (needed for FastAPI's threadpool).
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    # pool_pre_ping recycles connections dropped when serverless Postgres
    # (Neon) scales to zero between our weekly bursts of activity.
    engine = create_engine(SQLALCHEMY_DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    Base.metadata.create_all(bind=engine) 