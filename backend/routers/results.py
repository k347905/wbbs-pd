from __future__ import annotations

from fastapi import APIRouter, Query
from backend.database import get_db
from backend.models import CheckRead

router = APIRouter(prefix="/api/results", tags=["results"])


@router.get("", response_model=list[CheckRead])
async def list_results(
    batch_id: int | None = Query(None),
    status: str | None = Query(None),
    api_result_status: str | None = Query(None),
    actual_label: str | None = Query(None),
    limit: int = Query(100, le=1000),
    offset: int = Query(0),
):
    db = await get_db()
    where_parts = []
    params: list = []

    if batch_id is not None:
        where_parts.append("c.batch_id = ?")
        params.append(batch_id)
    if status is not None:
        where_parts.append("c.status = ?")
        params.append(status)
    if api_result_status is not None:
        where_parts.append("c.api_result_status = ?")
        params.append(api_result_status)
    if actual_label == "null":
        where_parts.append("c.actual_label IS NULL")
    elif actual_label is not None:
        where_parts.append("c.actual_label = ?")
        params.append(actual_label)

    where_clause = (" WHERE " + " AND ".join(where_parts)) if where_parts else ""
    params.extend([limit, offset])

    rows = await db.execute_fetchall(
        f"""SELECT c.*, b.name as batch_name
            FROM checks c
            LEFT JOIN check_batches b ON b.id = c.batch_id
            {where_clause}
            ORDER BY c.created_at DESC
            LIMIT ? OFFSET ?""",
        params,
    )
    return [
        CheckRead(
            id=r["id"],
            batch_id=r["batch_id"],
            batch_name=r["batch_name"],
            series_obfuscated=r["series_obfuscated"],
            number_obfuscated=r["number_obfuscated"],
            firstname_obfuscated=r["firstname_obfuscated"],
            lastname_obfuscated=r["lastname_obfuscated"],
            api_request_id=r["api_request_id"],
            api_result_status=r["api_result_status"],
            actual_label=r["actual_label"],
            request_sent_at=r["request_sent_at"],
            response_received_at=r["response_received_at"],
            duration_ms=r["duration_ms"],
            status=r["status"],
            error_message=r["error_message"],
            created_at=r["created_at"],
        )
        for r in rows
    ]
