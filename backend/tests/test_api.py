import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from app.main import app
from app.database.session import Base, engine, get_db
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

TEST_DATABASE_URL = "sqlite:///./test_sentiment.db"

test_engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def setup_test_db():
    from app.models.analysis import AnalysisHistory  # noqa
    Base.metadata.create_all(bind=test_engine)
    app.dependency_overrides[get_db] = override_get_db
    yield
    Base.metadata.drop_all(bind=test_engine)
    app.dependency_overrides.clear()


@pytest.fixture
def client():
    return TestClient(app)


def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


def test_analyze_success(client):
    mock_sentiment = ("Positive", 0.94)
    mock_summary = "This is a summary of the analyzed text."

    with patch("app.services.ml_service.run_sentiment", return_value=mock_sentiment), \
         patch("app.services.ml_service.run_summarization", return_value=mock_summary):
        response = client.post("/analyze", json={"text": "This is a great product that I love very much!"})

    assert response.status_code == 200
    data = response.json()
    assert data["sentiment"] == "Positive"
    assert data["confidence"] == 0.94
    assert data["summary"] == mock_summary
    assert "processing_time_ms" in data
    assert isinstance(data["processing_time_ms"], int)


def test_analyze_text_too_short(client):
    response = client.post("/analyze", json={"text": "Hi"})
    assert response.status_code == 422


def test_analyze_text_too_long(client):
    response = client.post("/analyze", json={"text": "x" * 5001})
    assert response.status_code == 422


def test_analyze_empty_text(client):
    response = client.post("/analyze", json={"text": ""})
    assert response.status_code == 422


def test_analyze_missing_text(client):
    response = client.post("/analyze", json={})
    assert response.status_code == 422


def test_history_empty(client):
    response = client.get("/history")
    assert response.status_code == 200
    data = response.json()
    assert data["items"] == []
    assert data["total"] == 0


def test_history_after_analysis(client):
    mock_sentiment = ("Neutral", 0.75)
    mock_summary = "Neutral tone detected in the provided text."

    with patch("app.services.ml_service.run_sentiment", return_value=mock_sentiment), \
         patch("app.services.ml_service.run_summarization", return_value=mock_summary):
        client.post("/analyze", json={"text": "The weather today is neither good nor bad."})

    response = client.get("/history")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert len(data["items"]) == 1
    item = data["items"][0]
    assert item["sentiment"] == "Neutral"
    assert item["confidence"] == 0.75
    assert "created_at" in item
    assert "id" in item


def test_history_limit(client):
    mock_sentiment = ("Positive", 0.9)
    mock_summary = "Positive content."

    with patch("app.services.ml_service.run_sentiment", return_value=mock_sentiment), \
         patch("app.services.ml_service.run_summarization", return_value=mock_summary):
        for i in range(5):
            client.post("/analyze", json={"text": f"This is a positive test sentence number {i} that is long enough."})

    response = client.get("/history?limit=3")
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 3
    assert data["total"] == 5
