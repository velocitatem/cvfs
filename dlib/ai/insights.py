from __future__ import annotations

import re
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from typing import Literal

STOPWORDS = frozenset(
    "a an the and or but in on at to for of with is are was were be been have has"
    " had do does did this that these those it its i you he she we they their our"
    " your my his her from by into through about as so if then when where which who"
    " can will may should would could also just not no more some all any each"
    " than other up out off over how what new using use used with well per".split()
)

Outcome = Literal["positive", "negative"]  # positive = pending_review / published


@dataclass
class SuggestionRecord:
    operation: str
    target_path: str
    proposed_text: str | None
    rationale: str | None
    accepted: bool | None


@dataclass
class SubmissionRecord:
    status: str
    suggestions: list[SuggestionRecord] = field(default_factory=list)


@dataclass
class OperationImpact:
    operation: str
    total: int
    positive: int
    rate: float


@dataclass
class KeywordSignal:
    keyword: str
    positive_count: int
    negative_count: int
    lift: float  # positive_count / max(negative_count, 1)


@dataclass
class SectionImpact:
    section: str
    positive_rate: float
    count: int


@dataclass
class InsightsResult:
    total_submissions: int
    positive_count: int
    positive_rate: float
    operation_impact: list[OperationImpact]
    top_positive_keywords: list[KeywordSignal]
    top_negative_keywords: list[KeywordSignal]
    section_impact: list[SectionImpact]
    has_data: bool


def _outcome(status: str) -> Outcome | None:
    if status in ("pending_review", "published"):
        return "positive"
    if status == "archived":
        return "negative"
    return None  # draft / tailoring — not enough signal


def _tokens(text: str | None) -> list[str]:
    if not text:
        return []
    return [
        t for t in re.findall(r"[a-z][a-z0-9+.-]{1,}", text.lower())
        if t not in STOPWORDS and len(t) > 2
    ]


def _section_prefix(path: str) -> str:
    """heading[1] -> heading, bullet[3] -> bullet, table[1].0-1 -> table"""
    return re.match(r"([a-z_]+)", path).group(1) if path else "unknown"


def analyze(submissions: list[SubmissionRecord]) -> InsightsResult:
    labeled = [(s, _outcome(s.status)) for s in submissions]
    labeled_known = [(s, o) for s, o in labeled if o is not None]

    positive_count = sum(1 for _, o in labeled_known if o == "positive")

    # operation impact: only accepted suggestions in outcome-labeled submissions
    op_positive: Counter[str] = Counter()
    op_total: Counter[str] = Counter()
    for sub, outcome in labeled_known:
        for sug in sub.suggestions:
            if sug.accepted is not True:
                continue
            op_total[sug.operation] += 1
            if outcome == "positive":
                op_positive[sug.operation] += 1

    op_impact = sorted(
        [
            OperationImpact(
                operation=op,
                total=total,
                positive=op_positive[op],
                rate=round(op_positive[op] / total, 3),
            )
            for op, total in op_total.items()
        ],
        key=lambda x: x.rate,
        reverse=True,
    )

    # keyword signals from accepted-suggestion text in outcome-labeled submissions
    kw_pos: Counter[str] = Counter()
    kw_neg: Counter[str] = Counter()
    for sub, outcome in labeled_known:
        bucket = kw_pos if outcome == "positive" else kw_neg
        for sug in sub.suggestions:
            if sug.accepted is not True:
                continue
            for t in _tokens(sug.proposed_text) + _tokens(sug.rationale):
                bucket[t] += 1

    all_kws = set(kw_pos) | set(kw_neg)
    signals = [
        KeywordSignal(
            keyword=kw,
            positive_count=kw_pos[kw],
            negative_count=kw_neg[kw],
            lift=round(kw_pos[kw] / max(kw_neg[kw], 1), 2),
        )
        for kw in all_kws
        if kw_pos[kw] + kw_neg[kw] >= 2  # minimum support
    ]
    top_pos_kw = sorted(
        [s for s in signals if s.positive_count > 0],
        key=lambda s: (s.lift, s.positive_count),
        reverse=True,
    )[:8]
    top_neg_kw = sorted(
        [s for s in signals if s.negative_count > 0],
        key=lambda s: (s.negative_count, -s.lift),
        reverse=True,
    )[:8]

    # section impact: group target_path prefix by outcome
    sec_pos: Counter[str] = Counter()
    sec_total: Counter[str] = Counter()
    for sub, outcome in labeled_known:
        for sug in sub.suggestions:
            if sug.accepted is not True:
                continue
            sec = _section_prefix(sug.target_path)
            sec_total[sec] += 1
            if outcome == "positive":
                sec_pos[sec] += 1

    section_impact = sorted(
        [
            SectionImpact(
                section=sec,
                positive_rate=round(sec_pos[sec] / total, 3),
                count=total,
            )
            for sec, total in sec_total.items()
        ],
        key=lambda s: s.positive_rate,
        reverse=True,
    )

    return InsightsResult(
        total_submissions=len(submissions),
        positive_count=positive_count,
        positive_rate=round(positive_count / len(submissions), 3) if submissions else 0.0,
        operation_impact=op_impact,
        top_positive_keywords=top_pos_kw,
        top_negative_keywords=top_neg_kw,
        section_impact=section_impact,
        has_data=bool(labeled_known),
    )
