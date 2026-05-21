import type { Company, CompanyInput } from "../types/company.types";
import { apiClient, unwrap } from "./apiClient";
import { localDb } from "../storage/localDb";
import { syncQueue } from "../storage/syncQueue";
import { useAuthStore } from "../store/authStore";

function toCompany(input: CompanyInput, id?: string): Omit<Company, "id"> & { id?: string } {
  const timestamp = new Date().toISOString();
  return {
    id,
    userId: useAuthStore.getState().user?.id ?? "guest",
    name: input.name,
    industry: input.industry ?? null,
    location: input.location ?? null,
    contact: input.contact ?? null,
    phone: input.phone ?? null,
    email: input.email ?? null,
    website: input.website ?? null,
    defaultHourlyWage: input.defaultHourlyWage ?? null,
    defaultBreakMinutes: input.defaultBreakMinutes ?? 0,
    defaultBonusType: input.defaultBonusType ?? "NONE",
    defaultBonusValue: input.defaultBonusValue ?? null,
    color: input.color ?? null,
    commonStartTime: input.commonStartTime ?? null,
    commonEndTime: input.commonEndTime ?? null,
    isArchived: false,
    archivedAt: null,
    notes: input.notes ?? null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export async function getCompaniesApi() {
  if (!useAuthStore.getState().isAuthenticated) return localDb.list("companies") as Promise<Company[]>;
  try {
    const remote = unwrap<Company[]>(await apiClient.get("/companies"));
    await localDb.replace("companies", await remote);
    return remote;
  } catch {
    return localDb.list("companies") as Promise<Company[]>;
  }
}

export async function getCompanyApi(id: string) {
  if (useAuthStore.getState().isAuthenticated) {
    try {
      return unwrap<Company>(await apiClient.get(`/companies/${id}`));
    } catch {
      // Local fallback below.
    }
  }
  const company = await localDb.find("companies", id);
  if (!company) throw new Error("Company not found");
  return company as Company;
}

export async function createCompanyApi(input: CompanyInput) {
  if (useAuthStore.getState().isAuthenticated) {
    try {
      const remote = unwrap<Company>(await apiClient.post("/companies", input));
      await localDb.upsert("companies", await remote);
      return remote;
    } catch {
      // Local fallback below.
    }
  }
  const local = await localDb.create("companies", toCompany(input));
  if (useAuthStore.getState().isAuthenticated) {
    await syncQueue.enqueue({ entityType: "company", entityId: local.id, operation: "CREATE", payload: local });
  }
  return local as Company;
}

export async function updateCompanyApi(
  id: string,
  input: Partial<CompanyInput>,
) {
  const local = await localDb.update("companies", id, input as never);
  if (useAuthStore.getState().isAuthenticated) {
    try {
      const remote = unwrap<Company>(await apiClient.put(`/companies/${id}`, input));
      await localDb.upsert("companies", await remote);
      return remote;
    } catch {
      await syncQueue.enqueue({ entityType: "company", entityId: id, operation: "UPDATE", payload: local ?? input });
    }
  }
  return local as Company;
}

export async function deleteCompanyApi(id: string) {
  await localDb.remove("companies", id);
  if (useAuthStore.getState().isAuthenticated) {
    try {
      return unwrap<{ id: string }>(await apiClient.delete(`/companies/${id}`));
    } catch {
      await syncQueue.enqueue({ entityType: "company", entityId: id, operation: "DELETE", payload: { id } });
    }
  }
  return { id };
}
