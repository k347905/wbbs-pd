from fastapi import APIRouter
from backend.config import settings
from backend.models import SettingsRead, SettingsUpdate

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("", response_model=SettingsRead)
async def get_settings():
    return SettingsRead(
        api_base_url=settings.api_base_url,
        service_name=settings.service_name,
        client_id=settings.client_id,
        client_secret=settings.client_secret,
        poll_interval_sec=settings.poll_interval_sec,
        poll_timeout_sec=settings.poll_timeout_sec,
    )


@router.put("", response_model=SettingsRead)
async def update_settings(data: SettingsUpdate):
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(settings, field, value)
    return await get_settings()
