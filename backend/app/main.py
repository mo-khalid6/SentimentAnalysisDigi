from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time

from app.core.config import get_settings
from app.core.logging import setup_logging, get_logger
from app.database.session import init_db
from app.routers import health_router, analyze_router, history_router

setup_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    logger.info({"message": "Starting up", "app": settings.APP_NAME, "version": settings.APP_VERSION})
    init_db()
    logger.info({"message": "Database ready"})
    yield
    logger.info({"message": "Shutting down", "app": settings.APP_NAME})


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="AI-powered sentiment analysis and text summarization API",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.middleware("http")
    async def log_requests(request: Request, call_next):
        start = time.time()
        response = await call_next(request)
        elapsed_ms = int((time.time() - start) * 1000)
        logger.info({
            "message": "Request handled",
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "duration_ms": elapsed_ms,
        })
        return response

    app.include_router(health_router)
    app.include_router(analyze_router)
    app.include_router(history_router)

    return app


app = create_app()
