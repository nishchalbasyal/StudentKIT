import { useMutation } from "@tanstack/react-query";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { googleSignInApi } from "../api/auth.api";
import { getApiErrorMessage } from "../api/apiClient";
import { useAuthStore } from "../store/authStore";
import { requestNotificationPermission } from "../utils/notifications";

// Configure Google Sign-In (no-op for web auth)
export function configureGoogleSignIn(webClientId: string) {
  // Web auth auto-configures with EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
}

// Make sure to complete auth session on app start
WebBrowser.maybeCompleteAuthSession();

export function useGoogleSignIn() {
  const setSession = useAuthStore((state) => state.login);
  const [, response, promptAsync] = Google.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "",
    scopes: ["profile", "email"]
  });

  const mutation = useMutation({
    mutationFn: async () => {
      try {
        // Launch Google Sign-In browser
        const result = await promptAsync();

        if (result?.type === "success" && result.authentication?.idToken) {
          // Send ID token to backend
          const session = await googleSignInApi(result.authentication.idToken);

          // Save session and request permissions
          await setSession(session);
          void requestNotificationPermission();

          return session;
        }

        if (result?.type === "dismiss") {
          throw new Error("Sign-in cancelled");
        }

        throw new Error("Sign-in failed");
      } catch (error: any) {
        throw error;
      }
    }
  });

  async function signOut() {
    try {
      await Google.useAuthRequest({
        clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || ""
      })[2](); // This clears auth session
    } catch (error) {
      console.warn("Error signing out from Google:", error);
    }
  }

  return {
    signIn: mutation.mutateAsync,
    isSigningIn: mutation.isPending,
    error: mutation.error ? getApiErrorMessage(mutation.error) : null,
    signOut
  };
}
