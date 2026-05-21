import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppHeader } from "../../components/ui/AppHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { FloatingActionButton } from "../../components/ui/FloatingActionButton";
import { ListRow } from "../../components/ui/ListRow";
import { LoadingState } from "../../components/ui/LoadingState";
import { SegmentedTabs } from "../../components/ui/SegmentedTabs";
import { colors, fontSize, radius, shadows, spacing } from "../../constants/colors";
import { useCompanyWorkSummary } from "../../hooks/useCompanyWorkSummary";
import { useWorkHours } from "../../hooks/useWorkHours";
import type { RootStackParamList } from "../../navigation/types";
import { useAuthStore } from "../../store/authStore";
import type { WorkShift } from "../../types/work.types";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatShortDate, getCurrentMonthParams } from "../../utils/formatDate";

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type Tab = "entries" | "companies" | "summary";

const tabs = [
  { key: "entries", label: "Entries" },
  { key: "companies", label: "Companies" },
  { key: "summary", label: "Summary" },
] as const;

export function WorkHoursScreen() {
  const navigation = useNavigation<Navigation>();
  const user = useAuthStore((state) => state.user);
  const [tab, setTab] = useState<Tab>("entries");
  const monthOptions = useMemo(() => buildMonthOptions(), []);
  const [selectedMonth] = useState(monthOptions[0]!);
  const { workShifts, monthlySummary, weeklySummary, deleteWorkShift, isSaving } = useWorkHours(selectedMonth);
  const companySummary = useCompanyWorkSummary(monthlySummary.data, weeklySummary.data?.shifts ?? []);

  if (workShifts.isLoading || monthlySummary.isLoading || weeklySummary.isLoading) {
    return <SafeAreaView style={styles.safe}><LoadingState label="Loading work" /></SafeAreaView>;
  }

  if (workShifts.isError || monthlySummary.isError || weeklySummary.isError) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ErrorState
            message="Could not load work hours."
            onRetry={() => {
              void workShifts.refetch();
              void monthlySummary.refetch();
              void weeklySummary.refetch();
            }}
          />
        </View>
      </SafeAreaView>
    );
  }

  const summary = monthlySummary.data;
  const shifts = companySummary.visibleShifts.length ? companySummary.visibleShifts : summary?.shifts ?? [];
  const workLimit = summary?.workLimit.usage;

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AppHeader title="Work" avatarText={user?.name ?? "ST"} showSettings />

        <View style={styles.summaryCard}>
          <Metric label="This month hours" value={`${summary?.totalHours ?? 0}h`} />
          <Metric label="This month income" value={formatCurrency(summary?.totalIncome ?? 0, user?.currency)} />
          <Metric
            label="Work limit"
            value={`${workLimit?.usedFullDayUnits ?? 0}/${workLimit?.limitFullDayUnits ?? 140} days`}
            tone={workLimit?.warningLevel === "critical" || workLimit?.warningLevel === "exceeded" ? "red" : "green"}
          />
        </View>

        <SegmentedTabs tabs={tabs} value={tab} onChange={setTab} />

        {tab === "entries" ? (
          <EntriesTab
            shifts={shifts}
            currency={user?.currency}
            navigation={navigation}
            deleteWorkShift={deleteWorkShift}
            disabled={isSaving}
          />
        ) : tab === "companies" ? (
          <CompaniesTab companies={companySummary.companies} currency={user?.currency} navigation={navigation} />
        ) : (
          <SummaryTab summaryHours={summary?.totalHours ?? 0} summaryIncome={summary?.totalIncome ?? 0} workLimitPercent={workLimit?.percentUsed ?? 0} currency={user?.currency} companies={companySummary.companies} navigation={navigation} />
        )}
      </ScrollView>

      <FloatingActionButton onPress={() => navigation.navigate("AddWorkShift")} />
    </SafeAreaView>
  );
}

function EntriesTab({
  shifts,
  currency,
  navigation,
  deleteWorkShift,
  disabled,
}: {
  shifts: WorkShift[];
  currency?: string;
  navigation: Navigation;
  deleteWorkShift: (id: string) => Promise<{ id: string }>;
  disabled: boolean;
}) {
  if (shifts.length === 0) {
    return (
      <EmptyState
        title="No work entries yet"
        message="Log your first shift to track hours, income, breaks, and student work limits."
        actionLabel="Add Work Entry"
        onAction={() => navigation.navigate("AddWorkShift")}
      />
    );
  }

  const showActions = (shift: WorkShift) => {
    Alert.alert(shift.jobName, "Choose an action", [
      { text: "View", onPress: () => navigation.navigate("WorkEntryDetail", { workShiftId: shift.id }) },
      { text: "Edit", onPress: () => navigation.navigate("AddWorkShift", { workShiftId: shift.id }) },
      { text: "Duplicate", onPress: () => navigation.navigate("AddWorkShift", { duplicateFromId: shift.id }) },
      { text: "Delete", style: "destructive", onPress: () => void deleteWorkShift(shift.id) },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <View style={styles.stack}>
      {shifts.map((shift) => (
        <ListRow
          key={shift.id}
          icon="briefcase-outline"
          title={shift.jobName}
          subtitle={`${formatShortDate(shift.date)} - ${shift.startTime}-${shift.endTime} - ${shift.calculatedHours}h`}
          meta={shift.breakMinutes ? `${shift.breakMinutes} min break` : "No break logged"}
          rightText={formatCurrency(shift.calculatedIncome, currency)}
          rightTone="green"
          disabled={disabled}
          onPress={() => navigation.navigate("WorkEntryDetail", { workShiftId: shift.id })}
          onLongPress={() => showActions(shift)}
          onOptionsPress={() => showActions(shift)}
        />
      ))}
    </View>
  );
}

function CompaniesTab({
  companies,
  currency,
  navigation,
}: {
  companies: ReturnType<typeof useCompanyWorkSummary>["companies"];
  currency?: string;
  navigation: Navigation;
}) {
  if (companies.length === 0) {
    return (
      <EmptyState
        title="No companies yet"
        message="Add a company once, then reuse wage and shift defaults."
        actionLabel="Add Company"
        onAction={() => navigation.navigate("AddEditCompany")}
      />
    );
  }

  return (
    <View style={styles.stack}>
      {companies.map((company) => (
        <ListRow
          key={`${company.companyId ?? company.companyName}`}
          avatarText={company.companyName}
          title={company.companyName}
          subtitle={`${company.totalHours}h - ${company.shiftCount} shifts`}
          meta={`Average ${formatCurrency(company.averageHourlyIncome, currency)}/h`}
          rightText={formatCurrency(company.totalIncome, currency)}
          rightTone="green"
          showChevron
          onPress={() => navigation.navigate("CompanyDetail", { companyId: company.companyId ?? undefined, companyName: company.companyName })}
          onLongPress={() => navigation.navigate("AddEditCompany", { companyId: company.companyId ?? undefined, companyName: company.companyName })}
        />
      ))}
    </View>
  );
}

function SummaryTab({
  summaryHours,
  summaryIncome,
  workLimitPercent,
  currency,
  companies,
  navigation,
}: {
  summaryHours: number;
  summaryIncome: number;
  workLimitPercent: number;
  currency?: string;
  companies: ReturnType<typeof useCompanyWorkSummary>["companies"];
  navigation: Navigation;
}) {
  return (
    <View style={styles.stack}>
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Monthly summary</Text>
        <Text style={styles.panelText}>{summaryHours} hours logged - {formatCurrency(summaryIncome, currency)} earned</Text>
        <Progress label="Work limit" value={workLimitPercent} />
      </View>
      {companies.slice(0, 5).map((company) => (
        <View key={company.companyName} style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>{company.companyName}</Text>
          <Text style={styles.breakdownValue}>{formatCurrency(company.totalIncome, currency)}</Text>
        </View>
      ))}
      <Pressable style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]} onPress={() => navigation.navigate("WorkSummary")}>
        <Text style={styles.secondaryButtonText}>Open detailed summary</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.primary} />
      </Pressable>
    </View>
  );
}

function Metric({ label, value, tone = "green" }: { label: string; value: string; tone?: "green" | "red" }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, { color: tone === "red" ? colors.danger : colors.primary }]}>{value}</Text>
    </View>
  );
}

function Progress({ label, value }: { label: string; value: number }) {
  const width = Math.min(100, Math.max(0, value));
  return (
    <View style={styles.progressWrap}>
      <View style={styles.progressHeader}>
        <Text style={styles.panelMeta}>{label}</Text>
        <Text style={styles.panelMeta}>{Math.round(width)}%</Text>
      </View>
      <View style={styles.track}><View style={[styles.fill, { width: `${width}%` }]} /></View>
    </View>
  );
}

function buildMonthOptions() {
  const current = getCurrentMonthParams();
  return [0, 1, 2].map((offset) => {
    const date = new Date(Date.UTC(current.year, current.month - 1 - offset, 1));
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    return { key: `${year}-${String(month).padStart(2, "0")}`, year, month };
  });
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: "center", padding: spacing.lg },
  content: { padding: spacing.lg, paddingBottom: 132, gap: spacing.md },
  stack: { gap: spacing.sm },
  summaryCard: {
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    ...shadows.soft,
  },
  metric: { flex: 1, minWidth: 96, gap: 3 },
  metricLabel: { color: colors.muted, fontSize: fontSize.caption, fontWeight: "700" },
  metricValue: { color: colors.primary, fontSize: fontSize.bodyLarge, fontWeight: "900" },
  panel: { borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, gap: spacing.sm },
  panelTitle: { color: colors.text, fontSize: fontSize.rowTitle, fontWeight: "900" },
  panelText: { color: colors.muted, fontSize: fontSize.body, lineHeight: 20 },
  panelMeta: { color: colors.muted, fontSize: fontSize.caption, fontWeight: "800" },
  progressWrap: { gap: spacing.xs, marginTop: spacing.xs },
  progressHeader: { flexDirection: "row", justifyContent: "space-between" },
  track: { height: 8, borderRadius: radius.pill, backgroundColor: colors.border, overflow: "hidden" },
  fill: { height: 8, backgroundColor: colors.primary },
  breakdownRow: {
    minHeight: 54,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  breakdownLabel: { flex: 1, color: colors.text, fontSize: fontSize.bodyLarge, fontWeight: "800" },
  breakdownValue: { color: colors.primary, fontSize: fontSize.body, fontWeight: "900" },
  secondaryButton: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  secondaryButtonText: { color: colors.primary, fontSize: fontSize.bodyLarge, fontWeight: "900" },
  pressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
});
