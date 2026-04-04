from __future__ import annotations

from io import BytesIO

from docx import Document
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import HRFlowable, Paragraph, SimpleDocTemplate, Spacer

from .parser import _detect_block_type

_STYLES = getSampleStyleSheet()

_STYLE_MAP: dict[str, ParagraphStyle] = {
    "heading": ParagraphStyle(
        "CVHeading", parent=_STYLES["Normal"],
        fontSize=15, leading=20, spaceBefore=10, spaceAfter=4,
        textColor=colors.HexColor("#111111"), fontName="Helvetica-Bold",
    ),
    "meta": ParagraphStyle(
        "CVMeta", parent=_STYLES["Normal"],
        fontSize=9, leading=13, spaceAfter=2, textColor=colors.HexColor("#555555"),
    ),
    "summary": ParagraphStyle(
        "CVSummary", parent=_STYLES["Normal"],
        fontSize=10, leading=14, spaceAfter=6, textColor=colors.HexColor("#333333"),
    ),
    "bullet": ParagraphStyle(
        "CVBullet", parent=_STYLES["Normal"],
        fontSize=10, leading=14, spaceAfter=3, leftIndent=14,
        bulletIndent=0, textColor=colors.HexColor("#222222"),
    ),
    "skills": ParagraphStyle(
        "CVSkills", parent=_STYLES["Normal"],
        fontSize=10, leading=14, spaceAfter=3, textColor=colors.HexColor("#222222"),
    ),
    "text": ParagraphStyle(
        "CVText", parent=_STYLES["Normal"],
        fontSize=10, leading=14, spaceAfter=4, textColor=colors.HexColor("#222222"),
    ),
}


def docx_bytes_to_pdf(docx_bytes: bytes) -> bytes:
    doc = Document(BytesIO(docx_bytes))
    buf = BytesIO()
    pdf = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=2.2 * cm, rightMargin=2.2 * cm,
        topMargin=2 * cm, bottomMargin=2 * cm,
    )
    story: list = []
    prev_type: str | None = None

    for para in doc.paragraphs:
        text = para.text.strip()
        if not text:
            if prev_type and prev_type != "empty":
                story.append(Spacer(1, 4))
            prev_type = "empty"
            continue

        block_type = _detect_block_type(getattr(para.style, "name", None), para)
        style = _STYLE_MAP.get(block_type, _STYLE_MAP["text"])

        # draw separator line before new heading sections (except first)
        if block_type == "heading" and prev_type not in (None, "heading"):
            story.append(Spacer(1, 6))
            story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#cccccc")))

        prefix = "\u2022\u00a0" if block_type == "bullet" else ""
        story.append(Paragraph(f"{prefix}{text}", style))
        prev_type = block_type

    pdf.build(story)
    return buf.getvalue()
