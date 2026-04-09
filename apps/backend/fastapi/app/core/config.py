from __future__ import annotations

import json
from functools import lru_cache
from typing import Annotated, List

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, NoDecode


class Settings(BaseSettings):
    project_name: str = "Resume Branches API"
    api_prefix: str = "/api/v1"
    environment: str = Field(default="local", alias="ENVIRONMENT")
    database_url: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/resume_branches",
        alias="DATABASE_URL",
    )
    cors_origins: Annotated[List[str], NoDecode] = Field(
        default_factory=lambda: ["http://localhost:3000"], alias="CORS_ORIGINS"
    )

    storage_bucket: str = Field(default="resume-branches", alias="MINIO_BUCKET")
    storage_region: str = Field(default="us-east-1", alias="MINIO_REGION")
    storage_endpoint_url: str | None = Field(
        default="http://localhost:9900", alias="MINIO_ENDPOINT"
    )
    storage_access_key: str | None = Field(default=None, alias="MINIO_ROOT_USER")
    storage_secret_key: str | None = Field(default=None, alias="MINIO_ROOT_PASSWORD")
    storage_path_prefix: str = Field(default="artifacts/cv")

    auth_oidc_issuer: str | None = Field(default=None, alias="AUTH_OIDC_ISSUER")
    auth_oidc_audience: str | None = Field(default=None, alias="AUTH_OIDC_AUDIENCE")
    auth_disable_verification: bool = Field(
        default=True, alias="AUTH_DISABLE_VERIFICATION"
    )

    celery_broker_url: str = Field(
        default="redis://localhost:6379/0", alias="CELERY_BROKER_URL"
    )
    celery_result_backend: str | None = Field(
        default=None, alias="CELERY_RESULT_BACKEND"
    )

    public_base_url: str = Field(
        default="https://cv.alves.world", alias="PUBLIC_BASE_URL"
    )
    publish_domain: str = Field(default="cv.alves.world", alias="CV_PUBLIC_DOMAIN")

    paperless_enabled: bool = Field(default=False, alias="PAPERLESS_ENABLED")
    paperless_base_url: str | None = Field(default=None, alias="PAPERLESS_BASE_URL")
    paperless_token: str | None = Field(default=None, alias="PAPERLESS_TOKEN")
    paperless_tag_ids: list[int] = Field(default_factory=list, alias="PAPERLESS_TAG_IDS")

    class Config:
        env_file = ".env"
        extra = "ignore"

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _split_origins(cls, value):
        if isinstance(value, str):
            stripped = value.strip()
            if not stripped:
                return []
            if stripped.startswith("["):
                parsed = json.loads(stripped)
                if isinstance(parsed, list):
                    return [
                        str(origin).strip() for origin in parsed if str(origin).strip()
                    ]
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @field_validator("storage_endpoint_url", "paperless_base_url", "paperless_token", mode="before")
    @classmethod
    def _empty_str_to_none(cls, value):
        if isinstance(value, str) and not value.strip():
            return None
        return value

    @field_validator("paperless_tag_ids", mode="before")
    @classmethod
    def _parse_tag_ids(cls, value):
        if isinstance(value, str):
            return [int(v.strip()) for v in value.split(",") if v.strip()]
        return value


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()  # type: ignore[arg-type]
