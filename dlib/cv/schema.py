from __future__ import annotations

from enum import Enum
from typing import Any, Literal

from pydantic import BaseModel, Field, ConfigDict


class StructuredBlock(BaseModel):
    """Editable slice of a DOCX document."""

    model_config = ConfigDict(extra="allow")

    path: str
    block_type: Literal[
        "heading", "summary", "bullet", "skills", "table", "meta", "text"
    ]
    text: str
    keywords: list[str] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)


class StructuredDocument(BaseModel):
    model_config = ConfigDict(extra="allow")

    version_label: str | None = None
    blocks: list[StructuredBlock] = Field(default_factory=list)

    def get_block(self, path: str) -> StructuredBlock | None:
        return next((block for block in self.blocks if block.path == path), None)


class PatchOperation(str, Enum):
    REPLACE_TEXT = "replace_text"
    REMOVE_BLOCK = "remove_block"
    REORDER_SECTION = "reorder_section"
    BOOST_KEYWORD = "boost_keyword"
    SUPPRESS_BLOCK = "suppress_block"


class PatchPayload(BaseModel):
    model_config = ConfigDict(extra="allow")

    target_path: str
    operation: PatchOperation
    new_value: str | None = None
    old_value: str | None = None
    rationale: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class PatchSuggestion(PatchPayload):
    confidence: float | None = None
    keywords: list[str] = Field(default_factory=list)
