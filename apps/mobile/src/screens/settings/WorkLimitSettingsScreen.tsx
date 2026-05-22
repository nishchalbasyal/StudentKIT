import { useEffect, useState } from "react";
import { Alert, StyleSheet, Switch, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppButton } from "../../components/ui/AppButton";
import { AppInput } from "../../components/ui/AppInput";
import { AppScreen } from "../../components/ui/AppScreen";
import { AppSelect } from "../../components/ui/AppSelect";
import { ErrorState } from "../../components/ui/ErrorState";
import { LoadingState } from "../../components/ui/LoadingState";
import { WorkLimitCard } from "../../components/dashboard/WorkLimitCard";
import {
  colors,
  fontSize,
  radius,
  shadows,
  spacing,
} from "../../constants/colors";
import { useWorkLimitSettings } from "../../hooks/useWorkLimitSettings";
import type { RootStackParamList } from "../../navigation/types";
import {
  describeWorkLimitSettings,
  getWorkLimitOverview,
} from "../../utils/workLimit";
import type { WorkLimitPeriodUnit } from "../../types/work.types";

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type LimitMode = "UNLIMITED" | "HOURS" | "DAYS";

const limitModeOptions: Array<{ label: string; value: LimitMode }> = [
  { label: "Unlimited", value: "UNLIMITED" },
  { label: "Hours", value: "HOURS" },
  { label: "Days", value: "DAYS" },
];

const periodUnitOptions: Array<{ label: string; value: WorkLimitPeriodUnit }> =
  [
    { label: "Week", value: "WEEK" },
    { label: "Month", value: "MONTH" },
    { label: "Year", value: "YEAR" },
    { label: "Custom days", value: "CUSTOM_DAYS" },
  ];

export function WorkLimitSettingsScreen() {
  const navigation = useNavigation<Navigation>();
  const workLimit = useWorkLimitSettings();
  const settings = workLimit.settings;
  const summary = workLimit.summary;
  const [enabled, setEnabled] = useState(false);
  const [limitMode, setLimitMode] = useState<LimitMode>("UNLIMITED");
  const [limitValue, setLimitValue] = useState("20");
  const [periodValue, setPeriodValue] = useState("1");
  const [periodUnit, setPeriodUnit] = useState<WorkLimitPeriodUnit>("WEEK");

  useEffect(() => {
    if (!settings) return;
    const mode =
      !settings.isLimitEnabled || settings.limitType === "UNLIMITED"
        ? "UNLIMITED"
        : settings.limitUnit === "DAYS"
          ? "DAYS"
          : "HOURS";
    setEnabled(settings.isLimitEnabled);
    setLimitMode(mode);
    setLimitValue(
      settings.limitValue !== null && settings.limitValue !== undefined
        ? String(settings.limitValue)
        : mode === "DAYS"
          ? "145"
          : "20",
    );
    setPeriodValue(
      settings.periodValue !== null && settings.periodValue !== undefined
        ? String(settings.periodValue)
        : "1",
    );
    setPeriodUnit(settings.periodUnit ?? "WEEK");
  }, [settings]);

  if (workLimit.isLoading) {
    return <LoadingState label="Loading work limit" />;
  }

  if (workLimit.isError || !settings) {
    return (
      <ErrorState
        message="Could not load work limit settings."
        onRetry={() => void workLimit.refetch()}
      />
    );
  }

  const save = async () => {
    const parsedLimit = Number(limitValue);
    const parsedPeriod = Number(periodValue);

    if (!enabled || limitMode === "UNLIMITED") {
      await workLimit.saveWorkLimitSettings({
        isLimitEnabled: false,
        limitType: "UNLIMITED",
        limitValue: null,
        limitUnit: null,
        periodValue: null,
        periodUnit: null,
      });
      Alert.alert("Work limit", "Saved as Unlimited.");
      return;
    }

    if (!Number.isFinite(parsedLimit) || parsedLimit <= 0) {
      return Alert.alert("Work limit", "Enter a positive limit value.");
    }

    if (!Number.isFinite(parsedPeriod) || parsedPeriod <= 0) {
      return Alert.alert("Work limit", "Enter a positive period value.");
    }

    await workLimit.saveWorkLimitSettings({
      isLimitEnabled: true,
      limitType: "CUSTOM",
      limitValue: parsedLimit,
      limitUnit: limitMode === "DAYS" ? "DAYS" : "HOURS",
      periodValue: Math.round(parsedPeriod),
      periodUnit,
    });
    Alert.alert("Work limit", "Saved.");
  };

  const reset = async () => {
    await workLimit.resetWorkLimitSettings();
    setEnabled(false);
    setLimitMode("UNLIMITED");
    Alert.alert("Work limit", "Reset to Unlimited.");
  };

  return (
    <AppScreen
      title="Work Limit Settings"
      subtitle="Set a student work limit or keep tracking hours without a limit."
      showBack
      onBack={() => navigation.goBack()}
    >
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.label}>Enable Student Work Limit</Text>
            <Text style={styles.helper}>
              Turn this on when you want the app to track a limit.
            </Text>
          </View>
          <Switch
            value={enabled}
            onValueChange={(value) => {
              setEnabled(value);
              if (value && limitMode === "UNLIMITED") {
                setLimitMode("HOURS");
              }
              if (!value) {
                setLimitMode("UNLIMITED");
              }
            }}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        <AppSelect
          label="Limit type"
          value={enabled ? limitMode : "UNLIMITED"}
          options={limitModeOptions}
          onChange={(value) => {
            if (value === "UNLIMITED") {
              setEnabled(false);
              setLimitMode("UNLIMITED");
              return;
            }
            setEnabled(true);
            setLimitMode(value);
          }}
        />

        {enabled ? (
          <>
            <AppInput
              label={
                limitMode === "DAYS"
                  ? "Limit value (days)"
                  : "Limit value (hours)"
              }
              value={limitValue}
              onChangeText={setLimitValue}
              keyboardType="decimal-pad"
              placeholder={limitMode === "DAYS" ? "145" : "20"}
            />
            <AppInput
              label="Period value"
              value={periodValue}
              onChangeText={setPeriodValue}
              keyboardType="number-pad"
              placeholder={periodUnit === "CUSTOM_DAYS" ? "14" : "1"}
            />
            <AppSelect
              label="Period unit"
              value={periodUnit}
              options={periodUnitOptions}
              onChange={setPeriodUnit}
            />
          </>
        ) : null}

        <Text style={styles.summaryLabel}>Current setting</Text>
        <Text style={styles.summaryValue}>
          {describeWorkLimitSettings(settings)}
        </Text>
      </View>

      {summary ? (
        <WorkLimitCard overview={getWorkLimitOverview(summary)} />
      ) : null}

      <View style={styles.actions}>
        <AppButton
          title="Save"
          loading={workLimit.isSaving}
          disabled={workLimit.isSaving}
          onPress={() => void save()}
        />
        <AppButton
          title="Reset to Unlimited"
          variant="secondary"
          disabled={workLimit.isSaving}
          onPress={() => void reset()}
        />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.soft,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  rowText: {
    flex: 1,
    gap: 4,
  },
  label: {
    color: colors.text,
    fontSize: fontSize.bodyLarge,
    fontWeight: "800",
  },
  helper: {
    color: colors.muted,
    fontSize: fontSize.caption,
    lineHeight: 17,
  },
  summaryLabel: {
    color: colors.muted,
    fontSize: fontSize.caption,
    fontWeight: "800",
  },
  summaryValue: {
    color: colors.primary,
    fontSize: fontSize.bodyLarge,
    fontWeight: "900",
  },
  actions: {
    gap: spacing.sm,
  },
});
