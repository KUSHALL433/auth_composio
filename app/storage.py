import json
import os
import sqlite3
import uuid

from datetime import datetime, timezone
from pathlib import Path
from typing import Any


DEFAULT_DB_PATH = (
    Path(__file__).resolve().parent.parent / "oauth_launchpad.db"
)

DB_PATH = Path(
    os.getenv("OAUTH_LAUNCHPAD_DB", str(DEFAULT_DB_PATH))
)


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def get_connection() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)

    connection = sqlite3.connect(
        str(DB_PATH),
        timeout=10,
    )
    connection.row_factory = sqlite3.Row

    return connection


def initialize_db() -> None:
    """Create persistence tables if they do not already exist."""

    with get_connection() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS investigations (
                id TEXT PRIMARY KEY,
                app_name TEXT NOT NULL,
                website TEXT,
                status TEXT NOT NULL,
                guide_json TEXT,
                research_json TEXT,
                analysis_json TEXT,
                error TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )

        connection.execute(
            """
            CREATE INDEX IF NOT EXISTS
            idx_investigations_created_at
            ON investigations(created_at DESC)
            """
        )

        connection.execute(
            """
            CREATE INDEX IF NOT EXISTS
            idx_investigations_app_name
            ON investigations(app_name COLLATE NOCASE)
            """
        )

        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS guide_feedback (
                id TEXT PRIMARY KEY,
                investigation_id TEXT NOT NULL,
                rating INTEGER NOT NULL,
                comment TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY(investigation_id)
                    REFERENCES investigations(id)
                    ON DELETE CASCADE
            )
            """
        )


def _json_dump(value: Any) -> str | None:
    if value is None:
        return None

    if hasattr(value, "model_dump"):
        value = value.model_dump(mode="json")

    return json.dumps(
        value,
        ensure_ascii=False,
        default=str,
    )


def _to_dict(row: sqlite3.Row) -> dict:
    item = dict(row)

    for field in (
        "guide_json",
        "research_json",
        "analysis_json",
    ):
        raw = item.pop(field, None)
        item[field.removesuffix("_json")] = (
            json.loads(raw) if raw else None
        )

    return item


def create_investigation(
    app_name: str,
    website: str | None = None,
) -> str:
    """Create a persistent record before the investigation starts."""

    investigation_id = str(uuid.uuid4())
    timestamp = utc_now()

    with get_connection() as connection:
        connection.execute(
            """
            INSERT INTO investigations (
                id,
                app_name,
                website,
                status,
                created_at,
                updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                investigation_id,
                app_name,
                website,
                "running",
                timestamp,
                timestamp,
            ),
        )

    return investigation_id


def complete_investigation(
    investigation_id: str,
    guide: Any,
    research: Any = None,
    analysis: Any = None,
) -> dict:
    """Save the final guide and its supporting research."""

    with get_connection() as connection:
        cursor = connection.execute(
            """
            UPDATE investigations
            SET status = ?,
                guide_json = ?,
                research_json = ?,
                analysis_json = ?,
                error = NULL,
                updated_at = ?
            WHERE id = ?
            """,
            (
                "completed",
                _json_dump(guide),
                _json_dump(research),
                _json_dump(analysis),
                utc_now(),
                investigation_id,
            ),
        )

        if cursor.rowcount == 0:
            raise ValueError(
                f"Investigation not found: {investigation_id}"
            )

    return get_investigation(investigation_id)


def fail_investigation(
    investigation_id: str,
    error: str,
) -> None:
    """Persist an investigation failure without exposing a traceback."""

    with get_connection() as connection:
        connection.execute(
            """
            UPDATE investigations
            SET status = ?,
                error = ?,
                updated_at = ?
            WHERE id = ?
            """,
            (
                "failed",
                str(error)[:2000],
                utc_now(),
                investigation_id,
            ),
        )


def get_investigation(
    investigation_id: str,
) -> dict | None:
    with get_connection() as connection:
        row = connection.execute(
            """
            SELECT *
            FROM investigations
            WHERE id = ?
            """,
            (investigation_id,),
        ).fetchone()

    return _to_dict(row) if row else None


def list_investigations(
    limit: int = 20,
    offset: int = 0,
    app_name: str | None = None,
) -> dict:
    """Return paginated investigation history."""

    limit = max(1, min(limit, 100))
    offset = max(0, offset)

    with get_connection() as connection:
        if app_name:
            where_clause = "WHERE app_name LIKE ? COLLATE NOCASE"
            params = (f"%{app_name}%",)

            total = connection.execute(
                f"SELECT COUNT(*) FROM investigations {where_clause}",
                params,
            ).fetchone()[0]

            rows = connection.execute(
                f"""
                SELECT id, app_name, website, status,
                       error, created_at, updated_at
                FROM investigations
                {where_clause}
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
                """,
                (*params, limit, offset),
            ).fetchall()
        else:
            total = connection.execute(
                "SELECT COUNT(*) FROM investigations"
            ).fetchone()[0]

            rows = connection.execute(
                """
                SELECT id, app_name, website, status,
                       error, created_at, updated_at
                FROM investigations
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
                """,
                (limit, offset),
            ).fetchall()

    return {
        "items": [dict(row) for row in rows],
        "total": total,
        "limit": limit,
        "offset": offset,
    }


def save_feedback(
    investigation_id: str,
    rating: int,
    comment: str | None = None,
) -> dict:
    """Save feedback for a persisted investigation."""

    if rating < 1 or rating > 5:
        raise ValueError("Rating must be between 1 and 5.")

    with get_connection() as connection:
        exists = connection.execute(
            "SELECT id FROM investigations WHERE id = ?",
            (investigation_id,),
        ).fetchone()

        if not exists:
            raise ValueError("Investigation not found.")

        feedback_id = str(uuid.uuid4())
        created_at = utc_now()

        connection.execute(
            """
            INSERT INTO guide_feedback (
                id,
                investigation_id,
                rating,
                comment,
                created_at
            )
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                feedback_id,
                investigation_id,
                rating,
                comment[:2000] if comment else None,
                created_at,
            ),
        )

    return {
        "id": feedback_id,
        "investigation_id": investigation_id,
        "rating": rating,
        "comment": comment,
        "created_at": created_at,
    }