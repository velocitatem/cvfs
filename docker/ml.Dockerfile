FROM python:3.12-slim

WORKDIR /app

# System deps - layer rarely changes
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Install external dependencies only - layer cached until pyproject.toml changes.
# Stub files satisfy setuptools' package discovery without real source,
# so external deps are downloaded once and reused across source-only rebuilds.
COPY pyproject.toml ./
RUN touch README.md \
    && mkdir -p alveslib && touch alveslib/__init__.py \
    && pip install --no-cache-dir . \
    && rm -rf alveslib README.md

# Copy local library and reinstall it without re-downloading external deps
COPY alveslib/ ./alveslib/
RUN pip install --no-cache-dir --no-deps .

# Copy application source last - most frequently changed
COPY ml/ ./
COPY src/ ./src/

RUN mkdir -p /app/models/weights

HEALTHCHECK --interval=30s --timeout=30s --start-period=60s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health').raise_for_status()" || exit 1

EXPOSE 8000

RUN useradd --create-home --shell /bin/bash app
RUN chown -R app:app /app
USER app
CMD ["uvicorn", "inference:app", "--host", "0.0.0.0", "--port", "8000"]
