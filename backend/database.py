import os
from pathlib import Path

import aiosqlite

from backend.config import settings

_db: aiosqlite.Connection | None = None

MIGRATIONS = [
    """
    CREATE TABLE IF NOT EXISTS check_batches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS checks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        batch_id INTEGER NOT NULL REFERENCES check_batches(id),
        series_obfuscated TEXT NOT NULL,
        number_obfuscated TEXT NOT NULL,
        firstname_obfuscated TEXT NOT NULL,
        lastname_obfuscated TEXT NOT NULL,
        api_request_id TEXT,
        api_result_status TEXT,
        actual_label TEXT,
        request_sent_at TEXT,
        response_received_at TEXT,
        duration_ms INTEGER,
        status TEXT NOT NULL DEFAULT 'pending',
        error_message TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS api_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        check_id INTEGER NOT NULL REFERENCES checks(id),
        direction TEXT NOT NULL,
        body TEXT NOT NULL,
        timestamp TEXT NOT NULL DEFAULT (datetime('now'))
    );
    """,
]


async def get_db() -> aiosqlite.Connection:
    global _db
    if _db is None:
        raise RuntimeError("Database not initialized")
    return _db


async def init_db() -> None:
    global _db
    db_path = Path(settings.database_path)
    os.makedirs(db_path.parent, exist_ok=True)
    _db = await aiosqlite.connect(str(db_path))
    _db.row_factory = aiosqlite.Row
    await _db.execute("PRAGMA journal_mode=WAL")
    await _db.execute("PRAGMA foreign_keys=ON")
    for migration in MIGRATIONS:
        await _db.executescript(migration)
    await _db.commit()


async def close_db() -> None:
    global _db
    if _db is not None:
        await _db.close()
        _db = None
