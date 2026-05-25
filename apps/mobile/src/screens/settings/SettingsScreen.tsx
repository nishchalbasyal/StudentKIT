import { useEffect, useState } from "react";
import { Alert, RefreshControl, StyleSheet, Text, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { useNavigation } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppButton } from "../../components/ui/AppButton";
import { AppInput } from "../../components/ui/AppInput";
import { AppScreen } from "../../components/ui/AppScreen";
import { AppSelect } from "../../components/ui/AppSelect";
import {
  colors,
  fontSize,
  radius,
  shadows,
  spacing,
} from "../../constants/colors";
import { API_BASE_URL } from "../../constants/config";
import { findCountryConfig } from "../../config/countries";
import { useAuth } from "../../hooks/useAuth";
import { useSettings } from "../../hooks/useSettings";
import { useUserProfile } from "../../hooks/useUserProfile";
import { useWorkLimitSettings } from "../../hooks/useWorkLimitSettings";
import type { RootStackParamList } from "../../navigation/types";
import { exportAppCsv, importAppCsv } from "../../storage/csvTransfer";
import { defaultSettings } from "../../storage/settingsStorage";
import { syncQueue } from "../../storage/syncQueue";
import { syncService } from "../../services/syncService";
import type { WorkLimitPeriodUnit } from "../../types/work.types";
import { describeWorkLimitSettings } from "../../utils/workLimit";

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type LimitMode = "UNLIMITED" | "HOURS" | "DAYS" | "CUSTOM";

const limitModeOptions: Array<{ label: string; value: LimitMode }> = [
  { label: "Unlimited", value: "UNLIMITED" },
  { label: "Hours", value: "HOURS" },
  { label: "Days", value: "DAYS" },
  { label: "Custom", value: "CUSTOM" },
];

const periodOptions: Array<{ label: string; value: WorkLimitPeriodUnit }> = [
  { label: "Week", value: "WEEK" },
  { label: "Month", value: "MONTH" },
  { label: "Year", value: "YEAR" },
  { label: "Custom days", value: "CUSTOM_DAYS" },
];

function looksLikeEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function canReachApi() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

export function SettingsScreen() {
  const navigation = useNavigation<Navigation>();
  const queryClient = useQueryClient();
  const { logout, isAuthenticated } = useAuth();
  const settings = useSettings();
  const profile = useUserProfile();
  const workLimit = useWorkLimitSettings();
  const [pendingCount, setPendingCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [authAction, setAuthAction] = useState<"Login" | "Register" | null>(
    null,
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [workCountry, setWorkCountry] = useState("DE");
  const [defaultHourlyWage, setDefaultHourlyWage] = useState("");
  const [limitMode, setLimitMode] = useState<LimitMode>("UNLIMITED");
  const [limitValue, setLimitValue] = useState("");
  const [customDays, setCustomDays] = useState("");
  const [customHours, setCustomHours] = useState("");
  const [periodUnit, setPeriodUnit] = useState<WorkLimitPeriodUnit>("WEEK");
  const [transferText, setTransferText] = useState("");

  const appSettings = settings.settings ?? defaultSettings;
  const workCountryConfig = findCountryConfig(workCountry);

  useEffect(() => {
    setName(profile.user?.name ?? "");
    setEmail(
      profile.user?.email === "Guest mode" ? "" : (profile.user?.email ?? ""),
    );
  }, [profile.user?.email, profile.user?.name]);

  useEffect(() => {
    setWorkCountry(
      appSettings.work.workCountry || profile.user?.country || "DE",
    );
    setDefaultHourlyWage(
      appSettings.work.defaultHourlyWage !== null &&
        appSettings.work.defaultHourlyWage !== undefined
        ? String(appSettings.work.defaultHourlyWage)
        : profile.user?.hourlyWageDefault
          ? String(profile.user.hourlyWageDefault)
          : "",
    );
  }, [
    appSettings.work.defaultHourlyWage,
    appSettings.work.workCountry,
    profile.user?.country,
    profile.user?.hourlyWageDefault,
  ]);

  useEffect(() => {
    const current = workLimit.settings;
    if (
      !current ||
      !current.isLimitEnabled ||
      current.limitType === "UNLIMITED"
    ) {
      setLimitMode("UNLIMITED");
      setLimitValue("");
      setCustomDays("");
      setCustomHours("");
      setPeriodUnit("WEEK");
      return;
    }

    if (current.limitUnit === "DAYS" && current.periodUnit === "YEAR") {
      setLimitMode("DAYS");
      setLimitValue(current.limitValue ? String(current.limitValue) : "");
      setCustomDays("");
      setCustomHours("");
    } else if (current.limitUnit === "HOURS") {
      setLimitMode("HOURS");
      setLimitValue(current.limitValue ? String(current.limitValue) : "");
      setCustomDays("");
      setCustomHours("");
    } else {
      setLimitMode("CUSTOM");
      setCustomDays(
        current.limitUnit === "DAYS" && current.limitValue
          ? String(current.limitValue)
          : "",
      );
      setCustomHours("");
      setLimitValue("");
    }

    setPeriodUnit(current.periodUnit ?? "WEEK");
  }, [workLimit.settings]);

  useEffect(() => {
    void syncQueue.pending().then((items) => setPendingCount(items.length));
  }, [settings.settings, workLimit.settings, profile.user]);

  async function saveProfile() {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      Alert.alert("Account", "Name is required.");
      return;
    }

    if (trimmedEmail && !looksLikeEmail(trimmedEmail)) {
      Alert.alert("Account", "Enter a valid email address.");
      return;
    }

    await profile.updateProfile({
      name: trimmedName,
      email: trimmedEmail || "Guest mode",
    });
    Alert.alert("Account", "Saved.");
  }

  async function saveWorkSettings() {
    const parsedWage = defaultHourlyWage.trim()
      ? Number(defaultHourlyWage)
      : null;
    const normalizedCountry = workCountry.trim().toUpperCase();

    if (!normalizedCountry || normalizedCountry.length !== 2) {
      Alert.alert("Work settings", "Use a 2-letter country code.");
      return;
    }

    if (
      parsedWage !== null &&
      (!Number.isFinite(parsedWage) || parsedWage <= 0)
    ) {
      Alert.alert(
        "Work settings",
        "Default hourly wage must be greater than 0.",
      );
      return;
    }

    await settings.updateWork({
      workCountry: normalizedCountry,
      defaultHourlyWage: parsedWage,
    });
    Alert.alert("Work settings", "Saved.");
  }

  async function saveWorkLimit() {
    if (limitMode === "UNLIMITED") {
      await workLimit.saveWorkLimitSettings({
        isLimitEnabled: false,
        limitType: "UNLIMITED",
        limitValue: null,
        limitUnit: null,
        periodValue: null,
        periodUnit: null,
      });
      Alert.alert("Work limit", "Current limit: Unlimited");
      return;
    }

    if (limitMode === "DAYS") {
      const days = Number(limitValue);
      if (!Number.isFinite(days) || days <= 0) {
        Alert.alert("Work limit", "Enter a valid number of days.");
        return;
      }

      await workLimit.saveWorkLimitSettings({
        isLimitEnabled: true,
        limitType: "CUSTOM",
        limitValue: days,
        limitUnit: "DAYS",
        periodValue: 1,
        periodUnit: "YEAR",
      });
      Alert.alert("Work limit", "Saved.");
      return;
    }

    if (limitMode === "HOURS") {
      const hours = Number(limitValue);
      if (!Number.isFinite(hours) || hours <= 0) {
        Alert.alert("Work limit", "Enter a valid number of hours.");
        return;
      }

      await workLimit.saveWorkLimitSettings({
        isLimitEnabled: true,
        limitType: "CUSTOM",
        limitValue: hours,
        limitUnit: "HOURS",
        periodValue: 1,
        periodUnit,
      });
      Alert.alert("Work limit", "Saved.");
      return;
    }

    const days = customDays.trim() ? Number(customDays) : 0;
    const hours = customHours.trim() ? Number(customHours) : 0;
    if (days <= 0 && hours <= 0) {
      Alert.alert("Work limit", "Add at least custom days or custom hours.");
      return;
    }

    await workLimit.saveWorkLimitSettings({
      isLimitEnabled: true,
      limitType: "CUSTOM",
      limitValue: hours > 0 ? hours : days,
      limitUnit: hours > 0 ? "HOURS" : "DAYS",
      periodValue: hours > 0 ? 14 : 1,
      periodUnit: hours > 0 ? "CUSTOM_DAYS" : "YEAR",
    });
    Alert.alert("Work limit", "Saved.");
  }

  async function syncNow() {
    const result = await syncService.syncLocalDataAfterLogin();
    await queryClient.invalidateQueries();
    setPendingCount(result.failed > 0 ? pendingCount : 0);
    Alert.alert(
      "Sync",
      result.failed > 0 ? "Some items still need sync." : "Synced.",
    );
  }

  async function openAuthFlow(screen: "Login" | "Register") {
    setAuthAction(screen);

    try {
      const online = await canReachApi();

      if (!online) {
        Alert.alert(
          "No internet connection",
          "You have to connect to internet to log in or register.",
        );
        return;
      }

      navigation.navigate("Auth", { screen });
    } finally {
      setAuthAction(null);
    }
  }

  async function refreshScreen() {
    setRefreshing(true);

    try {
      if (isAuthenticated) {
        await syncQueue.processWithBackend();
      }

      await Promise.all([
        settings.refetch(),
        profile.refetch(),
        workLimit.refetch(),
      ]);

      const items = await syncQueue.pending();
      setPendingCount(items.length);
    } finally {
      setRefreshing(false);
    }
  }

  async function exportData() {
    const csv = await exportAppCsv();
    await Clipboard.setStringAsync(csv);
    setTransferText(csv);
    Alert.alert("Export", "CSV copied to clipboard.");
  }

  async function pasteImport() {
    setTransferText(await Clipboard.getStringAsync());
  }

  async function importData() {
    if (!transferText.trim()) {
      Alert.alert("Import", "Paste a CSV export first.");
      return;
    }

    try {
      await importAppCsv(transferText);
    } catch (error) {
      Alert.alert(
        "Import",
        error instanceof Error ? error.message : "Invalid CSV data.",
      );
      return;
    }

    await queryClient.invalidateQueries();
    Alert.alert("Import", "CSV imported.");
  }

  const canGoBack = navigation.canGoBack();

  return (
    <AppScreen
      title="Settings"
      subtitle="Compact setup for work tracking."
      showBack={canGoBack}
      onBack={canGoBack ? () => navigation.goBack() : undefined}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void refreshScreen()}
        />
      }
    >
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Work settings</Text>
        <AppInput
          label="Work country code"
          value={workCountry}
          onChangeText={setWorkCountry}
          autoCapitalize="characters"
          maxLength={2}
        />
        {workCountryConfig?.code === "DE" ? (
          <Text style={styles.helper}>
            Germany suggested student limit: 140 days/year
          </Text>
        ) : workCountryConfig ? (
          <Text style={styles.helper}>{workCountryConfig.name}</Text>
        ) : null}
        <AppInput
          label="Default hourly wage"
          value={defaultHourlyWage}
          onChangeText={setDefaultHourlyWage}
          keyboardType="decimal-pad"
        />
        <AppButton
          title="Save work settings"
          icon="save-outline"
          loading={settings.isSaving}
          disabled={settings.isSaving}
          onPress={() => void saveWorkSettings()}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Work limit</Text>
        <AppSelect
          label="Limit type"
          value={limitMode}
          options={limitModeOptions}
          onChange={setLimitMode}
        />
        {limitMode === "HOURS" ? (
          <>
            <AppInput
              label="Hours amount"
              value={limitValue}
              onChangeText={setLimitValue}
              keyboardType="decimal-pad"
            />
            <AppSelect
              label="Period"
              value={periodUnit}
              options={periodOptions.filter(
                (option) => option.value !== "CUSTOM_DAYS",
              )}
              onChange={setPeriodUnit}
            />
            <Text style={styles.helper}>
              20 hours/week = approx. 80 hours/month
            </Text>
          </>
        ) : null}
        {limitMode === "DAYS" ? (
          <>
            <AppInput
              label="Days amount"
              value={limitValue}
              onChangeText={setLimitValue}
              keyboardType="number-pad"
            />
            <Text style={styles.helper}>140 days/year</Text>
          </>
        ) : null}
        {limitMode === "CUSTOM" ? (
          <>
            <AppInput
              label="Number of days"
              value={customDays}
              onChangeText={setCustomDays}
              keyboardType="number-pad"
            />
            <AppInput
              label="Number of hours"
              value={customHours}
              onChangeText={setCustomHours}
              keyboardType="decimal-pad"
            />
            <Text style={styles.helper}>Example: 14 days or 48 hours</Text>
          </>
        ) : null}
        <Text style={styles.currentText}>
          Current limit:{" "}
          {limitMode === "UNLIMITED"
            ? "Unlimited"
            : workLimit.settings
              ? describeWorkLimitSettings(workLimit.settings)
              : "Unlimited"}
        </Text>
        <AppButton
          title="Save work limit"
          icon="briefcase-outline"
          loading={workLimit.isSaving}
          disabled={workLimit.isSaving}
          onPress={() => void saveWorkLimit()}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Data & sync</Text>
        <Text style={styles.helper}>
          {isAuthenticated
            ? pendingCount > 0
              ? `Sync pending: ${pendingCount}`
              : "Synced"
            : "Guest mode"}
        </Text>
        <AppButton
          title="Sync now"
          icon="sync-outline"
          variant="secondary"
          onPress={() => void syncNow()}
          disabled={!isAuthenticated}
        />
        <Text style={styles.aiNote}>AI features coming later.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Account</Text>
        <AppButton
          title="Open Profile"
          icon="person-outline"
          variant="secondary"
          onPress={() => navigation.navigate("Profile")}
        />
        <AppInput label="Name" value={name} onChangeText={setName} />
        <AppInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <AppButton
          title="Save account"
          icon="save-outline"
          loading={profile.isSaving}
          disabled={profile.isSaving}
          onPress={() => void saveProfile()}
        />
        {isAuthenticated ? (
          <AppButton
            title="Logout"
            icon="log-out-outline"
            variant="danger"
            onPress={() => void logout()}
          />
        ) : (
          <View style={styles.buttonStack}>
            <AppButton
              title="Login"
              icon="log-in-outline"
              variant="secondary"
              loading={authAction === "Login"}
              disabled={authAction !== null}
              onPress={() => void openAuthFlow("Login")}
            />
            <AppButton
              title="Register"
              icon="person-add-outline"
              variant="secondary"
              loading={authAction === "Register"}
              disabled={authAction !== null}
              onPress={() => void openAuthFlow("Register")}
            />
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Import / Export</Text>
        <Text style={styles.helper}>
          CSV includes work entries, work settings, and work limit settings.
        </Text>
        <View style={styles.buttonStack}>
          <AppButton
            title="Export CSV"
            icon="download-outline"
            onPress={() => void exportData()}
          />
          <AppButton
            title="Paste CSV"
            icon="clipboard-outline"
            variant="secondary"
            onPress={() => void pasteImport()}
          />
        </View>
        <AppInput
          label="CSV data"
          value={transferText}
          onChangeText={setTransferText}
          multiline
          style={styles.textArea}
        />
        <AppButton
          title="Import CSV"
          icon="cloud-upload-outline"
          variant="secondary"
          onPress={() => void importData()}
        />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.soft,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.body,
    fontWeight: "800",
  },
  helper: {
    color: colors.muted,
    fontSize: fontSize.caption,
    lineHeight: 16,
  },
  currentText: {
    color: colors.text,
    fontSize: fontSize.caption,
    fontWeight: "700",
  },
  aiNote: {
    color: colors.muted,
    fontSize: fontSize.caption,
    fontStyle: "italic",
  },
  buttonStack: {
    gap: spacing.xs,
  },
  textArea: {
    minHeight: 120,
    paddingTop: 10,
    textAlignVertical: "top",
  },
});
