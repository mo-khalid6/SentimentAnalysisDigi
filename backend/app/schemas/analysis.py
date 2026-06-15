from datetime import datetime
from pydantic import BaseModel, Field, field_validator


class AnalyzeRequest(BaseModel):
    text: str = Field(..., min_length=5, max_length=5000, description="Text to analyze")

    @field_validator("text")
    @classmethod
    def strip_whitespace(cls, v: str) -> str:
        stripped = v.strip()
        if len(stripped) < 5:
            raise ValueError("Text must be at least 5 characters after stripping whitespace")
        return stripped


class AnalyzeResponse(BaseModel):
    sentiment: str
    confidence: float
    summary: str
    processing_time_ms: int


class AnalysisHistoryItem(BaseModel):
    id: int
    original_text: str
    sentiment: str
    confidence: float
    summary: str
    processing_time_ms: int
    created_at: datetime

    model_config = {"from_attributes": True}


class HistoryResponse(BaseModel):
    items: list[AnalysisHistoryItem]
    total: int


class HealthResponse(BaseModel):
    status: str
