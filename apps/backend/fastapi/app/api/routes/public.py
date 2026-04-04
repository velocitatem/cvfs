from __future__ import annotations

import hashlib
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import Response
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.core.config import get_settings
from app.models import CvDocument, CvVersion, PublicAsset, PublicAssetView
from app.schemas import (
    PublicAssetAnalyticsResponse,
    PublicAssetLookupResponse,
    PublicAssetResponse,
    PublishRequest,
)
from app.services.publication import publish_version
from app.services.storage import storage_client
from dlib.auth import AuthenticatedUser
from dlib.cv import docx_bytes_to_pdf, generate_patched_docx


router = APIRouter(prefix="/public", tags=["public"])


async def _log_view(session: AsyncSession, asset: PublicAsset, request: Request) -> None:
    ip = request.headers.get("x-forwarded-for", request.client.host if request.client else "")
    ip_hash = hashlib.sha256(ip.split(",")[0].strip().encode()).hexdigest()[:16] if ip else None
    view = PublicAssetView(
        public_asset_id=asset.id,
        viewed_at=datetime.utcnow(),
        user_agent=request.headers.get("user-agent", "")[:512] or None,
        ip_hash=ip_hash,
    )
    session.add(view)
    await session.commit()


async def _get_public_asset(session: AsyncSession, slug: str) -> PublicAsset:
    stmt = select(PublicAsset).where(PublicAsset.slug == slug, PublicAsset.is_public.is_(True))
    result = await session.execute(stmt)
    asset = result.scalars().one_or_none()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset


@router.post("/publish", response_model=PublicAssetResponse)
async def publish(
    payload: PublishRequest,
    session: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
):
    asset = await publish_version(
        session,
        owner_id=user.sub,
        version_id=payload.version_id,
        submission_id=payload.submission_id,
        slug=payload.slug,
    )
    if not asset:
        raise HTTPException(status_code=404, detail="Version or submission not found")
    return _response_from_asset(asset)


@router.get("/{slug}/analytics", response_model=PublicAssetAnalyticsResponse)
async def get_analytics(
    slug: str,
    session: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
):
    asset = await _get_public_asset(session, slug)

    if asset.version_id:
        stmt = (
            select(CvVersion)
            .join(CvVersion.document)
            .where(CvVersion.id == asset.version_id, CvDocument.owner_id == user.sub)
        )
        if not (await session.execute(stmt)).scalars().one_or_none():
            raise HTTPException(status_code=403, detail="Not authorized")
    else:
        raise HTTPException(status_code=403, detail="Not authorized")

    view_count = (
        await session.execute(
            select(func.count()).where(PublicAssetView.public_asset_id == asset.id)
        )
    ).scalar() or 0

    last_viewed_at = (
        await session.execute(
            select(PublicAssetView.viewed_at)
            .where(PublicAssetView.public_asset_id == asset.id)
            .order_by(PublicAssetView.viewed_at.desc())
            .limit(1)
        )
    ).scalar()

    return PublicAssetAnalyticsResponse(
        slug=slug, view_count=view_count, last_viewed_at=last_viewed_at
    )


@router.get("/{slug}/pdf")
async def get_public_pdf(slug: str, request: Request, session: AsyncSession = Depends(get_db)):
    asset = await _get_public_asset(session, slug)
    await _log_view(session, asset, request)

    version: CvVersion | None = None
    if asset.version_id:
        stmt = select(CvVersion).where(CvVersion.id == asset.version_id)
        version = (await session.execute(stmt)).scalars().one_or_none()

    docx_bytes = storage_client.download_bytes(key=asset.artifact_key)
    patched = generate_patched_docx(docx_bytes, (version.structured_blocks or []) if version else [])
    pdf_bytes = docx_bytes_to_pdf(patched)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{slug}.pdf"'},
    )


@router.get("/{slug}", response_model=PublicAssetLookupResponse)
async def get_public_asset(slug: str, request: Request, session: AsyncSession = Depends(get_db)):
    asset = await _get_public_asset(session, slug)
    await _log_view(session, asset, request)
    return PublicAssetLookupResponse(asset=_response_from_asset(asset))


def _response_from_asset(asset: PublicAsset) -> PublicAssetResponse:
    settings = get_settings()
    base = settings.public_base_url.rstrip("/")
    url = f"{base}/cv/{asset.slug}"
    return PublicAssetResponse(
        id=asset.id,
        slug=asset.slug,
        artifact_key=asset.artifact_key,
        is_public=asset.is_public,
        created_at=asset.created_at,
        version_id=asset.version_id,
        submission_id=asset.submission_id,
        url=url,
    )
