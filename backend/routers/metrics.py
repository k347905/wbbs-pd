from fastapi import APIRouter, Query
from backend.models import ConfusionMatrixData
from backend.metrics import compute_confusion_matrix

router = APIRouter(prefix="/api/metrics", tags=["metrics"])


@router.get("/confusion-matrix", response_model=ConfusionMatrixData)
async def get_confusion_matrix(
    include_enf_as_invalid: bool = Query(False),
):
    return await compute_confusion_matrix(
        include_entity_not_found_as_invalid=include_enf_as_invalid
    )
