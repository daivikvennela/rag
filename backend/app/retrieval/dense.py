"""Dense retrieval: top-k cosine similarity from Chroma.

Ported from Main.ipynb (cell 47).
"""

from __future__ import annotations

from typing import Any

from .. import deps
from .common import build_result


def dense_ranked(query: str, k: int = 50) -> list[tuple[int, float]]:
    """Returns [(doc_index, similarity)] best-first."""
    model = deps.get_embedder()
    collection = deps.get_collection()
    q_emb = model.encode([query], convert_to_numpy=True).tolist()
    res = collection.query(query_embeddings=q_emb, n_results=k, include=["distances"])
    # Chroma cosine space returns distance = 1 - cosine similarity
    return [(int(i), 1 - d) for i, d in zip(res["ids"][0], res["distances"][0])]


def dense_search(query: str, k: int = 5) -> list[dict[str, Any]]:
    return [
        build_result(i, s, r + 1, "dense")
        for r, (i, s) in enumerate(dense_ranked(query, k))
    ]
