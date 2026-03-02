FROM node:22-slim AS frontend-build
ENV NODE_OPTIONS="--max-old-space-size=256"
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --maxsockets 3
COPY frontend/ ./
RUN npm run build

FROM python:3.13-slim
WORKDIR /app
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv
COPY pyproject.toml ./
COPY backend/ ./backend/
RUN uv pip install --system --no-cache .
COPY --from=frontend-build /app/frontend/dist ./frontend/dist
EXPOSE 8000
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
