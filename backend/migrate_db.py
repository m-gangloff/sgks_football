"""One-time migration of the app database from one SQLAlchemy URL to another
(built for moving the local SQLite file into a managed Postgres such as Neon).

It copies every row of every table preserving primary keys, then fixes the
Postgres id sequences so future inserts don't collide.

Usage (from the backend/ directory):

    TARGET_DB_URL="postgresql+psycopg://USER:PASSWORD@HOST/DB?sslmode=require" \
        uv run python migrate_db.py [path/to/football.db]

- Source defaults to sqlite:///./football.db (override with $SOURCE_DB_URL or a
  positional path argument).
- Refuses to run if the target already contains players, unless you pass
  --force, which first clears the target tables and re-imports.
"""
import os
import sys

from sqlalchemy import create_engine, select, insert, func, text

from app.models import Base, Player, Match, Goal, PlayerVisibility

# FK-safe order for inserting; reverse it for deleting.
TABLES = [Player.__table__, Match.__table__, Goal.__table__, PlayerVisibility.__table__]


def main():
    force = "--force" in sys.argv[1:]
    positional = [a for a in sys.argv[1:] if not a.startswith("-")]

    source_url = os.getenv("SOURCE_DB_URL")
    if not source_url:
        source_url = f"sqlite:///{positional[0]}" if positional else "sqlite:///./football.db"
    target_url = os.getenv("TARGET_DB_URL")
    if not target_url:
        sys.exit("Set TARGET_DB_URL to the destination database URL (e.g. your Neon connection string).")

    print(f"Source: {source_url}")
    print(f"Target: {target_url.split('@')[-1] if '@' in target_url else target_url}")

    src = create_engine(source_url)
    dst = create_engine(target_url, pool_pre_ping=True)

    # Ensure the schema exists on the destination.
    Base.metadata.create_all(bind=dst)

    with src.connect() as sconn, dst.begin() as dconn:
        existing = dconn.execute(select(func.count()).select_from(Player.__table__)).scalar() or 0
        if existing and not force:
            sys.exit(
                f"Target already has {existing} players. Re-run with --force to clear and re-import."
            )
        if existing and force:
            print(f"--force: clearing {existing} existing players and related rows")
            for table in reversed(TABLES):
                dconn.execute(table.delete())

        for table in TABLES:
            rows = [dict(r) for r in sconn.execute(select(table)).mappings().all()]
            print(f"  {table.name}: {len(rows)} rows")
            if rows:
                dconn.execute(insert(table), rows)

        if dst.dialect.name == "postgresql":
            for table in TABLES:
                dconn.execute(
                    text(
                        f"SELECT setval(pg_get_serial_sequence('{table.name}', 'id'), "
                        f"COALESCE((SELECT MAX(id) FROM {table.name}), 1))"
                    )
                )

    print("Migration complete.")


if __name__ == "__main__":
    main()
