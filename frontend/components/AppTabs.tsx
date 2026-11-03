"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Search", match: (p: string) => p === "/" },
  { href: "/backend", label: "API", match: (p: string) => p.startsWith("/backend") },
];

export function AppTabs() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="App sections"
      className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-ink-850/80 p-1 backdrop-blur"
    >
      {TABS.map((tab) => {
        const active = tab.match(pathname);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-full px-3 py-1 text-xs font-display font-medium transition-colors ${
              active
                ? "bg-rh-green text-ink-950"
                : "text-muted hover:text-white"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
