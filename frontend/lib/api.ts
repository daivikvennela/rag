export type Method = "dense" | "hybrid" | "rerank";
export type MatchQuality = "strong" | "moderate" | "weak";

export interface SearchResult {
  rank: number;
  id: string;
  title: string;
  snippet: string | null;
  publisher: string | null;
  published_utc: string | null;
  article_url: string | null;
  score: number;
  match: MatchQuality;
  relevance: number;
  method: Method;
}

export interface SearchResponse {
  query: string;
  method: Method;
  k: number;
  count: number;
  confidence: MatchQuality;
  corpus_from: string | null;
  corpus_to: string | null;
  collection_count: number;
  results: SearchResult[];
}

export interface HealthResponse {
  status: string;
  collection_count: number;
  models_loaded: boolean;
  embed_model: string;
  reranker_model: string;
}

// Default to the same-origin rewrite (/api/backend -> FastAPI). Override with
// NEXT_PUBLIC_API_URL to call the backend directly (CORS is enabled server-side).
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "/api/backend";

export async function search(
  query: string,
  method: Method,
  k: number,
  signal?: AbortSignal
): Promise<SearchResponse> {
  const res = await fetch(`${API_BASE}/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, method, k }),
    signal,
  });

  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.detail) detail = body.detail;
    } catch {
      /* ignore parse errors */
    }
    throw new Error(detail);
  }

  return res.json();
}

export async function getHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error(`Health check failed (${res.status})`);
  return res.json();
}
