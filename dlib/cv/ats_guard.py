from __future__ import annotations

from typing import Iterable

from .schema import PatchPayload, PatchOperation, StructuredDocument


class PatchValidationError(ValueError):
    pass


def validate_patchset(
    document: StructuredDocument,
    patches: Iterable[PatchPayload],
    *,
    max_growth_ratio: float = 1.45,
) -> None:
    patch_list = list(patches)
    block_map = {block.path: block for block in document.blocks}
    for patch in patch_list:
        block = block_map.get(patch.target_path)
        if not block:
            raise PatchValidationError(
                f"Target path {patch.target_path} does not exist in base document"
            )
        if patch.operation == PatchOperation.REPLACE_TEXT:
            if not patch.new_value:
                raise PatchValidationError("replace_text requires new_value")
            baseline = len(block.text.strip()) or 1
            if len(patch.new_value.strip()) / baseline > max_growth_ratio:
                raise PatchValidationError("Patch grows text beyond ATS safe threshold")
        if (
            patch.operation
            in {PatchOperation.REMOVE_BLOCK, PatchOperation.SUPPRESS_BLOCK}
            and block.block_type == "heading"
        ):
            raise PatchValidationError(
                "Headings cannot be removed without manual confirmation"
            )
