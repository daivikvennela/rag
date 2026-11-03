# Pulse — Financial News Search

Full-stack semantic search over financial news. Built from the retrieval stack in [`Main.ipynb`](Main.ipynb).

- **Backend:** FastAPI + ChromaDB + Hugging Face embeddings
- **Frontend:** Next.js (App Router) with a dark Robinhood-style UI
- **Retrieval modes:** dense (cosine), hybrid (BM25 + RRF), rerank (cross-encoder)

The indexed corpus is a **2023-only** sample (~5,472 articles from [Kaggle](https://www.kaggle.com/datasets/rdolphin/financial-news-with-ticker-level-sentiment)). It is not a live news feed.

---

## What you need

| Tool | Version |
|------|---------|
| Python | 3.11+ (3.13 works) |
| Node.js | 18+ (20+ recommended) |
| npm | comes with Node |
| RAM / disk | ~4 GB free for model weights + vectors |

No Kaggle account is required. The first ingest downloads the dataset and two Hugging Face models (`all-distilroberta-v1` and `cross-encoder/ms-marco-MiniLM-L-6-v2`). That can take a few minutes.

---

## Setup (local, two terminals)

### 1. Clone

```bash
git clone https://github.com/daivikvennela/rag.git
cd rag
```

### 2. Backend — ingest once, then serve

```bash
cd backend
python3 -m venv .venv

# macOS / Linux
source .venv/bin/activate

# Windows
# .venv\Scripts\activate

pip install -r requirements.txt
python ingest.py
uvicorn app.main:app --reload --port 8000
```

`ingest.py` should finish with `Docs in collection: 5472`. Leave this terminal running.

Check:

- Health: [http://localhost:8000/health](http://localhost:8000/health)
- Swagger: [http://localhost:8000/docs](http://localhost:8000/docs)

### 3. Frontend

In a **second** terminal:

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

- **Search** tab — type a query or click a suggestion (try “What news is there about Tesla?”)
- **API** tab — playground for `GET /`, `GET /health`, `POST /search`, plus embedded Swagger
- Pulse logo — back to the home search screen

The UI proxies API calls through `/api/backend/*` so you do not need extra CORS setup in local dev.

---

## Retrieval modes

| Mode | What it does | Score you see in the UI |
|------|----------------|-------------------------|
| **Dense** | Embed the query, nearest neighbors in Chroma (cosine) | Strong / Moderate / Weak (normalized from cosine) |
| **Hybrid** | Dense + BM25 keyword search, fused with Reciprocal Rank Fusion | Same labels (raw RRF is ~0–0.03) |
| **Rerank** | Hybrid top-50, then `ms-marco-MiniLM-L-6-v2` re-scores | Same labels (raw value is a logit) |

Default method is **rerank**. Weak matches (for example a question the 2023 corpus cannot answer) show a low-confidence banner.

---

## API

`POST /search`

```json
{
  "query": "What news is there about Tesla?",
  "method": "rerank",
  "k": 5
}
```

`method` is `dense` | `hybrid` | `rerank`. `k` is 1–20.

`GET /health` reports collection size and whether models are loaded.

---

## Optional: Docker

After a local ingest (or run ingest inside the container):

```bash
docker compose up --build
```

```bash
docker compose run --rm api python ingest.py
```

API is on port 8000, UI on port 3000. Vectors persist in the `chroma_data` volume.

---

## Optional: eval harness

```bash
cd backend
source .venv/bin/activate
python -m eval.run_eval
```

Runs Recall@k and MRR on the notebook’s 40+40 question benches.

---

## Project layout

```
rag/
  Main.ipynb            # original notebook
  backend/              # FastAPI + ingest.py + retrieval
  frontend/             # Next.js UI
  docker-compose.yml
```

Copy `backend/.env.example` / `frontend/.env.example` to change model names, paths, or CORS. Swap `EMBED_MODEL` and re-run `ingest.py` if you want a different embedder (for example `BAAI/bge-small-en-v1.5`).
