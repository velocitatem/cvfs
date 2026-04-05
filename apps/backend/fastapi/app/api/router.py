from __future__ import annotations

from fastapi import APIRouter

from app.api.routes import documents, insights, versions, submissions, public

api_router = APIRouter()
api_router.include_router(documents.router)
api_router.include_router(versions.router)
api_router.include_router(submissions.router)
api_router.include_router(public.router)
api_router.include_router(insights.router)
