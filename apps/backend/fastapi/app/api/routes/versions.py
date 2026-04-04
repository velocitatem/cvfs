from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.schemas import BranchCreateRequest, PatchApplyRequest, VersionResponse
from app.services.versions import (
    append_patches_to_version,
    create_branch,
    delete_version,
)
from dlib.auth import AuthenticatedUser
from dlib.cv.ats_guard import PatchValidationError


router = APIRouter(prefix="/versions", tags=["versions"])


@router.post("/branches", response_model=VersionResponse)
async def create_version_branch(
    payload: BranchCreateRequest,
    session: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
):
    try:
        version = await create_branch(
            session,
            owner_id=user.sub,
            parent_version_id=payload.parent_version_id,
            branch_name=payload.branch_name,
            version_label=payload.version_label,
            patches=payload.patches,
        )
    except PatchValidationError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    if not version:
        raise HTTPException(status_code=404, detail="Parent version not found")
    return VersionResponse.model_validate(version)


@router.delete("/{version_id}", status_code=204)
async def delete_version_branch(
    version_id: str,
    session: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
):
    result = await delete_version(session, owner_id=user.sub, version_id=version_id)
    if result is False:
        raise HTTPException(status_code=404, detail="Version not found")
    if result == "root":
        raise HTTPException(status_code=400, detail="Cannot delete root version")
    if result == "has_children":
        raise HTTPException(status_code=409, detail="Delete child branches first")


@router.post("/{version_id}/patches", response_model=VersionResponse)
async def append_patches(
    version_id: str,
    payload: PatchApplyRequest,
    session: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
):
    if not payload.patches:
        raise HTTPException(status_code=400, detail="No patches provided")
    try:
        version = await append_patches_to_version(
            session,
            owner_id=user.sub,
            version_id=version_id,
            patches=payload.patches,
        )
    except PatchValidationError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    return VersionResponse.model_validate(version)
