import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AppButton } from "../../components/ui/AppButton";
import { AppInput } from "../../components/ui/AppInput";
import { AppScreen } from "../../components/ui/AppScreen";
import { AppSelect } from "../../components/ui/AppSelect";
import { colors, spacing } from "../../constants/colors";
import { getApiErrorMessage } from "../../api/apiClient";
import { useAuth } from "../../hooks/useAuth";
import type { AuthStackParamList } from "../../navigation/types";
import { registerSchema, type RegisterFormValues } from "../../validators/auth.schema";

type Navigation = NativeStackNavigationProp<AuthStackParamList, "Register">;

const studentStatusOptions = [
  { label: "International", value: "INTERNATIONAL" },
  { label: "EU/EEA", value: "EU_EEA_SWISS" },
  { label: "German", value: "GERMAN" },
  { label: "Other", value: "OTHER" }
] as const;

export function RegisterScreen() {
  const navigation = useNavigation<Navigation>();
  const { register, isRegistering } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const { control, handleSubmit } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema) as never,
    defaultValues: {
      name: "",
      email: "",
      password: "",
      country: "DE",
      studentStatus: "INTERNATIONAL",
      currency: "EUR"
    }
  });

  async function onSubmit(values: RegisterFormValues) {
    setServerError(null);

    try {
      await register({
        ...values,
        country: values.country.toUpperCase(),
        currency: values.currency.toUpperCase()
      });
    } catch (error) {
      setServerError(getApiErrorMessage(error));
    }
  }

  return (
    <AppScreen title="Create account" subtitle="A few basics help the app calculate your student budget correctly.">
      <View style={styles.form}>
        <Controller
          control={control}
          name="name"
          render={({ field, fieldState }) => (
            <AppInput label="Name" value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} />
          )}
        />
        <Controller
          control={control}
          name="email"
          render={({ field, fieldState }) => (
            <AppInput
              label="Email"
              value={field.value}
              onChangeText={field.onChange}
              error={fieldState.error?.message}
              autoCapitalize="none"
              keyboardType="email-address"
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
              error={fieldState.error?.message}
              secureTextEntry
            />
          )}
        />
        <View style={styles.row}>
          <View style={styles.half}>
            <Controller
              control={control}
              name="country"
              render={({ field, fieldState }) => (
                <AppInput
                  label="Country"
                  value={field.value}
                  onChangeText={field.onChange}
                  error={fieldState.error?.message}
                  autoCapitalize="characters"
                  maxLength={2}
                />
              )}
            />
          </View>
          <View style={styles.half}>
            <Controller
              control={control}
              name="currency"
              render={({ field, fieldState }) => (
                <AppInput
                  label="Currency"
                  value={field.value}
                  onChangeText={field.onChange}
                  error={fieldState.error?.message}
                  autoCapitalize="characters"
                  maxLength={3}
                />
              )}
            />
          </View>
        </View>
        <Controller
          control={control}
          name="studentStatus"
          render={({ field, fieldState }) => (
            <AppSelect
              label="Student status"
              value={field.value}
              onChange={field.onChange}
              options={[...studentStatusOptions]}
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="hourlyWageDefault"
          render={({ field, fieldState }) => (
            <AppInput
              label="Default hourly wage"
              value={field.value ? String(field.value) : ""}
              onChangeText={field.onChange}
              error={fieldState.error?.message}
              keyboardType="decimal-pad"
              placeholder="Optional"
            />
          )}
        />
        {serverError ? <Text style={styles.error}>{serverError}</Text> : null}
        <AppButton title="Create account" icon="person-add-outline" loading={isRegistering} onPress={handleSubmit(onSubmit)} />
        <Pressable onPress={() => navigation.navigate("Login")} style={styles.linkWrap}>
          <Text style={styles.link}>Already have an account? Log in</Text>
        </Pressable>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.md
  },
  row: {
    flexDirection: "row",
    gap: spacing.md
  },
  half: {
    flex: 1
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
  }
});
