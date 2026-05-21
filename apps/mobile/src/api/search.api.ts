import { apiClient, unwrap } from "./apiClient";
import type { SearchResult } from "../types/search.types";

export async function searchApi(q: string) {
  return unwrap<SearchResult[]>(await apiClient.get("/search", { params: { q } }));
}
