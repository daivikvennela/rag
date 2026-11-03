"""Lazily-loaded, process-wide singletons for retrieval.

The heavy objects (embedding model, cross-encoder, Chroma collection, BM25
index) are loaded once on first access and reused across requests. This mirrors
the global objects used in Main.ipynb while keeping import side effects out of
module load so the app can start even before the models are warmed.
"""

from __future__ import annotations

import threading
from functools import lru_cache
from typing import TYPE_CHECKING

import pandas as pd

from . import config

if TYPE_CHECKING:  # pragma: no cover - typing only
    from chromadb.api.models.Collection import Collection
    from rank_bm25 import BM25Okapi
    from sentence_transformers import CrossEncoder, SentenceTransformer

_lock = threading.Lock()


@lru_cache(maxsize=1)
def get_embedder() -> "SentenceTransformer":
    from sentence_transformers import SentenceTransformer

    return SentenceTransformer(config.EMBED_MODEL)


@lru_cache(maxsize=1)
def get_reranker() -> "CrossEncoder":
    from sentence_transformers import CrossEncoder

    return CrossEncoder(config.RERANKER_MODEL)


@lru_cache(maxsize=1)
def get_collection() -> "Collection":
    import chromadb

    client = chromadb.PersistentClient(path=str(config.CHROMA_PATH))
    return client.get_or_create_collection(
        name=config.COLLECTION_NAME,
        metadata=config.HNSW_SPACE,
    )


@lru_cache(maxsize=1)
def get_corpus() -> pd.DataFrame:
    """Row-aligned corpus written by ingest.py.

    Index position i corresponds to Chroma id str(i), matching the notebook's
    `docs_df = df_clean.reset_index(drop=True)` contract.
    """
    if not config.CORPUS_PATH.exists():
        raise FileNotFoundError(
            f"Corpus not found at {config.CORPUS_PATH}. Run `python ingest.py` first."
        )
    return pd.read_parquet(config.CORPUS_PATH).reset_index(drop=True)


@lru_cache(maxsize=1)
def get_texts() -> list[str]:
    return get_corpus()["text"].tolist()


@lru_cache(maxsize=1)
def get_bm25() -> "BM25Okapi":
    from rank_bm25 import BM25Okapi

    from .retrieval.tokenize import tokenize

    return BM25Okapi([tokenize(t) for t in get_texts()])


def warm_up() -> None:
    """Eagerly load everything so the first request isn't slow.

    Safe to call multiple times; the lru_caches dedupe. Guarded so concurrent
    startup paths don't double-load. Silently tolerates a missing corpus so the
    /health endpoint can still report status before ingestion.
    """
    with _lock:
        get_embedder()
        get_reranker()
        get_collection()
        try:
            get_corpus()
            get_texts()
            get_bm25()
        except FileNotFoundError:
            # Corpus not ingested yet; dense search over Chroma may still work,
            # hybrid/rerank will raise a clear error when invoked.
            pass


def models_loaded() -> bool:
    return get_embedder.cache_info().currsize > 0


def collection_count() -> int:
    try:
        return get_collection().count()
    except Exception:
        return 0


@lru_cache(maxsize=1)
def get_corpus_span() -> tuple[str | None, str | None]:
    """Earliest / latest published_utc dates in the ingested corpus."""
    try:
        dates = pd.to_datetime(get_corpus()["published_utc"], utc=True, errors="coerce")
        if dates.isna().all():
            return None, None
        return str(dates.min().date()), str(dates.max().date())
    except Exception:
        return None, None
