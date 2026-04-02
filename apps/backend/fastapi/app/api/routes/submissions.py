from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.schemas import (
    AiSuggestionRequest,
    SubmissionCreateRequest,
    SubmissionResponse,
    SuggestionResponse,
)
from app.services.submissions import create_submission, request_ai_suggestions
from dlib.auth import AuthenticatedUser


router = APIRouter(prefix="/submissions", tags=["submissions"])


@router.post("", response_model=SubmissionResponse)
async def create_submission_endpoint(
    payload: SubmissionCreateRequest,
    session: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
):
    submission = await create_submission(
        session,
        owner_id=user.sub,
        version_id=payload.version_id,
        company_name=payload.company_name,
        role_title=payload.role_title,
        job_url=payload.job_url,
        job_description=payload.job_description,
    )
    if not submission:
        raise HTTPException(status_code=404, detail="Version not found")
    return SubmissionResponse.model_validate(submission)


@router.post("/{submission_id}/ai", response_model=list[SuggestionResponse])
async def request_submissions_ai(
    submission_id: str,
    payload: AiSuggestionRequest,
    session: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
):
    suggestions = await request_ai_suggestions(
        session,
        owner_id=user.sub,
        submission_id=submission_id,
        job_description=payload.job_description,
        focus_keywords=payload.focus_keywords,
    )
    if suggestions is None:
        raise HTTPException(status_code=404, detail="Submission not found")
    return [SuggestionResponse.model_validate(item) for item in suggestions]
