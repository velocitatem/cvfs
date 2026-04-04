from __future__ import annotations

import enum
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import IdentifierMixin, TimestampMixin


class CvDocument(Base, IdentifierMixin, TimestampMixin):
    __tablename__ = "cv_documents"

    owner_id: Mapped[str] = mapped_column(String(255), index=True)
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    root_version_id: Mapped[str | None] = mapped_column(
        ForeignKey("cv_versions.id"), nullable=True
    )

    versions: Mapped[list["CvVersion"]] = relationship(
        "CvVersion",
        back_populates="document",
        foreign_keys="[CvVersion.document_id]",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class CvVersion(Base, IdentifierMixin, TimestampMixin):
    __tablename__ = "cv_versions"

    document_id: Mapped[str] = mapped_column(
        ForeignKey("cv_documents.id", ondelete="CASCADE")
    )
    parent_version_id: Mapped[str | None] = mapped_column(
        ForeignKey("cv_versions.id"), nullable=True
    )
    branch_name: Mapped[str] = mapped_column(String(120), default="root")
    version_label: Mapped[str | None] = mapped_column(String(120), nullable=True)
    artifact_docx_key: Mapped[str | None] = mapped_column(String(512), nullable=True)
    preview_html_key: Mapped[str | None] = mapped_column(String(512), nullable=True)
    structured_blocks: Mapped[list[dict] | None] = mapped_column(JSONB, default=list)
    metadata_json: Mapped[dict | None] = mapped_column(JSONB, default=dict)

    document: Mapped[CvDocument] = relationship(
        "CvDocument", back_populates="versions", foreign_keys="[CvVersion.document_id]"
    )
    parent: Mapped["CvVersion | None"] = relationship(
        "CvVersion", remote_side="[CvVersion.id]"
    )
    patches: Mapped[list["CvPatch"]] = relationship("CvPatch", back_populates="version")
    submissions: Mapped[list["Submission"]] = relationship(
        "Submission", back_populates="version"
    )
    public_assets: Mapped[list["PublicAsset"]] = relationship(
        "PublicAsset",
        back_populates="version",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class CvPatch(Base, IdentifierMixin, TimestampMixin):
    __tablename__ = "cv_patches"

    version_id: Mapped[str] = mapped_column(
        ForeignKey("cv_versions.id", ondelete="CASCADE")
    )
    target_path: Mapped[str] = mapped_column(String(255))
    operation: Mapped[str] = mapped_column(String(64))
    old_value: Mapped[str | None] = mapped_column(Text, nullable=True)
    new_value: Mapped[str | None] = mapped_column(Text, nullable=True)
    metadata_json: Mapped[dict | None] = mapped_column(JSONB, default=dict)

    version: Mapped[CvVersion] = relationship("CvVersion", back_populates="patches")


class Specialization(Base, IdentifierMixin, TimestampMixin):
    __tablename__ = "specializations"

    document_id: Mapped[str] = mapped_column(
        ForeignKey("cv_documents.id", ondelete="CASCADE")
    )
    name: Mapped[str] = mapped_column(String(120))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    based_on_version_id: Mapped[str | None] = mapped_column(
        ForeignKey("cv_versions.id"), nullable=True
    )
    metadata_json: Mapped[dict | None] = mapped_column(JSONB, default=dict)


class SubmissionStatus(str, enum.Enum):
    draft = "draft"
    tailoring = "tailoring"
    pending_review = "pending_review"
    published = "published"
    archived = "archived"


class Submission(Base, IdentifierMixin, TimestampMixin):
    __tablename__ = "submissions"

    version_id: Mapped[str] = mapped_column(
        ForeignKey("cv_versions.id", ondelete="CASCADE")
    )
    company_name: Mapped[str] = mapped_column(String(160))
    role_title: Mapped[str] = mapped_column(String(160))
    job_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    job_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[SubmissionStatus] = mapped_column(
        Enum(SubmissionStatus), default=SubmissionStatus.draft
    )
    metadata_json: Mapped[dict | None] = mapped_column(JSONB, default=dict)

    version: Mapped[CvVersion] = relationship("CvVersion", back_populates="submissions")
    suggestions: Mapped[list["AiSuggestion"]] = relationship(
        "AiSuggestion", back_populates="submission"
    )
    public_asset: Mapped["PublicAsset | None"] = relationship(
        "PublicAsset", back_populates="submission"
    )


class PublicAsset(Base, IdentifierMixin, TimestampMixin):
    __tablename__ = "public_assets"

    submission_id: Mapped[str | None] = mapped_column(
        ForeignKey("submissions.id", ondelete="SET NULL"), nullable=True
    )
    version_id: Mapped[str | None] = mapped_column(
        ForeignKey("cv_versions.id", ondelete="CASCADE"), nullable=True
    )
    slug: Mapped[str] = mapped_column(String(160), unique=True, index=True)
    artifact_key: Mapped[str] = mapped_column(String(512))
    is_public: Mapped[bool] = mapped_column(Boolean, default=True)
    expires_at: Mapped[str | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    submission: Mapped[Submission | None] = relationship(
        "Submission", back_populates="public_asset"
    )
    version: Mapped[CvVersion | None] = relationship(
        "CvVersion", back_populates="public_assets"
    )
    views: Mapped[list["PublicAssetView"]] = relationship(
        "PublicAssetView",
        back_populates="public_asset",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class PublicAssetView(Base, IdentifierMixin):
    __tablename__ = "public_asset_views"

    public_asset_id: Mapped[str] = mapped_column(
        ForeignKey("public_assets.id", ondelete="CASCADE"), index=True
    )
    viewed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True
    )
    user_agent: Mapped[str | None] = mapped_column(String(512), nullable=True)
    ip_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)

    public_asset: Mapped[PublicAsset] = relationship(
        "PublicAsset", back_populates="views"
    )


class AiSuggestion(Base, IdentifierMixin, TimestampMixin):
    __tablename__ = "ai_suggestions"

    submission_id: Mapped[str] = mapped_column(
        ForeignKey("submissions.id", ondelete="CASCADE")
    )
    target_path: Mapped[str] = mapped_column(String(255))
    operation: Mapped[str] = mapped_column(String(64))
    proposed_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    rationale: Mapped[str | None] = mapped_column(Text, nullable=True)
    accepted: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    metadata_json: Mapped[dict | None] = mapped_column(JSONB, default=dict)

    submission: Mapped[Submission] = relationship(
        "Submission", back_populates="suggestions"
    )
