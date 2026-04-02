from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.schemas import BranchCreateRequest, VersionResponse
from app.services.versions import create_branch
from dlib.auth import AuthenticatedUser


router = APIRouter(prefix="/versions", tags=["versions"])


@router.post("/branches", response_model=VersionResponse)
async def create_version_branch(
    payload: BranchCreateRequest,
    session: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
):
    version = await create_branch(
        session,
        owner_id=user.sub,
        parent_version_id=payload.parent_version_id,
        branch_name=payload.branch_name,
        version_label=payload.version_label,
        patches=payload.patches,
    )
    if not version:
        raise HTTPException(status_code=404, detail="Parent version not found")
    return VersionResponse.model_validate(version)
