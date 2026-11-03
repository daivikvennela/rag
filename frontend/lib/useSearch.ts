import { useQuery } from "@tanstack/react-query";
import { Method, search, SearchResponse } from "./api";

export interface SearchParams {
  query: string;
  method: Method;
  k: number;
}

export function useSearch(params: SearchParams | null) {
  return useQuery<SearchResponse, Error>({
    queryKey: ["search", params?.query, params?.method, params?.k],
    queryFn: ({ signal }) =>
      search(params!.query, params!.method, params!.k, signal),
    enabled: !!params && params.query.trim().length > 0,
  });
}
