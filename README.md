# Ultiplate

Template for any project: SaaS webapp, API server, ML pipeline, scraper, CLI, or background worker. AI-native, platform-agnostic, managed via Makefile + Nx.

## Quick Start

```bash
cp .env.example .env        # fill in NAME and any keys you need
make init                   # uv venv + sync + env linking
make dev                    # Next.js webapp at http://localhost:3000
make nx.projects            # list Nx projects in the monorepo
```

For Docker services (redis, ml inference, worker):
```bash
make up
```

## Directory

```
apps/
  webapp/          Next.js 15 + React 19 + Tailwind 4 + Supabase auth (Bun, Turbopack)
  webapp-minimal/  Streamlit quick prototype
  backend/
    fastapi/       FastAPI server (set BACKEND_MODE=fastapi)
    flask/         Flask server  (set BACKEND_MODE=flask)
  worker/          Celery background worker backed by Redis
ml/
  configs/         YAML config for data + training hyperparameters
  models/          arch.py (architecture) + train.py (training loop)
  data/            etl.py + processed artifacts
  inference.py     FastAPI inference server
  notebooks/       Jupyter notebooks
alveslib/          Shared Python utilities (logger, scraper, agent)
src/               Simple scripts / CLI entry points
```

## Make Targets

| Target | Description |
|--------|-------------|
| `make init` | First-time setup |
| `make dev` | Start Next.js webapp |
| `make up` | Start Docker core services |
| `make run.backend` | Start API backend |
| `make run.worker` | Start Celery worker |
| `make nx.graph` | Open Nx project graph |
| `make nx.affected` | Run lint/test/build for affected projects |
| `make lift.minio` | Start MinIO object storage |
| `make lift.logging` | Start Loki + Grafana |
| `make lift.mlflow` | Start optional MLflow server |
| `make lift.database` | Start Postgres / MongoDB |
| `make doctor` | Verify toolchain |

Run `make help` for the full list.

## Nx Workspace

This template now ships with Nx project definitions for:

- `webapp` (`apps/webapp`)
- `webapp-minimal` (`apps/webapp-minimal`)
- `backend-fastapi` (`apps/backend/fastapi`)
- `backend-flask` (`apps/backend/flask`)
- `worker` (`apps/worker`)
- `ml` (`ml`)
- `alveslib` (`alveslib`)

Common commands:

```bash
bun x nx show projects
bun x nx graph
bun x nx run webapp:dev
bun x nx affected -t lint,test,build
```

## AI Agent Capacity

Set `ANTHROPIC_API_KEY` in `.env`. Then use:

```python
from alveslib import ask, stream, Agent

# One-shot
print(ask("Summarize this data: ..."))

# Streaming
for chunk in stream("Write a Celery task that ..."):
    print(chunk, end="", flush=True)

# Multi-turn
agent = Agent(system="You are a senior Python developer.")
agent.chat("Scaffold a FastAPI endpoint for user profiles")
agent.chat("Add input validation and error handling")
```

Claude Code slash commands (type `/` in a Claude Code session):
- `/plan` - implementation plan for an idea within this boilerplate
- `/build` - implement a feature end-to-end
- `/api` - scaffold a new backend endpoint
- `/page` - scaffold a new Next.js page
- `/review` - code review of recent changes
- `/ship` - stage and commit changes

## Logging

```python
from alveslib import get_logger
logger = get_logger("service")
```

Outputs structured JSON to console + `./logs/`. Optional Loki push when `LOKI_PORT` is set and `make lift.logging` is running. View in Grafana at `http://localhost:$GRAFANA_PORT` (add Loki data source: `http://loki:3100`).

## Python Packaging

Python dependencies are managed with `pyproject.toml` and `uv`.

```bash
make deps         # uv sync
make lock         # refresh uv.lock
uv run pytest -v
```

## ML Workflow

High-level ML hyperparameters live in YAML configs:

- `ml/configs/data/default.yaml`
- `ml/configs/train/default.yaml`

Run with Nx targets (cacheable with explicit inputs/outputs):

```bash
bun x nx run ml:etl
bun x nx run ml:train
```

`ml:train` depends on `ml:etl`, and both targets cache artifacts in `ml/data/processed`, `ml/models/weights`, and `ml/tensorboard`.

## Services (docker compose profiles)

| Profile | Services | Command |
|---------|----------|---------|
| _(default)_ | redis, ml-inference, worker | `make up` |
| `minio` | + MinIO object storage | `make lift.minio` |
| `tensorboard` | + TensorBoard | `make lift.tensorboard` |
| `mlflow` | + MLflow tracking server (optional) | `make lift.mlflow` |
| `logging` | + Loki + Grafana | `make lift.logging` |
| `database` | + Postgres + MongoDB | `make lift.database` |

## Webapp Auth

Auth is off by default (`NEXT_PUBLIC_REQUIRE_AUTH=false`). Set it to `true` and configure Supabase keys to enable session-based auth gating across all routes.

## Resume Branches MVP

This repo now powers “Resume Branches”, a CV control plane built on the dstack layout.

- **Backend** (`apps/backend/fastapi`): FastAPI API that ingests ATS-safe DOCX files, stores structured blocks, supports branching and submissions, and exposes publish endpoints. Configure MinIO via `MINIO_*` env vars. Build image via `docker/backend-fastapi.Dockerfile`.
- **Webapp** (`apps/webapp`): Next.js dashboard featuring the CV tree, upload workflow, and publish tooling. It targets the FastAPI host set in `NEXT_PUBLIC_API_BASE_URL` and builds with `docker/webapp.Dockerfile`.
- **Worker** (`apps/worker`): Celery worker handling heavy DOCX parsing and AI tailoring suggestions using Redis and MinIO.
- **Docs**: `docs/resume-branches/architecture.md` (system design) and `docs/resume-branches/dokploy.md` (Dokploy API payloads for deploying backend to `api.cv.alves.world` and webapp to `cv.alves.world`).

Local storage uses MinIO via `make lift.minio`; publish-ready artifacts live under the configured bucket.
