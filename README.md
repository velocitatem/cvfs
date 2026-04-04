# Resume Branches
CV control plane that treats your resume like a git tree: preserve one canonical ATS-safe DOCX, branch it into role/company variants, review AI-suggested patches, and publish stable public links without losing structure.

```mermaid
graph TD
    ROOT[Root CV]
    ROOT --> SPEC1[Specialization: ML Engineer]
    ROOT --> SPEC2[Specialization: Product Engineer]
    SPEC1 --> SUB1[Submission: Company A]
    SPEC1 --> SUB2[Submission: Company B]
    SPEC2 --> SUB3[Submission: Company C]
    SUB1 --> PUB1[Published Public Link]
    SUB2 --> PUB2[Published Public Link]
    SUB3 --> PUB3[Published Public Link]
```

## Why Resume Branches exists
- **Preserve canonical formatting.** We never regenerate the DOCX wholesale; edits are stored as targeted patches on parsed blocks so ATS cues stay intact.
- **Branch with intent.** Root CV ➝ specializations ➝ submission leaves mirrors how people actually tailor resumes.
- **Controlled AI.** The worker produces constrained patch suggestions (max delta, no new claims) so you approve meaningful wording tweaks instead of rewriting history.
- **Publish safely.** Only frozen artifacts become public URLs; editing your working tree never breaks the links you already shared.

## Core capabilities
- Upload one ATS-safe DOCX, parse it into stable block paths, and keep the original artifact in object storage.
- Create specialization branches with manual or AI-assisted patches while tracking provenance.
- Tailor for each application: attach metadata, capture job descriptions, and log accepted suggestions.
- Publish any branch/submission as an immutable DOCX/PDF with a slugged URL plus analytics.
- Back everything with FastAPI + Postgres + MinIO + Redis + Celery so heavier jobs stay off the web tier.

## Quick start
```bash
cp .env.example .env   # fill in MINIO_*, AUTH_*, etc.
make init              # uv venv + deps + Bun installs + env linking
make lift.minio        # optional: start local MinIO bucket
make run.backend       # FastAPI API on http://localhost:8080
make dev               # Next.js webapp on http://localhost:3000
```

Need Redis/Postgres locally? `make lift.database` (Postgres) and `make up` (Redis + worker). For full stack via Docker Compose use `docker compose up backend webapp worker redis postgres minio`.

## System architecture
| Surface | Stack | Responsibilities |
|---------|-------|------------------|
| Webapp (`apps/webapp`) | Next.js 15 + React 19 + Tailwind 4 (Bun) | CV tree UI, inline editing, diff viewer, submissions dashboard, publish flows, public CV routes |
| Backend (`apps/backend/fastapi`) | FastAPI + SQLAlchemy + uvicorn | Auth/OIDC validation, DOCX ingestion, structured patch engine, branch CRUD, submissions API, publish service |
| Worker (`apps/worker`) | Celery + Redis | DOCX parsing, preview rendering, AI tailoring jobs, PDF export, artifact publication |
| Shared lib (`dlib`) | Python package | DOCX parser, block schema, patch application/validation, AI prompt helpers, storage adapters |
| Data plane | Postgres + MinIO + Redis | Metadata (documents/versions/patches/submissions), artifact storage (DOCX/PDF/HTML), queues + locks |

```
┌────────┐    GraphQL-like REST        ┌────────────┐      Object storage
│ Webapp │ ─────────────────────────▶ │ FastAPI API│ ───▶  (MinIO/S3)
└────────┘    Auth cookie / JWT        └──────┬─────┘      ┌────────┐
      ▲                                      │            │ Worker │
      │ Webhooks / SSE                        └────┬─────▶ └────────┘
      │                                               │
      │                                       Redis queue / locks
      │                                               │
      │                                      Postgres metadata
```

## Data model snapshot
| Table | Purpose |
|-------|---------|
| `cv_documents` | Canonical resume root (owner, title, `root_version_id`). |
| `cv_versions` | Each branch node; references parent, artifact keys, structured blocks, metadata. |
| `cv_patches` | Stored diffs relative to parent version (`target_path`, operation, values, metadata). |
| `specializations` | Named reusable branch templates. |
| `submissions` | Role/company tailoring instances with status + AI suggestions. |
| `public_assets` | Immutable published artifacts (slug, version/submission, storage key, analytics). |
| `ai_suggestions` | Pending/accepted/rejected AI patch proposals tied to submissions. |

## Primary workflows
1. **Upload root CV.** Webapp calls `/documents` with a DOCX. Backend persists the original artifact to MinIO, parses structured blocks via `dlib.cv`, stores the first version, and returns the tree.
2. **Branch for a specialization.** Create `ml-engineer` from `root`. Backend clones structured blocks, applies staged patches, and records them in `cv_patches`.
3. **Tailor for a submission.** Attach job description, request AI suggestions, accept/reject patches, and either extend the branch in place or apply them to a leaf version.
4. **Publish.** `/public/publish` copies the artifact to a public bucket path, locks it, emits a slug URL, and tracks views via `public_asset_views`.

## Configuration essentials
| Variable | Description | Default |
|----------|-------------|---------|
| `API_BASE_URL` | Backend host consumed by the webapp build + runtime. | `http://cvfs-backend:8080` in Docker |
| `NEXT_PUBLIC_BASE_URL` | Public origin for web routes. | `https://cv.alves.world` |
| `AUTHENTIK_*` / `AUTH_OIDC_*` | OIDC issuer, audience, and client credentials. | required |
| `MINIO_ENDPOINT` / `MINIO_BUCKET` | Object storage endpoint + bucket for artifacts. | `https://storage.cv.alves.world` / `resume-branches` |
| `REDIS_URL` | Celery broker/result backend. | `redis://cvfs-redis:6379/0` |
| `DATABASE_URL` | SQLAlchemy DSN for Postgres. | `postgresql+asyncpg://postgres:postgres@cvfs-postgres:5432/resume_branches` |
| `ANTHROPIC_API_KEY` | Enables AI tailoring jobs. | unset |

`.env.example` documents every supported variable. `make envlink` symlinks root `.env` into all app directories.

## Repository layout
```
apps/
  webapp/            # Next.js dashboard + public routes
  webapp-minimal/    # Streamlit prototype (optional)
  backend/fastapi/   # FastAPI service with routers, schemas, services
  backend/flask/     # Alternative API (mostly unused)
  worker/            # Celery worker + job modules
alveslib/            # Shared logging/agent utilities
dlib/                # CV parser + patch engine + storage helpers
docs/                # Architecture notes, deployment playbooks, diagrams
ml/                  # Optional ML experiments (etl/train/infer)
src/                 # Small scripts / CLI helpers
docker/              # Dockerfiles for backend/webapp/worker
Makefile             # Developer entrypoints
```

## Development routines
| Command | Purpose |
|---------|---------|
| `make init` | Bootstrap uv venv, install Python deps, run Bun installs, symlink `.env`. |
| `make dev` | Start the Next.js app (`bun x nx run webapp:dev`). |
| `make run.backend` | Launch FastAPI (switchable `BACKEND_MODE`). |
| `make run.worker` | Start Celery worker (requires Redis & MinIO). |
| `make lift.minio` | Local MinIO server + console for artifact testing. |
| `make lift.database` | Start Postgres (compose profile). |
| `make up` | Bring up redis + worker for background jobs. |
| `make nx.projects` | Inspect Nx workspace graph. |
| `make test` | Run pytest (unit/integration suites). |

Use `bun x nx affected -t lint,test,build` before PRs to run fine-grained checks.

## Deployment notes
- **Docker images:** `docker/backend-fastapi.Dockerfile`, `docker/webapp.Dockerfile`, and `docker/worker.Dockerfile` bake env args for Dokploy. The web build now receives `API_BASE_URL` so rewrites point at the deployed backend.
- **Dokploy:** see `docs/resume-branches/dokploy.md` for the API payload that provisions `cvfs-backend`, `cvfs-webapp`, Redis, Postgres, and MinIO on `cv.alves.world` / `api.cv.alves.world`.
- **Storage:** `make lift.minio` mirrors the production bucket layout. Set `MINIO_ROOT_USER/MINIO_ROOT_PASSWORD` for parity. Public artifacts should only be published via the API to guarantee immutability + audit logging.

## Limitations & next steps
- AI tailoring currently operates synchronously per submission; multi-edit batching and historical rollbacks are in progress.
- Auth is wired to generic OIDC (Authentik-ready) but does not yet expose roles beyond owner/admin.
- The worker queue is Redis-backed; scale-out deployments should move to a managed Redis + add observability (Prometheus, structured tracing).

## License
MIT — see `LICENSE` for details.
