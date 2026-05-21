import { prisma } from "../../database/prisma.js";
import { toDateOnlyString } from "../../utils/date.js";

type SearchResult = {
  id: string;
  type: "work" | "company" | "expense" | "task" | "grocery" | "cleaning" | "split" | "coupon" | "event";
  title: string;
  subtitle?: string | null;
  route: string;
  params?: Record<string, string>;
};

function contains(query: string) {
  return { contains: query, mode: "insensitive" as const };
}

function splitAccess(userId: string) {
  return { OR: [{ ownerUserId: userId }, { members: { some: { userId } } }] };
}

export async function searchAll(userId: string, q: string) {
  const query = q.trim();

  if (!query) {
    return recentItems(userId);
  }

  const [work, companies, expenses, tasks, groceries, cleaning, splitGroups, coupons, events] = await Promise.all([
    prisma.workShift.findMany({ where: { userId, jobName: contains(query) }, take: 5, orderBy: { date: "desc" } }),
    prisma.company.findMany({ where: { userId, isArchived: false, name: contains(query) }, take: 5, orderBy: { name: "asc" } }),
    prisma.expense.findMany({ where: { userId, title: contains(query) }, take: 5, orderBy: { date: "desc" } }),
    prisma.task.findMany({ where: { userId, title: contains(query) }, take: 5, orderBy: { updatedAt: "desc" } }),
    prisma.groceryItem.findMany({ where: { userId, name: contains(query) }, take: 5, orderBy: { updatedAt: "desc" } }),
    prisma.cleaningTask.findMany({ where: { userId, title: contains(query) }, take: 5, orderBy: { updatedAt: "desc" } }),
    prisma.splitGroup.findMany({ where: { ...splitAccess(userId), name: contains(query) }, take: 5, orderBy: { updatedAt: "desc" } }),
    prisma.coupon.findMany({ where: { isActive: true, title: contains(query) }, take: 5, orderBy: { updatedAt: "desc" } }),
    prisma.event.findMany({ where: { isActive: true, title: contains(query) }, take: 5, orderBy: { startsAt: "asc" } }),
  ]);

  return [
    ...work.map((item): SearchResult => ({ id: item.id, type: "work", title: item.jobName, subtitle: toDateOnlyString(item.date), route: "WorkEntryDetail", params: { workShiftId: item.id } })),
    ...companies.map((item): SearchResult => ({ id: item.id, type: "company", title: item.name, subtitle: item.location, route: "CompanyDetail", params: { companyId: item.id } })),
    ...expenses.map((item): SearchResult => ({ id: item.id, type: "expense", title: item.title, subtitle: `${item.category} · ${toDateOnlyString(item.date)}`, route: "ExpenseDetail", params: { expenseId: item.id } })),
    ...tasks.map((item): SearchResult => ({ id: item.id, type: "task", title: item.title, subtitle: item.dueDate ? toDateOnlyString(item.dueDate) : item.status, route: "TaskDetail", params: { taskId: item.id } })),
    ...groceries.map((item): SearchResult => ({ id: item.id, type: "grocery", title: item.name, subtitle: item.category, route: "GroceryDetails", params: { groceryItemId: item.id } })),
    ...cleaning.map((item): SearchResult => ({ id: item.id, type: "cleaning", title: item.title, subtitle: "Cleaning routine", route: "Cleaning" })),
    ...splitGroups.map((item): SearchResult => ({ id: item.id, type: "split", title: item.name, subtitle: item.currency, route: "SplitGroupDetail", params: { groupId: item.id } })),
    ...coupons.map((item): SearchResult => ({ id: item.id, type: "coupon", title: item.title, subtitle: item.discount, route: "CouponDetails", params: { couponId: item.id } })),
    ...events.map((item): SearchResult => ({ id: item.id, type: "event", title: item.title, subtitle: toDateOnlyString(item.startsAt), route: "EventDetails", params: { eventId: item.id } })),
  ];
}

async function recentItems(userId: string) {
  const [work, tasks, expenses, splitGroups] = await Promise.all([
    prisma.workShift.findMany({ where: { userId }, take: 3, orderBy: { updatedAt: "desc" } }),
    prisma.task.findMany({ where: { userId }, take: 3, orderBy: { updatedAt: "desc" } }),
    prisma.expense.findMany({ where: { userId }, take: 3, orderBy: { updatedAt: "desc" } }),
    prisma.splitGroup.findMany({ where: splitAccess(userId), take: 3, orderBy: { updatedAt: "desc" } }),
  ]);

  return [
    ...work.map((item): SearchResult => ({ id: item.id, type: "work", title: item.jobName, subtitle: toDateOnlyString(item.date), route: "WorkEntryDetail", params: { workShiftId: item.id } })),
    ...tasks.map((item): SearchResult => ({ id: item.id, type: "task", title: item.title, subtitle: item.status, route: "TaskDetail", params: { taskId: item.id } })),
    ...expenses.map((item): SearchResult => ({ id: item.id, type: "expense", title: item.title, subtitle: item.category, route: "ExpenseDetail", params: { expenseId: item.id } })),
    ...splitGroups.map((item): SearchResult => ({ id: item.id, type: "split", title: item.name, subtitle: item.currency, route: "SplitGroupDetail", params: { groupId: item.id } })),
  ];
}
