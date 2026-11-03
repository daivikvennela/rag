"use client";

import { motion } from "framer-motion";
import { FormEvent, useRef } from "react";

export function SearchBar({
  value,
  onChange,
  onSubmit,
  compact = false,
  autoFocus = false,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  compact?: boolean;
  autoFocus?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (value.trim()) onSubmit();
  }

  return (
    <motion.form
      layout
      onSubmit={handleSubmit}
      transition={{ type: "spring", stiffness: 320, damping: 32 }}
      className={`group flex items-center gap-3 rounded-2xl border border-white/10 bg-ink-850/70 backdrop-blur-xl transition-shadow focus-within:border-rh-green/60 focus-within:shadow-glow ${
        compact ? "px-4 py-2.5" : "px-5 py-4 md:py-5"
      }`}
    >
      <SearchIcon
        className={`shrink-0 text-muted group-focus-within:text-rh-green transition-colors ${
          compact ? "h-4 w-4" : "h-5 w-5"
        }`}
      />
      <input
        ref={inputRef}
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Ask the tape… e.g. What news is there about Tesla?"
        className={`w-full bg-transparent font-display text-white placeholder:text-muted/70 outline-none ${
          compact ? "text-sm" : "text-base md:text-lg"
        }`}
      />
      <button
        type="submit"
        className={`shrink-0 rounded-xl bg-rh-green font-display font-semibold text-ink-950 transition-transform hover:scale-[1.03] active:scale-95 ${
          compact ? "px-3 py-1.5 text-xs" : "px-5 py-2.5 text-sm"
        }`}
      >
        Search
      </button>
    </motion.form>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
