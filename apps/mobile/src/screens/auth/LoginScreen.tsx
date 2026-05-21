import { useState, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { AppButton } from "../../components/ui/AppButton";
import { AppInput } from "../../components/ui/AppInput";
import { AppScreen } from "../../components/ui/AppScreen";
import { colors, spacing, radius } from "../../constants/colors";
import { getApiErrorMessage } from "../../api/apiClient";
import { useAuth } from "../../hooks/useAuth";
import { useGoogleSignIn, configureGoogleSignIn } from "../../hooks/useGoogleSignIn";
import type { AuthStackParamList } from "../../navigation/types";
import { loginSchema, type LoginFormValues } from "../../validators/auth.schema";

type Navigation = NativeStackNavigationProp<AuthStackParamList, "Login">;

const testAccount = {
  email: "test@studentkit.local",
  password: "Test@12345"
};

// Google Web Client ID from environment configuration
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "";

export function LoginScreen() {
  const navigation = useNavigation<Navigation>();
  const { login, isLoggingIn } = useAuth();
  const { signIn, isSigningIn, error: googleError } = useGoogleSignIn();
  const [serverError, setServerError] = useState<string | null>(null);
  const { control, handleSubmit, reset } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  useEffect(() => {
    configureGoogleSignIn(GOOGLE_WEB_CLIENT_ID);
  }, []);

  async function onSubmit(values: LoginFormValues) {
    setServerError(null);

    try {
      await login(values);
    } catch (error) {
      setServerError(getApiErrorMessage(error));
    }
  }

  async function useTestAccount() {
    reset(testAccount);
    await onSubmit(testAccount);
  }

  async function handleGoogleSignIn() {
    setServerError(null);
    try {
      await signIn();
    } catch (error) {
      setServerError(googleError || getApiErrorMessage(error));
    }
  }

  return (
    <AppScreen scroll={false}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.logo}>Student Kit</Text>
          <Text style={styles.subtitle}>Track work, money, study, groceries, and reminders in one place.</Text>
        </View>

        <View style={styles.form}>
          <Controller
            control={control}
            name="email"
            render={({ field, fieldState }) => (
              <AppInput
                label="Email"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
                autoCapitalize="none"
                keyboardType="email-address"
                textContentType="emailAddress"
              />
            )}
          />
          <Controller
            control={control}
            name="password"
            render={({ field, fieldState }) => (
              <AppInput
                label="Password"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
                secureTextEntry
                textContentType="password"
              />
            )}
          />
          {serverError ? <Text style={styles.error}>{serverError}</Text> : null}
          <AppButton title="Log in" icon="log-in-outline" loading={isLoggingIn} onPress={handleSubmit(onSubmit)} />
          
          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.line} />
          </View>

          <Pressable
            style={[styles.googleButton, isSigningIn && styles.googleButtonDisabled]}
            onPress={() => void handleGoogleSignIn()}
            disabled={isSigningIn}
          >
            <FontAwesome name="google" size={20} color={colors.text} />
            <Text style={styles.googleButtonText}>{isSigningIn ? "Signing in..." : "Sign in with Google"}</Text>
          </Pressable>

          <AppButton title="Use test account" icon="key-outline" variant="secondary" loading={isLoggingIn} onPress={() => void useTestAccount()} />
        </View>

        <Pressable onPress={() => navigation.navigate("Register")} style={styles.linkWrap}>
          <Text style={styles.link}>New here? Create an account</Text>
        </Pressable>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    gap: spacing.xl
  },
  header: {
    gap: spacing.sm
  },
  logo: {
    color: colors.text,
    fontSize: 34,
    fontWeight: "900"
  },
  subtitle: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 23
  },
  form: {
    gap: spacing.md
  },
  error: {
    color: colors.danger,
    fontSize: 14,
    lineHeight: 20
  },
  linkWrap: {
    alignItems: "center",
    padding: spacing.md
  },
  link: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "800"
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginVertical: spacing.sm
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border
  },
  dividerText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "600"
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border
  },
  googleButtonDisabled: {
    opacity: 0.5
  },
  googleButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600"
  }
});
