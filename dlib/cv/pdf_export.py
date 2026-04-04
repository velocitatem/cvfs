from __future__ import annotations

import os
import subprocess
import tempfile


def docx_bytes_to_pdf(docx_bytes: bytes) -> bytes:
    with tempfile.TemporaryDirectory() as tmpdir:
        docx_path = os.path.join(tmpdir, "cv.docx")
        pdf_path = os.path.join(tmpdir, "cv.pdf")
        with open(docx_path, "wb") as f:
            f.write(docx_bytes)
        subprocess.run(
            ["libreoffice", "--headless", "--convert-to", "pdf", "--outdir", tmpdir, docx_path],
            check=True,
            capture_output=True,
            timeout=60,
        )
        with open(pdf_path, "rb") as f:
            return f.read()
