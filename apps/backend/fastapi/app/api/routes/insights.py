from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.schemas.insights import InsightsResponse
from app.services.insights import get_insights
from dlib.auth import AuthenticatedUser

router = APIRouter(prefix="/insights", tags=["insights"])


@router.get("", response_model=InsightsResponse)
async def insights_endpoint(
    session: AsyncSession = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
):
    result = await get_insights(session, owner_id=user.sub)
    return InsightsResponse(
        total_submissions=result.total_submissions,
        positive_count=result.positive_count,
        positive_rate=result.positive_rate,
        operation_impact=[
            {"operation": o.operation, "total": o.total, "positive": o.positive, "rate": o.rate}
            for o in result.operation_impact
        ],
        top_positive_keywords=[
            {"keyword": k.keyword, "positive_count": k.positive_count, "negative_count": k.negative_count, "lift": k.lift}
            for k in result.top_positive_keywords
        ],
        top_negative_keywords=[
            {"keyword": k.keyword, "positive_count": k.positive_count, "negative_count": k.negative_count, "lift": k.lift}
            for k in result.top_negative_keywords
        ],
        section_impact=[
            {"section": s.section, "positive_rate": s.positive_rate, "count": s.count}
            for s in result.section_impact
        ],
        has_data=result.has_data,
    )
