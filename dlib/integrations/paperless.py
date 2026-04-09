from __future__ import annotations

import time
from datetime import datetime
from typing import TYPE_CHECKING

import httpx

if TYPE_CHECKING:
    from app.core.config import Settings


class PaperlessClient:
    def __init__(self, base_url: str, token: str) -> None:
        self._base = base_url.rstrip("/")
        self._headers = {"Authorization": f"Token {token}"}

    def _get(self, path: str, **params) -> dict:
        r = httpx.get(f"{self._base}{path}", headers=self._headers, params=params, timeout=30)
        r.raise_for_status()
        return r.json()

    def _post(self, path: str, **kwargs) -> dict:
        r = httpx.post(f"{self._base}{path}", headers=self._headers, timeout=30, **kwargs)
        r.raise_for_status()
        return r.json()

    def _delete(self, path: str) -> None:
        r = httpx.delete(f"{self._base}{path}", headers=self._headers, timeout=30)
        r.raise_for_status()

    def upload_document(self, pdf_bytes: bytes, title: str, tags: list[int] | None = None) -> int:
        """Upload PDF to paperless and return the created document_id (polls until task completes)."""
        files = {"document": (f"{title}.pdf", pdf_bytes, "application/pdf")}
        data: dict = {"title": title}
        if tags:
            data["tags"] = tags
        resp = self._post("/api/documents/post_document/", files=files, data=data)
        task_id = resp if isinstance(resp, str) else resp.get("task_id", resp)
        return self._poll_task(str(task_id))

    def _poll_task(self, task_id: str, max_wait: int = 60) -> int:
        delay = 2
        elapsed = 0
        while elapsed < max_wait:
            time.sleep(delay)
            elapsed += delay
            result = self._get("/api/tasks/", task_id=task_id)
            tasks = result if isinstance(result, list) else result.get("results", [])
            if not tasks:
                delay = min(delay * 2, 10)
                continue
            task = tasks[0]
            if task.get("status") == "SUCCESS":
                return int(task["related_document"])
            if task.get("status") in ("FAILURE", "REVOKED"):
                raise RuntimeError(f"Paperless task {task_id} failed: {task.get('result')}")
            delay = min(delay * 2, 10)
        raise TimeoutError(f"Paperless task {task_id} did not complete within {max_wait}s")

    def create_share_link(
        self, document_id: int, expiration: datetime | None = None
    ) -> tuple[int, str]:
        """Create a share link for document_id. Returns (share_link_id, full share URL)."""
        payload: dict = {"document": document_id}
        if expiration:
            payload["expiration_date"] = expiration.isoformat()
        resp = self._post("/api/share_links/", json=payload)
        slug = resp["slug"]
        link_id = int(resp["id"])
        return link_id, f"{self._base}/share/{slug}"

    def get_share_links(self, document_id: int) -> list[dict]:
        return self._get(f"/api/documents/{document_id}/share_links/").get("results", [])

    def delete_share_link(self, share_link_id: int) -> None:
        self._delete(f"/api/share_links/{share_link_id}/")

    def delete_document(self, document_id: int) -> None:
        self._delete(f"/api/documents/{document_id}/")


def get_paperless_client(settings: "Settings") -> PaperlessClient | None:
    if not settings.paperless_enabled:
        return None
    if not settings.paperless_base_url or not settings.paperless_token:
        return None
    return PaperlessClient(settings.paperless_base_url, settings.paperless_token)
