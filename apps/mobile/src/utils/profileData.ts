import type { User } from "../types/auth.types";

export function buildExportUser(user?: User | null): User | null {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    username: user.username ?? null,
    email: user.email,
    country: user.country,
    studentStatus: user.studentStatus,
    hourlyWageDefault: user.hourlyWageDefault ?? null,
    currency: user.currency,
    avatarUrl: user.avatarUrl ?? null,
    university: user.university ?? null,
    course: user.course ?? null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
