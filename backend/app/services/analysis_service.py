import time
from sqlalchemy.orm import Session
from app.schemas.analysis import AnalyzeRequest, AnalyzeResponse, AnalysisHistoryItem, HistoryResponse
from app.models.analysis import AnalysisHistory
from app.services.ml_service import run_sentiment, run_summarization
from app.core.logging import get_logger

logger = get_logger(__name__)


def analyze_text(request: AnalyzeRequest, db: Session) -> AnalyzeResponse:
    start_ms = int(time.time() * 1000)

    logger.info({"message": "Starting analysis", "text_length": len(request.text)})

    sentiment, confidence = run_sentiment(request.text)
    summary = run_summarization(request.text)

    elapsed_ms = int(time.time() * 1000) - start_ms

    record = AnalysisHistory(
        original_text=request.text,
        sentiment=sentiment,
        confidence=confidence,
        summary=summary,
        processing_time_ms=elapsed_ms,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    logger.info({
        "message": "Analysis complete",
        "sentiment": sentiment,
        "confidence": confidence,
        "processing_time_ms": elapsed_ms,
    })

    return AnalyzeResponse(
        sentiment=sentiment,
        confidence=confidence,
        summary=summary,
        processing_time_ms=elapsed_ms,
    )


def get_history(db: Session, limit: int = 20) -> HistoryResponse:
    records = (
        db.query(AnalysisHistory)
        .order_by(AnalysisHistory.created_at.desc())
        .limit(limit)
        .all()
    )
    total = db.query(AnalysisHistory).count()
    items = [AnalysisHistoryItem.model_validate(r) for r in records]
    return HistoryResponse(items=items, total=total)
