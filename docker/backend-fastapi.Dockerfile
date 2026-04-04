# syntax=docker/dockerfile:1.6

FROM python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PYTHONPATH=/app

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    libreoffice-writer \
    fonts-liberation \
  && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml uv.lock requirements.txt ./
RUN pip install uv && uv pip install --system -r requirements.txt

COPY alveslib ./alveslib
COPY dlib ./dlib
COPY apps/backend/fastapi ./apps/backend/fastapi

WORKDIR /app/apps/backend/fastapi

EXPOSE 8080

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
