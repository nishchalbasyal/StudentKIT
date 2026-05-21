export type StudentStatus = "INTERNATIONAL" | "EU_EEA_SWISS" | "GERMAN" | "OTHER";

export type User = {
  id: string;
  name: string;
  email: string;
  country: string;
  studentStatus: StudentStatus;
  hourlyWageDefault?: number | null;
  currency: string;
  avatarUrl?: string | null;
  university?: string | null;
  course?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
};

export type AuthResponse = {
  user: User;
  tokens: AuthTokens;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = LoginInput & {
  name: string;
  country: string;
  studentStatus: StudentStatus;
  currency: string;
  hourlyWageDefault?: number;
};
