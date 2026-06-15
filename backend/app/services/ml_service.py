import threading
import time
from typing import Optional
from app.core.logging import get_logger
from app.core.config import get_settings

# Check if ML dependencies are available (skipped in lightweight CI)
try:
    import torch  # noqa: F401
    ML_AVAILABLE = True
except ImportError:
    ML_AVAILABLE = False

logger = get_logger(__name__)

_sentiment_pipeline = None
_summarizer_pipeline = None
_sentiment_lock = threading.Lock()
_summarizer_lock = threading.Lock()

SENTIMENT_MODEL = "cardiffnlp/twitter-roberta-base-sentiment-latest"
SUMMARIZATION_MODEL = "sshleifer/distilbart-cnn-12-6"

LABEL_MAP = {
    "LABEL_0": "Negative",
    "LABEL_1": "Neutral",
    "LABEL_2": "Positive",
    "negative": "Negative",
    "neutral": "Neutral",
    "positive": "Positive",
}


def get_sentiment_pipeline():
    global _sentiment_pipeline
    if not ML_AVAILABLE:
        raise RuntimeError("ML dependencies (torch/transformers) are not installed.")
    if _sentiment_pipeline is None:
        with _sentiment_lock:
            if _sentiment_pipeline is None:
                logger.info({"message": "Loading sentiment model", "model": SENTIMENT_MODEL})
                from transformers import pipeline
                settings = get_settings()
                _sentiment_pipeline = pipeline(
                    "text-classification",
                    model=SENTIMENT_MODEL,
                    model_kwargs={"cache_dir": settings.MODEL_CACHE_DIR},
                    truncation=True,
                    max_length=512,
                )
                logger.info({"message": "Sentiment model loaded", "model": SENTIMENT_MODEL})
    return _sentiment_pipeline


def get_summarizer_pipeline():
    global _summarizer_pipeline
    if not ML_AVAILABLE:
        raise RuntimeError("ML dependencies (torch/transformers) are not installed.")
    if _summarizer_pipeline is None:
        with _summarizer_lock:
            if _summarizer_pipeline is None:
                logger.info({"message": "Loading summarization model", "model": SUMMARIZATION_MODEL})
                from transformers import pipeline
                settings = get_settings()
                _summarizer_pipeline = pipeline(
                    "summarization",
                    model=SUMMARIZATION_MODEL,
                    model_kwargs={"cache_dir": settings.MODEL_CACHE_DIR},
                    truncation=True,
                )
                logger.info({"message": "Summarization model loaded", "model": SUMMARIZATION_MODEL})
    return _summarizer_pipeline


def run_sentiment(text: str) -> tuple[str, float]:
    pipe = get_sentiment_pipeline()
    result = pipe(text, truncation=True, max_length=512)
    raw_label: str = result[0]["label"]
    score: float = float(result[0]["score"])
    label = LABEL_MAP.get(raw_label, raw_label.capitalize())
    return label, round(score, 4)


def run_summarization(text: str) -> str:
    if len(text.split()) < 30:
        return text.strip()
    pipe = get_summarizer_pipeline()
    word_count = len(text.split())
    max_len = min(130, max(30, word_count // 3))
    min_len = min(30, max_len - 5)
    result = pipe(
        text,
        max_length=max_len,
        min_length=min_len,
        do_sample=False,
        truncation=True,
    )
    return result[0]["summary_text"].strip()
