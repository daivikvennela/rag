"""Pydantic request/response models for the search API."""

from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, Field

from . import config


class Method(str, Enum):
    dense = "dense"
    hybrid = "hybrid"
    rerank = "rerank"


class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1, description="Natural-language search query")
    method: Method = Field(
        default=Method(config.DEFAULT_METHOD),
        description="Retrieval strategy: dense, hybrid (BM25+RRF), or rerank (cross-encoder)",
    )
    k: int = Field(
        default=config.DEFAULT_K,
        ge=1,
        le=config.MAX_K,
        description="Number of results to return",
    )


class MatchQuality(str, Enum):
    strong = "strong"
    moderate = "moderate"
    weak = "weak"


class SearchResult(BaseModel):
    rank: int
    id: str
    title: str
    snippet: str | None = None
    publisher: str | None = None
    published_utc: str | None = None
    article_url: str | None = None
    score: float
    match: MatchQuality
    relevance: int = Field(..., ge=0, le=100, description="0–100 bar, method-normalized")
    method: Method


class SearchResponse(BaseModel):
    query: str
    method: Method
    k: int
    count: int
    confidence: MatchQuality
    corpus_from: str | None = None
    corpus_to: str | None = None
    collection_count: int = 0
    results: list[SearchResult]


class HealthResponse(BaseModel):
    status: str
    collection_count: int
    models_loaded: bool
    embed_model: str
    reranker_model: str
