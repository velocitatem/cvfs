from __future__ import annotations

from pydantic import BaseModel


class OperationImpactSchema(BaseModel):
    operation: str
    total: int
    positive: int
    rate: float


class KeywordSignalSchema(BaseModel):
    keyword: str
    positive_count: int
    negative_count: int
    lift: float


class SectionImpactSchema(BaseModel):
    section: str
    positive_rate: float
    count: int


class InsightsResponse(BaseModel):
    total_submissions: int
    positive_count: int
    positive_rate: float
    operation_impact: list[OperationImpactSchema]
    top_positive_keywords: list[KeywordSignalSchema]
    top_negative_keywords: list[KeywordSignalSchema]
    section_impact: list[SectionImpactSchema]
    has_data: bool
