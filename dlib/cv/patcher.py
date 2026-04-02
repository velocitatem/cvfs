from __future__ import annotations

from copy import deepcopy

from .schema import PatchOperation, PatchPayload, StructuredDocument


def apply_patchset(
    document: StructuredDocument, patches: list[PatchPayload]
) -> StructuredDocument:
    working = StructuredDocument.model_validate(deepcopy(document.model_dump()))
    for patch in patches:
        block = working.get_block(patch.target_path)
        if not block:
            continue
        if patch.operation == PatchOperation.REPLACE_TEXT:
            block.metadata["previous_text"] = block.text
            if patch.new_value:
                block.text = patch.new_value
        elif patch.operation == PatchOperation.REMOVE_BLOCK:
            working.blocks = [
                candidate
                for candidate in working.blocks
                if candidate.path != patch.target_path
            ]
        elif patch.operation == PatchOperation.REORDER_SECTION:
            target_index = (
                patch.metadata.get("target_index") if patch.metadata else None
            )
            if target_index is None:
                continue
            to_move = next(
                (
                    candidate
                    for candidate in working.blocks
                    if candidate.path == patch.target_path
                ),
                None,
            )
            if not to_move:
                continue
            working.blocks = [
                candidate
                for candidate in working.blocks
                if candidate.path != patch.target_path
            ]
            working.blocks.insert(int(target_index), to_move)
        elif patch.operation == PatchOperation.BOOST_KEYWORD and patch.new_value:
            if patch.new_value not in block.keywords:
                block.keywords.insert(0, patch.new_value)
        elif patch.operation == PatchOperation.SUPPRESS_BLOCK:
            block.metadata["suppressed"] = True
    return working
