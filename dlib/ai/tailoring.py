from __future__ import annotations

import json
import os
import re
import textwrap
from typing import Sequence

from pydantic import BaseModel, Field

from alveslib import ask

from dlib.cv.schema import (
    PatchOperation,
    PatchSuggestion,
    StructuredBlock,
    StructuredDocument,
)


class TailoringContext(BaseModel):
    job_description: str
    focus_keywords: list[str] = Field(default_factory=list)
    prohibited_terms: list[str] = Field(default_factory=list)


def generate_tailoring_suggestions(
    context: TailoringContext,
    document: StructuredDocument,
    *,
    max_changes: int = 12,
) -> list[PatchSuggestion]:
    if not document.blocks:
        return []
    if not os.getenv("ANTHROPIC_API_KEY"):
        return _rule_based_suggestions(context, document, max_changes)

    prompt = _build_prompt(context, document, max_changes)
    raw = ask(prompt)
    try:
        payload = json.loads(raw)
        candidates = payload.get("patches", payload)
    except json.JSONDecodeError:
        return _rule_based_suggestions(context, document, max_changes)

    suggestions: list[PatchSuggestion] = []
    for candidate in candidates[:max_changes]:
        try:
            suggestions.append(PatchSuggestion.model_validate(candidate))
        except Exception:
            continue
    return suggestions or _rule_based_suggestions(context, document, max_changes)


def _rule_based_suggestions(
    context: TailoringContext,
    document: StructuredDocument,
    max_changes: int,
) -> list[PatchSuggestion]:
    keywords = set([kw.lower() for kw in context.focus_keywords])
    if not keywords:
        keywords = set(_extract_keywords(context.job_description))
    suggestions: list[PatchSuggestion] = []
    for block in document.blocks:
        overlap = keywords.intersection({kw.lower() for kw in block.keywords})
        if not overlap and len(suggestions) < max_changes:
            keyword = next(iter(keywords), None)
            if keyword:
                suggestions.append(
                    PatchSuggestion(
                        target_path=block.path,
                        operation=PatchOperation.BOOST_KEYWORD,
                        new_value=keyword,
                        rationale="Surface JD keyword in existing bullet",
                        keywords=[keyword],
                        confidence=0.4,
                    )
                )
        elif overlap and len(suggestions) < max_changes:
            keyword = next(iter(overlap))
            suggestions.append(
                PatchSuggestion(
                    target_path=block.path,
                    operation=PatchOperation.REPLACE_TEXT,
                    new_value=_strengthen_sentence(block, keyword),
                    old_value=block.text,
                    rationale=f"Highlight {keyword}",
                    keywords=[keyword],
                    confidence=0.55,
                )
            )
    return suggestions[:max_changes]


def _strengthen_sentence(block: StructuredBlock, keyword: str) -> str:
    text = block.text.strip()
    if keyword.lower() not in text.lower():
        return f"{text} — emphasized {keyword} impact"
    return re.sub(keyword, keyword.upper(), text, flags=re.IGNORECASE)


def _extract_keywords(job_description: str, limit: int = 8) -> list[str]:
    tokens = {}
    for token in re.findall(r"[A-Za-z][A-Za-z0-9+./-]{2,}", job_description):
        t = token.lower()
        tokens[t] = tokens.get(t, 0) + 1
    return [
        token
        for token, _ in sorted(tokens.items(), key=lambda kv: kv[1], reverse=True)[
            :limit
        ]
    ]


def _build_prompt(
    context: TailoringContext, document: StructuredDocument, max_changes: int
) -> str:
    lines = [f"{block.path}: {block.text}" for block in document.blocks]
    doc_preview = "\n".join(lines[:40])
    focus = ", ".join(context.focus_keywords) or "n/a"
    prohibited = ", ".join(context.prohibited_terms) or "n/a"
    return textwrap.dedent(
        f"""
        You are an ATS-preserving copy editor. Job description:\n{context.job_description}\n---\n
        Existing resume snippets:\n{doc_preview}

        Provide at most {max_changes} JSON patch objects with fields
        target_path, operation, new_value, rationale, keywords, confidence.
        Allowed operations: replace_text, boost_keyword, suppress_block.
        Focus keywords: {focus}. Forbidden topics: {prohibited}.
        Ensure every change is truthful and preserves formatting.
        Respond with JSON: {{"patches": [{{...}}]}} only.
        """
    ).strip()
