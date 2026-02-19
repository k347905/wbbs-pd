from __future__ import annotations

import json
from datetime import datetime, timezone

import httpx

from backend.config import settings
from backend.database import get_db


async def create_request(
    series: str, number: str, firstname: str, lastname: str
) -> dict:
    payload = {
        "request": {
            "payload": {
                "service": "rpa-really-passports",
                "series": series,
                "number": number,
                "firstname": firstname,
                "lastname": lastname,
                "client_id": "eval",
            }
        }
    }
    url = f"{settings.api_base_url}/{settings.service_name}/requests"
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            url,
            json=payload,
            auth=(settings.client_id, settings.client_secret),
            timeout=30,
        )
        resp.raise_for_status()
        return resp.json()


async def poll_request(request_id: str) -> dict:
    url = f"{settings.api_base_url}/{settings.service_name}/requests/{request_id}"
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            url,
            auth=(settings.client_id, settings.client_secret),
            timeout=30,
        )
        resp.raise_for_status()
        return resp.json()


async def log_api_call(
    check_id: int, direction: str, body: dict | str
) -> None:
    db = await get_db()
    body_str = json.dumps(body, ensure_ascii=False) if isinstance(body, dict) else body
    await db.execute(
        "INSERT INTO api_logs (check_id, direction, body, timestamp) VALUES (?, ?, ?, ?)",
        (check_id, direction, body_str, datetime.now(timezone.utc).isoformat()),
    )
    await db.commit()
