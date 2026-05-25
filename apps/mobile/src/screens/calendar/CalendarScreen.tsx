import { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppHeader } from "../../components/ui/AppHeader";
import { ErrorState } from "../../components/ui/ErrorState";
import { LoadingState } from "../../components/ui/LoadingState";
import { colors, fontSize, radius, shadows, spacing } from "../../constants/colors";
import { useWorkHours } from "../../hooks/useWorkHours";
import { useWorkLimitSettings } from "../../hooks/useWorkLimitSettings";
import type { RootStackParamList } from "../../navigation/types";
import { useAuthStore } from "../../store/authStore";
import type { WorkShift } from "../../types/work.types";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatShortDate } from "../../utils/formatDate";
import { getWorkLimitOverview } from "../../utils/workLimit";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

type DayCell = {
  isoDate: string;
  dayNumber: number;
  inMonth: boolean;
  hours: number;
  count: number;
};

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function toIsoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

function buildMonthDays(monthDate: Date, shifts: WorkShift[]) {
  const counts = new Map<string, { hours: number; count: number }>();
  for (const shift of shifts) {
    const entry = counts.get(shift.date) ?? { hours: 0, count: 0 };
    entry.hours += shift.calculatedHours;
    entry.count += 1;
    counts.set(shift.date, entry);
  }

  const firstDay = startOfMonth(monthDate);
  const startWeekday = (firstDay.getDay() + 6) % 7;
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - startWeekday);
  const days: DayCell[] = [];

  for (let index = 0; index < 42; index += 1) {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + index);
    const isoDate = toIsoDate(day);
    const info = counts.get(isoDate);
    days.push({
      isoDate,
      dayNumber: day.getDate(),
      inMonth: day.getMonth() === monthDate.getMonth(),
      hours: info?.hours ?? 0,
      count: info?.count ?? 0,
    });
  }

  return days;
}

export function CalendarScreen() {
  const navigation = useNavigation<Navigation>();
  const user = useAuthStore((state) => state.user);
  const [monthDate, setMonthDate] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => toIsoDate(new Date()));
  const { monthlySummary, deleteWorkShift, isSaving } = useWorkHours({
    year: monthDate.getFullYear(),
    month: monthDate.getMonth() + 1,
  });
  const workLimit = useWorkLimitSettings();

  const monthTitle = useMemo(
    () =>
      new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(monthDate),
    [monthDate],
  );

  const shifts = monthlySummary.data?.shifts ?? [];
  const calendarDays = useMemo(() => buildMonthDays(monthDate, shifts), [monthDate, shifts]);
  const selectedShifts = shifts.filter((shift) => shift.date === selectedDate);
  const workDays = new Set(shifts.map((shift) => shift.date)).size;
  const totalHours = monthlySummary.data?.totalHours ?? 0;
  const totalIncome = monthlySummary.data?.totalIncome ?? 0;
  const averageHours = workDays > 0 ? totalHours / workDays : 0;
  const limitOverview = workLimit.summary ? getWorkLimitOverview(workLimit.summary) : null;

  if (monthlySummary.isLoading || workLimit.isLoading) {
    return <LoadingState label="Loading calendar" />;
  }

  if (monthlySummary.isError || workLimit.isError) {
    return (
      <ErrorState
        message="Could not load your calendar."
        onRetry={() => {
          void monthlySummary.refetch();
          void workLimit.refetch();
        }}
      />
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AppHeader title="Calendar" avatarText={user?.name ?? "SK"} />

        <View style={styles.topRow}>
          <Text style={styles.monthTitle}>{monthTitle}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate("AddWorkShift")}
            style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
          >
            <Ionicons name="add" size={16} color="#FFFFFF" />
            <Text style={styles.addText}>Add Work Entry</Text>
          </Pressable>
        </View>

        <View style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setMonthDate((current) => addMonths(current, -1))}
              style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
            >
              <Ionicons name="chevron-back" size={18} color={colors.text} />
            </Pressable>
            <Text style={styles.monthHeader}>{monthTitle}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setMonthDate((current) => addMonths(current, 1))}
              style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
            >
              <Ionicons name="chevron-forward" size={18} color={colors.text} />
            </Pressable>
          </View>

          <View style={styles.weekRow}>
            {[
              { key: "mon", label: "M" },
              { key: "tue", label: "T" },
              { key: "wed", label: "W" },
              { key: "thu", label: "T" },
              { key: "fri", label: "F" },
              { key: "sat", label: "S" },
              { key: "sun", label: "S" },
            ].map((day) => (
              <Text key={day.key} style={styles.weekLabel}>
                {day.label}
              </Text>
            ))}
          </View>

          <View style={styles.grid}>
            {calendarDays.map((day) => {
              const selected = day.isoDate === selectedDate;
              return (
                <Pressable
                  key={day.isoDate}
                  accessibilityRole="button"
                  onPress={() => setSelectedDate(day.isoDate)}
                  style={({ pressed }) => [
                    styles.dayCell,
                    !day.inMonth && styles.dayMuted,
                    selected && styles.daySelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={[styles.dayNumber, selected && styles.dayNumberSelected]}>
                    {day.dayNumber}
                  </Text>
                  {day.count > 0 ? (
                    <>
                      <View style={styles.dot} />
                      <Text style={styles.dayHours}>{day.hours.toFixed(1)}h</Text>
                    </>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{formatShortDate(selectedDate)}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate("AddWorkShift")}
              style={({ pressed }) => [styles.inlineAdd, pressed && styles.pressed]}
            >
              <Text style={styles.inlineAddText}>+ Add work entry</Text>
            </Pressable>
          </View>
          {selectedShifts.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>No work entry on this date.</Text>
              <Text style={styles.emptyText}>+ Add work entry</Text>
            </View>
          ) : (
            <View style={styles.list}>
              {selectedShifts.map((shift) => (
                <View key={shift.id} style={styles.entryRow}>
                  <View style={styles.entryMeta}>
                    <Text style={styles.entryTime}>
                      {shift.startTime} - {shift.endTime}
                    </Text>
                    <Text style={styles.entrySub}>
                      Break {shift.breakMinutes} min · {shift.calculatedHours.toFixed(1)}h
                    </Text>
                  </View>
                  <Text style={styles.entryIncome}>
                    {formatCurrency(shift.calculatedIncome, user?.currency)}
                  </Text>
                  <View style={styles.entryActions}>
                    <Pressable
                      accessibilityRole="button"
                      disabled={isSaving}
                      onPress={() => navigation.navigate("AddWorkShift", { workShiftId: shift.id })}
                      style={({ pressed }) => [styles.smallAction, pressed && styles.pressed]}
                    >
                      <Text style={styles.smallActionText}>Edit</Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      disabled={isSaving}
                      onPress={() =>
                        Alert.alert("Delete work entry?", "This entry will be removed.", [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Delete",
                            style: "destructive",
                            onPress: () => void deleteWorkShift(shift.id),
                          },
                        ])
                      }
                      style={({ pressed }) => [styles.smallAction, styles.smallDanger, pressed && styles.pressed]}
                    >
                      <Text style={styles.smallDangerText}>Delete</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Month summary</Text>
          <View style={styles.summaryGrid}>
            <SummaryMetric label="Hours" value={`${totalHours.toFixed(1)}h`} />
            <SummaryMetric label="Income" value={formatCurrency(totalIncome, user?.currency)} />
            <SummaryMetric label="Work days" value={`${workDays}`} />
            <SummaryMetric label="Avg/day" value={`${averageHours.toFixed(1)}h`} />
            <SummaryMetric label="Limit" value={limitOverview?.statusLabel ?? "Unlimited"} />
            <SummaryMetric
              label="Remaining"
              value={limitOverview?.remainingLabel ?? "N/A"}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricBox}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
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
  monthTitle: {
    color: colors.text,
    fontSize: fontSize.body,
    fontWeight: "800",
  },
  addButton: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
  },
  addText: {
    color: "#FFFFFF",
    fontSize: fontSize.caption,
    fontWeight: "800",
  },
  calendarCard: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    gap: spacing.sm,
    ...shadows.soft,
  },
  calendarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  monthHeader: {
    color: colors.text,
    fontSize: fontSize.caption,
    fontWeight: "800",
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  weekLabel: {
    width: "14%",
    color: colors.muted,
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  dayCell: {
    width: "13.2%",
    minHeight: 48,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    gap: 2,
  },
  dayMuted: {
    opacity: 0.35,
  },
  daySelected: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  dayNumber: {
    color: colors.text,
    fontSize: 11,
    fontWeight: "800",
  },
  dayNumberSelected: {
    color: colors.primary,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  dayHours: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: "700",
  },
  card: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
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
  },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.body,
    fontWeight: "800",
  },
  inlineAdd: {
    minHeight: 26,
    paddingHorizontal: 8,
    justifyContent: "center",
  },
  inlineAddText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "800",
  },
  emptyBox: {
    borderRadius: radius.md,
    backgroundColor: colors.background,
    padding: spacing.sm,
    gap: 4,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: fontSize.caption,
    fontWeight: "700",
  },
  emptyText: {
    color: colors.primary,
    fontSize: fontSize.caption,
    fontWeight: "700",
  },
  list: {
    gap: spacing.xs,
  },
  entryRow: {
    borderRadius: radius.md,
    backgroundColor: colors.background,
    padding: spacing.sm,
    gap: 4,
  },
  entryMeta: {
    gap: 2,
  },
  entryTime: {
    color: colors.text,
    fontSize: fontSize.caption,
    fontWeight: "800",
  },
  entrySub: {
    color: colors.muted,
    fontSize: 11,
  },
  entryIncome: {
    color: colors.primary,
    fontSize: fontSize.caption,
    fontWeight: "800",
  },
  entryActions: {
    flexDirection: "row",
    gap: spacing.xs,
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
  summaryGrid: {
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
    fontSize: fontSize.caption,
    fontWeight: "800",
  },
  pressed: {
    opacity: 0.78,
  },
});
