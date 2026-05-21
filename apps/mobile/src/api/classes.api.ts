import type { ClassInput, ClassSchedule } from "../types/class.types";
import { apiClient, unwrap } from "./apiClient";

export async function getClassesApi() {
  return unwrap<ClassSchedule[]>(await apiClient.get("/classes"));
}

export async function getWeeklyClassesApi() {
  return unwrap<Array<{ dayOfWeek: string; classes: ClassSchedule[] }>>(
    await apiClient.get("/classes/week")
  );
}

export async function createClassApi(input: ClassInput) {
  return unwrap<ClassSchedule>(await apiClient.post("/classes", input));
}

export async function updateClassApi(id: string, input: Partial<ClassInput>) {
  return unwrap<ClassSchedule>(await apiClient.put(`/classes/${id}`, input));
}

export async function deleteClassApi(id: string) {
  return unwrap<{ id: string }>(await apiClient.delete(`/classes/${id}`));
}

