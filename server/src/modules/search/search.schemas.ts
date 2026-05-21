import { z } from "zod";

export const searchQuerySchema = z.object({
  q: z.string().trim().max(120).optional().default(""),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;
