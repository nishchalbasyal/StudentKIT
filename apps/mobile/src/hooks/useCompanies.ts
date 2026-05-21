import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCompanyApi,
  deleteCompanyApi,
  getCompaniesApi,
  getCompanyApi,
  updateCompanyApi,
} from "../api/company.api";
import type { Company, CompanyInput } from "../types/company.types";

export function useCompanies() {
  const queryClient = useQueryClient();

  const companies = useQuery({
    queryKey: ["companies"],
    queryFn: getCompaniesApi,
  });

  const createMutation = useMutation({
    mutationFn: (input: CompanyInput) => createCompanyApi(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CompanyInput> }) =>
      updateCompanyApi(id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCompanyApi(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
  });

  return {
    companies,
    createCompany: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateCompany: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteCompany: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}

export function useCompanyDetail(id: string) {
  return useQuery({
    queryKey: ["company", id],
    queryFn: () => getCompanyApi(id),
    enabled: Boolean(id),
  });
}
