"""Rerank retrieval: first-stage retrieve, then cross-encoder rerank.

Ported from Main.ipynb (cell 49).
"""

from __future__ import annotations

from typing import Any

import numpy as np

from .. import config, deps
from .common import build_result
from .dense import dense_ranked
from .hybrid import hybrid_ranked


def rerank_search(
    query: str,
    k: int = 5,
    n_candidates: int = config.N_CANDIDATES,
    first_stage: str = "hybrid",
) -> list[dict[str, Any]]:
    # Cross-encoders read (query, document) together, so they're much more precise
    # than bi-encoder similarity but too slow to run over the whole corpus - hence
    # retrieve-then-rerank. Swap RERANKER_MODEL for "BAAI/bge-reranker-base" for a
    # stronger (slower) reranker.
    texts = deps.get_texts()
    reranker = deps.get_reranker()
    ranked = (
        hybrid_ranked(query, n_candidates)
        if first_stage == "hybrid"
        else dense_ranked(query, n_candidates)
    )
    cand = [i for i, _ in ranked]
    if not cand:
        return []
    scores = reranker.predict(
        [(query, texts[i]) for i in cand], batch_size=config.RERANK_BATCH
    )
    order = np.argsort(scores)[::-1][:k]
    return [
        build_result(cand[j], scores[j], r + 1, "rerank")
        for r, j in enumerate(order)
    ]
