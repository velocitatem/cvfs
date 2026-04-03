from .schema import (
    StructuredBlock,
    StructuredDocument,
    PatchPayload,
    PatchSuggestion,
    PatchOperation,
)
from .parser import parse_docx_bytes, summarize_keywords
from .patcher import apply_patchset
from .ats_guard import validate_patchset
from .docx_export import generate_patched_docx

__all__ = [
    "StructuredBlock",
    "StructuredDocument",
    "PatchPayload",
    "PatchSuggestion",
    "PatchOperation",
    "parse_docx_bytes",
    "summarize_keywords",
    "apply_patchset",
    "validate_patchset",
    "generate_patched_docx",
]
