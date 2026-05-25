import { useEffect, useState } from "react";
import {
  Alert,
  RefreshControl,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { AppHeader } from "../../components/ui/AppHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { FloatingActionButton } from "../../components/ui/FloatingActionButton";
import { LoadingState } from "../../components/ui/LoadingState";
import {
  colors,
  fontSize,
  radius,
  shadows,
  spacing,
} from "../../constants/colors";
import { useCompanies } from "../../hooks/useCompanies";
import { useWorkHours } from "../../hooks/useWorkHours";
import { useWorkLimitSettings } from "../../hooks/useWorkLimitSettings";
import type { RootStackParamList } from "../../navigation/types";
import { syncQueue } from "../../storage/syncQueue";
import { useAuthStore } from "../../store/authStore";
import type { WorkShift } from "../../types/work.types";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatShortDate } from "../../utils/formatDate";
import { getWorkLimitOverview } from "../../utils/workLimit";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

type CompanyFilter = {
  key: string;
  label: string;
};

type CompanyGroup = {
  key: string;
  title: string;
  companyId: string | null;
  totalHours: number;
  totalIncome: number;
  shiftCount: number;
  shifts: WorkShift[];
};

type WorkTab = "recent" | "companies";

function getSyncStatusLabel(
  isAuthenticated: boolean,
  hasPendingSync: boolean,
  hasSyncError: boolean,
) {
  if (!isAuthenticated) return "Guest mode";
  if (hasPendingSync) return "Sync pending";
  if (hasSyncError) return "Offline mode";
  return "Synced";
}

function getCompanyKey(shift: WorkShift) {
  return (
    shift.companyId ??
    `job:${shift.jobName.trim().toLowerCase() || "work-shift"}`
  );
}

function getCompanyTitle(shift: WorkShift, companyName?: string | null) {
  return companyName?.trim() || shift.jobName?.trim() || "Work shift";
}

function buildCompanyGroups(
  shifts: WorkShift[],
  companyNames: Map<string, string>,
) {
  const groups = new Map<string, CompanyGroup>();

  for (const shift of shifts) {
    const key = getCompanyKey(shift);
    const current = groups.get(key) ?? {
      key,
      title: getCompanyTitle(
        shift,
        shift.companyId ? companyNames.get(shift.companyId) : null,
      ),
      companyId: shift.companyId ?? null,
      totalHours: 0,
      totalIncome: 0,
      shiftCount: 0,
      shifts: [],
    };

    current.totalHours += shift.calculatedHours;
    current.totalIncome += shift.calculatedIncome;
    current.shiftCount += 1;
    current.shifts.push(shift);
    groups.set(key, current);
  }

  return [...groups.values()].sort((left, right) => {
    const leftDate = left.shifts[0]?.date ?? "";
    const rightDate = right.shifts[0]?.date ?? "";
    return rightDate.localeCompare(leftDate);
  });
}

function toCompanyDetailParams(group: CompanyGroup) {
  return group.companyId
    ? { companyId: group.companyId }
    : { companyName: group.title };
}

export function WorkHoursScreen() {
  const navigation = useNavigation<Navigation>();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const {
    workShifts,
    weeklySummary,
    monthlySummary,
    deleteWorkShift,
    isSaving,
  } = useWorkHours();
  const workLimit = useWorkLimitSettings();
  const { companies } = useCompanies();
  const [pendingCount, setPendingCount] = useState(0);
  const [selectedCompanyKey, setSelectedCompanyKey] = useState<string>("");
  const [activeTab, setActiveTab] = useState<WorkTab>("recent");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    void syncQueue.pending().then((items) => setPendingCount(items.length));
  }, [workShifts.data, isSaving]);

  async function refreshScreen() {
    setRefreshing(true);

    try {
      if (isAuthenticated) {
        await syncQueue.processWithBackend();
      }

      await Promise.all([
        workShifts.refetch(),
        weeklySummary.refetch(),
        monthlySummary.refetch(),
        workLimit.refetch(),
        companies.refetch(),
      ]);

      const items = await syncQueue.pending();
      setPendingCount(items.length);
    } finally {
      setRefreshing(false);
    }
  }

  const shifts = workShifts.data ?? [];
  const weekDays = new Set(
    (weeklySummary.data?.shifts ?? []).map((shift) => shift.date),
  ).size;
  const companyNames = new Map(
    (companies.data ?? []).map((company) => [company.id, company.name]),
  );
  const companyGroups = buildCompanyGroups(
    [...(monthlySummary.data?.shifts ?? [])].sort((left, right) => {
      const leftValue = `${left.date} ${left.startTime}`;
      const rightValue = `${right.date} ${right.startTime}`;
      return rightValue.localeCompare(leftValue);
    }),
    companyNames,
  );
  const companyFilters: CompanyFilter[] = [
    ...companyGroups.map((group) => ({ key: group.key, label: group.title })),
  ];
  const selectedCompany =
    companyGroups.find((group) => group.key === selectedCompanyKey) ??
    companyGroups[0] ??
    null;

  useEffect(() => {
    if (activeTab !== "companies") return;
    if (!selectedCompany && companyGroups.length > 0) {
      setSelectedCompanyKey(companyGroups[0].key);
    }
  }, [activeTab, companyGroups, selectedCompany]);

  const recentShifts = [...shifts]
    .sort((left, right) => {
      const leftValue = `${left.date} ${left.startTime}`;
      const rightValue = `${right.date} ${right.startTime}`;
      return rightValue.localeCompare(leftValue);
    })
    .slice(0, 8);
  const workLimitOverview = workLimit.summary
    ? getWorkLimitOverview(workLimit.summary)
    : monthlySummary.data
      ? getWorkLimitOverview(monthlySummary.data.workLimit)
      : null;
  const showLimitBanner =
    workLimit.settings &&
    !workLimit.settings.isLimitEnabled &&
    !workLimit.settings.hasDismissedUnlimitedLimitBanner;

  if (
    workShifts.isLoading ||
    weeklySummary.isLoading ||
    monthlySummary.isLoading ||
    workLimit.isLoading
  ) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingState label="Loading work" />
      </SafeAreaView>
    );
  }

  if (
    workShifts.isError ||
    weeklySummary.isError ||
    monthlySummary.isError ||
    workLimit.isError
  ) {
    return (
      <SafeAreaView style={styles.safe}>
        <ErrorState
          message="Could not load work tracking."
          onRetry={() => {
            void workShifts.refetch();
            void weeklySummary.refetch();
            void monthlySummary.refetch();
            void workLimit.refetch();
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void refreshScreen()}
          />
        }
      >
        <AppHeader title="Work" avatarText={user?.name ?? "SK"} />

        <View style={styles.topRow}>
          <Text style={styles.syncText}>
            {getSyncStatusLabel(
              isAuthenticated,
              pendingCount > 0,
              workShifts.isError,
            )}
          </Text>
        </View>

        {showLimitBanner ? (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>
              No work limit is active. You can set one in Settings.
            </Text>
            <View style={styles.bannerRow}>
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  navigation.navigate("Main", { screen: "Settings" })
                }
                style={({ pressed }) => [
                  styles.bannerAction,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.bannerActionText}>Set work limit</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => void workLimit.dismissUnlimitedBanner()}
                style={({ pressed }) => [
                  styles.bannerGhost,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.bannerGhostText}>Dismiss</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>This week</Text>
            <Text style={styles.sectionMeta}>
              {pendingCount > 0 ? `${pendingCount} pending` : "Up to date"}
            </Text>
          </View>
          <View style={styles.metricGrid}>
            <CompactMetric
              label="Hours"
              value={`${(weeklySummary.data?.totalHours ?? 0).toFixed(1)}h`}
            />
            <CompactMetric
              label="Income"
              value={formatCurrency(
                weeklySummary.data?.totalIncome ?? 0,
                user?.currency,
              )}
            />
            <CompactMetric label="Days" value={`${weekDays}`} />
            <CompactMetric
              label="Limit"
              value={workLimitOverview?.statusLabel ?? "Unlimited"}
              tone={
                workLimitOverview?.statusTone === "danger"
                  ? "danger"
                  : "default"
              }
            />
          </View>
        </View>

        <View style={styles.tabRow}>
          {[
            { key: "recent", label: "Recent entries" },
            { key: "companies", label: "Company shifts" },
          ].map((tab) => {
            const selected = activeTab === tab.key;

            return (
              <Pressable
                key={tab.key}
                accessibilityRole="button"
                onPress={() => setActiveTab(tab.key as WorkTab)}
                style={({ pressed }) => [
                  styles.tabChip,
                  selected && styles.tabChipSelected,
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[
                    styles.tabChipText,
                    selected && styles.tabChipTextSelected,
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {activeTab === "companies" ? (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Company shifts</Text>
              <Text style={styles.sectionMeta}>
                {companyFilters.length} companies
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              {companyFilters.map((filter) => {
                const selected = filter.key === selectedCompanyKey;

                return (
                  <Pressable
                    key={filter.key}
                    accessibilityRole="button"
                    onPress={() => setSelectedCompanyKey(filter.key)}
                    style={({ pressed }) => [
                      styles.filterChip,
                      selected && styles.filterChipSelected,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        selected && styles.filterChipTextSelected,
                      ]}
                    >
                      {filter.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {selectedCompany ? (
              <View style={styles.list}>
                <CompanyShiftCard
                  group={selectedCompany}
                  currency={user?.currency}
                  onPress={() =>
                    navigation.navigate(
                      "CompanyDetail",
                      toCompanyDetailParams(selectedCompany) as never,
                    )
                  }
                />

                <View style={styles.recentSection}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recent entries</Text>
                    <Text style={styles.sectionMeta}>
                      {selectedCompany.shifts.length}
                    </Text>
                  </View>
                  {selectedCompany.shifts.length === 0 ? (
                    <EmptyState
                      title="No work entries yet"
                      message="Add your first work shift to start tracking hours and income."
                      actionLabel="Add Work Entry"
                      onAction={() => navigation.navigate("AddWorkShift")}
                    />
                  ) : (
                    <View style={styles.list}>
                      {selectedCompany.shifts.slice(0, 6).map((shift) => (
                        <RecentEntryRow
                          key={shift.id}
                          shift={shift}
                          companyName={selectedCompany.title}
                          currency={user?.currency}
                          disabled={isSaving}
                          onEdit={() =>
                            navigation.navigate("AddWorkShift", {
                              workShiftId: shift.id,
                            })
                          }
                          onDelete={() =>
                            Alert.alert(
                              "Delete work entry?",
                              "This entry will be removed.",
                              [
                                { text: "Cancel", style: "cancel" },
                                {
                                  text: "Delete",
                                  style: "destructive",
                                  onPress: () => void deleteWorkShift(shift.id),
                                },
                              ],
                            )
                          }
                        />
                      ))}
                    </View>
                  )}
                </View>
              </View>
            ) : (
              <EmptyState
                title="No work entries yet"
                message="Add your first work shift to start tracking hours and income."
                actionLabel="Add Work Entry"
                onAction={() => navigation.navigate("AddWorkShift")}
              />
            )}
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent entries</Text>
              <Text style={styles.sectionMeta}>{recentShifts.length}</Text>
            </View>
            {recentShifts.length === 0 ? (
              <EmptyState
                title="No work entries yet"
                message="Add your first work shift to start tracking hours and income."
                actionLabel="Add Work Entry"
                onAction={() => navigation.navigate("AddWorkShift")}
              />
            ) : (
              <View style={styles.list}>
                {recentShifts.map((shift) => (
                  <RecentEntryRow
                    key={shift.id}
                    shift={shift}
                    companyName={
                      shift.companyId
                        ? companyNames.get(shift.companyId)
                        : undefined
                    }
                    currency={user?.currency}
                    disabled={isSaving}
                    onEdit={() =>
                      navigation.navigate("AddWorkShift", {
                        workShiftId: shift.id,
                      })
                    }
                    onDelete={() =>
                      Alert.alert(
                        "Delete work entry?",
                        "This entry will be removed.",
                        [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Delete",
                            style: "destructive",
                            onPress: () => void deleteWorkShift(shift.id),
                          },
                        ],
                      )
                    }
                  />
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
      <FloatingActionButton
        onPress={() => navigation.navigate("AddWorkShift")}
      />
    </SafeAreaView>
  );
}

function CompactMetric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "danger";
}) {
  return (
    <View style={styles.metricBox}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text
        style={[styles.metricValue, tone === "danger" && styles.metricDanger]}
      >
        {value}
      </Text>
    </View>
  );
}

function RecentEntryRow({
  shift,
  companyName,
  currency,
  disabled,
  onEdit,
  onDelete,
}: {
  shift: WorkShift;
  companyName?: string;
  currency?: string;
  disabled: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={styles.rowCard}>
      <View style={styles.rowTop}>
        <Text style={styles.rowDate}>{companyName ?? shift.jobName}</Text>
        <Text style={styles.rowIncome}>
          {formatCurrency(shift.calculatedIncome, currency)}
        </Text>
      </View>
      <Text style={styles.rowTitleMeta}>
        {formatShortDate(shift.date)} · {shift.startTime} - {shift.endTime}
      </Text>
      <Text style={styles.rowTime}>
        {shift.breakMinutes} min break · {shift.calculatedHours.toFixed(1)}h
      </Text>
      <View style={styles.rowBottom}>
        <View style={styles.rowActions}>
          <Pressable
            accessibilityRole="button"
            disabled={disabled}
            onPress={onEdit}
            style={({ pressed }) => [
              styles.rowAction,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.rowActionText}>Edit</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={disabled}
            onPress={onDelete}
            style={({ pressed }) => [
              styles.rowAction,
              styles.rowActionDanger,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.rowActionDangerText}>Delete</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function CompanyShiftCard({
  group,
  currency,
  onPress,
}: {
  group: CompanyGroup;
  currency?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.groupCard, pressed && styles.pressed]}
    >
      <View style={styles.groupHeader}>
        <View style={styles.groupHeaderText}>
          <Text style={styles.groupTitle}>{group.title}</Text>
          <Text style={styles.groupMeta}>
            This month · {group.shiftCount} shifts ·{" "}
            {group.totalHours.toFixed(1)}h
          </Text>
        </View>
        <View style={styles.groupSummary}>
          <Text style={styles.groupSummaryLabel}>Hours</Text>
          <Text style={styles.groupIncome}>{group.totalHours.toFixed(1)}h</Text>
          <Text style={styles.groupSummaryLabel}>Earned</Text>
          <Text style={styles.groupIncome}>
            {formatCurrency(group.totalIncome, currency)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: 88,
    gap: spacing.sm,
  },
  topRow: {
    minHeight: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  syncText: {
    color: colors.muted,
    fontSize: fontSize.caption,
    fontWeight: "700",
  },
  banner: {
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  bannerText: {
    color: colors.text,
    fontSize: fontSize.caption,
    lineHeight: 16,
  },
  bannerRow: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  bannerAction: {
    minHeight: 30,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  bannerActionText: {
    color: "#FFFFFF",
    fontSize: fontSize.caption,
    fontWeight: "700",
  },
  bannerGhost: {
    minHeight: 30,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  bannerGhostText: {
    color: colors.text,
    fontSize: fontSize.caption,
    fontWeight: "700",
  },
  card: {
    borderRadius: radius.lg,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    gap: spacing.sm,
    ...shadows.soft,
  },
  sectionHeader: {
    minHeight: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.body,
    fontWeight: "800",
  },
  sectionMeta: {
    color: colors.muted,
    fontSize: fontSize.caption,
    fontWeight: "700",
  },
  tabRow: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  tabChip: {
    flex: 1,
    minHeight: 34,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
  },
  tabChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabChipText: {
    color: colors.text,
    fontSize: fontSize.caption,
    fontWeight: "800",
  },
  tabChipTextSelected: {
    color: "#FFFFFF",
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  metricBox: {
    minWidth: "47%",
    flex: 1,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    gap: 2,
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
  },
  metricValue: {
    color: colors.text,
    fontSize: fontSize.body,
    fontWeight: "800",
  },
  metricDanger: {
    color: colors.danger,
  },
  filterRow: {
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  filterChip: {
    minHeight: 30,
    borderRadius: radius.md,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.xs,
  },
  filterChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: "800",
  },
  filterChipTextSelected: {
    color: "#FFFFFF",
  },
  list: {
    gap: spacing.xs,
  },
  groupCard: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    minHeight: 88,
    flexDirection: "row",
    alignItems: "center",
    ...shadows.soft,
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    flex: 1,
  },
  groupHeaderText: {
    flex: 1,
    gap: 2,
  },
  groupTitle: {
    color: colors.text,
    fontSize: fontSize.body,
    fontWeight: "900",
  },
  groupMeta: {
    color: colors.muted,
    fontSize: fontSize.caption,
    fontWeight: "700",
  },
  groupSummary: {
    alignItems: "flex-end",
    gap: 2,
  },
  groupSummaryLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  groupIncome: {
    color: colors.primary,
    fontSize: fontSize.body,
    fontWeight: "900",
  },
  rowCard: {
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    gap: 3,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  rowTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  rowDate: {
    color: colors.text,
    fontSize: fontSize.caption,
    fontWeight: "800",
  },
  rowTitleMeta: {
    color: colors.muted,
    fontSize: 10,
  },
  rowIncome: {
    color: colors.primary,
    fontSize: fontSize.caption,
    fontWeight: "800",
  },
  rowTime: {
    color: colors.muted,
    fontSize: 11,
  },
  rowBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  rowActions: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  rowAction: {
    minHeight: 24,
    minWidth: 46,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  rowActionDanger: {
    borderColor: colors.danger,
    backgroundColor: colors.surface,
  },
  rowActionText: {
    color: colors.text,
    fontSize: 10,
    fontWeight: "700",
  },
  rowActionDangerText: {
    color: colors.danger,
    fontSize: 10,
    fontWeight: "700",
  },
  smallAction: {
    minHeight: 26,
    minWidth: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  smallActionText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: "700",
  },
  smallDanger: {
    borderColor: colors.danger,
  },
  smallDangerText: {
    color: colors.danger,
    fontSize: 11,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.78,
  },
});
