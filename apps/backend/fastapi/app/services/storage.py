from __future__ import annotations

from datetime import datetime
from pathlib import Path
from typing import Tuple

from fastapi import UploadFile

from app.core.config import get_settings
from dlib.storage import MinioStorageClient, MinioStorageConfig


def _build_storage_client() -> MinioStorageClient:
    settings = get_settings()
    config = MinioStorageConfig(
        bucket_name=settings.storage_bucket,
        region_name=settings.storage_region,
        endpoint_url=settings.storage_endpoint_url,
        access_key_id=settings.storage_access_key,
        secret_access_key=settings.storage_secret_key,
        path_prefix=settings.storage_path_prefix,
    )
    return MinioStorageClient(config)


storage_client = _build_storage_client()


def build_artifact_key(owner_id: str, suffix: str) -> str:
    safe_suffix = suffix.lstrip(".") if suffix else ""
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    return storage_client.build_key(
        stem=f"{owner_id}-{timestamp}", extension=safe_suffix
    )


async def persist_upload(upload: UploadFile, owner_id: str) -> Tuple[str, bytes]:
    data = await upload.read()
    suffix = Path(upload.filename or "document.docx").suffix or ".docx"
    key = build_artifact_key(owner_id, suffix)
    storage_client.upload_bytes(key=key, data=data, content_type=upload.content_type)
    return key, data


def build_public_url(key: str) -> str | None:
    settings = get_settings()
    if settings.storage_endpoint_url:
        # Object storage accessible through endpoint URL
        base = settings.storage_endpoint_url.rstrip("/")
        return f"{base}/{settings.storage_bucket}/{key}"
    return storage_client.generate_presigned_url(key=key, expires_in=3600)
