from __future__ import annotations

from fastapi import APIRouter, UploadFile, File, Form
from backend.database import get_db
from backend.models import BatchCreate, BatchRead, CheckInput
from backend.obfuscation import obfuscate_series, obfuscate_number, obfuscate_name
from backend.tasks import enqueue, CheckJob
from backend.csv_parser import parse_csv

router = APIRouter(prefix="/api/checks", tags=["checks"])


async def _create_batch(name: str, items: list[CheckInput]) -> BatchRead:
    db = await get_db()
    cursor = await db.execute(
        "INSERT INTO check_batches (name, status) VALUES (?, 'processing')",
        (name,),
    )
    batch_id = cursor.lastrowid
    await db.commit()

    for item in items:
        cur = await db.execute(
            """INSERT INTO checks
               (batch_id, series_obfuscated, number_obfuscated,
                firstname_obfuscated, lastname_obfuscated, status)
               VALUES (?, ?, ?, ?, ?, 'pending')""",
            (
                batch_id,
                obfuscate_series(item.series),
                obfuscate_number(item.number),
                obfuscate_name(item.firstname),
                obfuscate_name(item.lastname),
            ),
        )
        check_id = cur.lastrowid
        await db.commit()
        enqueue(
            CheckJob(
                check_id=check_id,
                series=item.series,
                number=item.number,
                firstname=item.firstname,
                lastname=item.lastname,
            )
        )

    row = await db.execute_fetchall(
        "SELECT * FROM check_batches WHERE id=?", (batch_id,)
    )
    return BatchRead(
        id=row[0]["id"],
        name=row[0]["name"],
        status=row[0]["status"],
        created_at=row[0]["created_at"],
        total=len(items),
        completed=0,
    )


@router.post("/batch", response_model=BatchRead)
async def create_batch(data: BatchCreate):
    return await _create_batch(data.name, data.checks)


@router.post("/upload-csv", response_model=BatchRead)
async def upload_csv(
    file: UploadFile = File(...),
    name: str = Form("CSV Upload"),
):
    content = await file.read()
    items = parse_csv(content)
    return await _create_batch(name, items)


@router.get("/batches", response_model=list[BatchRead])
async def list_batches():
    db = await get_db()
    rows = await db.execute_fetchall(
        """SELECT b.*,
                  COUNT(c.id) as total,
                  SUM(CASE WHEN c.status='completed' THEN 1 ELSE 0 END) as completed
           FROM check_batches b
           LEFT JOIN checks c ON c.batch_id = b.id
           GROUP BY b.id
           ORDER BY b.created_at DESC"""
    )
    return [
        BatchRead(
            id=r["id"],
            name=r["name"],
            status=r["status"],
            created_at=r["created_at"],
            total=r["total"] or 0,
            completed=r["completed"] or 0,
        )
        for r in rows
    ]
