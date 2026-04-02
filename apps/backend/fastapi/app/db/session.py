from __future__ import annotations

from contextlib import asynccontextmanager

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import get_settings
from app.db.base import Base


settings = get_settings()
engine = create_async_engine(
    settings.database_url, echo=settings.environment == "local", future=True
)
AsyncSessionLocal = async_sessionmaker(
    bind=engine, expire_on_commit=False, class_=AsyncSession
)


@asynccontextmanager
async def lifespan(app):  # pragma: no cover
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


async def get_session() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session
