from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.schemas.analysis import HistoryResponse
from app.services.analysis_service import get_history
from app.database.session import get_db

router = APIRouter(tags=["history"])


@router.get("/history", response_model=HistoryResponse)
async def history(
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> HistoryResponse:
    return get_history(db, limit=limit)
