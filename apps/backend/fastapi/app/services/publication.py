from __future__ import annotations

import asyncio
import re
from datetime import datetime
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models import CvDocument, CvVersion, PublicAsset, Submission
from app.services.storage import storage_client
from dlib.cv import docx_bytes_to_pdf, generate_patched_docx
from dlib.integrations.paperless import get_paperless_client


async def publish_version(
    session: AsyncSession,
    *,
    owner_id: str,
    version_id: str | None,
    submission_id: str | None,
    slug: str | None,
    expires_at: datetime | None = None,
) -> PublicAsset | None:
    target_version: CvVersion | None = None
    target_submission: Submission | None = None

    if submission_id:
        stmt = (
            select(Submission)
            .join(Submission.version)
            .join(CvVersion.document)
            .where(Submission.id == submission_id, CvDocument.owner_id == owner_id)
        )
        result = await session.execute(stmt)
        target_submission = result.scalars().one_or_none()
        target_version = target_submission.version if target_submission else None
    elif version_id:
        stmt = (
            select(CvVersion)
            .join(CvVersion.document)
            .where(CvVersion.id == version_id, CvDocument.owner_id == owner_id)
        )
        result = await session.execute(stmt)
        target_version = result.scalars().one_or_none()
    else:
        return None

    if not target_version or not target_version.artifact_docx_key:
        return None

    resolved_slug = slugify(slug or target_version.version_label or "cv")
    if not resolved_slug:
        resolved_slug = f"cv-{uuid4().hex[:6]}"

    asset = PublicAsset(
        submission_id=target_submission.id if target_submission else None,
        version_id=target_version.id,
        slug=resolved_slug,
        artifact_key=target_version.artifact_docx_key,
        is_public=True,
        expires_at=expires_at,
    )
    session.add(asset)
    await session.commit()
    await session.refresh(asset)

    settings = get_settings()
    client = get_paperless_client(settings)
    if client:
        docx = storage_client.download_bytes(target_version.artifact_docx_key)
        blocks = target_version.structured_blocks or []
        pdf = docx_bytes_to_pdf(generate_patched_docx(docx, blocks))
        doc_id = await asyncio.to_thread(
            client.upload_document, pdf, resolved_slug, settings.paperless_tag_ids or []
        )
        _, share_url = await asyncio.to_thread(client.create_share_link, doc_id, expires_at)
        asset.paperless_document_id = doc_id
        asset.paperless_share_slug = share_url.split("/share/")[-1]
        await session.commit()
        await session.refresh(asset)

    return asset


def slugify(value: str) -> str:
    safe = re.sub(r"[^a-zA-Z0-9-]+", "-", value.strip().lower())
    safe = re.sub(r"-+", "-", safe).strip("-")
    return safe[:120]
