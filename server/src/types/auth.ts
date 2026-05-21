import type { StudentStatus } from "@prisma/client";

export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string;
  country: string;
  studentStatus: StudentStatus;
  currency: string;
};

