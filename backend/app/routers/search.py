"""Search + health endpoints."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from .. import config, deps
from ..retrieval.dense import dense_search
from ..retrieval.hybrid import hybrid_search
from ..retrieval.rerank import rerank_search
from ..schemas import (
    HealthResponse,
    MatchQuality,
    Method,
    SearchRequest,
    SearchResponse,
)

router = APIRouter()

_SEARCH_FNS = {
    Method.dense: dense_search,
    Method.hybrid: hybrid_search,
    Method.rerank: rerank_search,
}


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        collection_count=deps.collection_count(),
        models_loaded=deps.models_loaded(),
        embed_model=config.EMBED_MODEL,
        reranker_model=config.RERANKER_MODEL,
    )


@router.post("/search", response_model=SearchResponse)
def search(req: SearchRequest) -> SearchResponse:
    if deps.collection_count() == 0:
        raise HTTPException(
            status_code=503,
            detail="Vector store is empty. Run `python ingest.py` before searching.",
        )

    fn = _SEARCH_FNS[req.method]
    try:
        # Fetch a slightly larger pool so we can drop clearly-irrelevant hits
        # (e.g. negative rerank logits) without coming back empty-handed.
        results = fn(req.query, k=min(req.k * 3, config.MAX_K))
    except FileNotFoundError as exc:
        # hybrid/rerank need the local corpus for BM25 + document text
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:  # pragma: no cover - surface a clean 500
        raise HTTPException(status_code=500, detail=f"Search failed: {exc}") from exc

    kept = [r for r in results if r.get("match") != "weak"]
    results = (kept or results)[: req.k]
    for i, r in enumerate(results, start=1):
        r["rank"] = i

    top_match = results[0]["match"] if results else "weak"
    corpus_from, corpus_to = deps.get_corpus_span()

    return SearchResponse(
        query=req.query,
        method=req.method,
        k=req.k,
        count=len(results),
        confidence=MatchQuality(top_match),
        corpus_from=corpus_from,
        corpus_to=corpus_to,
        collection_count=deps.collection_count(),
        results=results,
    )
