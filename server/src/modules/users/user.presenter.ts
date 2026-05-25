export type PublicUserSource = {
  id: string;
  name: string;
  email: string;
  country: string;
  studentStatus: string;
  hourlyWageDefault: unknown;
  currency: string;
  avatarUrl?: string | null;
  university?: string | null;
  course?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export function toPublicUser(user: PublicUserSource) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    country: user.country,
    studentStatus: user.studentStatus,
    hourlyWageDefault: user.hourlyWageDefault,
    currency: user.currency,
    avatarUrl: user.avatarUrl ?? null,
    university: user.university ?? null,
    course: user.course ?? null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
