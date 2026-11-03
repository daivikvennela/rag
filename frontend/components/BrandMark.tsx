"use client";

import { motion } from "framer-motion";

export function BrandMark({
  compact = false,
  onClick,
}: {
  compact?: boolean;
  onClick?: () => void;
}) {
  const content = (
    <div className="flex items-center gap-2 select-none">
      <motion.span
        aria-hidden
        className="inline-block rounded-full bg-rh-green animate-pulse-dot"
        style={{
          width: compact ? 8 : 11,
          height: compact ? 8 : 11,
          boxShadow: "0 0 16px 2px rgba(0,200,5,0.8)",
        }}
      />
      <span
        className={`font-display font-bold tracking-tight ${
          compact ? "text-lg" : "text-xl"
        }`}
      >
        Pulse
      </span>
    </div>
  );

  if (!onClick) return content;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Go to home"
      className="rounded-lg transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-1 focus-visible:ring-rh-green/60"
    >
      {content}
    </button>
  );
}
