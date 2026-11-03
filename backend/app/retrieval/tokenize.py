"""Tokenizer + stopwords for BM25, ported verbatim from Main.ipynb (cell 48)."""

from __future__ import annotations

import re

STOPWORDS: set[str] = {
    "the", "a", "an", "and", "or", "of", "to", "in", "on", "for", "is", "are", "was", "were",
    "what", "which", "who", "how", "about", "with", "by", "at", "from", "as", "that", "this",
    "there", "any", "news", "latest", "recent", "recently", "it", "its", "be", "has", "have",
}


def tokenize(text: str) -> list[str]:
    # keeps tickers / numbers like "tsla", "q3", "2024"
    return [t for t in re.findall(r"[a-z0-9]+", text.lower()) if t not in STOPWORDS]
