# Dokploy Deployment Plan (cv.alves.world)

Default host: `https://dev.alves.world` (`DOKPLOY_API_BASE=https://dev.alves.world/api`). Authentication uses `x-api-key: $DOKPLOY_API` loaded from `.env`.

```bash
set -a
. ./.env            # must contain DOKPLOY_API
set +a
: "${DOKPLOY_API:?missing token}"
DOKPLOY_BASE_URL="${DOKPLOY_BASE_URL:-https://dev.alves.world}"
DOKPLOY_API_BASE="${DOKPLOY_BASE_URL%/}/api"
```

## 1. Resolve IDs

Discover the Personal project and staging environment:

```bash
curl -sS "$DOKPLOY_API_BASE/project.all" \
  -H "accept: application/json" \
  -H "x-api-key: $DOKPLOY_API" | jq '.[] | {id, name}'

PROJECT_ID="<personal-project-id>"

curl -sS "$DOKPLOY_API_BASE/environment.byProjectId?projectId=$PROJECT_ID" \
  -H "accept: application/json" \
  -H "x-api-key: $DOKPLOY_API" | jq '.[] | {id, name}'

ENVIRONMENT_ID="<personal-env-id>"
```

## 2. Build + push images

Backend image (adjust registry/org as needed):

```bash
docker build -t ghcr.io/<org>/resume-branches-backend:latest -f docker/backend-fastapi.Dockerfile .
docker push ghcr.io/<org>/resume-branches-backend:latest
```

Webapp image:

```bash
docker build -t ghcr.io/<org>/resume-branches-webapp:latest -f docker/webapp.Dockerfile .
docker push ghcr.io/<org>/resume-branches-webapp:latest
```

## 3. Backend application

```bash
curl -sS -X POST "$DOKPLOY_API_BASE/application.create" \
  -H "Content-Type: application/json" -H "x-api-key: $DOKPLOY_API" \
  -d @- <<'JSON'
{
  "name": "resume-backend",
  "environmentId": "ENVIRONMENT_ID",
  "projectId": "PROJECT_ID",
  "deployment": {
    "type": "docker",
    "image": "ghcr.io/<org>/resume-branches-backend:latest",
    "env": {
      "BACKEND_PORT": "8080",
      "DATABASE_URL": "postgresql+asyncpg://postgres:postgres@postgres:5432/resume_branches",
      "MINIO_ENDPOINT": "http://minio:9000",
      "MINIO_BUCKET": "resume-branches",
      "MINIO_REGION": "us-east-1",
      "MINIO_ROOT_USER": "${MINIO_ROOT_USER}",
      "MINIO_ROOT_PASSWORD": "${MINIO_ROOT_PASSWORD}",
      "PUBLIC_BASE_URL": "https://cv.alves.world",
      "CV_PUBLIC_DOMAIN": "cv.alves.world"
    },
    "healthcheck": {
      "path": "/health",
      "interval": 10
    }
  }
}
JSON
```

### Domain attach (api.cv.alves.world)

```bash
curl -sS -X POST "$DOKPLOY_API_BASE/domain.validateDomain" \
  -H "Content-Type: application/json" -H "x-api-key: $DOKPLOY_API" \
  -d '{"domain":"api.cv.alves.world"}'

curl -sS -X POST "$DOKPLOY_API_BASE/domain.create" \
  -H "Content-Type: application/json" -H "x-api-key: $DOKPLOY_API" \
  -d '{
    "host":"api.cv.alves.world",
    "https": true,
    "certificateType": "letsencrypt",
    "applicationId": "<backend-app-id>",
    "domainType": "application",
    "path": "/",
    "stripPath": false
  }'
```

Deploy or redeploy:

```bash
curl -sS -X POST "$DOKPLOY_API_BASE/application.deploy" \
  -H "Content-Type: application/json" -H "x-api-key: $DOKPLOY_API" \
  -d '{"applicationId":"<backend-app-id>"}'
```

## 4. Webapp application (cv.alves.world)

```bash
curl -sS -X POST "$DOKPLOY_API_BASE/application.create" -H "Content-Type: application/json" -H "x-api-key: $DOKPLOY_API" -d @- <<'JSON'
{
  "name": "resume-webapp",
  "environmentId": "ENVIRONMENT_ID",
  "projectId": "PROJECT_ID",
  "deployment": {
    "type": "docker",
    "image": "ghcr.io/<org>/resume-branches-webapp:latest",
    "env": {
      "NEXT_PUBLIC_API_BASE_URL": "https://api.cv.alves.world"
    },
    "healthcheck": {
      "path": "/health",
      "interval": 10
    }
  }
}
JSON
```

Attach `cv.alves.world` to the webapp (same `domain.validateDomain` + `domain.create`).

## 5. Post-deploy verification

```bash
curl https://api.cv.alves.world/health
curl https://api.cv.alves.world/api/v1/documents -H "x-api-key: <if auth enforced>"
curl https://cv.alves.world/dashboard
```

## Notes

- Keep the Dokploy panel at `dev.alves.world`. Never assign production apps to that hostname.
- If Postgres/Redis/MinIO run inside Dokploy, create additional compose services or dedicated applications and inject their service hostnames via env vars.
- Once DNS is live, re-run `domain.validateDomain` until Dokploy issues certificates.
