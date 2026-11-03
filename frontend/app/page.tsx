"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Method } from "@/lib/api";
import { useSearch } from "@/lib/useSearch";
import { BrandMark } from "@/components/BrandMark";
import { AppTabs } from "@/components/AppTabs";
import { MethodToggle } from "@/components/MethodToggle";
import { SearchBar } from "@/components/SearchBar";
import { ResultsFeed } from "@/components/ResultsFeed";

const SUGGESTIONS = [
  "What news is there about Tesla?",
  "Which companies beat earnings estimates?",
  "The Fed and interest rates",
  "AI chip stocks",
];

export default function Home() {
  const [query, setQuery] = useState("");
  const [method, setMethod] = useState<Method>("rerank");
  const [k] = useState(5);
  const [submitted, setSubmitted] = useState<string | null>(null);

  const params = submitted ? { query: submitted, method, k } : null;
  const { data, isLoading, isError, error, isFetching } = useSearch(params);

  const hasSearched = submitted !== null;

  function runSearch(q?: string) {
    const next = (q ?? query).trim();
    if (!next) return;
    if (q) setQuery(q);
    setSubmitted(next);
  }

  function goHome() {
    setSubmitted(null);
    setQuery("");
  }

  return (
    <main className="relative min-h-screen">
      <AnimatePresence mode="wait">
        {!hasSearched ? (
          <HeroView
            key="hero"
            query={query}
            setQuery={setQuery}
            method={method}
            setMethod={setMethod}
            onSubmit={() => runSearch()}
            onSuggestion={(s) => runSearch(s)}
          />
        ) : (
          <ResultsView
            key="results"
            query={query}
            setQuery={setQuery}
            method={method}
            setMethod={(m) => {
              setMethod(m);
            }}
            onSubmit={() => runSearch()}
            onHome={goHome}
            data={data}
            isLoading={isLoading || isFetching}
            isError={isError}
            error={error}
            k={k}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

function HeroView({
  query,
  setQuery,
  method,
  setMethod,
  onSubmit,
  onSuggestion,
}: {
  query: string;
  setQuery: (v: string) => void;
  method: Method;
  setMethod: (m: Method) => void;
  onSubmit: () => void;
  onSuggestion: (s: string) => void;
}) {
  return (
    <motion.section
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.35 }}
      className="relative mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-5 text-center"
    >
      <div className="absolute right-5 top-4 sm:right-0">
        <AppTabs />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8 flex justify-center">
          <div className="scale-125">
            <BrandMark />
          </div>
        </div>
      </motion.div>

      <motion.div
        layout
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mt-10 w-full"
      >
        <SearchBar
          value={query}
          onChange={setQuery}
          onSubmit={onSubmit}
          autoFocus
        />
        <div className="mt-5 flex flex-col items-center gap-4">
          <MethodToggle value={method} onChange={setMethod} />
          <div className="flex flex-wrap justify-center gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => onSuggestion(s)}
                className="rounded-full border border-white/10 bg-ink-850/50 px-3 py-1.5 text-xs text-muted transition-colors hover:border-rh-green/40 hover:text-white"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.section>
  );
}

function ResultsView({
  query,
  setQuery,
  method,
  setMethod,
  onSubmit,
  onHome,
  data,
  isLoading,
  isError,
  error,
  k,
}: {
  query: string;
  setQuery: (v: string) => void;
  method: Method;
  setMethod: (m: Method) => void;
  onSubmit: () => void;
  onHome: () => void;
  data: ReturnType<typeof useSearch>["data"];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  k: number;
}) {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-ink-900/80 backdrop-blur-xl">
        <div className="mx-auto max-w-3xl px-5 py-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <BrandMark compact onClick={onHome} />
            <div className="flex items-center gap-2">
              <MethodToggle value={method} onChange={setMethod} size="sm" />
              <AppTabs />
            </div>
          </div>
          <SearchBar
            value={query}
            onChange={setQuery}
            onSubmit={onSubmit}
            compact
          />
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-5 py-8">
        <ResultsFeed
          data={data}
          isLoading={isLoading}
          isError={isError}
          error={error}
          k={k}
        />
      </div>
    </motion.section>
  );
}
