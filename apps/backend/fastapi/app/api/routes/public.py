from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.core.config import get_settings
from app.models import PublicAsset
from app.schemas import PublicAssetLookupResponse, PublicAssetResponse, PublishRequest
from app.services.publication import publish_version
from dlib.auth import AuthenticatedUser


router = APIRouter(prefix="/public", tags=["public"])


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


@router.get("/{slug}", response_model=PublicAssetLookupResponse)
async def get_public_asset(slug: str, session: AsyncSession = Depends(get_db)):
    stmt = select(PublicAsset).where(
        PublicAsset.slug == slug, PublicAsset.is_public.is_(True)
    )
    result = await session.execute(stmt)
    asset = result.scalars().one_or_none()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return PublicAssetLookupResponse(asset=_response_from_asset(asset))


def _response_from_asset(asset: PublicAsset) -> PublicAssetResponse:
    settings = get_settings()
    url = f"{settings.public_base_url.rstrip('/')}/cv/{asset.slug}"
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
