from __future__ import annotations

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.core.config import get_settings
from app.schemas import DocumentListResponse, DocumentResponse
from app.services.documents import (
    create_document,
    delete_document,
    get_document,
    list_documents,
)
from app.services.storage import storage_client
from dlib.auth import AuthenticatedUser
from dlib.cv import generate_patched_docx


router = APIRouter(prefix="/documents", tags=["documents"])


@router.get("", response_model=DocumentListResponse)
async def list_user_documents(
    session: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
):
    documents = await list_documents(session, owner_id=user.sub)
    payload = [_build_document_response(doc) for doc in documents]
    return DocumentListResponse(items=payload)


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_user_document(
    document_id: str,
    session: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
):
    document = await get_document(session, owner_id=user.sub, document_id=document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return _build_document_response(document)


@router.get("/{document_id}/versions/{version_id}/download")
async def download_version_docx(
    document_id: str,
    version_id: str,
    session: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
):
    document = await get_document(session, owner_id=user.sub, document_id=document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    version = next((v for v in document.versions if v.id == version_id), None)
    if not version or not version.artifact_docx_key:
        raise HTTPException(status_code=404, detail="Version artifact not found")
    original = storage_client.download_bytes(key=version.artifact_docx_key)
    data = generate_patched_docx(original, version.structured_blocks or [])
    slug = f"{document.title.replace(' ', '-')}-{version.branch_name}.docx"
    return Response(
        content=data,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="{slug}"'},
    )


@router.post("", response_model=DocumentResponse)
async def upload_document(
    title: str = Form(...),
    description: str | None = Form(default=None),
    file: UploadFile = File(...),
    session: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
):
    document = await create_document(
        session,
        owner_id=user.sub,
        title=title,
        description=description,
        upload=file,
    )
    return _build_document_response(document)


@router.delete("/{document_id}", status_code=204)
async def delete_user_document(
    document_id: str,
    session: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
):
    deleted = await delete_document(session, owner_id=user.sub, document_id=document_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Document not found")


def _build_document_response(document) -> DocumentResponse:
    settings = get_settings()
    base = (settings.public_base_url or "").rstrip("/")
    response = DocumentResponse.model_validate(document)
    versions = []
    for version in response.versions:
        assets = []
        for asset in version.public_assets:
            slug = asset.slug
            url = asset.url
            if slug and not url:
                url = f"{base}/cv/{slug}" if base else f"/cv/{slug}"
            assets.append(asset.model_copy(update={"url": url}))
        versions.append(version.model_copy(update={"public_assets": assets}))
    return response.model_copy(update={"versions": versions})
