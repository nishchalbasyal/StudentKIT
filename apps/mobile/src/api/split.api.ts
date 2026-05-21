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

async function localGroups(): Promise<SplitGroup[]> {
  const [groups, members, expenses] = await Promise.all([
    localDb.list("splitGroups"),
    localDb.list("splitMembers"),
    localDb.list("splitExpenses"),
  ]);
  return groups.map((group) => {
    const groupMembers = members.filter((member) => member.groupId === group.id);
    const groupExpenses = expenses.filter((expense) => expense.groupId === group.id);
    const totalAmount = groupExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    return {
      id: group.id,
      userId: group.userId ?? "guest",
      ownerUserId: group.userId ?? "guest",
      name: group.name,
      description: group.description ?? null,
      currency: "EUR",
      archivedAt: group.archivedAt ?? null,
      totalAmount,
      totalAmountCents: Math.round(totalAmount * 100),
      currentUserBalance: 0,
      currentUserBalanceCents: 0,
      createdAt: group.createdAt ?? new Date().toISOString(),
      updatedAt: group.updatedAt ?? new Date().toISOString(),
      members: groupMembers.map((member) => ({
        id: member.id,
        groupId: member.groupId,
        userId: member.userId,
        name: member.name,
        email: member.email ?? null,
        isCurrentUser: member.name.toLowerCase() === "me",
        isRegisteredUser: Boolean(member.userId),
        createdAt: member.createdAt ?? new Date().toISOString(),
        updatedAt: member.updatedAt ?? new Date().toISOString(),
      })),
      expenses: [],
      settlements: [],
      balances: [],
      simplifiedDebts: [],
    };
  });
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
    return {
      balance: 0,
      balanceCents: 0,
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
    const members = input.members.length ? input.members : [{ name: "Me", isCurrentUser: true }];
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
      amount: input.amountCents / 100,
      paidByMemberId: input.paidByMemberId,
      date: input.date,
      notes: input.notes ?? null,
    });
    return {
      id: expense.id,
      groupId,
      paidByMemberId: input.paidByMemberId,
      title: input.title,
      category: input.category ?? null,
      amount: input.amountCents / 100,
      amountCents: input.amountCents,
      currency: "EUR",
      date: input.date,
      splitType: input.splitType,
      notes: input.notes ?? null,
      createdAt: expense.createdAt ?? new Date().toISOString(),
      updatedAt: expense.updatedAt ?? new Date().toISOString(),
      shares: input.shares.map((share) => ({
        memberId: share.memberId,
        amount: (share.amountCents ?? 0) / 100,
        amountCents: share.amountCents ?? 0,
      })),
      group: { id: groupId, name: "", currency: "EUR" },
      paidBy: undefined,
      balanceEffect: [],
    } as SplitExpense;
  },
  async getExpenses(groupId: string) {
    if (isOnlineAccount()) {
      try {
        return unwrap<SplitExpense[]>(await apiClient.get(`/split/groups/${groupId}/expenses`));
      } catch {
        // Local fallback below.
      }
    }
    const expenses = (await localDb.list("splitExpenses")).filter((expense) => expense.groupId === groupId);
    return expenses.map((expense) => ({
      id: expense.id,
      groupId,
      paidByMemberId: expense.paidByMemberId ?? "",
      title: expense.title,
      amount: expense.amount,
      amountCents: Math.round(expense.amount * 100),
      currency: "EUR",
      date: expense.date,
      splitType: "EQUAL" as const,
      notes: expense.notes ?? null,
      createdAt: expense.createdAt ?? new Date().toISOString(),
      updatedAt: expense.updatedAt ?? new Date().toISOString(),
      shares: [],
      group: { id: groupId, name: "", currency: "EUR" },
      paidBy: undefined,
      balanceEffect: [],
    } as SplitExpense));
  },
  async getExpense(expenseId: string) {
    if (isOnlineAccount()) {
      try {
        return unwrap<SplitExpense>(await apiClient.get(`/split/expenses/${expenseId}`));
      } catch {
        // Local fallback below.
      }
    }
    const expense = (await localDb.list("splitExpenses")).find((item) => item.id === expenseId);
    if (!expense) throw new Error("Split expense not found");
    return {
      id: expense.id,
      groupId: expense.groupId,
      paidByMemberId: expense.paidByMemberId ?? "",
      title: expense.title,
      amount: expense.amount,
      amountCents: Math.round(expense.amount * 100),
      currency: "EUR",
      date: expense.date,
      splitType: "EQUAL" as const,
      notes: expense.notes ?? null,
      createdAt: expense.createdAt ?? new Date().toISOString(),
      updatedAt: expense.updatedAt ?? new Date().toISOString(),
      shares: [],
      group: { id: expense.groupId, name: "", currency: "EUR" },
      paidBy: undefined,
      balanceEffect: [],
    } as SplitExpense;
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
      paidByMemberId: input.paidByMemberId,
      date: input.date,
      notes: input.notes,
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
    void groupId;
    return [];
  },
  async recordSettlement(groupId: string, input: RecordSettlementInput) {
    if (isOnlineAccount()) {
      try {
        return unwrap<SplitSettlement>(await apiClient.post(`/split/groups/${groupId}/settlements`, input));
      } catch {
        // Local fallback below.
      }
    }
    return {
      id: `settlement_${Date.now()}`,
      groupId,
      fromMemberId: input.fromMemberId,
      toMemberId: input.toMemberId,
      amount: input.amountCents / 100,
      amountCents: input.amountCents,
      currency: "EUR",
      date: input.date ?? new Date().toISOString(),
      notes: input.notes ?? null,
    };
  },
  async getSettlements(groupId: string) {
    if (isOnlineAccount()) {
      try {
        return unwrap<SplitSettlement[]>(await apiClient.get(`/split/groups/${groupId}/settlements`));
      } catch {
        // Local fallback below.
      }
    }
    void groupId;
    return [];
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
    return [];
  },
  async getFriend(friendId: string) {
    if (isOnlineAccount()) {
      try {
        return unwrap<SplitFriendBalance>(await apiClient.get(`/split/friends/${encodeURIComponent(friendId)}`));
      } catch {
        // Local fallback below.
      }
    }
    return {
      id: friendId,
      name: "Local member",
      memberIds: [friendId],
      balance: 0,
      balanceCents: 0,
      currency: "EUR",
      groups: [],
    };
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
