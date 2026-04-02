FROM python:3.12-slim

WORKDIR /app

# System deps - layer rarely changes
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install external dependencies only - layer cached until pyproject.toml changes.
# Stub files satisfy setuptools' package discovery without real source,
# so external deps are downloaded once and reused across source-only rebuilds.
COPY pyproject.toml ./
RUN touch README.md \
    && mkdir -p alveslib dlib && touch alveslib/__init__.py dlib/__init__.py \
    && pip install --no-cache-dir . \
    && rm -rf alveslib dlib README.md

# Copy local library and reinstall it without re-downloading external deps
COPY alveslib/ ./alveslib/
COPY dlib/ ./dlib/
RUN pip install --no-cache-dir --no-deps .

# Copy application source last - most frequently changed
RUN mkdir -p ./worker/
COPY apps/worker/ ./worker/
COPY src/ ./src/

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD python -c "import redis; r=redis.from_url('redis://redis:6379'); r.ping()" || exit 1

RUN useradd --create-home --shell /bin/bash app
RUN chown -R app:app /app
USER app
CMD ["celery", "-A", "worker.worker:app", "worker", "--loglevel=info"]
