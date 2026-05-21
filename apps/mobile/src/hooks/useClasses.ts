import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClassApi, deleteClassApi, getClassesApi, updateClassApi } from "../api/classes.api";
import type { ClassInput } from "../types/class.types";

export function useClasses() {
  const queryClient = useQueryClient();
  const classes = useQuery({ queryKey: ["classes"], queryFn: getClassesApi });

  const createMutation = useMutation({
    mutationFn: (input: ClassInput) => createClassApi(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["classes"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<ClassInput> }) => updateClassApi(id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["classes"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteClassApi,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["classes"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });

  return {
    classes,
    createClass: createMutation.mutateAsync,
    updateClass: updateMutation.mutateAsync,
    deleteClass: deleteMutation.mutateAsync,
    isSaving: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending
  };
}

