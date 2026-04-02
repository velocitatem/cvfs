from __future__ import annotations

import mimetypes
import os
from dataclasses import dataclass
from datetime import timedelta
from typing import BinaryIO
from uuid import uuid4

import boto3
from botocore.exceptions import ClientError


@dataclass(slots=True)
class MinioStorageConfig:
    bucket_name: str
    region_name: str = "us-east-1"
    endpoint_url: str | None = None
    access_key_id: str | None = None
    secret_access_key: str | None = None
    path_prefix: str = "artifacts"


class MinioStorageClient:
    def __init__(self, config: MinioStorageConfig):
        self.config = config
        self._client = boto3.client(
            "s3",
            region_name=config.region_name,
            endpoint_url=config.endpoint_url,
            aws_access_key_id=config.access_key_id or os.getenv("MINIO_ROOT_USER"),
            aws_secret_access_key=config.secret_access_key
            or os.getenv("MINIO_ROOT_PASSWORD"),
        )

    def build_key(
        self, *, stem: str | None = None, extension: str | None = None
    ) -> str:
        suffix = extension or ""
        if suffix and not suffix.startswith("."):
            suffix = f".{suffix}"
        filename = f"{stem or uuid4().hex}{suffix or ''}"
        prefix = self.config.path_prefix.strip("/")
        return f"{prefix}/{filename}" if prefix else filename

    def upload_bytes(
        self, *, key: str, data: bytes, content_type: str | None = None
    ) -> str:
        content_type = (
            content_type or mimetypes.guess_type(key)[0] or "application/octet-stream"
        )
        self._client.put_object(
            Bucket=self.config.bucket_name, Key=key, Body=data, ContentType=content_type
        )
        return key

    def upload_fileobj(
        self, *, fileobj: BinaryIO, key: str, content_type: str | None = None
    ) -> str:
        content_type = (
            content_type or mimetypes.guess_type(key)[0] or "application/octet-stream"
        )
        self._client.upload_fileobj(
            fileobj,
            self.config.bucket_name,
            key,
            ExtraArgs={"ContentType": content_type},
        )
        return key

    def generate_presigned_url(self, *, key: str, expires_in: int = 900) -> str | None:
        try:
            return self._client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self.config.bucket_name, "Key": key},
                ExpiresIn=int(timedelta(seconds=expires_in).total_seconds()),
            )
        except ClientError:
            return None

    def delete_object(self, *, key: str) -> None:
        try:
            self._client.delete_object(Bucket=self.config.bucket_name, Key=key)
        except ClientError:
            pass

    def download_bytes(self, *, key: str) -> bytes:
        response = self._client.get_object(Bucket=self.config.bucket_name, Key=key)
        body = response.get("Body")
        if body:
            return body.read()
        return b""
