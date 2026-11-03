"use client";

import { motion } from "framer-motion";
import { MatchQuality, SearchResult } from "@/lib/api";

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const MATCH_LABEL: Record<MatchQuality, string> = {
  strong: "Strong",
  moderate: "Moderate",
  weak: "Weak",
};

const SCORE_HINT: Record<SearchResult["method"], string> = {
  dense: "cosine similarity (0–1)",
  hybrid: "RRF rank fusion (~0–0.03)",
  rerank: "cross-encoder logit",
};

export function ResultRow({
  result,
  index,
}: {
  result: SearchResult;
  index: number;
}) {
  const Wrapper = result.article_url ? motion.a : motion.div;
  const weak = result.match === "weak";

  return (
    <Wrapper
      {...(result.article_url
        ? { href: result.article_url, target: "_blank", rel: "noopener noreferrer" }
        : {})}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.4) }}
      whileHover={{ scale: 1.012 }}
      className={`group block rounded-xl border px-5 py-4 transition-colors ${
        weak
          ? "border-white/[0.04] bg-ink-850/20 opacity-70"
          : "border-white/[0.06] bg-ink-850/40 hover:border-rh-green/40 hover:bg-ink-800/60 hover:ring-1 hover:ring-rh-green/30"
      }`}
    >
      <div className="flex items-start gap-4">
        <span className="mt-0.5 font-mono text-xs text-muted/70 tabular-nums">
          {String(result.rank).padStart(2, "0")}
        </span>

        <div className="min-w-0 flex-1">
          <h3 className="font-display text-[15px] font-medium leading-snug text-white">
            {result.title}
          </h3>
          {result.snippet && (
            <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted">
              {result.snippet}
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            {result.publisher && (
              <span className="text-white/70">{result.publisher}</span>
            )}
            {result.published_utc && <span>{formatDate(result.published_utc)}</span>}
            {result.article_url && (
              <span className="inline-flex items-center gap-1 text-rh-green/80 opacity-0 transition-opacity group-hover:opacity-100">
                Read
                <svg
                  className="h-3 w-3"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden
                >
                  <path d="M7 17 17 7M9 7h8v8" />
                </svg>
              </span>
            )}
          </div>
        </div>

        <div className="hidden w-28 shrink-0 flex-col items-end gap-1.5 sm:flex">
          <span
            className={`font-display text-xs font-medium ${
              result.match === "strong"
                ? "text-rh-green"
                : result.match === "moderate"
                  ? "text-white/80"
                  : "text-muted"
            }`}
            title={`Raw ${result.score.toFixed(3)} · ${SCORE_HINT[result.method]}`}
          >
            {MATCH_LABEL[result.match]}
          </span>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <motion.div
              className={`h-full rounded-full ${
                weak ? "bg-muted" : "bg-rh-green"
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(6, result.relevance)}%` }}
              transition={{ duration: 0.5, delay: 0.1 }}
            />
          </div>
          <span className="font-mono text-[10px] text-muted/70 tabular-nums">
            {result.relevance}%
          </span>
        </div>
      </div>
    </Wrapper>
  );
}
