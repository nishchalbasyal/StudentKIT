import { apiClient, unwrap } from "./apiClient";
import type { User } from "../types/auth.types";

export type SearchUserResult = {
  id: string;
  name: string;
  email: string;
};

export type UserSummary = {
  totalSaved: number;
  workStreak: number;
  expensesTracked: number;
  tasksCompleted: number;
  activeSplitGroups: number;
  currency: string;
};

export type UpdateUserInput = Partial<
  Pick<User, "name" | "email" | "country" | "studentStatus" | "hourlyWageDefault" | "currency" | "avatarUrl" | "university" | "course">
> & {
  yearlyWorkLimitDays?: number;
};

export const usersApi = {
  async getMe() {
    return unwrap<User>(await apiClient.get("/users/me"));
  },
  async updateMe(input: UpdateUserInput) {
    return unwrap<User>(await apiClient.put("/users/me", input));
  },
  async updateAvatar(avatarUrl: string | null) {
    return unwrap<User>(await apiClient.post("/users/avatar", { avatarUrl }));
  },
  async getSummary() {
    return unwrap<UserSummary>(await apiClient.get("/users/me/summary"));
  },
  async deleteMe() {
    return unwrap<{ id: string }>(await apiClient.delete("/users/me"));
  },
  async searchUsers(query: string) {
    return unwrap<SearchUserResult[]>(
      await apiClient.get("/users/search", { params: { q: query } }),
    );
  },
};
