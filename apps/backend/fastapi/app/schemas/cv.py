from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from dlib.cv.schema import PatchSuggestion, StructuredBlock


class DocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    description: str | None
    owner_id: str
    root_version_id: str | None
    created_at: datetime
    updated_at: datetime
    versions: list["VersionResponse"] = Field(default_factory=list)


class VersionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    branch_name: str
    version_label: str | None
    parent_version_id: str | None
    structured_blocks: list[StructuredBlock] | None = None
    artifact_docx_key: str | None = None
    preview_html_key: str | None = None
    created_at: datetime
    updated_at: datetime
    patches: list["PatchResponse"] = Field(default_factory=list)


class PatchResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    target_path: str
    operation: str
    old_value: str | None = None
    new_value: str | None = None
    metadata_json: dict[str, Any] | None = None
    created_at: datetime


class DocumentListResponse(BaseModel):
    items: list[DocumentResponse]


class DocumentCreateResult(BaseModel):
    document: DocumentResponse


class BranchCreateRequest(BaseModel):
    parent_version_id: str
    branch_name: str
    version_label: str | None = None
    patches: list[dict[str, Any]] = Field(default_factory=list)


class SubmissionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    version_id: str
    company_name: str
    role_title: str
    job_url: str | None = None
    job_description: str | None = None
    status: str
    created_at: datetime
    suggestions: list["SuggestionResponse"] = Field(default_factory=list)


class SubmissionCreateRequest(BaseModel):
    version_id: str
    company_name: str
    role_title: str
    job_url: str | None = None
    job_description: str | None = None


class SuggestionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    target_path: str
    operation: str
    proposed_text: str | None
    rationale: str | None
    accepted: bool | None
    metadata_json: dict[str, Any] | None = None


class AiSuggestionRequest(BaseModel):
    job_description: str
    focus_keywords: list[str] = Field(default_factory=list)


class PublishRequest(BaseModel):
    version_id: str | None = None
    submission_id: str | None = None
    slug: str | None = None


class PublicAssetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    slug: str
    artifact_key: str
    is_public: bool
    created_at: datetime
    version_id: str | None = None
    submission_id: str | None = None
    url: str | None = None


class PublicAssetLookupResponse(BaseModel):
    asset: PublicAssetResponse
