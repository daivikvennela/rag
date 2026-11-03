"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BrandMark } from "@/components/BrandMark";
import { AppTabs } from "@/components/AppTabs";
import { Method } from "@/lib/api";

type Endpoint = "root" | "health" | "search";
type Panel = "playground" | "swagger";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "/api/backend";
const SWAGGER_SRC = "/docs";

export default function BackendPage() {
  const router = useRouter();
  const [panel, setPanel] = useState<Panel>("playground");
  const [endpoint, setEndpoint] = useState<Endpoint>("search");
  const [query, setQuery] = useState("What news is there about Tesla?");
  const [method, setMethod] = useState<Method>("rerank");
  const [k, setK] = useState(5);
  const [status, setStatus] = useState<number | null>(null);
  const [ms, setMs] = useState<number | null>(null);
  const [body, setBody] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setErr(null);
    setStatus(null);
    setMs(null);
    const started = performance.now();
    try {
      let res: Response;
      if (endpoint === "root") {
        res = await fetch(`${API_BASE}/`);
      } else if (endpoint === "health") {
        res = await fetch(`${API_BASE}/health`);
      } else {
        res = await fetch(`${API_BASE}/search`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, method, k }),
        });
      }
      const text = await res.text();
      setStatus(res.status);
      setMs(Math.round(performance.now() - started));
      try {
        setBody(JSON.stringify(JSON.parse(text), null, 2));
      } catch {
        setBody(text);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Request failed");
      setBody("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-ink-900/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
          <BrandMark compact onClick={() => router.push("/")} />
          <div className="flex items-center gap-3">
            <div className="hidden sm:inline-flex items-center gap-1 rounded-full border border-white/10 bg-ink-850/80 p-1">
              <button
                onClick={() => setPanel("playground")}
                className={`rounded-full px-3 py-1 text-xs font-display font-medium ${
                  panel === "playground"
                    ? "bg-white/10 text-white"
                    : "text-muted hover:text-white"
                }`}
              >
                Playground
              </button>
              <button
                onClick={() => setPanel("swagger")}
                className={`rounded-full px-3 py-1 text-xs font-display font-medium ${
                  panel === "swagger"
                    ? "bg-white/10 text-white"
                    : "text-muted hover:text-white"
                }`}
              >
                Swagger
              </button>
            </div>
            <AppTabs />
          </div>
        </div>
      </header>

      {panel === "swagger" ? (
        <div className="flex-1 bg-white">
          <iframe
            title="FastAPI Swagger UI"
            src={SWAGGER_SRC}
            className="h-[calc(100vh-57px)] w-full border-0"
          />
        </div>
      ) : (
        <div className="mx-auto grid w-full max-w-5xl flex-1 gap-6 px-5 py-8 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-2">
            <p className="px-1 text-xs uppercase tracking-wider text-muted">
              Endpoints
            </p>
            <EndpointBtn
              active={endpoint === "root"}
              method="GET"
              path="/"
              onClick={() => setEndpoint("root")}
            />
            <EndpointBtn
              active={endpoint === "health"}
              method="GET"
              path="/health"
              onClick={() => setEndpoint("health")}
            />
            <EndpointBtn
              active={endpoint === "search"}
              method="POST"
              path="/search"
              onClick={() => setEndpoint("search")}
            />
          </aside>

          <section className="min-w-0 space-y-4">
            {endpoint === "search" && (
              <div className="rounded-xl border border-white/10 bg-ink-850/40 p-4 space-y-3">
                <label className="block text-xs text-muted">
                  query
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-ink-900 px-3 py-2 font-display text-sm text-white outline-none focus:border-rh-green/60"
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-xs text-muted">
                    method
                    <select
                      value={method}
                      onChange={(e) => setMethod(e.target.value as Method)}
                      className="mt-1 w-full rounded-lg border border-white/10 bg-ink-900 px-3 py-2 font-display text-sm text-white outline-none focus:border-rh-green/60"
                    >
                      <option value="dense">dense</option>
                      <option value="hybrid">hybrid</option>
                      <option value="rerank">rerank</option>
                    </select>
                  </label>
                  <label className="block text-xs text-muted">
                    k
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={k}
                      onChange={(e) => setK(Number(e.target.value))}
                      className="mt-1 w-full rounded-lg border border-white/10 bg-ink-900 px-3 py-2 font-display text-sm text-white outline-none focus:border-rh-green/60"
                    />
                  </label>
                </div>
              </div>
            )}

            <button
              onClick={run}
              disabled={busy}
              className="rounded-xl bg-rh-green px-5 py-2.5 font-display text-sm font-semibold text-ink-950 transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50"
            >
              {busy ? "Sending…" : "Send request"}
            </button>

            {(status !== null || err) && (
              <div className="flex items-center gap-3 text-xs text-muted">
                {status !== null && (
                  <span
                    className={
                      status >= 200 && status < 300
                        ? "text-rh-green"
                        : "text-rh-red"
                    }
                  >
                    {status}
                  </span>
                )}
                {ms !== null && <span>{ms} ms</span>}
                {err && <span className="text-rh-red">{err}</span>}
              </div>
            )}

            {body && (
              <pre className="max-h-[60vh] overflow-auto rounded-xl border border-white/10 bg-ink-950 p-4 font-mono text-xs leading-relaxed text-white/85">
                {body}
              </pre>
            )}
          </section>
        </div>
      )}
    </main>
  );
}

function EndpointBtn({
  active,
  method,
  path,
  onClick,
}: {
  active: boolean;
  method: string;
  path: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
        active
          ? "border-rh-green/40 bg-ink-800/80"
          : "border-white/10 bg-ink-850/30 hover:border-white/20"
      }`}
    >
      <span
        className={`font-mono text-[10px] font-bold ${
          method === "POST" ? "text-rh-green" : "text-white/70"
        }`}
      >
        {method}
      </span>
      <span className="font-mono text-sm text-white">{path}</span>
    </button>
  );
}
