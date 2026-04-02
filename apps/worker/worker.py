import os
import time
from typing import Any

from celery import Celery
from dotenv import load_dotenv

from dlib.ai import TailoringContext, generate_tailoring_suggestions
from dlib.cv import StructuredBlock, StructuredDocument, parse_docx_bytes
from dlib.storage import MinioStorageClient, MinioStorageConfig


load_dotenv()


# Redis / Celery configuration
redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
app = Celery(
    "worker", broker=redis_url, backend=os.getenv("CELERY_RESULT_BACKEND", redis_url)
)


def _storage_client() -> MinioStorageClient:
    config = MinioStorageConfig(
        bucket_name=os.getenv("MINIO_BUCKET", "resume-branches"),
        region_name=os.getenv("MINIO_REGION", "us-east-1"),
        endpoint_url=os.getenv("MINIO_ENDPOINT", "http://localhost:9900"),
        access_key_id=os.getenv("MINIO_ROOT_USER"),
        secret_access_key=os.getenv("MINIO_ROOT_PASSWORD"),
        path_prefix=os.getenv("MINIO_PATH_PREFIX", "artifacts/cv"),
    )
    return MinioStorageClient(config)


storage_client = _storage_client()


@app.task
def simple_task(message: str) -> str:
    """Basic smoke-test task."""
    time.sleep(1)
    return f"Processed: {message}"


@app.task
def parse_document_from_storage(key: str) -> list[dict[str, Any]]:
    data = storage_client.download_bytes(key=key)
    structured = parse_docx_bytes(data)
    return [block.model_dump() for block in structured.blocks]


@app.task
def generate_tailoring(
    job_description: str, blocks: list[dict[str, Any]], focus_keywords: list[str]
):
    context = TailoringContext(
        job_description=job_description, focus_keywords=focus_keywords
    )
    document = StructuredDocument(
        version_label="worker",
        blocks=[StructuredBlock.model_validate(block) for block in blocks],
    )
    suggestions = generate_tailoring_suggestions(context, document)
    return [suggestion.model_dump() for suggestion in suggestions]


if __name__ == "__main__":
    app.start()
