from __future__ import annotations

import time
from typing import Any
from urllib.parse import urlparse, urlunparse

import httpx
from jose import JWTError, jwt
from pydantic import BaseModel, Field


class AuthenticatedUser(BaseModel):
    sub: str
    email: str | None = None
    name: str | None = None
    picture: str | None = None
    roles: list[str] = Field(default_factory=list)


class TokenValidationError(Exception):
    pass


def _normalize_issuer(value: str | None) -> str | None:
    if not value:
        return None
    parsed = urlparse(value.strip())
    path = parsed.path.rstrip("/")
    if not path:
        return urlunparse((parsed.scheme, parsed.netloc, "", "", "", ""))
    segments = [segment for segment in path.split("/") if segment]
    if (
        len(segments) >= 4
        and segments[0] == "application"
        and segments[1] == "o"
        and segments[2] == "authorize"
    ):
        segments.pop(2)
    normalized_path = "/" + "/".join(segments)
    normalized = urlunparse(
        (parsed.scheme, parsed.netloc, normalized_path.rstrip("/"), "", "", "")
    )
    return normalized.rstrip("/")


class OidcTokenValidator:
    def __init__(
        self,
        *,
        issuer: str | None,
        audience: str | None,
        jwks_url: str | None = None,
        disable: bool = False,
    ) -> None:
        normalized_issuer = _normalize_issuer(issuer)
        self.issuer = normalized_issuer
        self.audience = audience
        self.jwks_url = jwks_url or (
            f"{normalized_issuer.rstrip('/')}/.well-known/jwks.json"
            if normalized_issuer
            else None
        )
        self.disable = disable or not normalized_issuer
        self._jwks: dict[str, Any] | None = None
        self._jwks_expiry: float = 0

    async def validate(self, token: str) -> AuthenticatedUser:
        if self.disable or not token:
            return AuthenticatedUser(
                sub="dev-user", email="dev@example.com", name="Developer"
            )
        header = jwt.get_unverified_header(token)
        key = await self._get_key(header.get("kid"))
        if not key:
            raise TokenValidationError("Unable to resolve signing key")
        try:
            claims = jwt.decode(
                token,
                key,
                algorithms=[key.get("alg", "RS256")],
                audience=self.audience,
                issuer=self.issuer,
            )
        except JWTError as exc:
            raise TokenValidationError(str(exc)) from exc
        roles = claims.get("roles") or claims.get("app_metadata", {}).get("roles") or []
        if isinstance(roles, str):
            roles = [roles]
        return AuthenticatedUser(
            sub=str(claims.get("sub")),
            email=claims.get("email"),
            name=claims.get("name"),
            picture=claims.get("picture"),
            roles=roles,
        )

    async def _get_key(self, kid: str | None) -> dict[str, Any] | None:
        if not self.jwks_url:
            return None
        if not self._jwks or time.time() > self._jwks_expiry:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.get(self.jwks_url)
                response.raise_for_status()
                self._jwks = response.json()
                self._jwks_expiry = time.time() + 3600
        keys = self._jwks.get("keys", []) if isinstance(self._jwks, dict) else []
        if kid:
            for key in keys:
                if key.get("kid") == kid:
                    return key
        return keys[0] if keys else None


def build_validator(
    *, issuer: str | None, audience: str | None, disable: bool
) -> OidcTokenValidator:
    return OidcTokenValidator(issuer=issuer, audience=audience, disable=disable)
