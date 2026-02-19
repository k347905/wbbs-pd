from __future__ import annotations

import asyncio
import json
import logging
from datetime import datetime, timezone
from dataclasses import dataclass

from backend.config import settings
from backend.database import get_db
from backend.api_client import create_request, poll_request, log_api_call

logger = logging.getLogger(__name__)


@dataclass
class CheckJob:
    check_id: int
    series: str
    number: str
    firstname: str
    lastname: str


_queue: asyncio.Queue[CheckJob] = asyncio.Queue()
_running = False


def enqueue(job: CheckJob) -> None:
    _queue.put_nowait(job)


async def _process_one(job: CheckJob) -> None:
    db = await get_db()
    sent_at = datetime.now(timezone.utc)
    try:
        await db.execute(
            "UPDATE checks SET status='processing', request_sent_at=? WHERE id=?",
            (sent_at.isoformat(), job.check_id),
        )
        await db.commit()

        request_payload = {
            "series": job.series,
            "number": job.number,
            "firstname": job.firstname,
            "lastname": job.lastname,
        }
        await log_api_call(job.check_id, "request", request_payload)

        resp = await create_request(
            job.series, job.number, job.firstname, job.lastname
        )
        await log_api_call(job.check_id, "response_create", resp)

        request_id = str(resp.get("id") or resp.get("request", {}).get("id", ""))
        if not request_id:
            raise ValueError(f"No request id in response: {resp}")

        await db.execute(
            "UPDATE checks SET api_request_id=? WHERE id=?",
            (request_id, job.check_id),
        )
        await db.commit()

        elapsed = 0
        interval = settings.poll_interval_sec
        timeout = settings.poll_timeout_sec

        while elapsed < timeout:
            await asyncio.sleep(interval)
            elapsed += interval
            poll_resp = await poll_request(request_id)
            await log_api_call(job.check_id, "response_poll", poll_resp)

            status_code = poll_resp.get("status")
            if status_code == 200:
                received_at = datetime.now(timezone.utc)
                result_status = (
                    poll_resp.get("response", {}).get("result_status")
                    or poll_resp.get("result_status")
                    or "unknown"
                )
                duration = int(
                    (received_at - sent_at).total_seconds() * 1000
                )
                await db.execute(
                    """UPDATE checks SET
                        api_result_status=?, status='completed',
                        response_received_at=?, duration_ms=?
                    WHERE id=?""",
                    (result_status, received_at.isoformat(), duration, job.check_id),
                )
                await db.commit()
                return

        raise TimeoutError(f"Polling timed out after {timeout}s")

    except Exception as e:
        logger.exception("Check %s failed", job.check_id)
        error_msg = str(e) or f"{type(e).__name__}: {repr(e)}"
        try:
            await log_api_call(job.check_id, "error", {
                "error": error_msg,
                "type": type(e).__name__,
            })
        except Exception:
            pass
        await db.execute(
            "UPDATE checks SET status='error', error_message=? WHERE id=?",
            (error_msg, job.check_id),
        )
        await db.commit()


async def _worker() -> None:
    global _running
    _running = True
    while _running:
        try:
            job = await asyncio.wait_for(_queue.get(), timeout=1.0)
        except asyncio.TimeoutError:
            continue
        try:
            await _process_one(job)
        except Exception:
            logger.exception("Unhandled error in worker")


_worker_task: asyncio.Task | None = None


async def start_worker() -> None:
    global _worker_task
    _worker_task = asyncio.create_task(_worker())


async def stop_worker() -> None:
    global _running, _worker_task
    _running = False
    if _worker_task:
        _worker_task.cancel()
        try:
            await _worker_task
        except asyncio.CancelledError:
            pass
        _worker_task = None
