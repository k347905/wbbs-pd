from __future__ import annotations

from pydantic import BaseModel


class SettingsRead(BaseModel):
    api_base_url: str
    service_name: str
    client_id: str
    client_secret: str
    poll_interval_sec: int
    poll_timeout_sec: int


class SettingsUpdate(BaseModel):
    api_base_url: str | None = None
    service_name: str | None = None
    client_id: str | None = None
    client_secret: str | None = None
    poll_interval_sec: int | None = None
    poll_timeout_sec: int | None = None


class CheckInput(BaseModel):
    series: str
    number: str
    firstname: str
    lastname: str


class BatchCreate(BaseModel):
    name: str
    checks: list[CheckInput]


class CheckRead(BaseModel):
    id: int
    batch_id: int
    batch_name: str | None = None
    series_obfuscated: str
    number_obfuscated: str
    firstname_obfuscated: str
    lastname_obfuscated: str
    api_request_id: str | None = None
    api_result_status: str | None = None
    actual_label: str | None = None
    request_sent_at: str | None = None
    response_received_at: str | None = None
    duration_ms: int | None = None
    status: str
    error_message: str | None = None
    created_at: str


class BatchRead(BaseModel):
    id: int
    name: str
    status: str
    created_at: str
    total: int = 0
    completed: int = 0


class LabelUpdate(BaseModel):
    actual_label: str  # "valid" | "invalid"


class ConfusionMatrixData(BaseModel):
    tp: int = 0
    tn: int = 0
    fp: int = 0
    fn: int = 0
    entity_not_found: int = 0
    accuracy: float = 0.0
    precision_val: float = 0.0
    recall: float = 0.0
    f1: float = 0.0
    total_labeled: int = 0


class LogEntry(BaseModel):
    id: int
    check_id: int
    direction: str
    body: str
    timestamp: str


class TimingStats(BaseModel):
    avg_ms: float
    min_ms: int
    max_ms: int
    p50_ms: float
    p95_ms: float
    total_completed: int
