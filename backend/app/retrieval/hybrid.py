"""Hybrid retrieval: BM25 keywords + dense, fused with Reciprocal Rank Fusion.

Ported from Main.ipynb (cell 48).
"""

from __future__ import annotations

from typing import Any

import numpy as np

from .. import config, deps
from .common import build_result
from .dense import dense_ranked
from .tokenize import tokenize


def bm25_ranked(query: str, k: int = 50) -> list[tuple[int, float]]:
    bm25 = deps.get_bm25()
    scores = bm25.get_scores(tokenize(query))
    top = np.argsort(scores)[::-1][:k]
    return [(int(i), float(scores[i])) for i in top if scores[i] > 0]


def hybrid_ranked(
    query: str,
    k: int = 50,
    rrf_k: int = config.RRF_K,
    w_dense: float = 1.0,
    w_bm25: float = 1.0,
    pool: int = config.POOL,
) -> list[tuple[int, float]]:
    """Reciprocal Rank Fusion: score = sum_w / (rrf_k + rank). Uses ranks, so BM25's
    unbounded scores and cosine similarities never need to be put on the same scale."""
    fused: dict[int, float] = {}
    for w, ranked in (
        (w_dense, dense_ranked(query, pool)),
        (w_bm25, bm25_ranked(query, pool)),
    ):
        for r, (i, _) in enumerate(ranked):
            fused[i] = fused.get(i, 0.0) + w / (rrf_k + r + 1)
    return sorted(fused.items(), key=lambda x: -x[1])[:k]


def hybrid_search(query: str, k: int = 5, **kw: Any) -> list[dict[str, Any]]:
    return [
        build_result(i, s, r + 1, "hybrid")
        for r, (i, s) in enumerate(hybrid_ranked(query, k, **kw))
    ]
