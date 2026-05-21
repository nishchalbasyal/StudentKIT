export type Reminder = {
  id: string;
  localId?: string;
  userId?: string | null;
  sourceType?: ReminderSourceType;
  sourceId?: string;
  title: string;
  message?: string | null;
  type: "CLASS" | "TASK" | "GROCERY" | "CLEANING" | "WORK" | "EXPENSE" | "AI" | "CUSTOM";
  scheduledAt: string;
  remindAt?: string;
  repeatRule?: string | null;
  isEnabled?: boolean;
  isCompleted: boolean;
  deliveryType?: ReminderDeliveryType;
  completedAt?: string | null;
  linkedEntityType?: string | null;
  linkedEntityId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  syncedAt?: string | null;
};

export type ReminderInput = {
  title: string;
  message?: string;
  type: Reminder["type"];
  scheduledAt: string;
  linkedEntityType?: string;
  linkedEntityId?: string;
};

export type ReminderSourceType = "TASK" | "GROCERY" | "CLEANING" | "WORK" | "SPLIT" | "CLASS" | "CUSTOM";

export type ReminderDeliveryType = "PUSH" | "IN_APP" | "CALENDAR";
