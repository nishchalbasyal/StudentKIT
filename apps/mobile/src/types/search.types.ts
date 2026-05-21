export type SearchResultType = "work" | "company" | "expense" | "task" | "grocery" | "cleaning" | "split" | "coupon" | "event";

export type SearchResult = {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string | null;
  route: string;
  params?: Record<string, string>;
};
