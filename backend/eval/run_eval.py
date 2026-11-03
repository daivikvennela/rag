"""Retrieval regression harness, ported from Main.ipynb (cells 42 + 51).

Runs Recall@k and MRR for dense / hybrid / rerank over the model_bench and
manual_bench question sets (stored in benches.json). Use this after refactoring
retrieval code or swapping models to confirm quality hasn't regressed.

Requires an ingested corpus + Chroma collection:
    cd backend && python ingest.py && python -m eval.run_eval
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np

from app.retrieval.dense import dense_search
from app.retrieval.hybrid import hybrid_search
from app.retrieval.rerank import rerank_search

BENCHES_PATH = Path(__file__).resolve().parent / "benches.json"


def evaluate(search_fn, bench, k=5):
    """Recall@k: fraction of relevant titles found in the top k. MRR: 1 / rank
    of first relevant hit. Questions with no labels are skipped."""
    recalls, rrs = [], []
    for item in bench:
        relevant = set(
            item.get("relevant_titles")
            or ([item["expected_title"]] if item.get("expected_title") else [])
        )
        if not relevant:
            continue
        titles = [h["title"] for h in search_fn(item["question"], k=k)]
        recalls.append(len(relevant & set(titles)) / len(relevant))
        rrs.append(
            next((1 / (r + 1) for r, t in enumerate(titles) if t in relevant), 0.0)
        )
    return {
        "n": len(recalls),
        f"recall@{k}": float(np.mean(recalls)) if recalls else float("nan"),
        "MRR": float(np.mean(rrs)) if rrs else float("nan"),
    }


def main() -> None:
    with open(BENCHES_PATH) as f:
        benches = json.load(f)

    methods = [
        ("dense", dense_search),
        ("hybrid", hybrid_search),
        ("rerank", rerank_search),
    ]

    header = f"{'bench':<13}{'k':<4}{'method':<9}{'n':<5}{'recall':<9}{'MRR':<9}"
    print(header)
    print("-" * len(header))
    for bench_name in ("model_bench", "manual_bench"):
        bench = benches[bench_name]
        for name, fn in methods:
            for k in (5, 10):
                m = evaluate(fn, bench, k)
                print(
                    f"{bench_name:<13}{k:<4}{name:<9}{m['n']:<5}"
                    f"{m[f'recall@{k}']:<9.3f}{m['MRR']:<9.3f}"
                )


if __name__ == "__main__":
    main()
