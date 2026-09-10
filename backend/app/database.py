"""
Bridge Point — Database Engine & Session Management
Uses SQLAlchemy with SQLite for local development.
Swap DATABASE_URL to PostgreSQL for production.
"""

from sqlalchemy import create_engine, event, inspect, text
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from app.config import DATABASE_URL


# ─── Engine Setup ───────────────────────────────────────
connect_args = {}
engine_kwargs = {"echo": False}

if DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False
else:
    # PostgreSQL connection pool settings
    engine_kwargs.update({
        "pool_size": 5,
        "max_overflow": 10,
        "pool_pre_ping": True,      # Auto-reconnect stale connections
        "pool_recycle": 300,         # Recycle connections every 5 minutes
    })

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    **engine_kwargs,
)

# Enable WAL mode and foreign keys for SQLite
if DATABASE_URL.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def _set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL;")
        cursor.execute("PRAGMA foreign_keys=ON;")
        cursor.close()


# ─── Session Factory ───────────────────────────────────
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


# ─── Base Model ────────────────────────────────────────
class Base(DeclarativeBase):
    pass


def migrate_sqlite_schema() -> None:
    """Add safe model columns to existing local SQLite/PostgreSQL databases."""
    if DATABASE_URL.startswith(("postgresql", "postgres")):
        inspector = inspect(engine)
        if inspector.has_table("users") and "provider_verification_status" not in {
            column["name"] for column in inspector.get_columns("users")
        }:
            with engine.begin() as connection:
                connection.execute(text(
                    "ALTER TABLE users ADD COLUMN provider_verification_status "
                    "VARCHAR(20) NOT NULL DEFAULT 'VERIFIED'"
                ))
        return
    if not DATABASE_URL.startswith("sqlite"):
        return

    inspector = inspect(engine)
    with engine.begin() as connection:
        for table in Base.metadata.sorted_tables:
            if not inspector.has_table(table.name):
                continue

            existing = {column["name"] for column in inspector.get_columns(table.name)}
            for column in table.columns:
                if column.name in existing:
                    continue

                default = column.default.arg if column.default and column.default.is_scalar else None
                if not column.nullable and default is None and column.server_default is None:
                    continue

                column_type = column.type.compile(dialect=engine.dialect)
                definition = f'"{column.name}" {column_type}'
                if not column.nullable:
                    definition += " NOT NULL"
                if default is not None:
                    if isinstance(default, bool):
                        default = int(default)
                    if isinstance(default, str):
                        default = "'" + default.replace("'", "''") + "'"
                    definition += f" DEFAULT {default}"
                elif column.server_default is not None:
                    definition += f" DEFAULT {column.server_default.arg}"

                connection.execute(
                    text(f'ALTER TABLE "{table.name}" ADD COLUMN {definition}')
                )


# ─── Dependency ────────────────────────────────────────
def get_db():
    """FastAPI dependency that yields a DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
