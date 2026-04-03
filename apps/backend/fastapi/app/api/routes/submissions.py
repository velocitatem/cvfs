from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.schemas import (
    AiSuggestionRequest,
    SubmissionCreateRequest,
    SubmissionResponse,
    SuggestionResponse,
    SuggestionUpdateRequest,
)
from app.services.submissions import (
    create_submission,
    get_submission,
    list_submissions,
    request_ai_suggestions,
    update_suggestion,
)
from dlib.auth import AuthenticatedUser


router = APIRouter(prefix="/submissions", tags=["submissions"])


@router.get("", response_model=list[SubmissionResponse])
async def list_submissions_endpoint(
    version_id: str | None = None,
    session: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
):
    items = await list_submissions(session, owner_id=user.sub, version_id=version_id)
    return [SubmissionResponse.model_validate(s) for s in items]


@router.get("/{submission_id}", response_model=SubmissionResponse)
async def get_submission_endpoint(
    submission_id: str,
    session: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
):
    submission = await get_submission(session, owner_id=user.sub, submission_id=submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    return SubmissionResponse.model_validate(submission)


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


@router.patch("/{submission_id}/suggestions/{suggestion_id}", response_model=SuggestionResponse)
async def update_suggestion_endpoint(
    submission_id: str,
    suggestion_id: str,
    payload: SuggestionUpdateRequest,
    session: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
):
    suggestion = await update_suggestion(
        session,
        owner_id=user.sub,
        submission_id=submission_id,
        suggestion_id=suggestion_id,
        accepted=payload.accepted,
    )
    if not suggestion:
        raise HTTPException(status_code=404, detail="Suggestion not found")
    return SuggestionResponse.model_validate(suggestion)
