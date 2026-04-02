from __future__ import annotations

from functools import lru_cache

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.db.session import AsyncSessionLocal
from dlib.auth import AuthenticatedUser, build_validator


security_scheme = HTTPBearer(auto_error=False)


async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session


@lru_cache(maxsize=1)
def _validator():
    settings = get_settings()
    return build_validator(
        issuer=settings.auth_oidc_issuer,
        audience=settings.auth_oidc_audience,
        disable=settings.auth_disable_verification,
    )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security_scheme),
) -> AuthenticatedUser:
    validator = _validator()
    token = credentials.credentials if credentials else ""
    try:
        return await validator.validate(token)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)
        ) from exc
