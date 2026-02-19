from __future__ import annotations

from fastapi import APIRouter, Query
from backend.database import get_db
from backend.models import LogEntry, TimingStats
from backend.metrics import compute_timing_stats

router = APIRouter(prefix="/api/logs", tags=["logs"])


@router.get("", response_model=list[LogEntry])
async def list_logs(
    check_id: int | None = Query(None),
    direction: str | None = Query(None),
    limit: int = Query(100, le=1000),
    offset: int = Query(0),
):
    db = await get_db()
    where_parts: list[str] = []
    params: list = []

    if check_id is not None:
        where_parts.append("check_id = ?")
        params.append(check_id)
    if direction is not None:
        where_parts.append("direction = ?")
        params.append(direction)

    where_clause = (" WHERE " + " AND ".join(where_parts)) if where_parts else ""
    params.extend([limit, offset])

    rows = await db.execute_fetchall(
        f"SELECT * FROM api_logs {where_clause} ORDER BY timestamp DESC LIMIT ? OFFSET ?",
        params,
    )
    return [
        LogEntry(
            id=r["id"],
            check_id=r["check_id"],
            direction=r["direction"],
            body=r["body"],
            timestamp=r["timestamp"],
        )
        for r in rows
    ]


@router.get("/timing", response_model=TimingStats | None)
async def get_timing_stats():
    return await compute_timing_stats()
