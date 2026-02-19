from fastapi import APIRouter
from backend.database import get_db
from backend.models import LabelUpdate

router = APIRouter(prefix="/api/labels", tags=["labels"])


@router.patch("/{check_id}")
async def update_label(check_id: int, data: LabelUpdate):
    db = await get_db()
    await db.execute(
        "UPDATE checks SET actual_label=? WHERE id=?",
        (data.actual_label, check_id),
    )
    await db.commit()
    return {"ok": True, "check_id": check_id, "actual_label": data.actual_label}
