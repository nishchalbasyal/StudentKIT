import { apiClient, unwrap } from "./apiClient";
import { localDb } from "../storage/localDb";
import { syncQueue } from "../storage/syncQueue";
import { useAuthStore } from "../store/authStore";
import type {
  CreateSplitExpenseInput,
  CreateSplitGroupInput,
  CreateSplitMemberInput,
  RecordSettlementInput,
  SplitActivity,
  SplitBalance,
  SplitDebt,
  SplitExpense,
  SplitFriendBalance,
  SplitGroup,
  SplitMember,
  SplitSettlement,
  SplitSummary,
} from "../types/split.types";

function isOnlineAccount() {
  return useAuthStore.getState().isAuthenticated;
}

function centsToMoney(cents: number) {
  return Number((cents / 100).toFixed(2));
}

function expenseCents(expense: { amount: number; amountCents?: number | null }) {
  return expense.amountCents ?? Math.round(expense.amount * 100);
}

function memberKey(member: { userId?: string | null; email?: string | null; id: string }) {
  return member.userId ?? member.email?.toLowerCase() ?? member.id;
}

async function localGroups(): Promise<SplitGroup[]> {
  const [groups, members, expenses, settlements] = await Promise.all([
    localDb.list("splitGroups"),
    localDb.list("splitMembers"),
    localDb.list("splitExpenses"),
    localDb.list("splitSettlements"),
  ]);
  const currentUserId = useAuthStore.getState().user?.id ?? null;

  return groups.map((group) => {
    const groupMembers = members.filter((member) => member.groupId === group.id);
    const groupExpenses = expenses.filter((expense) => expense.groupId === group.id);
    const groupSettlements = settlements.filter((settlement) => settlement.groupId === group.id);
    const mappedMembers = groupMembers.map((member) => ({
      id: member.id,
      groupId: member.groupId,
      userId: member.userId,
      name: member.name,
      email: member.email ?? null,
      isCurrentUser: member.userId === currentUserId || member.name.toLowerCase() === "me",
      isRegisteredUser: Boolean(member.userId),
      createdAt: member.createdAt ?? new Date().toISOString(),
      updatedAt: member.updatedAt ?? new Date().toISOString(),
    }));
    const memberById = new Map(mappedMembers.map((member) => [member.id, member]));
    const mappedExpenses = groupExpenses.map((expense) => {
      const amountCents = expenseCents(expense);
      const fallbackShare = mappedMembers.length
        ? Math.floor(amountCents / mappedMembers.length)
        : amountCents;
      let remainder = mappedMembers.length ? amountCents % mappedMembers.length : 0;
      const shares = (expense.shares?.length
        ? expense.shares
        : mappedMembers.map((member) => {
            const extra = remainder > 0 ? 1 : 0;
            remainder -= extra;
            return { memberId: member.id, amountCents: fallbackShare + extra };
          })
      ).map((share) => ({
        memberId: share.memberId,
        amount: centsToMoney(share.amountCents),
        amountCents: share.amountCents,
        percentage: "percentage" in share ? share.percentage : undefined,
        member: memberById.get(share.memberId),
      }));

      return {
        id: expense.id,
        groupId: group.id,
        paidByMemberId: expense.paidByMemberId ?? "",
        title: expense.title,
        category: expense.category ?? null,
        amount: centsToMoney(amountCents),
        amountCents,
        currency: "EUR",
        date: expense.date,
        splitType: expense.splitType ?? "EQUAL",
        notes: expense.notes ?? null,
        createdAt: expense.createdAt ?? new Date().toISOString(),
        updatedAt: expense.updatedAt ?? new Date().toISOString(),
        paidBy: expense.paidByMemberId ? memberById.get(expense.paidByMemberId) : undefined,
        payers: expense.paidByMemberId
          ? [{
              memberId: expense.paidByMemberId,
              amount: centsToMoney(amountCents),
              amountCents,
              member: memberById.get(expense.paidByMemberId),
            }]
          : [],
        shares,
        group: { id: group.id, name: group.name, currency: "EUR" },
        balanceEffect: [],
      } as SplitExpense;
    });
    const mappedSettlements = groupSettlements.map((settlement) => {
      const amountCents = expenseCents(settlement);
      return {
        id: settlement.id,
        groupId: group.id,
        fromMemberId: settlement.fromMemberId,
        toMemberId: settlement.toMemberId,
        amount: centsToMoney(amountCents),
        amountCents,
        currency: settlement.currency ?? "EUR",
        date: settlement.date,
        notes: settlement.notes ?? null,
        fromMember: memberById.get(settlement.fromMemberId),
        toMember: memberById.get(settlement.toMemberId),
      } as SplitSettlement;
    });
    const balances = mappedMembers.map((member) => {
      const totalPaidCents = mappedExpenses
        .flatMap((expense) => expense.payers ?? [])
        .filter((payer) => payer.memberId === member.id)
        .reduce((sum, payer) => sum + payer.amountCents, 0);
      const totalShareCents = mappedExpenses
        .flatMap((expense) => expense.shares ?? [])
        .filter((share) => share.memberId === member.id)
        .reduce((sum, share) => sum + share.amountCents, 0);
      const settlementCents = mappedSettlements.reduce((sum, settlement) => {
        if (settlement.fromMemberId === member.id) return sum + settlement.amountCents;
        if (settlement.toMemberId === member.id) return sum - settlement.amountCents;
        return sum;
      }, 0);
      const netCents = totalPaidCents - totalShareCents + settlementCents;
      return {
        memberId: member.id,
        member,
        totalPaidCents,
        totalPaid: centsToMoney(totalPaidCents),
        totalShareCents,
        totalShare: centsToMoney(totalShareCents),
        settlementCents,
        settlement: centsToMoney(settlementCents),
        netCents,
        net: centsToMoney(netCents),
      } as SplitBalance;
    });
    const simplifiedDebts = simplifyLocalDebts(balances);
    const currentMember = mappedMembers.find((member) => member.isCurrentUser);
    const currentUserBalanceCents = currentMember
      ? balances.find((balance) => balance.memberId === currentMember.id)?.netCents ?? 0
      : 0;
    const totalAmountCents = mappedExpenses.reduce((sum, expense) => sum + expense.amountCents, 0);

    return {
      id: group.id,
      userId: group.userId ?? "guest",
      ownerUserId: group.userId ?? "guest",
      name: group.name,
      description: group.description ?? null,
      currency: "EUR",
      archivedAt: group.archivedAt ?? null,
      totalAmount: centsToMoney(totalAmountCents),
      totalAmountCents,
      currentUserBalance: centsToMoney(currentUserBalanceCents),
      currentUserBalanceCents,
      createdAt: group.createdAt ?? new Date().toISOString(),
      updatedAt: group.updatedAt ?? new Date().toISOString(),
      members: mappedMembers,
      expenses: mappedExpenses,
      settlements: mappedSettlements,
      balances,
      simplifiedDebts,
    };
  });
}

function simplifyLocalDebts(balances: SplitBalance[]): SplitDebt[] {
  const debtors = balances
    .filter((row) => row.netCents < 0)
    .map((row) => ({ ...row, remaining: Math.abs(row.netCents) }))
    .sort((a, b) => b.remaining - a.remaining);
  const creditors = balances
    .filter((row) => row.netCents > 0)
    .map((row) => ({ ...row, remaining: row.netCents }))
    .sort((a, b) => b.remaining - a.remaining);
  const debts: SplitDebt[] = [];
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
        amount: centsToMoney(amountCents),
        amountCents,
      });
    }

    debtor.remaining -= amountCents;
    creditor.remaining -= amountCents;
    if (debtor.remaining === 0) debtorIndex += 1;
    if (creditor.remaining === 0) creditorIndex += 1;
  }

  return debts;
}

export const splitApi = {
  async getSummary() {
    if (isOnlineAccount()) {
      try {
        return unwrap<SplitSummary>(await apiClient.get("/split/summary"));
      } catch {
        // Local fallback below.
      }
    }
    const groups = await localGroups();
    const balanceCents = groups.reduce((sum, group) => sum + group.currentUserBalanceCents, 0);
    return {
      balance: centsToMoney(balanceCents),
      balanceCents,
      currency: "EUR",
      groupsCount: groups.length,
      expenseCount: groups.reduce((sum, group) => sum + group.expenses.length, 0),
      status: "local",
    };
  },
  async getGroups() {
    if (isOnlineAccount()) {
      try {
        const remote = unwrap<SplitGroup[]>(await apiClient.get("/split/groups"));
        return remote;
      } catch {
        // Local fallback below.
      }
    }
    return localGroups();
  },
  async getGroupDetail(id: string) {
    if (isOnlineAccount()) {
      try {
        return unwrap<SplitGroup>(await apiClient.get(`/split/groups/${id}`));
      } catch {
        // Local fallback below.
      }
    }
    const group = (await localGroups()).find((item) => item.id === id);
    if (!group) throw new Error("Split group not found");
    return group;
  },
  async createGroup(input: CreateSplitGroupInput) {
    if (isOnlineAccount()) {
      try {
        return unwrap<SplitGroup>(await apiClient.post("/split/groups", input));
      } catch {
        // Local fallback below.
      }
    }
    const group = await localDb.create("splitGroups", {
      name: input.name,
      description: input.description ?? null,
      userId: useAuthStore.getState().user?.id ?? null,
      archivedAt: null,
    });
    const currentUser = useAuthStore.getState().user;
    const inputMembers = input.members?.length ? input.members : [];
    const hasCurrent = inputMembers.some((member) => member.isCurrentUser || member.userId === currentUser?.id || member.name.toLowerCase() === "me");
    const members = hasCurrent
      ? inputMembers
      : [{ name: "Me", email: currentUser?.email ?? null, userId: currentUser?.id ?? null, isCurrentUser: true }, ...inputMembers];
    await Promise.all(
      members.map((member) =>
      localDb.create("splitMembers", {
          groupId: group.id,
          name: member.name,
          email: member.email ?? null,
          userId: member.userId ?? null,
        }),
      ),
    );
    if (isOnlineAccount()) {
      await syncQueue.enqueue({ entityType: "splitGroup", entityId: group.id, operation: "CREATE", payload: input });
    }
    return (await localGroups()).find((item) => item.id === group.id) as SplitGroup;
  },
  async updateGroup(id: string, input: Partial<CreateSplitGroupInput> & { archivedAt?: string | null }) {
    if (isOnlineAccount()) {
      try {
        return unwrap<SplitGroup>(await apiClient.put(`/split/groups/${id}`, input));
      } catch {
        // Local fallback below.
      }
    }
    await localDb.update("splitGroups", id, {
      name: input.name,
      description: input.description,
      archivedAt: input.archivedAt,
    });
    if (isOnlineAccount()) {
      await syncQueue.enqueue({ entityType: "splitGroup", entityId: id, operation: "UPDATE", payload: input });
    }
    return (await localGroups()).find((item) => item.id === id) as SplitGroup;
  },
  async archiveGroup(id: string) {
    return unwrap<SplitGroup>(await apiClient.put(`/split/groups/${id}`, { archivedAt: new Date().toISOString() }));
  },
  async deleteGroup(id: string) {
    if (isOnlineAccount()) {
      try {
        return unwrap<{ id: string }>(await apiClient.delete(`/split/groups/${id}`));
      } catch {
        // Local fallback below.
      }
    }
    await localDb.remove("splitGroups", id);
    if (isOnlineAccount()) {
      await syncQueue.enqueue({ entityType: "splitGroup", entityId: id, operation: "DELETE", payload: { id } });
    }
    return { id };
  },
  async getMembers(groupId: string) {
    if (isOnlineAccount()) {
      try {
        return unwrap<SplitMember[]>(await apiClient.get(`/split/groups/${groupId}/members`));
      } catch {
        // Local fallback below.
      }
    }
    const members = (await localDb.list("splitMembers")).filter((member) => member.groupId === groupId);
    return members.map((member) => ({
      id: member.id,
      groupId,
      userId: member.userId,
      name: member.name,
      email: member.email ?? null,
      isCurrentUser: member.name.toLowerCase() === "me",
      isRegisteredUser: Boolean(member.userId),
      createdAt: member.createdAt ?? new Date().toISOString(),
      updatedAt: member.updatedAt ?? new Date().toISOString(),
    }));
  },
  async addMember(groupId: string, input: CreateSplitMemberInput) {
    if (isOnlineAccount()) {
      try {
        return unwrap<SplitMember>(await apiClient.post(`/split/groups/${groupId}/members`, input));
      } catch {
        // Local fallback below.
      }
    }
    const member = await localDb.create("splitMembers", {
      groupId,
      name: input.name,
      email: input.email ?? null,
      userId: input.userId ?? null,
    });
    return {
      id: member.id,
      groupId,
      userId: member.userId,
      name: member.name,
      email: member.email ?? null,
      isCurrentUser: input.isCurrentUser ?? false,
      isRegisteredUser: Boolean(input.userId),
      createdAt: member.createdAt ?? new Date().toISOString(),
      updatedAt: member.updatedAt ?? new Date().toISOString(),
    };
  },
  async updateMember(groupId: string, memberId: string, input: Partial<CreateSplitMemberInput>) {
    if (isOnlineAccount()) {
      try {
        return unwrap<SplitMember>(await apiClient.put(`/split/groups/${groupId}/members/${memberId}`, input));
      } catch {
        // Local fallback below.
      }
    }
    await localDb.update("splitMembers", memberId, {
      name: input.name,
      email: input.email,
      userId: input.userId,
    });
    return (await this.getMembers(groupId)).find((member) => member.id === memberId) as SplitMember;
  },
  async removeMember(groupId: string, memberId: string) {
    if (isOnlineAccount()) {
      try {
        return unwrap<{ id: string }>(await apiClient.delete(`/split/groups/${groupId}/members/${memberId}`));
      } catch {
        // Local fallback below.
      }
    }
    await localDb.remove("splitMembers", memberId);
    return { id: memberId };
  },
  async createExpense(groupId: string, input: CreateSplitExpenseInput) {
    if (isOnlineAccount()) {
      try {
        return unwrap<SplitExpense>(await apiClient.post(`/split/groups/${groupId}/expenses`, input));
      } catch {
        // Local fallback below.
      }
    }
    const expense = await localDb.create("splitExpenses", {
      groupId,
      title: input.title,
      category: input.category ?? null,
      amount: input.amountCents / 100,
      amountCents: input.amountCents,
      paidByMemberId: input.paidByMemberId,
      date: input.date,
      splitType: input.splitType,
      notes: input.notes ?? null,
      shares: input.shares.map((share) => ({
        memberId: share.memberId,
        amountCents: share.amountCents ?? 0,
        percentage: share.percentage,
      })),
    });
    if (isOnlineAccount()) {
      await syncQueue.enqueue({ entityType: "splitExpense", entityId: expense.id, operation: "CREATE", payload: { groupId, ...input } });
    }
    return (await this.getExpenses(groupId)).find((item) => item.id === expense.id) as SplitExpense;
  },
  async getExpenses(groupId: string) {
    if (isOnlineAccount()) {
      try {
        return unwrap<SplitExpense[]>(await apiClient.get(`/split/groups/${groupId}/expenses`));
      } catch {
        // Local fallback below.
      }
    }
    return (await localGroups()).find((group) => group.id === groupId)?.expenses ?? [];
  },
  async getExpense(expenseId: string) {
    if (isOnlineAccount()) {
      try {
        return unwrap<SplitExpense>(await apiClient.get(`/split/expenses/${expenseId}`));
      } catch {
        // Local fallback below.
      }
    }
    const groups = await localGroups();
    const group = groups.find((item) => item.expenses.some((expense) => expense.id === expenseId));
    const expense = group?.expenses.find((item) => item.id === expenseId);
    if (!expense) throw new Error("Split expense not found");
    const balanceEffect = simplifyLocalDebts(
      (group?.members ?? []).map((member) => {
        const paid = expense.paidByMemberId === member.id ? expense.amountCents : 0;
        const share = expense.shares.find((item) => item.memberId === member.id)?.amountCents ?? 0;
        return {
          memberId: member.id,
          member,
          totalPaidCents: paid,
          totalPaid: centsToMoney(paid),
          totalShareCents: share,
          totalShare: centsToMoney(share),
          settlementCents: 0,
          settlement: 0,
          netCents: paid - share,
          net: centsToMoney(paid - share),
        };
      }),
    );
    return { ...expense, balanceEffect };
  },
  async updateExpense(expenseId: string, input: Partial<CreateSplitExpenseInput>) {
    if (isOnlineAccount()) {
      try {
        return unwrap<SplitExpense>(await apiClient.put(`/split/expenses/${expenseId}`, input));
      } catch {
        // Local fallback below.
      }
    }
    await localDb.update("splitExpenses", expenseId, {
      title: input.title,
      amount: input.amountCents ? input.amountCents / 100 : undefined,
      amountCents: input.amountCents,
      category: input.category,
      paidByMemberId: input.paidByMemberId,
      date: input.date,
      splitType: input.splitType,
      notes: input.notes,
      shares: input.shares?.map((share) => ({
        memberId: share.memberId,
        amountCents: share.amountCents ?? 0,
        percentage: share.percentage,
      })),
    });
    return this.getExpense(expenseId);
  },
  async deleteExpense(expenseId: string) {
    if (isOnlineAccount()) {
      try {
        return unwrap<{ id: string }>(await apiClient.delete(`/split/expenses/${expenseId}`));
      } catch {
        // Local fallback below.
      }
    }
    await localDb.remove("splitExpenses", expenseId);
    return { id: expenseId };
  },
  async getBalances(groupId: string) {
    if (isOnlineAccount()) {
      try {
        return unwrap<SplitBalance[]>(await apiClient.get(`/split/groups/${groupId}/balances`));
      } catch {
        // Local fallback below.
      }
    }
    return (await localGroups()).find((group) => group.id === groupId)?.balances ?? [];
  },
  async recordSettlement(groupId: string, input: RecordSettlementInput) {
    if (isOnlineAccount()) {
      try {
        return unwrap<SplitSettlement>(await apiClient.post(`/split/groups/${groupId}/settlements`, input));
      } catch {
        // Local fallback below.
      }
    }
    const settlement = await localDb.create("splitSettlements", {
      groupId,
      fromMemberId: input.fromMemberId,
      toMemberId: input.toMemberId,
      amount: input.amountCents / 100,
      amountCents: input.amountCents,
      currency: "EUR",
      date: input.date ?? new Date().toISOString().slice(0, 10),
      notes: input.notes ?? null,
      status: "paid",
      paidAt: new Date().toISOString(),
    });
    if (isOnlineAccount()) {
      await syncQueue.enqueue({ entityType: "splitSettlement", entityId: settlement.id, operation: "CREATE", payload: { groupId, ...input } });
    }
    return (await this.getSettlements(groupId)).find((item) => item.id === settlement.id) as SplitSettlement;
  },
  async getSettlements(groupId: string) {
    if (isOnlineAccount()) {
      try {
        return unwrap<SplitSettlement[]>(await apiClient.get(`/split/groups/${groupId}/settlements`));
      } catch {
        // Local fallback below.
      }
    }
    return (await localGroups()).find((group) => group.id === groupId)?.settlements ?? [];
  },
  async deleteSettlement(settlementId: string) {
    if (isOnlineAccount()) {
      try {
        return unwrap<{ id: string }>(await apiClient.delete(`/split/settlements/${settlementId}`));
      } catch {
        // Local fallback below.
      }
    }
    return { id: settlementId };
  },
  async getFriendsBalances() {
    if (isOnlineAccount()) {
      try {
        return unwrap<SplitFriendBalance[]>(await apiClient.get("/split/friends/balances"));
      } catch {
        // Local fallback below.
      }
    }
    const groups = await localGroups();
    const friends = new Map<string, SplitFriendBalance>();
    for (const group of groups) {
      const currentMember = group.members.find((member) => member.isCurrentUser);
      if (!currentMember) continue;
      for (const debt of group.simplifiedDebts ?? []) {
        const friend =
          debt.fromMemberId === currentMember.id
            ? debt.toMember
            : debt.toMemberId === currentMember.id
              ? debt.fromMember
              : null;
        if (!friend) continue;
        const currentPerspective = debt.toMemberId === currentMember.id ? debt.amountCents : -debt.amountCents;
        const key = memberKey(friend);
        const existing = friends.get(key) ?? {
          id: key,
          name: friend.name,
          email: friend.email,
          isRegisteredUser: friend.isRegisteredUser,
          memberIds: [],
          balance: 0,
          balanceCents: 0,
          currency: group.currency,
          groups: [],
          expenses: [],
          settlements: [],
        };
        existing.balanceCents += currentPerspective;
        existing.balance = centsToMoney(existing.balanceCents);
        existing.memberIds = Array.from(new Set([...existing.memberIds, friend.id]));
        existing.groups.push({
          groupId: group.id,
          groupName: group.name,
          balance: centsToMoney(currentPerspective),
          balanceCents: currentPerspective,
          expenses: group.expenses.filter((expense) => expense.paidByMemberId === friend.id || expense.shares.some((share) => share.memberId === friend.id)),
          settlements: group.settlements.filter((settlement) => settlement.fromMemberId === friend.id || settlement.toMemberId === friend.id),
        });
        existing.expenses = [...(existing.expenses ?? []), ...group.expenses];
        existing.settlements = [...(existing.settlements ?? []), ...group.settlements];
        friends.set(key, existing);
      }
    }
    return Array.from(friends.values()).sort((a, b) => Math.abs(b.balanceCents) - Math.abs(a.balanceCents));
  },
  async getFriend(friendId: string) {
    if (isOnlineAccount()) {
      try {
        return unwrap<SplitFriendBalance>(await apiClient.get(`/split/friends/${encodeURIComponent(friendId)}`));
      } catch {
        // Local fallback below.
      }
    }
    const friend = (await this.getFriendsBalances()).find((item) => item.id === friendId || item.memberIds.includes(friendId));
    if (!friend) throw new Error("Friend balance not found");
    return friend;
  },
  async getActivity() {
    if (isOnlineAccount()) {
      try {
        return unwrap<SplitActivity[]>(await apiClient.get("/split/activity"));
      } catch {
        // Local fallback below.
      }
    }
    return [];
  },
  async getGroupActivity(groupId: string) {
    if (isOnlineAccount()) {
      try {
        return unwrap<SplitActivity[]>(await apiClient.get(`/split/groups/${groupId}/activity`));
      } catch {
        // Local fallback below.
      }
    }
    void groupId;
    return [];
  },
};
