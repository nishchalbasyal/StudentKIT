import { z } from "zod";

export const syncQueueItemSchema = z.object({
  entityType: z.string().trim().min(1).max(80),
  entityId: z.string().trim().min(1).max(160),
  operation: z.enum(["CREATE", "UPDATE", "DELETE"]),
  payload: z.unknown(),
  updatedAt: z.string().datetime().optional(),
});

export const syncPullQuerySchema = z.object({
  since: z.string().datetime().optional(),
});

export type SyncQueueItemInput = z.infer<typeof syncQueueItemSchema>;
export type SyncPullQuery = z.infer<typeof syncPullQuerySchema>;
