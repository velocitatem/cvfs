from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from dlib.ai.insights import InsightsResult, SubmissionRecord, SuggestionRecord, analyze
from app.models import AiSuggestion, CvDocument, CvVersion, Submission


async def get_insights(session: AsyncSession, *, owner_id: str) -> InsightsResult:
    stmt = (
        select(Submission)
        .join(Submission.version)
        .join(CvVersion.document)
        .where(CvDocument.owner_id == owner_id)
        .options(selectinload(Submission.suggestions))
    )
    rows = list((await session.execute(stmt)).scalars().all())

    records = [
        SubmissionRecord(
            status=s.status.value,
            suggestions=[
                SuggestionRecord(
                    operation=sug.operation,
                    target_path=sug.target_path,
                    proposed_text=sug.proposed_text,
                    rationale=sug.rationale,
                    accepted=sug.accepted,
                )
                for sug in s.suggestions
            ],
        )
        for s in rows
    ]
    return analyze(records)
