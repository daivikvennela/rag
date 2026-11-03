"""Central configuration for the FinNews retrieval backend.

Values mirror the constants used in Main.ipynb so the service behaves
identically to the notebook prototype. Override any value via environment
variables (e.g. EMBED_MODEL, CHROMA_PATH).
"""

from __future__ import annotations

import os
from pathlib import Path

# Repo-relative paths -------------------------------------------------------
# config.py lives at backend/app/config.py -> parents[1] == backend/
BACKEND_DIR = Path(__file__).resolve().parents[1]


def _env_path(name: str, default: Path) -> Path:
    raw = os.getenv(name)
    return Path(raw).expanduser().resolve() if raw else default


# Vector store --------------------------------------------------------------
CHROMA_PATH: Path = _env_path("CHROMA_PATH", BACKEND_DIR / "chroma_db")
COLLECTION_NAME: str = os.getenv("COLLECTION_NAME", "financial_news")
HNSW_SPACE: dict[str, str] = {"hnsw:space": "cosine"}

# Row-aligned corpus written by ingest.py (id/text/metadata) ----------------
CORPUS_PATH: Path = _env_path("CORPUS_PATH", BACKEND_DIR / "data" / "corpus.parquet")

# Models --------------------------------------------------------------------
EMBED_MODEL: str = os.getenv("EMBED_MODEL", "all-distilroberta-v1")
RERANKER_MODEL: str = os.getenv("RERANKER_MODEL", "cross-encoder/ms-marco-MiniLM-L-6-v2")

# Retrieval defaults (from notebook) ---------------------------------------
ENCODE_BATCH: int = int(os.getenv("ENCODE_BATCH", "64"))
UPSERT_BATCH: int = int(os.getenv("UPSERT_BATCH", "1000"))
RRF_K: int = int(os.getenv("RRF_K", "60"))
POOL: int = int(os.getenv("POOL", "100"))
N_CANDIDATES: int = int(os.getenv("N_CANDIDATES", "50"))
RERANK_BATCH: int = int(os.getenv("RERANK_BATCH", "32"))

DEFAULT_METHOD: str = os.getenv("DEFAULT_METHOD", "rerank")
DEFAULT_K: int = int(os.getenv("DEFAULT_K", "5"))
MAX_K: int = int(os.getenv("MAX_K", "20"))

# Dataset (for ingest.py) ---------------------------------------------------
KAGGLE_DATASET: str = os.getenv(
    "KAGGLE_DATASET", "rdolphin/financial-news-with-ticker-level-sentiment"
)
KAGGLE_FILE: str = os.getenv("KAGGLE_FILE", "polygon_news_sample.json")

# CORS ----------------------------------------------------------------------
_default_origins = "http://localhost:3000,http://127.0.0.1:3000"
CORS_ORIGINS: list[str] = [
    o.strip() for o in os.getenv("CORS_ORIGINS", _default_origins).split(",") if o.strip()
]
