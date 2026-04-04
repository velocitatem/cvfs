from __future__ import annotations

from fastapi import UploadFile
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from dlib.cv import parse_docx_bytes

from app.models import CvDocument, CvVersion, PublicAsset
from app.services.storage import persist_upload


async def create_document(
    session: AsyncSession,
    *,
    owner_id: str,
    title: str,
    description: str | None,
    upload: UploadFile,
) -> CvDocument:
    artifact_key, file_bytes = await persist_upload(upload, owner_id)
    structured = parse_docx_bytes(file_bytes, version_label="root")

    doc = CvDocument(owner_id=owner_id, title=title, description=description)
    session.add(doc)
    await session.flush()  # persist doc so version FK is satisfied

    version = CvVersion(
        document_id=doc.id,
        branch_name="root",
        version_label="root",
        artifact_docx_key=artifact_key,
        structured_blocks=[block.model_dump() for block in structured.blocks],
        metadata_json={"ingested": True},
    )
    session.add(version)
    await session.flush()  # persist version so root_version_id FK is satisfied

    doc.root_version_id = version.id
    await session.commit()

    stmt = (
        select(CvDocument)
        .where(CvDocument.id == doc.id)
        .options(selectinload(CvDocument.versions).selectinload(CvVersion.patches))
    )
    result = await session.execute(stmt)
    return result.scalars().unique().one()


async def list_documents(session: AsyncSession, owner_id: str) -> list[CvDocument]:
    stmt = (
        select(CvDocument)
        .where(CvDocument.owner_id == owner_id)
        .options(selectinload(CvDocument.versions).selectinload(CvVersion.patches))
        .order_by(CvDocument.created_at.desc())
    )
    result = await session.execute(stmt)
    return result.scalars().unique().all()


async def get_document(
    session: AsyncSession, owner_id: str, document_id: str
) -> CvDocument | None:
    stmt = (
        select(CvDocument)
        .where(CvDocument.id == document_id, CvDocument.owner_id == owner_id)
        .options(selectinload(CvDocument.versions).selectinload(CvVersion.patches))
    )
    result = await session.execute(stmt)
    return result.scalars().unique().one_or_none()


async def delete_document(
    session: AsyncSession, owner_id: str, document_id: str
) -> bool:
    doc = await get_document(session, owner_id, document_id)
    if not doc:
        return False
    version_ids = [version.id for version in doc.versions]
    if version_ids:
        await session.execute(
            delete(PublicAsset).where(PublicAsset.version_id.in_(version_ids))
        )
    await session.delete(doc)
    await session.commit()
    return True
