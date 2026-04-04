from __future__ import annotations

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from dlib.cv import (
    StructuredBlock,
    StructuredDocument,
    PatchPayload,
    apply_patchset,
    validate_patchset,
)

from app.models import CvDocument, CvPatch, CvVersion, PublicAsset


async def create_branch(
    session: AsyncSession,
    *,
    owner_id: str,
    parent_version_id: str,
    branch_name: str,
    version_label: str | None,
    patches: list[dict],
) -> CvVersion | None:
    stmt = (
        select(CvVersion)
        .join(CvVersion.document)
        .where(CvVersion.id == parent_version_id, CvDocument.owner_id == owner_id)
        .options(selectinload(CvVersion.patches))
    )
    result = await session.execute(stmt)
    parent = result.scalars().one_or_none()
    if not parent:
        return None

    base_doc = StructuredDocument(
        version_label=parent.version_label,
        blocks=[
            StructuredBlock.model_validate(block)
            for block in parent.structured_blocks or []
        ],
    )
    patch_models = [PatchPayload.model_validate(item) for item in patches]
    if patch_models:
        validate_patchset(base_doc, patch_models)
        updated_doc = apply_patchset(base_doc, patch_models)
    else:
        updated_doc = base_doc

    new_version = CvVersion(
        document_id=parent.document_id,
        parent_version_id=parent.id,
        branch_name=branch_name,
        version_label=version_label or branch_name,
        artifact_docx_key=parent.artifact_docx_key,
        structured_blocks=[block.model_dump() for block in updated_doc.blocks],
        metadata_json={"patch_count": len(patch_models)},
    )

    session.add(new_version)
    await session.flush()
    for patch in patch_models:
        session.add(
            CvPatch(
                version_id=new_version.id,
                target_path=patch.target_path,
                operation=patch.operation.value,
                old_value=patch.old_value,
                new_value=patch.new_value,
                metadata_json=patch.metadata,
            )
        )

    await session.commit()

    stmt_refresh = (
        select(CvVersion)
        .where(CvVersion.id == new_version.id)
        .options(selectinload(CvVersion.patches), selectinload(CvVersion.public_assets))
    )
    result = await session.execute(stmt_refresh)
    return result.scalars().one()


async def append_patches_to_version(
    session: AsyncSession,
    *,
    owner_id: str,
    version_id: str,
    patches: list[dict],
) -> CvVersion | None:
    stmt = (
        select(CvVersion)
        .join(CvVersion.document)
        .where(CvVersion.id == version_id, CvDocument.owner_id == owner_id)
        .options(selectinload(CvVersion.patches))
    )
    result = await session.execute(stmt)
    version = result.scalars().one_or_none()
    if not version:
        return None

    patch_models = [PatchPayload.model_validate(item) for item in patches]
    if not patch_models:
        return version

    base_doc = StructuredDocument(
        version_label=version.version_label,
        blocks=[
            StructuredBlock.model_validate(block)
            for block in version.structured_blocks or []
        ],
    )
    validate_patchset(base_doc, patch_models)
    updated_doc = apply_patchset(base_doc, patch_models)

    version.structured_blocks = [block.model_dump() for block in updated_doc.blocks]
    metadata = version.metadata_json or {}
    metadata["patch_count"] = int(metadata.get("patch_count") or 0) + len(patch_models)
    version.metadata_json = metadata

    for patch in patch_models:
        session.add(
            CvPatch(
                version_id=version.id,
                target_path=patch.target_path,
                operation=patch.operation.value,
                old_value=patch.old_value,
                new_value=patch.new_value,
                metadata_json=patch.metadata,
            )
        )

    await session.commit()

    stmt_refresh = (
        select(CvVersion)
        .where(CvVersion.id == version_id)
        .options(selectinload(CvVersion.patches), selectinload(CvVersion.public_assets))
    )
    result = await session.execute(stmt_refresh)
    return result.scalars().one()


async def delete_version(
    session: AsyncSession, owner_id: str, version_id: str
) -> bool | str:
    """Delete a non-root branch. Returns False if not found, 'root' if root, True on success."""
    stmt = (
        select(CvVersion)
        .join(CvVersion.document)
        .where(CvVersion.id == version_id, CvDocument.owner_id == owner_id)
    )
    result = await session.execute(stmt)
    version = result.scalars().one_or_none()
    if not version:
        return False
    if not version.parent_version_id:
        return "root"
    # Refuse if child branches exist
    child_stmt = (
        select(CvVersion.id).where(CvVersion.parent_version_id == version_id).limit(1)
    )
    child_result = await session.execute(child_stmt)
    if child_result.scalar_one_or_none():
        return "has_children"
    await session.execute(
        delete(PublicAsset).where(PublicAsset.version_id == version_id)
    )
    await session.delete(version)
    await session.commit()
    return True
