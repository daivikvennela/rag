"use client";

import { motion } from "framer-motion";
import { SearchResponse } from "@/lib/api";
import { ResultRow } from "./ResultRow";
import { ResultsSkeleton } from "./Skeletons";

function formatSpan(from: string | null, to: string | null): string | null {
  if (!from || !to) return null;
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const fmt = (iso: string) => {
    const [y, m] = iso.split("-").map(Number);
    if (!y || !m) return iso;
    return `${months[m - 1]} ${y}`;
  };
  return `${fmt(from)} – ${fmt(to)}`;
}

export function ResultsFeed({
  data,
  isLoading,
  isError,
  error,
  k,
}: {
  data?: SearchResponse;
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  k: number;
}) {
  if (isLoading) return <ResultsSkeleton count={k} />;

  if (isError) {
    const msg = error?.message ?? "";
    const offline =
      /failed to fetch|network|econnrefused|500|502|503|504/i.test(msg);
    return (
      <div className="rounded-xl border border-rh-red/30 bg-rh-red/5 px-5 py-8 text-center">
        <p className="font-display font-medium text-rh-red">Search failed</p>
        <p className="mt-1 text-sm text-muted">
          {offline
            ? "Backend unreachable. Is FastAPI running on port 8000?"
            : msg || "Something went wrong."}
        </p>
      </div>
    );
  }

  if (!data) return null;

  if (data.results.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-ink-850/40 px-5 py-10 text-center">
        <p className="font-display font-medium text-white">No matches found</p>
        <p className="mt-1 text-sm text-muted">
          Try a broader query or a different retrieval method.
        </p>
      </div>
    );
  }

  const span = formatSpan(data.corpus_from, data.corpus_to);
  const lowConfidence = data.confidence === "weak";

  return (
    <div>
      {span && (
        <p className="mb-3 px-1 text-xs text-muted">
          Searching {data.collection_count.toLocaleString()} articles from{" "}
          <span className="text-white/70">{span}</span>
          {" · "}
          {data.count} result{data.count === 1 ? "" : "s"} ·{" "}
          <span className="text-rh-green">{data.method}</span>
        </p>
      )}

      {lowConfidence && (
        <div className="mb-4 rounded-xl border border-white/10 bg-ink-850/50 px-4 py-3 text-sm text-muted">
          <span className="font-display font-medium text-white">
            Low confidence.{" "}
          </span>
          Nothing in this 2023 news corpus strongly matches that query. The
          articles below are the closest neighbors — not answers. Try a 2023
          market topic (Tesla, Fed, earnings).
        </div>
      )}

      <motion.div layout className="space-y-3">
        {data.results.map((r, i) => (
          <ResultRow key={r.id} result={r} index={i} />
        ))}
      </motion.div>
    </div>
  );
}
