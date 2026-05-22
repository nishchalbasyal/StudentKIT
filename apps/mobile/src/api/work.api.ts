import type {
  WorkShift,
  WorkShiftInput,
  WorkSummary,
} from "../types/work.types";
import { apiClient, unwrap } from "./apiClient";
import { localDb } from "../storage/localDb";
import { syncQueue } from "../storage/syncQueue";
import { useAuthStore } from "../store/authStore";
import { calculateWorkDuration } from "../utils/workMath";
import { defaultWorkLimitSummary } from "./workLimit.api";

function enrichShift(input: WorkShiftInput): Omit<WorkShift, "id"> {
  const duration = calculateWorkDuration(
    input.date,
    input.startTime,
    input.endTime,
    input.breakMinutes,
  );
  const calculatedHours = Math.max(0, duration.hours);
  return {
    ...input,
    companyId: input.companyId ?? null,
    bonusValue: input.bonusValue ?? null,
    notes: input.notes ?? null,
    calculatedHours,
    calculatedIncome: calculatedHours * input.hourlyWage,
  };
}

async function buildLocalWorkSummary(
  year: number,
  month: number,
): Promise<WorkSummary> {
  const shifts = await localDb.list("workEntries");
  const filtered = shifts.filter((shift) => {
    const date = new Date(`${shift.date}T12:00:00`);
    return date.getFullYear() === year && date.getMonth() + 1 === month;
  });
  const totalHours = filtered.reduce(
    (sum, shift) => sum + Number(shift.calculatedHours ?? 0),
    0,
  );
  const totalIncome = filtered.reduce(
    (sum, shift) => sum + Number(shift.calculatedIncome ?? 0),
    0,
  );

  return {
    year,
    month,
    totalHours,
    totalIncome,
    shiftCount: filtered.length,
    remainingLimitDays: null,
    remainingLimitHours: null,
    companies: [],
    workLimit: {
      ...defaultWorkLimitSummary,
      used: totalHours,
      usage: {
        ...defaultWorkLimitSummary.usage,
        usedFullDayUnits: totalHours,
      },
    },
    shifts: filtered,
  };
}

export async function getWorkShiftsApi() {
  if (!useAuthStore.getState().isAuthenticated)
    return localDb.list("workEntries");
  try {
    const remote = unwrap<WorkShift[]>(await apiClient.get("/work-shifts"));
    await localDb.replace("workEntries", await remote);
    return remote;
  } catch {
    return localDb.list("workEntries");
  }
}

export async function createWorkShiftApi(input: WorkShiftInput) {
  if (useAuthStore.getState().isAuthenticated) {
    try {
      const remote = unwrap<WorkShift>(
        await apiClient.post("/work-shifts", input),
      );
      await localDb.upsert("workEntries", await remote);
      return remote;
    } catch {
      // Local fallback below.
    }
  }
  const local = await localDb.create("workEntries", enrichShift(input));
  if (useAuthStore.getState().isAuthenticated) {
    await syncQueue.enqueue({
      entityType: "workEntry",
      entityId: local.id,
      operation: "CREATE",
      payload: local,
    });
  }
  return local;
}

export async function updateWorkShiftApi(
  id: string,
  input: Partial<WorkShiftInput>,
) {
  const current = await localDb.find("workEntries", id);
  const localInput = { ...(current ?? {}), ...input } as WorkShiftInput;
  const local = await localDb.update(
    "workEntries",
    id,
    enrichShift(localInput),
  );
  if (useAuthStore.getState().isAuthenticated) {
    try {
      const remote = unwrap<WorkShift>(
        await apiClient.put(`/work-shifts/${id}`, input),
      );
      await localDb.upsert("workEntries", await remote);
      return remote;
    } catch {
      await syncQueue.enqueue({
        entityType: "workEntry",
        entityId: id,
        operation: "UPDATE",
        payload: local ?? input,
      });
    }
  }
  return local as WorkShift;
}

export async function deleteWorkShiftApi(id: string) {
  await localDb.remove("workEntries", id);
  if (useAuthStore.getState().isAuthenticated) {
    try {
      return unwrap<{ id: string }>(
        await apiClient.delete(`/work-shifts/${id}`),
      );
    } catch {
      await syncQueue.enqueue({
        entityType: "workEntry",
        entityId: id,
        operation: "DELETE",
        payload: { id },
      });
    }
  }
  return { id };
}

export async function getMonthlyWorkSummaryApi(year: number, month: number) {
  if (!useAuthStore.getState().isAuthenticated)
    return buildLocalWorkSummary(year, month);
  try {
    return unwrap<WorkSummary>(
      await apiClient.get("/work-shifts/summary/monthly", {
        params: { year, month },
      }),
    );
  } catch {
    return buildLocalWorkSummary(year, month);
  }
}

export async function getMonthlyWorkSummaryByKeyApi(monthKey: string) {
  return unwrap<WorkSummary>(
    await apiClient.get("/work-shifts/summary/monthly", {
      params: { month: monthKey },
    }),
  );
}

export async function getWeeklyWorkSummaryApi(date?: string) {
  if (useAuthStore.getState().isAuthenticated) {
    try {
      return unwrap<Omit<WorkSummary, "year" | "month" | "workLimit">>(
        await apiClient.get("/work-shifts/summary/weekly", {
          params: { date },
        }),
      );
    } catch {
      // Local fallback below.
    }
  }
  const now = date ? new Date(`${date}T12:00:00`) : new Date();
  const summary = await buildLocalWorkSummary(
    now.getFullYear(),
    now.getMonth() + 1,
  );
  return {
    totalHours: summary.totalHours,
    totalIncome: summary.totalIncome,
    shiftCount: summary.shiftCount,
    shifts: summary.shifts,
  };
}
