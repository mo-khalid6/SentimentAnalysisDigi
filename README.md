# 🧠 Sentiment AI

An AI-powered web application that performs real-time **sentiment analysis** and **text summarization** using state-of-the-art NLP models from Hugging Face.

Built with a **FastAPI** backend and a **React + TypeScript** frontend with a sleek dark-mode UI.

---

## ✨ Features

- **Sentiment Classification** — Detects Positive, Neutral, or Negative sentiment with confidence score
- **AI Summarization** — Generates abstractive summaries of long-form text
- **Analysis History** — Persists all past analyses in a local SQLite database
- **Download Report** — Export results as a `.txt` report
- **Dark / Light Mode** — Toggleable theme
- **Backend Health Status** — Live indicator showing if the ML engine is online

---

## 🏗️ Architecture

```
Sentiment AI
├── backend/          # FastAPI + HuggingFace Transformers
│   ├── app/
│   │   ├── core/     # Config, logging
│   │   ├── database/ # SQLAlchemy session & models
│   │   ├── routers/  # API endpoints (analyze, history, health)
│   │   ├── schemas/  # Pydantic request/response schemas
│   │   └── services/ # ML inference logic
│   ├── tests/
│   └── requirements.txt
└── frontend/         # React 19 + TypeScript + Tailwind CSS + Vite
    └── src/
        ├── api/      # HTTP client
        ├── components/
        ├── hooks/
        └── types/
```

---

## 🤖 Models Used

| Task | Model |
|---|---|
| Sentiment Analysis | `cardiffnlp/twitter-roberta-base-sentiment-latest` |
| Text Summarization | `sshleifer/distilbart-cnn-12-6` |

Models are downloaded automatically on first run and cached in `backend/model_cache/`.

---

## 🚀 Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- npm

---

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/sentiment-ai.git
cd sentiment-ai
```

---

### 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment config
cp .env.example .env

# Start the server
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

> ⚠️ **First run:** The app will automatically download the HuggingFace models (~1.5 GB). This may take a few minutes depending on your internet connection.

---

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The app will be available at `http://localhost:5173`

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Backend health check |
| `POST` | `/analyze` | Analyze text (sentiment + summary) |
| `GET` | `/history` | Retrieve analysis history |

### Example Request

```bash
curl -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{"text": "I absolutely love how this product works. It exceeded all my expectations!"}'
```

### Example Response

```json
{
  "sentiment": "Positive",
  "confidence": 0.9821,
  "summary": "The user expresses strong satisfaction with the product, noting it exceeded expectations.",
  "processing_time_ms": 342
}
```

---

## ⚙️ Environment Variables

Copy `backend/.env.example` to `backend/.env` and adjust as needed:

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `sqlite:///./sentiment_ai.db` | SQLite database path |
| `MODEL_CACHE_DIR` | `./model_cache` | HuggingFace model cache directory |
| `FRONTEND_URL` | `http://localhost:5173` | Allowed CORS origin |
| `LOG_LEVEL` | `INFO` | Logging level |

---

## 🧪 Running Tests

```bash
cd backend
pytest tests/
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Backend Framework | FastAPI |
| ML / NLP | HuggingFace Transformers, PyTorch |
| Database | SQLite + SQLAlchemy |
| Frontend | React 19, TypeScript |
| Styling | Tailwind CSS |
| Build Tool | Vite |
| Validation | Pydantic v2 |

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
