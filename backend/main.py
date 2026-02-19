from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from backend.database import init_db, close_db
from backend.tasks import start_worker, stop_worker
from backend.routers import settings, checks, labels, results, metrics, logs


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    await start_worker()
    yield
    await stop_worker()
    await close_db()


app = FastAPI(title="Passport Verification Evaluator", lifespan=lifespan)

app.include_router(settings.router)
app.include_router(checks.router)
app.include_router(labels.router)
app.include_router(results.router)
app.include_router(metrics.router)
app.include_router(logs.router)

# Serve frontend static files in production
static_dir = Path(__file__).parent.parent / "frontend" / "dist"
if static_dir.is_dir():
    app.mount("/", StaticFiles(directory=str(static_dir), html=True), name="frontend")
