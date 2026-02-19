from __future__ import annotations

from backend.database import get_db
from backend.models import ConfusionMatrixData, TimingStats


async def compute_confusion_matrix(
    include_entity_not_found_as_invalid: bool = False,
) -> ConfusionMatrixData:
    db = await get_db()
    rows = await db.execute_fetchall(
        """SELECT api_result_status, actual_label
           FROM checks
           WHERE actual_label IS NOT NULL AND api_result_status IS NOT NULL"""
    )

    tp = tn = fp = fn = entity_not_found = 0

    for row in rows:
        predicted = row["api_result_status"]
        actual = row["actual_label"]

        if predicted == "entity_not_found":
            entity_not_found += 1
            if not include_entity_not_found_as_invalid:
                continue
            predicted = "invalid"

        if predicted == "valid" and actual == "valid":
            tp += 1
        elif predicted == "invalid" and actual == "invalid":
            tn += 1
        elif predicted == "valid" and actual == "invalid":
            fp += 1
        elif predicted == "invalid" and actual == "valid":
            fn += 1

    total = tp + tn + fp + fn
    accuracy = (tp + tn) / total if total else 0.0
    precision_val = tp / (tp + fp) if (tp + fp) else 0.0
    recall = tp / (tp + fn) if (tp + fn) else 0.0
    f1 = (
        2 * precision_val * recall / (precision_val + recall)
        if (precision_val + recall)
        else 0.0
    )

    return ConfusionMatrixData(
        tp=tp,
        tn=tn,
        fp=fp,
        fn=fn,
        entity_not_found=entity_not_found,
        accuracy=round(accuracy, 4),
        precision_val=round(precision_val, 4),
        recall=round(recall, 4),
        f1=round(f1, 4),
        total_labeled=total + (entity_not_found if not include_entity_not_found_as_invalid else 0),
    )


async def compute_timing_stats() -> TimingStats | None:
    db = await get_db()
    rows = await db.execute_fetchall(
        "SELECT duration_ms FROM checks WHERE duration_ms IS NOT NULL ORDER BY duration_ms"
    )
    if not rows:
        return None

    durations = [row["duration_ms"] for row in rows]
    n = len(durations)
    avg = sum(durations) / n
    p50 = durations[n // 2]
    p95_idx = min(int(n * 0.95), n - 1)
    p95 = durations[p95_idx]

    return TimingStats(
        avg_ms=round(avg, 1),
        min_ms=durations[0],
        max_ms=durations[-1],
        p50_ms=p50,
        p95_ms=p95,
        total_completed=n,
    )
