from __future__ import annotations

from fastapi import UploadFile
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from dlib.cv import (
    StructuredBlock,
    StructuredDocument,
    PatchPayload,
    PatchOperation,
    apply_patchset,
    validate_patchset,
    parse_docx_bytes,
)

from app.models import CvDocument, CvPatch, CvVersion, PublicAsset
from app.services.storage import persist_upload


def _diff_blocks(old: list[dict], new: list[dict]) -> list[PatchPayload]:
    old_map = {b["path"]: b for b in old}
    new_map = {b["path"]: b for b in new}
    patches: list[PatchPayload] = []
    for path, nb in new_map.items():
        ob = old_map.get(path)
        if ob and ob["text"] != nb["text"]:
            patches.append(PatchPayload(
                target_path=path, operation=PatchOperation.REPLACE_TEXT,
                old_value=ob["text"], new_value=nb["text"],
            ))
    for path, ob in old_map.items():
        if path not in new_map and ob.get("block_type") != "heading":
            patches.append(PatchPayload(
                target_path=path, operation=PatchOperation.REMOVE_BLOCK,
                old_value=ob["text"],
            ))
    return patches


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
        .options(
            selectinload(CvVersion.patches),
            selectinload(CvVersion.public_assets),
        )
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
        .options(
            selectinload(CvVersion.patches),
            selectinload(CvVersion.public_assets),
        )
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
        .options(
            selectinload(CvVersion.patches),
            selectinload(CvVersion.public_assets),
        )
    )
    result = await session.execute(stmt_refresh)
    return result.scalars().one()


async def upload_docx_to_version(
    session: AsyncSession,
    *,
    owner_id: str,
    version_id: str,
    upload: UploadFile,
) -> CvVersion | None:
    stmt = (
        select(CvVersion)
        .join(CvVersion.document)
        .where(CvVersion.id == version_id, CvDocument.owner_id == owner_id)
        .options(selectinload(CvVersion.patches), selectinload(CvVersion.public_assets))
    )
    version = (await session.execute(stmt)).scalars().one_or_none()
    if not version:
        return None

    artifact_key, file_bytes = await persist_upload(upload, owner_id)
    new_blocks_parsed = parse_docx_bytes(file_bytes)
    new_blocks = [b.model_dump() for b in new_blocks_parsed.blocks]

    diff_patches = _diff_blocks(version.structured_blocks or [], new_blocks)

    version.artifact_docx_key = artifact_key
    version.structured_blocks = new_blocks
    metadata = version.metadata_json or {}
    metadata["patch_count"] = int(metadata.get("patch_count") or 0) + len(diff_patches)
    version.metadata_json = metadata

    for patch in diff_patches:
        session.add(CvPatch(
            version_id=version.id,
            target_path=patch.target_path,
            operation=patch.operation.value,
            old_value=patch.old_value,
            new_value=patch.new_value,
            metadata_json=patch.metadata,
        ))

    await session.commit()

    stmt_refresh = (
        select(CvVersion)
        .where(CvVersion.id == version_id)
        .options(selectinload(CvVersion.patches), selectinload(CvVersion.public_assets))
    )
    return (await session.execute(stmt_refresh)).scalars().one()


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
