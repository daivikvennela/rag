"""Shared result builder, ported from Main.ipynb (cell 46) and extended.

The notebook's `_result` returned rank/id/title/publisher/published_utc/score.
We additionally surface `article_url` (stored in the corpus + Chroma metadata)
and the `method` used so the frontend can label and link results.
"""

from __future__ import annotations

from typing import Any

from .. import deps


def _clean(value: Any) -> str | None:
    if value is None:
        return None
    # Guard against the notebook edge case where publisher was sometimes a dict
    if isinstance(value, dict):
        return value.get("name")
    # pandas may hand back NaN floats for missing optional fields
    try:
        import math

        if isinstance(value, float) and math.isnan(value):
            return None
    except Exception:
        pass
    return str(value)


def _snippet(row: Any, title: str) -> str | None:
    text = _clean(row.get("text")) or ""
    if title and text.startswith(title):
        text = text[len(title) :].strip()
    text = " ".join(text.split())
    if not text:
        return None
    return text if len(text) <= 220 else text[:217].rstrip() + "…"


def interpret_score(method: str, score: float) -> tuple[str, int]:
    """Map each method's raw score onto a shared Strong/Moderate/Weak + 0–100 bar.

    Scales (from the notebook):
      dense  — cosine similarity, typically 0.25–0.70
      hybrid — RRF sum, typically 0–0.033 (two #1 ranks = 2/61 ≈ 0.033)
      rerank — MiniLM logit, roughly -11 to +11 (negative = not relevant)
    """
    if method == "dense":
        pct = int(max(0, min(100, round((score - 0.25) / 0.45 * 100))))
        if score >= 0.55:
            return "strong", pct
        if score >= 0.40:
            return "moderate", pct
        return "weak", pct
    if method == "hybrid":
        pct = int(max(0, min(100, round(score / 0.033 * 100))))
        if score >= 0.025:
            return "strong", pct
        if score >= 0.015:
            return "moderate", pct
        return "weak", pct
    # rerank logits
    import math

    pct = int(max(0, min(100, round(1 / (1 + math.exp(-score)) * 100))))
    if score >= 2.0:
        return "strong", pct
    if score >= 0.0:
        return "moderate", pct
    return "weak", pct


def is_weak(method: str, score: float) -> bool:
    return interpret_score(method, score)[0] == "weak"


def build_result(i: int, score: float, rank: int, method: str) -> dict[str, Any]:
    row = deps.get_corpus().iloc[i]
    title = _clean(row.get("title")) or ""
    match, relevance = interpret_score(method, float(score))
    return {
        "rank": rank,
        "id": str(i),
        "title": title,
        "snippet": _snippet(row, title),
        "publisher": _clean(row.get("publisher")),
        "published_utc": _clean(row.get("published_utc")),
        "article_url": _clean(row.get("article_url")),
        "score": float(score),
        "match": match,
        "relevance": relevance,
        "method": method,
    }
