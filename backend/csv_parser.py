from __future__ import annotations

import csv
import io
from backend.models import CheckInput


def parse_csv(content: str | bytes) -> list[CheckInput]:
    if isinstance(content, bytes):
        content = content.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(content))
    results: list[CheckInput] = []
    for row in reader:
        # Normalize column names: strip whitespace, lowercase
        norm = {k.strip().lower(): v.strip() for k, v in row.items()}
        results.append(
            CheckInput(
                series=norm.get("series", ""),
                number=norm.get("number", ""),
                firstname=norm.get("firstname", norm.get("first_name", "")),
                lastname=norm.get("lastname", norm.get("last_name", "")),
            )
        )
    return results
