import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { splitApi } from "../api/split.api";
import { reminderEngine } from "../services/reminderEngine";
import type {
  CreateSplitExpenseInput,
  CreateSplitGroupInput,
  CreateSplitMemberInput,
  RecordSettlementInput,
} from "../types/split.types";

export const splitKeys = {
  all: ["split"] as const,
  summary: ["split", "summary"] as const,
  groups: ["split", "groups"] as const,
  group: (groupId?: string) => ["split", "group", groupId] as const,
  balances: (groupId?: string) => ["split", "group", groupId, "balances"] as const,
  expenses: (groupId?: string) => ["split", "group", groupId, "expenses"] as const,
  settlements: (groupId?: string) => ["split", "group", groupId, "settlements"] as const,
  friends: ["split", "friends"] as const,
  friend: (friendId?: string) => ["split", "friend", friendId] as const,
  activity: ["split", "activity"] as const,
  groupActivity: (groupId?: string) => ["split", "group", groupId, "activity"] as const,
};

function useInvalidateSplit() {
  const queryClient = useQueryClient();
  return async (groupId?: string) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: splitKeys.summary }),
      queryClient.invalidateQueries({ queryKey: splitKeys.groups }),
      queryClient.invalidateQueries({ queryKey: splitKeys.friends }),
      queryClient.invalidateQueries({ queryKey: splitKeys.activity }),
      groupId ? queryClient.invalidateQueries({ queryKey: splitKeys.group(groupId) }) : Promise.resolve(),
      groupId ? queryClient.invalidateQueries({ queryKey: splitKeys.balances(groupId) }) : Promise.resolve(),
      groupId ? queryClient.invalidateQueries({ queryKey: splitKeys.expenses(groupId) }) : Promise.resolve(),
      groupId ? queryClient.invalidateQueries({ queryKey: splitKeys.settlements(groupId) }) : Promise.resolve(),
      groupId ? queryClient.invalidateQueries({ queryKey: splitKeys.groupActivity(groupId) }) : Promise.resolve(),
    ]);
  };
}

export const useSplitSummary = () => {
  return useQuery({ queryKey: splitKeys.summary, queryFn: splitApi.getSummary });
};

export const useSplitGroups = () => {
  const queryClient = useQueryClient();
  const invalidateSplit = useInvalidateSplit();
  const groupsQuery = useQuery({ queryKey: splitKeys.groups, queryFn: splitApi.getGroups });

  const createMutation = useMutation({
    mutationFn: (input: CreateSplitGroupInput) => splitApi.createGroup(input),
    onSuccess: async () => {
      await invalidateSplit();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => splitApi.deleteGroup(id),
    onSuccess: async () => {
      await invalidateSplit();
      await queryClient.removeQueries({ queryKey: splitKeys.all, exact: false });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => splitApi.archiveGroup(id),
    onSuccess: async (group) => {
      await invalidateSplit(group.id);
    },
  });

  return {
    groups: groupsQuery.data ?? [],
    isLoading: groupsQuery.isLoading,
    isError: groupsQuery.isError,
    refetch: groupsQuery.refetch,
    createGroup: createMutation.mutateAsync,
    deleteGroup: deleteMutation.mutateAsync,
    archiveGroup: archiveMutation.mutateAsync,
    isSaving: createMutation.isPending || deleteMutation.isPending || archiveMutation.isPending,
  };
};

export const useSplitGroupDetail = (groupId?: string) => {
  const invalidateSplit = useInvalidateSplit();
  const groupQuery = useQuery({
    queryKey: splitKeys.group(groupId),
    queryFn: () => splitApi.getGroupDetail(groupId!),
    enabled: !!groupId,
  });

  const updateGroupMutation = useMutation({
    mutationFn: (input: Partial<CreateSplitGroupInput> & { archivedAt?: string | null }) => splitApi.updateGroup(groupId!, input),
    onSuccess: async () => {
      await invalidateSplit(groupId);
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: (input: CreateSplitMemberInput) => splitApi.addMember(groupId!, input),
    onSuccess: async () => {
      await invalidateSplit(groupId);
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) => splitApi.removeMember(groupId!, memberId),
    onSuccess: async () => {
      await invalidateSplit(groupId);
    },
  });

  return {
    group: groupQuery.data,
    isLoading: groupQuery.isLoading,
    isError: groupQuery.isError,
    refetch: groupQuery.refetch,
    updateGroup: updateGroupMutation.mutateAsync,
    addMember: addMemberMutation.mutateAsync,
    removeMember: removeMemberMutation.mutateAsync,
    isSaving: updateGroupMutation.isPending || addMemberMutation.isPending || removeMemberMutation.isPending,
  };
};

export const useSplitExpenses = (groupId?: string) => {
  const invalidateSplit = useInvalidateSplit();
  const expensesQuery = useQuery({
    queryKey: splitKeys.expenses(groupId),
    queryFn: () => splitApi.getExpenses(groupId!),
    enabled: !!groupId,
  });

  const createMutation = useMutation({
    mutationFn: (input: CreateSplitExpenseInput) => splitApi.createExpense(groupId!, input),
    onSuccess: async () => {
      await invalidateSplit(groupId);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ expenseId, input }: { expenseId: string; input: Partial<CreateSplitExpenseInput> }) => splitApi.updateExpense(expenseId, input),
    onSuccess: async () => {
      await invalidateSplit(groupId);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (expenseId: string) => splitApi.deleteExpense(expenseId),
    onSuccess: async () => {
      await invalidateSplit(groupId);
    },
  });

  return {
    expenses: expensesQuery.data ?? [],
    isLoading: expensesQuery.isLoading,
    isError: expensesQuery.isError,
    createExpense: createMutation.mutateAsync,
    updateExpense: updateMutation.mutateAsync,
    deleteExpense: deleteMutation.mutateAsync,
    isSaving: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
  };
};

export const useSplitExpenseDetail = (expenseId?: string) => {
  return useQuery({
    queryKey: ["split", "expense", expenseId],
    queryFn: () => splitApi.getExpense(expenseId!),
    enabled: !!expenseId,
  });
};

export const useSplitBalances = (groupId?: string) => {
  return useQuery({
    queryKey: splitKeys.balances(groupId),
    queryFn: () => splitApi.getBalances(groupId!),
    enabled: !!groupId,
  });
};

export const useSplitSettlements = (groupId?: string) => {
  return useQuery({
    queryKey: splitKeys.settlements(groupId),
    queryFn: () => splitApi.getSettlements(groupId!),
    enabled: !!groupId,
  });
};

export const useSplitSettlement = (groupId?: string) => {
  const invalidateSplit = useInvalidateSplit();
  const mutation = useMutation({
    mutationFn: (input: RecordSettlementInput) => splitApi.recordSettlement(groupId!, input),
    onSuccess: async () => {
      if (groupId) {
        await reminderEngine.createForSplit(groupId, "Review split settlement");
      }
      await invalidateSplit(groupId);
    },
  });

  return { recordSettlement: mutation.mutateAsync, isLoading: mutation.isPending };
};

export const useSplitFriends = () => {
  return useQuery({ queryKey: splitKeys.friends, queryFn: splitApi.getFriendsBalances });
};

export const useSplitFriendDetail = (friendId?: string) => {
  return useQuery({
    queryKey: splitKeys.friend(friendId),
    queryFn: () => splitApi.getFriend(friendId!),
    enabled: !!friendId,
  });
};

export const useSplitActivity = () => {
  return useQuery({ queryKey: splitKeys.activity, queryFn: splitApi.getActivity });
};

export const useSplitGroupActivity = (groupId?: string) => {
  return useQuery({
    queryKey: splitKeys.groupActivity(groupId),
    queryFn: () => splitApi.getGroupActivity(groupId!),
    enabled: !!groupId,
  });
};
