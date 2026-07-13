from __future__ import annotations

import os
from pathlib import Path

from sqlalchemy import create_engine, text

BASE_DIR = Path(__file__).resolve().parents[1]
MIGRATION_PATH = BASE_DIR / "migrations" / "001_postgis_location.sql"
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'data' / 'roadguard.db'}")


def main() -> None:
    if not DATABASE_URL.startswith("postgresql"):
        raise SystemExit("This migration is intended for PostgreSQL/PostGIS databases.")

    engine = create_engine(DATABASE_URL)
    sql_text = MIGRATION_PATH.read_text(encoding="utf-8")

    with engine.begin() as connection:
        for statement in [part.strip() for part in sql_text.split(";") if part.strip()]:
            connection.execute(text(statement))

    print(f"Applied migration: {MIGRATION_PATH.name}")


if __name__ == "__main__":
    main()
