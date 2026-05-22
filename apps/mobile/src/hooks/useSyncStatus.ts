import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { pullSyncApi } from "../api/sync.api";
import { syncQueue } from "../storage/syncQueue";

export function useSyncStatus() {
  const queryClient = useQueryClient();
  const pendingQuery = useQuery({
    queryKey: ["sync", "queue"],
    queryFn: () => syncQueue.pending(),
  });

  const snapshotQuery = useQuery({
    queryKey: ["sync", "snapshot"],
    queryFn: () => pullSyncApi(),
    enabled: false,
  });

  const syncMutation = useMutation({
    mutationFn: () => syncQueue.processWithBackend(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["sync", "queue"] });
    },
  });

  return {
    pendingItems: pendingQuery.data ?? [],
    pendingCount: pendingQuery.data?.length ?? 0,
    isLoading: pendingQuery.isLoading,
    isSyncing: syncMutation.isPending,
    isError: pendingQuery.isError,
    refetch: pendingQuery.refetch,
    syncNow: syncMutation.mutateAsync,
    pullSnapshot: snapshotQuery.refetch,
  };
}
