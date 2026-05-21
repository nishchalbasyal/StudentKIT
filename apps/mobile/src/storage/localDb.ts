import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Budget, Expense } from "../types/expense.types";
import type { GroceryItem, ShoppingListItem } from "../types/grocery.types";
import type { CleaningTask } from "../types/cleaning.types";
import type { StudentTask } from "../types/task.types";
import type { WorkShift } from "../types/work.types";
import type { Reminder } from "../types/reminder.types";

export type LocalEntity = {
  id: string;
  localId?: string;
  userId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  syncedAt?: string | null;
};

export type LocalCompany = LocalEntity & {
  name: string;
  defaultHourlyWage?: number | null;
  defaultBreakMinutes?: number | null;
  commonStartTime?: string | null;
  commonEndTime?: string | null;
};

export type LocalSplitGroup = LocalEntity & {
  name: string;
  description?: string | null;
  archivedAt?: string | null;
};

export type LocalSplitMember = LocalEntity & {
  groupId: string;
  name: string;
  email?: string | null;
  userId?: string | null;
};

export type LocalSplitExpense = LocalEntity & {
  groupId: string;
  title: string;
  amount: number;
  paidByMemberId?: string | null;
  date: string;
  notes?: string | null;
};

export type LocalCollections = {
  tasks: StudentTask[];
  reminders: Reminder[];
  workEntries: WorkShift[];
  companies: LocalCompany[];
  expenses: Expense[];
  budgets: Budget[];
  groceries: GroceryItem[];
  shoppingList: ShoppingListItem[];
  cleaningRoutines: CleaningTask[];
  splitGroups: LocalSplitGroup[];
  splitMembers: LocalSplitMember[];
  splitExpenses: LocalSplitExpense[];
};

export type LocalCollectionName = keyof LocalCollections;

const storagePrefix = "student-kit.localDb.";

function storageKey(collection: LocalCollectionName) {
  return `${storagePrefix}${collection}`;
}

function nowIso() {
  return new Date().toISOString();
}

export function createLocalId(prefix = "local") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

async function readCollection<K extends LocalCollectionName>(
  collection: K,
): Promise<LocalCollections[K]> {
  const raw = await AsyncStorage.getItem(storageKey(collection));
  if (!raw) return [] as LocalCollections[K];

  try {
    return JSON.parse(raw) as LocalCollections[K];
  } catch {
    await AsyncStorage.removeItem(storageKey(collection));
    return [] as LocalCollections[K];
  }
}

async function writeCollection<K extends LocalCollectionName>(
  collection: K,
  value: LocalCollections[K],
) {
  await AsyncStorage.setItem(storageKey(collection), JSON.stringify(value));
}

export const localDb = {
  list: readCollection,

  async replace<K extends LocalCollectionName>(
    collection: K,
    value: LocalCollections[K],
  ) {
    await writeCollection(collection, value);
    return value;
  },

  async find<K extends LocalCollectionName>(collection: K, id: string) {
    const items = await readCollection(collection);
    return items.find((item) => item.id === id) ?? null;
  },

  async create<K extends LocalCollectionName>(
    collection: K,
    input: Omit<LocalCollections[K][number], "id"> & { id?: string },
  ) {
    const items = await readCollection(collection);
    const timestamp = nowIso();
    const inputAny = input as Record<string, unknown>;
    const item = {
      ...input,
      id: input.id ?? createLocalId(String(collection)),
      localId: inputAny.localId ?? input.id ?? createLocalId(String(collection)),
      createdAt: inputAny.createdAt ?? timestamp,
      updatedAt: inputAny.updatedAt ?? timestamp,
      syncedAt: inputAny.syncedAt ?? null,
    } as LocalCollections[K][number];

    await writeCollection(collection, [item, ...items] as LocalCollections[K]);
    return item;
  },

  async upsert<K extends LocalCollectionName>(
    collection: K,
    item: LocalCollections[K][number],
  ) {
    const items = await readCollection(collection);
    const timestamp = nowIso();
    const itemAny = item as Record<string, unknown>;
    const normalized = {
      ...item,
      localId: itemAny.localId ?? item.id,
      createdAt: itemAny.createdAt ?? timestamp,
      updatedAt: itemAny.updatedAt ?? timestamp,
    };
    const index = items.findIndex((entry) => entry.id === item.id);
    const next =
      index >= 0
        ? [
            ...items.slice(0, index),
            { ...items[index], ...normalized },
            ...items.slice(index + 1),
          ]
        : [normalized, ...items];

    await writeCollection(collection, next as LocalCollections[K]);
    return normalized as LocalCollections[K][number];
  },

  async update<K extends LocalCollectionName>(
    collection: K,
    id: string,
    input: Partial<LocalCollections[K][number]>,
  ) {
    const items = await readCollection(collection);
    const index = items.findIndex((entry) => entry.id === id);
    if (index < 0) return null;

    const updated = {
      ...items[index],
      ...input,
      updatedAt: nowIso(),
      syncedAt: (input as Record<string, unknown>).syncedAt ?? null,
    };
    const next = [
      ...items.slice(0, index),
      updated,
      ...items.slice(index + 1),
    ] as LocalCollections[K];

    await writeCollection(collection, next);
    return updated as LocalCollections[K][number];
  },

  async remove<K extends LocalCollectionName>(collection: K, id: string) {
    const items = await readCollection(collection);
    await writeCollection(
      collection,
      items.filter((entry) => entry.id !== id) as LocalCollections[K],
    );
    return { id };
  },

  async clearAll() {
    await AsyncStorage.multiRemove(
      (Object.keys({
        tasks: true,
        reminders: true,
        workEntries: true,
        companies: true,
        expenses: true,
        budgets: true,
        groceries: true,
        shoppingList: true,
        cleaningRoutines: true,
        splitGroups: true,
        splitMembers: true,
        splitExpenses: true,
      }) as LocalCollectionName[]).map(storageKey),
    );
  },
};
