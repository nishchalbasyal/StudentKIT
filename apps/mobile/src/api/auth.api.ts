import type { AuthResponse, LoginInput, RegisterInput, User } from "../types/auth.types";
import { apiClient, unwrap } from "./apiClient";

export async function loginApi(input: LoginInput) {
  return unwrap<AuthResponse>(await apiClient.post("/auth/login", input));
}

export async function registerApi(input: RegisterInput) {
  return unwrap<AuthResponse>(await apiClient.post("/auth/register", input));
}

export async function getCurrentUserApi() {
  return unwrap<User>(await apiClient.get("/auth/me"));
}

export async function refreshTokenApi(refreshToken: string) {
  return unwrap<AuthResponse>(await apiClient.post("/auth/refresh", { refreshToken }));
}

export async function googleSignInApi(idToken: string) {
  return unwrap<AuthResponse>(
    await apiClient.post("/auth/google-signin", { idToken })
  );
}

