from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from dlib.ai.tailoring import TailoringContext, generate_tailoring_suggestions
from dlib.cv import StructuredBlock, StructuredDocument

from app.models import AiSuggestion, CvDocument, CvVersion, Submission, SubmissionStatus


async def create_submission(
    session: AsyncSession,
    *,
    owner_id: str,
    version_id: str,
    company_name: str,
    role_title: str,
    job_url: str | None,
    job_description: str | None,
) -> Submission | None:
    version = await _get_version_for_owner(session, owner_id, version_id)
    if not version:
        return None
    submission = Submission(
        version_id=version.id,
        company_name=company_name,
        role_title=role_title,
        job_url=job_url,
        job_description=job_description,
        status=SubmissionStatus.draft,
    )
    session.add(submission)
    await session.commit()
    await session.refresh(submission)
    return submission


async def request_ai_suggestions(
    session: AsyncSession,
    *,
    owner_id: str,
    submission_id: str,
    job_description: str,
    focus_keywords: list[str],
) -> list[AiSuggestion] | None:
    submission = await _get_submission_for_owner(session, owner_id, submission_id)
    if not submission:
        return None
    version = submission.version
    document = StructuredDocument(
        version_label=version.version_label,
        blocks=[
            StructuredBlock.model_validate(block)
            for block in version.structured_blocks or []
        ],
    )
    context = TailoringContext(
        job_description=job_description, focus_keywords=focus_keywords
    )
    suggestions = generate_tailoring_suggestions(context, document)
    if not suggestions:
        return []
    submission.status = SubmissionStatus.tailoring
    created: list[AiSuggestion] = []
    for suggestion in suggestions:
        ai_row = AiSuggestion(
            submission_id=submission.id,
            target_path=suggestion.target_path,
            operation=suggestion.operation.value,
            proposed_text=suggestion.new_value,
            rationale=suggestion.rationale,
            metadata_json={
                "keywords": suggestion.keywords,
                "confidence": suggestion.confidence,
            },
        )
        session.add(ai_row)
        created.append(ai_row)
    await session.commit()
    for row in created:
        await session.refresh(row)
    return created


async def _get_version_for_owner(
    session: AsyncSession, owner_id: str, version_id: str
) -> CvVersion | None:
    stmt = (
        select(CvVersion)
        .join(CvVersion.document)
        .where(CvVersion.id == version_id, CvDocument.owner_id == owner_id)
    )
    result = await session.execute(stmt)
    return result.scalars().one_or_none()


async def _get_submission_for_owner(
    session: AsyncSession,
    owner_id: str,
    submission_id: str,
) -> Submission | None:
    stmt = (
        select(Submission)
        .join(Submission.version)
        .join(CvVersion.document)
        .where(Submission.id == submission_id, CvDocument.owner_id == owner_id)
        .options(selectinload(Submission.version))
    )
    result = await session.execute(stmt)
    return result.scalars().one_or_none()
