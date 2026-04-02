# Resume Branches Architecture

## Overview

Resume Branches treats a canonical ATS-safe DOCX as a source-of-truth document graph. The stack is split into a Next.js control plane, a FastAPI backend, and a Celery worker. MinIO hosts artifacts locally and can be swapped with any S3-compatible object storage in production.

## Services

- **apps/webapp** – Next.js 15 UI with a CV tree, upload workflow, specialization browser, and publish controls. It talks to the FastAPI backend via `NEXT_PUBLIC_API_BASE_URL`.
- **apps/backend/fastapi** – FastAPI service that handles ingest, structured patch storage, AI suggestions, and publishing. SQLAlchemy models persist into Postgres. Storage relies on MinIO.
- **apps/worker** – Celery worker for asynchronous DOCX parsing, keyword extraction, and optional AI tailoring loops. It consumes Redis as the broker backend.
- **dlib** – Shared domain library including: structured DOCX parsing (`dlib.cv`), patch validation, ATS guardrails, storage adapter (`dlib.storage`), MinIO client, and auth utilities.

## Data Model

- `cv_documents` – conceptual resume per owner.
- `cv_versions` – every branch or specialization. Stores structured block snapshots and artifact pointers.
- `cv_patches` – granular operations applied to a version.
- `submissions` – leaf nodes representing a company/role tailoring.
- `ai_suggestions` – AI proposals pending acceptance.
- `public_assets` – immutable artifacts for published CV links.

## Flows

1. **Upload canonical DOCX**: The backend stores the raw file in MinIO, parses the blocks, and seeds the root branch version.
2. **Create branches**: Provide a parent version + patch list. ATS guardrails enforce change budgets and ratio protections.
3. **Tailoring**: Submit job description + focus keywords. Suggestions are produced via `dlib.ai.tailoring` and saved for review.
4. **Publish**: Copy a version/submission artifact to a public slug (e.g., `https://cv.alves.world/cv/ml-engineer-stripe`).

## Environment Variables

- `DATABASE_URL` – Async SQLAlchemy DSN (default local Postgres).
- `MINIO_*` – Access, bucket, region, and endpoint for the object storage.
- `PUBLIC_BASE_URL` / `CV_PUBLIC_DOMAIN` – Hostnames for publishable resumes.
- `AUTH_*` – Optional OIDC issuer/audience. Disabled by default for local dev.
- `NEXT_PUBLIC_API_BASE_URL` – Next.js uses this to call FastAPI.

## Local Dev

```bash
cp .env.example .env
make init
make dev              # Next.js
make run.backend      # FastAPI API server
make run.worker       # Celery worker
make lift.database    # Postgres profile
make lift.minio       # MinIO bucket
```

## Dokploy Targets

- Backend (FastAPI) – build from `docker/backend-fastapi.Dockerfile`, run behind `api.cv.alves.world`.
- Webapp (Next.js) – build from `docker/webapp.Dockerfile`, exposed via `cv.alves.world`.
- Redis, Postgres, and MinIO run either inside Dokploy or via managed offerings.

See `docs/resume-branches/dokploy.md` for concrete API payloads.
