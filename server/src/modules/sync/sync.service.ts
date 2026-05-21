import { prisma } from "../../database/prisma.js";
import type { SyncQueueItemInput } from "./sync.schemas.js";

export async function processSyncQueueItem(userId: string, input: SyncQueueItemInput) {
  const timestamp = input.updatedAt ? new Date(input.updatedAt) : new Date();

  if (input.entityType === "settings") {
    return { status: "accepted", entityType: input.entityType, entityId: input.entityId, syncedAt: timestamp };
  }

  if (input.entityType === "reminder") {
    const payload = input.payload as {
      id?: string;
      title?: string;
      message?: string | null;
      type?: "CLASS" | "TASK" | "GROCERY" | "CLEANING" | "WORK" | "EXPENSE" | "AI" | "CUSTOM";
      sourceType?: "CLASS" | "TASK" | "GROCERY" | "CLEANING" | "WORK" | "SPLIT" | "CUSTOM";
      sourceId?: string;
      scheduledAt?: string;
      remindAt?: string;
      isCompleted?: boolean;
      linkedEntityId?: string | null;
    };

    if (input.operation === "DELETE") {
      await prisma.reminder.deleteMany({ where: { userId, OR: [{ id: input.entityId }, { linkedEntityId: input.entityId }] } });
      return { status: "deleted", entityType: input.entityType, entityId: input.entityId, syncedAt: timestamp };
    }

    const type = payload.type ?? (payload.sourceType === "SPLIT" ? "CUSTOM" : payload.sourceType) ?? "CUSTOM";
    const linkedEntityId = payload.linkedEntityId ?? payload.sourceId ?? input.entityId;
    const existing = await prisma.reminder.findFirst({ where: { userId, linkedEntityId, type } });

    const data = {
      userId,
      title: payload.title ?? "Reminder",
      message: payload.message ?? null,
      type,
      scheduledAt: new Date(payload.scheduledAt ?? payload.remindAt ?? timestamp),
      isCompleted: payload.isCompleted ?? false,
      linkedEntityId,
    };

    const saved = existing
      ? await prisma.reminder.update({ where: { id: existing.id }, data })
      : await prisma.reminder.create({ data });

    return { status: existing ? "updated" : "created", entityType: input.entityType, entityId: saved.id, syncedAt: timestamp };
  }

  return {
    status: "accepted",
    entityType: input.entityType,
    entityId: input.entityId,
    operation: input.operation,
    syncedAt: timestamp,
    note: "MVP sync accepted. Entity-specific merge uses local latest updatedAt on the client.",
  };
}
