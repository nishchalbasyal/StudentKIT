import { prisma } from "../../database/prisma.js";
import { parseDateOnly, toDateOnlyString } from "../../utils/date.js";
import { HttpError } from "../../utils/httpError.js";
import type {
  CreateSplitExpenseInput,
  CreateSplitGroupInput,
  CreateSplitMemberInput,
  CreateSplitSettlementInput,
  UpdateSplitExpenseInput,
  UpdateSplitGroupInput,
  UpdateSplitMemberInput,
} from "./split.schemas.js";

const memberOrder = { createdAt: "asc" as const };

const groupInclude = {
  members: { orderBy: memberOrder },
  expenses: {
    include: {
      paidBy: true,
      payers: { include: { member: true } },
      shares: { include: { member: true } },
    },
    orderBy: [{ date: "desc" as const }, { createdAt: "desc" as const }],
  },
  settlements: {
    include: { fromMember: true, toMember: true },
    orderBy: [{ date: "desc" as const }, { createdAt: "desc" as const }],
  },
  activities: {
    orderBy: { createdAt: "desc" as const },
    take: 20,
  },
};

type GroupWithData = any;
type BalanceRow = {
  memberId: string;
  member: any;
  totalPaidCents: number;
  totalShareCents: number;
  settlementCents: number;
  netCents: number;
};

function moneyToCents(value: unknown) {
  return Math.round(Number(value ?? 0) * 100);
}

function centsToMoney(cents: number) {
  return Number((cents / 100).toFixed(2));
}

function dateOnly(value: Date | string) {
  return typeof value === "string" ? value.slice(0, 10) : toDateOnlyString(value);
}

function amountCentsFrom(value: { amount?: number | null; amountCents?: number | null }) {
  return value.amountCents ?? moneyToCents(value.amount);
}

function mapMember(member: any) {
  return {
    ...member,
    isRegisteredUser: Boolean(member.isRegisteredUser || member.userId),
  };
}

function mapExpense(expense: any) {
  const amountCents = expense.amountCents || moneyToCents(expense.amount);
  const payers =
    expense.payers?.length > 0
      ? expense.payers
      : [{ memberId: expense.paidByMemberId, member: expense.paidBy, amountCents }];

  return {
    ...expense,
    amountCents,
    amount: centsToMoney(amountCents),
    date: dateOnly(expense.date),
    paidBy: expense.paidBy ? mapMember(expense.paidBy) : undefined,
    payers: payers.map((payer: any) => ({
      ...payer,
      member: payer.member ? mapMember(payer.member) : undefined,
      amount: centsToMoney(payer.amountCents ?? amountCents),
      amountCents: payer.amountCents ?? amountCents,
    })),
    shares: expense.shares?.map((share: any) => {
      const shareCents = share.amountCents || moneyToCents(share.amount);
      return {
        ...share,
        amountCents: shareCents,
        amount: centsToMoney(shareCents),
        member: share.member ? mapMember(share.member) : undefined,
      };
    }) ?? [],
  };
}

function mapSettlement(settlement: any) {
  const amountCents = settlement.amountCents || moneyToCents(settlement.amount);
  return {
    ...settlement,
    amountCents,
    amount: centsToMoney(amountCents),
    date: dateOnly(settlement.date),
    fromMember: settlement.fromMember ? mapMember(settlement.fromMember) : undefined,
    toMember: settlement.toMember ? mapMember(settlement.toMember) : undefined,
  };
}

function mapActivity(activity: any) {
  return {
    ...activity,
    createdAt: activity.createdAt.toISOString(),
  };
}

function calculateBalancesFromGroup(group: GroupWithData): BalanceRow[] {
  const balances = new Map<string, BalanceRow>();

  for (const rawMember of group.members ?? []) {
    const member = mapMember(rawMember);
    balances.set(member.id, {
      memberId: member.id,
      member,
      totalPaidCents: 0,
      totalShareCents: 0,
      settlementCents: 0,
      netCents: 0,
    });
  }

  for (const rawExpense of group.expenses ?? []) {
    const expense = mapExpense(rawExpense);
    const payers =
      expense.payers.length > 0
        ? expense.payers
        : [{ memberId: expense.paidByMemberId, amountCents: expense.amountCents }];

    for (const payer of payers) {
      const balance = balances.get(payer.memberId);
      if (balance) balance.totalPaidCents += payer.amountCents;
    }

    for (const share of expense.shares) {
      const balance = balances.get(share.memberId);
      if (balance) balance.totalShareCents += share.amountCents;
    }
  }

  for (const rawSettlement of group.settlements ?? []) {
    const settlement = mapSettlement(rawSettlement);
    const from = balances.get(settlement.fromMemberId);
    const to = balances.get(settlement.toMemberId);
    if (from) from.settlementCents += settlement.amountCents;
    if (to) to.settlementCents -= settlement.amountCents;
  }

  for (const balance of balances.values()) {
    balance.netCents = balance.totalPaidCents - balance.totalShareCents + balance.settlementCents;
  }

  return Array.from(balances.values());
}

function simplifyDebts(balanceRows: BalanceRow[]) {
  const debtors = balanceRows
    .filter((row) => row.netCents < 0)
    .map((row) => ({ ...row, remaining: -row.netCents }))
    .sort((a, b) => b.remaining - a.remaining);
  const creditors = balanceRows
    .filter((row) => row.netCents > 0)
    .map((row) => ({ ...row, remaining: row.netCents }))
    .sort((a, b) => b.remaining - a.remaining);

  const debts: Array<{
    fromMemberId: string;
    toMemberId: string;
    fromMember: any;
    toMember: any;
    amountCents: number;
    amount: number;
  }> = [];

  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex]!;
    const creditor = creditors[creditorIndex]!;
    const amountCents = Math.min(debtor.remaining, creditor.remaining);

    if (amountCents > 0) {
      debts.push({
        fromMemberId: debtor.memberId,
        toMemberId: creditor.memberId,
        fromMember: debtor.member,
        toMember: creditor.member,
        amountCents,
        amount: centsToMoney(amountCents),
      });
    }

    debtor.remaining -= amountCents;
    creditor.remaining -= amountCents;

    if (debtor.remaining === 0) debtorIndex += 1;
    if (creditor.remaining === 0) creditorIndex += 1;
  }

  return debts;
}

function getCurrentMember(group: GroupWithData, userId: string) {
  return (
    group.members?.find((member: any) => member.userId === userId) ??
    (group.ownerUserId === userId ? group.members?.find((member: any) => member.isCurrentUser) : undefined)
  );
}

function mapBalance(row: BalanceRow) {
  return {
    memberId: row.memberId,
    member: row.member,
    totalPaidCents: row.totalPaidCents,
    totalPaid: centsToMoney(row.totalPaidCents),
    totalShareCents: row.totalShareCents,
    totalShare: centsToMoney(row.totalShareCents),
    settlementCents: row.settlementCents,
    settlement: centsToMoney(row.settlementCents),
    netCents: row.netCents,
    net: centsToMoney(row.netCents),
  };
}

function mapGroup(group: GroupWithData, userId?: string) {
  const expenses = group.expenses?.map(mapExpense) ?? [];
  const settlements = group.settlements?.map(mapSettlement) ?? [];
  const mapped = {
    ...group,
    userId: group.ownerUserId,
    ownerUserId: group.ownerUserId,
    members: group.members?.map(mapMember) ?? [],
    expenses,
    settlements,
    activities: group.activities?.map(mapActivity) ?? [],
    totalAmountCents: expenses.reduce((sum: number, expense: any) => sum + expense.amountCents, 0),
    totalAmount: expenses.reduce((sum: number, expense: any) => sum + expense.amount, 0),
  };
  const balances = calculateBalancesFromGroup(mapped);
  const current = userId ? getCurrentMember(mapped, userId) : undefined;
  const currentBalance = current ? balances.find((row) => row.memberId === current.id)?.netCents ?? 0 : 0;

  return {
    ...mapped,
    balances: balances.map(mapBalance),
    simplifiedDebts: simplifyDebts(balances),
    currentUserBalanceCents: currentBalance,
    currentUserBalance: centsToMoney(currentBalance),
  };
}

function normalizeShares(
  amountCents: number,
  splitType: "EQUAL" | "CUSTOM" | undefined,
  shares: Array<{ memberId: string; amount?: number; amountCents?: number }>,
  currentMemberId?: string,
) {
  if (shares.length === 0) {
    throw new HttpError(400, "VALIDATION_ERROR", "Choose at least one member to split with.");
  }

  if (splitType === "CUSTOM") {
    const customShares = shares.map((share) => ({
      memberId: share.memberId,
      amountCents: amountCentsFrom(share),
    }));
    const shareTotal = customShares.reduce((sum, share) => sum + share.amountCents, 0);
    if (shareTotal !== amountCents) {
      throw new HttpError(400, "VALIDATION_ERROR", "Expense shares must equal the total amount.");
    }
    return customShares;
  }

  const memberIds = shares.map((share) => share.memberId);
  const orderedMemberIds = currentMemberId && memberIds.includes(currentMemberId)
    ? [currentMemberId, ...memberIds.filter((memberId) => memberId !== currentMemberId)]
    : memberIds;
  const base = Math.floor(amountCents / orderedMemberIds.length);
  let remainder = amountCents % orderedMemberIds.length;

  return orderedMemberIds.map((memberId) => {
    const extra = remainder > 0 ? 1 : 0;
    remainder -= extra;
    return { memberId, amountCents: base + extra };
  });
}

function friendKey(member: any) {
  return member.userId ?? member.email?.toLowerCase() ?? member.id;
}

export class SplitService {
  static async createGroup(userId: string, data: CreateSplitGroupInput) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true } });
    if (!user) throw new HttpError(404, "NOT_FOUND", "User not found");

    const inputMembers = data.members ?? [];
    const currentUserMember = {
      name: user.name,
      email: user.email,
      userId: user.id,
      isCurrentUser: true,
      isRegisteredUser: true,
      role: "OWNER",
    };
    const withoutCurrent = inputMembers.filter((member) => member.userId !== user.id && member.email !== user.email);
    const members = [currentUserMember, ...withoutCurrent.map((member) => ({
      name: member.name,
      email: member.email ?? null,
      userId: member.userId ?? null,
      avatarUrl: member.avatarUrl ?? null,
      isCurrentUser: false,
      isRegisteredUser: Boolean(member.userId || member.isRegisteredUser),
      role: member.role ?? "MEMBER",
    }))];

    const group = await prisma.$transaction(async (tx) => {
      const created = await tx.splitGroup.create({
        data: {
          ownerUserId: userId,
          name: data.name,
          description: data.description,
          currency: data.currency,
          imageUrl: data.imageUrl,
          members: { create: members },
        },
        include: groupInclude,
      });

      await tx.splitActivity.create({
        data: {
          groupId: created.id,
          type: "GROUP_CREATED",
          message: `You created ${created.name}`,
          metadata: { groupId: created.id },
        },
      });

      return tx.splitGroup.findUniqueOrThrow({ where: { id: created.id }, include: groupInclude });
    });

    return mapGroup(group, userId);
  }

  static async listGroups(userId: string) {
    const groups = await prisma.splitGroup.findMany({
      where: this.accessWhere(userId),
      include: groupInclude,
      orderBy: { updatedAt: "desc" },
    });

    return groups.map((group) => mapGroup(group, userId));
  }

  static async getSummary(userId: string) {
    const groups = await this.listGroups(userId);
    const balanceCents = groups.reduce((sum, group: any) => sum + group.currentUserBalanceCents, 0);
    const activeGroups = groups.filter((group: any) => !group.archivedAt);

    return {
      balanceCents,
      balance: centsToMoney(balanceCents),
      currency: activeGroups[0]?.currency ?? "EUR",
      groupsCount: activeGroups.length,
      expenseCount: activeGroups.reduce((sum: number, group: any) => sum + group.expenses.length, 0),
      status:
        balanceCents > 0
          ? `You are owed ${centsToMoney(balanceCents)}`
          : balanceCents < 0
            ? `You owe ${centsToMoney(Math.abs(balanceCents))}`
            : "You are settled up",
    };
  }

  static async getGroup(groupId: string, userId: string) {
    return mapGroup(await this.getAccessibleGroup(groupId, userId), userId);
  }

  static async updateGroup(groupId: string, userId: string, data: UpdateSplitGroupInput) {
    await this.assertGroupOwner(groupId, userId);
    const group = await prisma.splitGroup.update({
      where: { id: groupId },
      data: {
        name: data.name,
        description: data.description,
        currency: data.currency,
        imageUrl: data.imageUrl,
        archivedAt: data.archivedAt ? new Date(data.archivedAt) : data.archivedAt,
      },
      include: groupInclude,
    });

    await prisma.splitActivity.create({
      data: {
        groupId,
        type: data.archivedAt ? "GROUP_ARCHIVED" : "GROUP_UPDATED",
        message: data.archivedAt ? `${group.name} was archived` : `${group.name} was updated`,
        metadata: { groupId },
      },
    });

    return mapGroup(group, userId);
  }

  static async deleteGroup(groupId: string, userId: string) {
    await this.assertGroupOwner(groupId, userId);
    await prisma.splitGroup.delete({ where: { id: groupId } });
    return { id: groupId };
  }

  static async listMembers(groupId: string, userId: string) {
    await this.getAccessibleGroup(groupId, userId);
    const members = await prisma.splitMember.findMany({ where: { groupId }, orderBy: memberOrder });
    return members.map(mapMember);
  }

  static async createMember(groupId: string, userId: string, data: CreateSplitMemberInput) {
    await this.assertGroupOwner(groupId, userId);
    const member = await prisma.splitMember.create({
      data: {
        groupId,
        name: data.name,
        email: data.email ?? null,
        userId: data.userId ?? null,
        avatarUrl: data.avatarUrl ?? null,
        isCurrentUser: Boolean(data.isCurrentUser),
        isRegisteredUser: Boolean(data.userId || data.isRegisteredUser),
        role: data.role ?? "MEMBER",
      },
    });

    await prisma.splitActivity.create({
      data: {
        groupId,
        type: "MEMBER_ADDED",
        message: `${member.name} was added to group`,
        metadata: { groupId, memberId: member.id },
      },
    });

    return mapMember(member);
  }

  static async updateMember(groupId: string, memberId: string, userId: string, data: UpdateSplitMemberInput) {
    await this.assertGroupOwner(groupId, userId);
    const member = await prisma.splitMember.findFirst({ where: { id: memberId, groupId } });
    if (!member) throw new HttpError(404, "NOT_FOUND", "Split member not found");

    const updated = await prisma.splitMember.update({
      where: { id: member.id },
      data: {
        name: data.name,
        email: data.email,
        userId: data.userId,
        avatarUrl: data.avatarUrl,
        isCurrentUser: data.isCurrentUser,
        isRegisteredUser: data.isRegisteredUser,
        role: data.role,
      },
    });

    return mapMember(updated);
  }

  static async deleteMember(groupId: string, memberId: string, userId: string) {
    await this.assertGroupOwner(groupId, userId);
    const member = await prisma.splitMember.findFirst({ where: { id: memberId, groupId } });
    if (!member) throw new HttpError(404, "NOT_FOUND", "Split member not found");

    const usageCount = await prisma.splitExpense.count({
      where: { OR: [{ paidByMemberId: member.id }, { payers: { some: { memberId: member.id } } }, { shares: { some: { memberId: member.id } } }] },
    });
    const settlementCount = await prisma.splitSettlement.count({
      where: { OR: [{ fromMemberId: member.id }, { toMemberId: member.id }] },
    });

    if (usageCount + settlementCount > 0) {
      throw new HttpError(409, "CONFLICT", "Members with split history cannot be deleted.");
    }

    await prisma.splitMember.delete({ where: { id: member.id } });
    await prisma.splitActivity.create({
      data: {
        groupId,
        type: "MEMBER_REMOVED",
        message: `${member.name} was removed from group`,
        metadata: { groupId, memberId: member.id },
      },
    });
    return { id: member.id };
  }

  static async listExpenses(groupId: string, userId: string) {
    await this.getAccessibleGroup(groupId, userId);
    const expenses = await prisma.splitExpense.findMany({
      where: { groupId },
      include: { paidBy: true, payers: { include: { member: true } }, shares: { include: { member: true } } },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });

    return expenses.map(mapExpense);
  }

  static async createExpense(groupId: string, userId: string, data: CreateSplitExpenseInput) {
    const group = await this.assertMembersBelongToAccessibleGroup(groupId, userId, [
      data.paidByMemberId,
      ...data.shares.map((share) => share.memberId),
    ]);
    const amountCents = amountCentsFrom(data);
    const currentMember = getCurrentMember(group, userId);
    const shares = normalizeShares(amountCents, data.splitType, data.shares, currentMember?.id);

    const expense = await prisma.$transaction(async (tx) => {
      const created = await tx.splitExpense.create({
        data: {
          groupId,
          paidByMemberId: data.paidByMemberId,
          title: data.title,
          category: data.category,
          amount: centsToMoney(amountCents),
          amountCents,
          currency: group.currency,
          date: parseDateOnly(data.date),
          splitType: data.splitType,
          notes: data.notes,
          createdByUserId: userId,
          payers: {
            create: [{ memberId: data.paidByMemberId, amountCents }],
          },
          shares: {
            create: shares.map((share) => ({
              memberId: share.memberId,
              amount: centsToMoney(share.amountCents),
              amountCents: share.amountCents,
            })),
          },
        },
        include: { paidBy: true, payers: { include: { member: true } }, shares: { include: { member: true } } },
      });

      await tx.splitActivity.create({
        data: {
          groupId,
          type: "EXPENSE_CREATED",
          message: `You added ${created.title} ${group.currency} ${centsToMoney(amountCents).toFixed(2)}`,
          metadata: { groupId, expenseId: created.id, amountCents },
        },
      });

      return created;
    });

    return mapExpense(expense);
  }

  static async getExpense(expenseId: string, userId: string) {
    const expense = await prisma.splitExpense.findFirst({
      where: { id: expenseId, group: this.accessWhere(userId) },
      include: {
        paidBy: true,
        payers: { include: { member: true } },
        shares: { include: { member: true } },
        group: { include: { members: { orderBy: memberOrder }, settlements: { include: { fromMember: true, toMember: true } }, expenses: { include: { paidBy: true, payers: { include: { member: true } }, shares: { include: { member: true } } } } } },
      },
    });

    if (!expense) throw new HttpError(404, "NOT_FOUND", "Split expense not found");
    const group = mapGroup(expense.group, userId);
    const mappedExpense = mapExpense(expense);
    const balanceEffect = simplifyDebts(calculateBalancesFromGroup({
      ...expense.group,
      expenses: [expense],
      settlements: [],
    }));

    return { ...mappedExpense, group: { id: group.id, name: group.name, currency: group.currency }, balanceEffect };
  }

  static async updateExpense(expenseId: string, userId: string, data: UpdateSplitExpenseInput) {
    const existing = await prisma.splitExpense.findFirst({
      where: { id: expenseId, group: this.accessWhere(userId) },
      include: { group: { include: { members: { orderBy: memberOrder } } }, shares: true },
    });
    if (!existing) throw new HttpError(404, "NOT_FOUND", "Split expense not found");
    await this.assertCanEditGroupData(existing.groupId, existing.createdByUserId, userId);

    const amountCents = data.amountCents ?? (data.amount ? moneyToCents(data.amount) : existing.amountCents || moneyToCents(existing.amount));
    const nextPaidByMemberId = data.paidByMemberId ?? existing.paidByMemberId;
    const nextSharesInput = data.shares ?? existing.shares.map((share) => ({ memberId: share.memberId, amountCents: share.amountCents || moneyToCents(share.amount) }));

    const group = await this.assertMembersBelongToAccessibleGroup(existing.groupId, userId, [
      nextPaidByMemberId,
      ...nextSharesInput.map((share) => share.memberId),
    ]);
    const shares = normalizeShares(amountCents, data.splitType ?? existing.splitType, nextSharesInput, getCurrentMember(group, userId)?.id);

    const expense = await prisma.$transaction(async (tx) => {
      await tx.splitExpenseShare.deleteMany({ where: { splitExpenseId: expenseId } });
      await tx.splitExpensePayer.deleteMany({ where: { expenseId } });
      const updated = await tx.splitExpense.update({
        where: { id: expenseId },
        data: {
          paidByMemberId: nextPaidByMemberId,
          title: data.title ?? existing.title,
          category: data.category ?? existing.category,
          amount: centsToMoney(amountCents),
          amountCents,
          currency: group.currency,
          date: data.date ? parseDateOnly(data.date) : existing.date,
          splitType: data.splitType ?? existing.splitType,
          notes: data.notes ?? existing.notes,
          payers: { create: [{ memberId: nextPaidByMemberId, amountCents }] },
          shares: {
            create: shares.map((share) => ({
              memberId: share.memberId,
              amount: centsToMoney(share.amountCents),
              amountCents: share.amountCents,
            })),
          },
        },
        include: { paidBy: true, payers: { include: { member: true } }, shares: { include: { member: true } } },
      });
      await tx.splitActivity.create({
        data: {
          groupId: existing.groupId,
          type: "EXPENSE_UPDATED",
          message: `${updated.title} was updated`,
          metadata: { groupId: existing.groupId, expenseId },
        },
      });
      return updated;
    });

    return mapExpense(expense);
  }

  static async deleteExpense(expenseId: string, userId: string) {
    const expense = await prisma.splitExpense.findFirst({ where: { id: expenseId, group: this.accessWhere(userId) } });
    if (!expense) throw new HttpError(404, "NOT_FOUND", "Split expense not found");
    await this.assertCanEditGroupData(expense.groupId, expense.createdByUserId, userId);

    await prisma.$transaction(async (tx) => {
      await tx.splitExpense.delete({ where: { id: expenseId } });
      await tx.splitActivity.create({
        data: {
          groupId: expense.groupId,
          type: "EXPENSE_DELETED",
          message: `${expense.title} was deleted`,
          metadata: { groupId: expense.groupId, expenseId },
        },
      });
    });
    return { id: expenseId };
  }

  static async getBalances(groupId: string, userId: string) {
    const group = await this.getAccessibleGroup(groupId, userId);
    return calculateBalancesFromGroup(group).map(mapBalance);
  }

  static async listSettlements(groupId: string, userId: string) {
    await this.getAccessibleGroup(groupId, userId);
    const settlements = await prisma.splitSettlement.findMany({
      where: { groupId },
      include: { fromMember: true, toMember: true },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });

    return settlements.map(mapSettlement);
  }

  static async createSettlement(groupId: string, userId: string, data: CreateSplitSettlementInput) {
    const group = await this.assertMembersBelongToAccessibleGroup(groupId, userId, [data.fromMemberId, data.toMemberId]);
    if (data.fromMemberId === data.toMemberId) {
      throw new HttpError(400, "VALIDATION_ERROR", "Settlement members must be different.");
    }
    const amountCents = amountCentsFrom(data);

    const settlement = await prisma.$transaction(async (tx) => {
      const created = await tx.splitSettlement.create({
        data: {
          groupId,
          fromMemberId: data.fromMemberId,
          toMemberId: data.toMemberId,
          amount: centsToMoney(amountCents),
          amountCents,
          currency: group.currency,
          date: data.date ? parseDateOnly(data.date) : parseDateOnly(new Date().toISOString().slice(0, 10)),
          notes: data.notes,
          createdByUserId: userId,
        },
        include: { fromMember: true, toMember: true },
      });
      await tx.splitActivity.create({
        data: {
          groupId,
          type: "SETTLEMENT_CREATED",
          message: `${created.fromMember.name} paid ${created.toMember.name} ${group.currency} ${centsToMoney(amountCents).toFixed(2)}`,
          metadata: { groupId, settlementId: created.id, amountCents },
        },
      });
      return created;
    });

    return mapSettlement(settlement);
  }

  static async deleteSettlement(settlementId: string, userId: string) {
    const settlement = await prisma.splitSettlement.findFirst({
      where: { id: settlementId, group: this.accessWhere(userId) },
    });
    if (!settlement) throw new HttpError(404, "NOT_FOUND", "Split settlement not found");
    await this.assertCanEditGroupData(settlement.groupId, settlement.createdByUserId, userId);
    await prisma.splitSettlement.delete({ where: { id: settlementId } });
    return { id: settlementId };
  }

  static async listFriendsBalances(userId: string) {
    return this.buildFriends(userId);
  }

  static async getFriend(friendId: string, userId: string) {
    const friends = await this.buildFriends(userId);
    const friend = friends.find((item) => item.id === friendId || item.memberIds.includes(friendId));
    if (!friend) throw new HttpError(404, "NOT_FOUND", "Friend balance not found");

    const expenses = friend.groups.flatMap((group: any) => group.expenses ?? []);
    const settlements = friend.groups.flatMap((group: any) => group.settlements ?? []);
    return { ...friend, expenses, settlements };
  }

  static async listActivity(userId: string) {
    const activities = await prisma.splitActivity.findMany({
      where: { group: this.accessWhere(userId) },
      include: { group: { select: { id: true, name: true, currency: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return activities.map((activity) => ({ ...mapActivity(activity), group: activity.group }));
  }

  static async listGroupActivity(groupId: string, userId: string) {
    await this.getAccessibleGroup(groupId, userId);
    const activities = await prisma.splitActivity.findMany({
      where: { groupId },
      include: { group: { select: { id: true, name: true, currency: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return activities.map((activity) => ({ ...mapActivity(activity), group: activity.group }));
  }

  private static async buildFriends(userId: string) {
    const groups = await this.listGroups(userId);
    const friends = new Map<string, any>();

    for (const group of groups as any[]) {
      const currentMember = getCurrentMember(group, userId);
      if (!currentMember) continue;

      for (const debt of group.simplifiedDebts) {
        const friendMember =
          debt.fromMemberId === currentMember.id
            ? debt.toMember
            : debt.toMemberId === currentMember.id
              ? debt.fromMember
              : null;
        if (!friendMember) continue;

        const key = friendKey(friendMember);
        const currentPerspective =
          debt.toMemberId === currentMember.id
            ? debt.amountCents
            : -debt.amountCents;
        const existing = friends.get(key) ?? {
          id: key,
          name: friendMember.name,
          email: friendMember.email,
          avatarUrl: friendMember.avatarUrl,
          isRegisteredUser: friendMember.isRegisteredUser,
          memberIds: [],
          balanceCents: 0,
          balance: 0,
          currency: group.currency,
          groups: [],
        };

        existing.balanceCents += currentPerspective;
        existing.memberIds = Array.from(new Set([...existing.memberIds, friendMember.id]));
        existing.groups.push({
          groupId: group.id,
          groupName: group.name,
          balanceCents: currentPerspective,
          balance: centsToMoney(currentPerspective),
          expenses: group.expenses.filter((expense: any) =>
            expense.paidByMemberId === friendMember.id ||
            expense.shares.some((share: any) => share.memberId === friendMember.id),
          ),
          settlements: group.settlements.filter((settlement: any) =>
            settlement.fromMemberId === friendMember.id ||
            settlement.toMemberId === friendMember.id,
          ),
        });
        existing.balance = centsToMoney(existing.balanceCents);
        friends.set(key, existing);
      }
    }

    return Array.from(friends.values()).sort((a, b) => Math.abs(b.balanceCents) - Math.abs(a.balanceCents));
  }

  private static accessWhere(userId: string) {
    return {
      OR: [
        { ownerUserId: userId },
        { members: { some: { userId } } },
      ],
    };
  }

  private static async getAccessibleGroup(groupId: string, userId: string) {
    const group = await prisma.splitGroup.findFirst({
      where: { id: groupId, ...this.accessWhere(userId) },
      include: groupInclude,
    });

    if (!group) throw new HttpError(404, "NOT_FOUND", "Split group not found");
    return group;
  }

  private static async assertGroupOwner(groupId: string, userId: string) {
    const group = await prisma.splitGroup.findFirst({ where: { id: groupId, ownerUserId: userId }, select: { id: true } });
    if (!group) throw new HttpError(404, "NOT_FOUND", "Split group not found");
    return group;
  }

  private static async assertCanEditGroupData(groupId: string, createdByUserId: string | null, userId: string) {
    const group = await prisma.splitGroup.findFirst({ where: { id: groupId, ownerUserId: userId }, select: { id: true } });
    if (group || createdByUserId === userId) return;
    throw new HttpError(403, "FORBIDDEN", "You cannot modify this split item.");
  }

  private static async assertMembersBelongToAccessibleGroup(groupId: string, userId: string, memberIds: string[]) {
    const group = await this.getAccessibleGroup(groupId, userId);
    const validMemberIds = new Set(group.members.map((member: any) => member.id));
    const uniqueMemberIds = Array.from(new Set(memberIds));

    if (uniqueMemberIds.some((memberId) => !validMemberIds.has(memberId))) {
      throw new HttpError(400, "VALIDATION_ERROR", "All split members must belong to this group.");
    }

    return group;
  }
}
