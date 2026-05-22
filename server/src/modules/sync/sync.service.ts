import { prisma } from "../../database/prisma.js";
import { SettingsService } from "../settings/settings.service.js";
import { BudgetsService } from "../budgets/budgets.service.js";
import {
  deleteReminder,
  syncReminders,
} from "../reminders/reminders.service.js";
import type { SyncQueueItemInput } from "./sync.schemas.js";

function asDate(value?: string) {
  if (!value) return new Date(0);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date(0) : date;
}

function normalizeSettingsPayload(payload: unknown) {
  const value = (payload ?? {}) as Record<string, unknown>;
  const selectedModules = value.selectedModules ?? value.userEnabledModules;
  return {
    pushNotifications: value.notifications
      ? (value.notifications as { pushNotifications?: boolean })
          .pushNotifications
      : (value.pushNotifications as boolean | undefined),
    emailUpdates: value.notifications
      ? (value.notifications as { emailUpdates?: boolean }).emailUpdates
      : (value.emailUpdates as boolean | undefined),
    reminderCategories: value.notifications
      ? (
          value.notifications as {
            reminderCategories?: Record<string, boolean>;
          }
        ).reminderCategories
      : (value.reminderCategories as Record<string, boolean> | undefined),
    theme: value.preferences
      ? (value.preferences as { theme?: string }).theme
      : (value.theme as string | undefined),
    language: value.preferences
      ? (value.preferences as { language?: string }).language
      : (value.language as string | undefined),
    currency: value.preferences
      ? (value.preferences as { currency?: string }).currency
      : (value.currency as string | undefined),
    dateFormat: value.preferences
      ? (value.preferences as { dateFormat?: string }).dateFormat
      : (value.dateFormat as string | undefined),
    timeFormat: value.preferences
      ? (value.preferences as { timeFormat?: string }).timeFormat
      : (value.timeFormat as string | undefined),
    aiSuggestionsEnabled: value.ai
      ? (value.ai as { aiSuggestionsEnabled?: boolean }).aiSuggestionsEnabled
      : (value.aiSuggestionsEnabled as boolean | undefined),
    aiFormSuggestionsAllowed: value.ai
      ? (value.ai as { aiFormSuggestionsAllowed?: boolean })
          .aiFormSuggestionsAllowed
      : (value.aiFormSuggestionsAllowed as boolean | undefined),
    clearCache: value.ai
      ? (value.ai as { clearCache?: boolean }).clearCache
      : (value.clearCache as boolean | undefined),
    workCountry: value.work
      ? (value.work as { workCountry?: string }).workCountry
      : (value.workCountry as string | undefined),
    yearlyWorkLimitDays: value.work
      ? (value.work as { yearlyWorkLimitDays?: number }).yearlyWorkLimitDays
      : (value.yearlyWorkLimitDays as number | undefined),
    defaultHourlyWage: value.work
      ? (value.work as { defaultHourlyWage?: number | null }).defaultHourlyWage
      : (value.defaultHourlyWage as number | null | undefined),
    selectedModules:
      selectedModules && typeof selectedModules === "object"
        ? (selectedModules as Record<string, boolean>)
        : undefined,
  };
}

function normalizeBudgetPayload(payload: unknown) {
  const value = (payload ?? {}) as Record<string, unknown>;
  return {
    id: typeof value.id === "string" ? value.id : undefined,
    localId: typeof value.localId === "string" ? value.localId : undefined,
    type:
      typeof value.type === "string"
        ? (value.type as "WEEKLY" | "MONTHLY" | "CATEGORY" | "SAVINGS")
        : undefined,
    categoryId:
      typeof value.categoryId === "string" ? value.categoryId : undefined,
    year:
      typeof value.year === "number"
        ? value.year
        : typeof value.year === "string"
          ? Number(value.year)
          : undefined,
    month:
      typeof value.month === "number"
        ? value.month
        : typeof value.month === "string"
          ? Number(value.month)
          : undefined,
    week:
      typeof value.week === "number"
        ? value.week
        : typeof value.week === "string"
          ? Number(value.week)
          : undefined,
    category:
      typeof value.category === "string"
        ? (value.category as
            | "GROCERIES"
            | "RENT"
            | "TRANSPORT"
            | "FOOD"
            | "STUDY"
            | "HEALTH"
            | "ENTERTAINMENT"
            | "BILLS"
            | "SHOPPING"
            | "OTHER")
        : undefined,
    amount:
      typeof value.amount === "number"
        ? value.amount
        : typeof value.amount === "string"
          ? Number(value.amount)
          : undefined,
    amountCents:
      typeof value.amountCents === "number"
        ? value.amountCents
        : typeof value.amountCents === "string"
          ? Number(value.amountCents)
          : undefined,
    currency: typeof value.currency === "string" ? value.currency : undefined,
    periodStart:
      typeof value.periodStart === "string" ? value.periodStart : undefined,
    periodEnd:
      typeof value.periodEnd === "string" ? value.periodEnd : undefined,
    isActive: typeof value.isActive === "boolean" ? value.isActive : undefined,
    notes: typeof value.notes === "string" ? value.notes : undefined,
    syncedAt: typeof value.syncedAt === "string" ? value.syncedAt : undefined,
    deleted: typeof value.deleted === "boolean" ? value.deleted : false,
  };
}

function normalizeReminderPayload(payload: unknown) {
  const value = (payload ?? {}) as Record<string, unknown>;
  return {
    id: typeof value.id === "string" ? value.id : undefined,
    localId: typeof value.localId === "string" ? value.localId : undefined,
    title: typeof value.title === "string" ? value.title : "Reminder",
    message: typeof value.message === "string" ? value.message : undefined,
    type:
      typeof value.type === "string"
        ? (value.type as
            | "CLASS"
            | "TASK"
            | "GROCERY"
            | "CLEANING"
            | "WORK"
            | "EXPENSE"
            | "AI"
            | "CUSTOM")
        : undefined,
    sourceType:
      typeof value.sourceType === "string"
        ? (value.sourceType as
            | "CLASS"
            | "TASK"
            | "GROCERY"
            | "CLEANING"
            | "WORK"
            | "SPLIT"
            | "CUSTOM")
        : undefined,
    sourceId: typeof value.sourceId === "string" ? value.sourceId : undefined,
    scheduledAt:
      typeof value.scheduledAt === "string" ? value.scheduledAt : undefined,
    remindAt: typeof value.remindAt === "string" ? value.remindAt : undefined,
    repeatRule:
      typeof value.repeatRule === "string" ? value.repeatRule : undefined,
    isEnabled:
      typeof value.isEnabled === "boolean" ? value.isEnabled : undefined,
    isCompleted:
      typeof value.isCompleted === "boolean" ? value.isCompleted : undefined,
    deliveryType:
      typeof value.deliveryType === "string"
        ? (value.deliveryType as "PUSH" | "IN_APP" | "CALENDAR")
        : undefined,
    linkedEntityType:
      typeof value.linkedEntityType === "string"
        ? (value.linkedEntityType as
            | "CLASS"
            | "TASK"
            | "GROCERY_ITEM"
            | "GROCERY_PURCHASE"
            | "SHOPPING_LIST_ITEM"
            | "CLEANING_TASK"
            | "WORK_SHIFT"
            | "EXPENSE"
            | "BUDGET"
            | "AI_INSIGHT"
            | "CUSTOM")
        : undefined,
    linkedEntityId:
      typeof value.linkedEntityId === "string"
        ? value.linkedEntityId
        : undefined,
    syncedAt: typeof value.syncedAt === "string" ? value.syncedAt : undefined,
    deleted: typeof value.deleted === "boolean" ? value.deleted : false,
  };
}

export async function processSyncQueueItem(
  userId: string,
  input: SyncQueueItemInput,
) {
  const timestamp = input.updatedAt ? new Date(input.updatedAt) : new Date();

  if (input.entityType === "settings") {
    const settings = normalizeSettingsPayload(input.payload);
    const { selectedModules, ...settingsInput } = settings;
    await SettingsService.update(userId, settingsInput as any);
    if (selectedModules) {
      await SettingsService.updateModules(userId, selectedModules);
    }
    return {
      status: "updated",
      entityType: input.entityType,
      entityId: input.entityId,
      syncedAt: timestamp,
    };
  }

  if (input.entityType === "budget") {
    const payload = normalizeBudgetPayload(input.payload);

    if (input.operation === "DELETE" || payload.deleted) {
      if (payload.id) {
        await prisma.budget.deleteMany({
          where: { id: payload.id, userId } as any,
        });
      } else if (payload.localId) {
        await prisma.budget.deleteMany({
          where: { localId: payload.localId, userId } as any,
        });
      }
      return {
        status: "deleted",
        entityType: input.entityType,
        entityId: input.entityId,
        syncedAt: timestamp,
      };
    }

    const result = await BudgetsService.syncBudgets(userId, {
      budgets: [payload as any],
    });
    return {
      status: result.results[0]?.status ?? "accepted",
      entityType: input.entityType,
      entityId: input.entityId,
      syncedAt: timestamp,
    };
  }

  if (input.entityType === "reminder") {
    const payload = normalizeReminderPayload(input.payload);

    if (input.operation === "DELETE" || payload.deleted) {
      if (payload.id) {
        await deleteReminder(userId, payload.id);
      } else if (payload.localId) {
        await prisma.reminder.deleteMany({
          where: { localId: payload.localId, userId } as any,
        });
      }
      return {
        status: "deleted",
        entityType: input.entityType,
        entityId: input.entityId,
        syncedAt: timestamp,
      };
    }

    const result = await syncReminders(userId, { reminders: [payload as any] });
    return {
      status: result.results[0]?.status ?? "accepted",
      entityType: input.entityType,
      entityId: input.entityId,
      syncedAt: timestamp,
    };
  }

  return {
    status: "accepted",
    entityType: input.entityType,
    entityId: input.entityId,
    operation: input.operation,
    syncedAt: timestamp,
    note: "MVP sync accepted. Entity-specific merge currently covers settings, budgets, and reminders.",
  };
}

export async function getSyncSnapshot(userId: string, since?: string) {
  const date = asDate(since);
  const [settings, budgets, reminders] = await Promise.all([
    SettingsService.get(userId),
    prisma.budget.findMany({
      where: { userId, updatedAt: { gt: date } },
      orderBy: { updatedAt: "asc" },
    }),
    prisma.reminder.findMany({
      where: { userId, updatedAt: { gt: date } },
      orderBy: { updatedAt: "asc" },
    }),
  ]);

  return {
    since: date.toISOString(),
    settings: [settings],
    budgets,
    reminders,
  };
}
