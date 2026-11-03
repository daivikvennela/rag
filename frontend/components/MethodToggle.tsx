"use client";

import { motion } from "framer-motion";
import { Method } from "@/lib/api";

const OPTIONS: { value: Method; label: string; hint: string }[] = [
  { value: "dense", label: "Dense", hint: "Pure semantic similarity" },
  { value: "hybrid", label: "Hybrid", hint: "Keywords + semantic (RRF)" },
  { value: "rerank", label: "Rerank", hint: "Cross-encoder precision" },
];

export function MethodToggle({
  value,
  onChange,
  size = "md",
}: {
  value: Method;
  onChange: (m: Method) => void;
  size?: "sm" | "md";
}) {
  return (
    <div
      role="tablist"
      aria-label="Retrieval method"
      className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-ink-850/80 p-1 backdrop-blur"
    >
      {OPTIONS.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={active}
            title={opt.hint}
            onClick={() => onChange(opt.value)}
            className={`relative rounded-full font-display font-medium transition-colors ${
              size === "sm" ? "px-3 py-1 text-xs" : "px-4 py-1.5 text-sm"
            } ${active ? "text-ink-950" : "text-muted hover:text-white"}`}
          >
            {active && (
              <motion.span
                layoutId="method-pill"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
                className="absolute inset-0 rounded-full bg-rh-green shadow-glow-soft"
              />
            )}
            <span className="relative z-10">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
