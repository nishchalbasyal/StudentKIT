import { StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../../constants/colors";
import { formatCurrency } from "../../utils/formatCurrency";

type Props = {
  savings: number;
  workHours: number;
  currency?: string;
};

const savingsTarget = 200;
const workHoursTarget = 80;

function progress(current: number, target: number) {
  return Math.max(0, Math.min(100, (current / target) * 100));
}

export function MonthlyGoalCard({ savings, workHours, currency }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Monthly Goals</Text>
      <GoalRow
        title="Save more"
        value={`${formatCurrency(Math.max(savings, 0), currency)} / ${formatCurrency(savingsTarget, currency)}`}
        percent={progress(Math.max(savings, 0), savingsTarget)}
        color={colors.savings}
      />
      <GoalRow
        title="Work hours"
        value={`${workHours}h / ${workHoursTarget}h`}
        percent={progress(workHours, workHoursTarget)}
        color={colors.income}
      />
    </View>
  );
}

function GoalRow({
  title,
  value,
  percent,
  color
}: {
  title: string;
  value: string;
  percent: number;
  color: string;
}) {
  return (
    <View style={styles.goal}>
      <View style={styles.goalHeader}>
        <Text style={styles.goalTitle}>{title}</Text>
        <Text style={styles.goalValue}>{value}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percent}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900"
  },
  goal: {
    gap: spacing.xs
  },
  goalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm
  },
  goalTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900"
  },
  goalValue: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "800"
  },
  track: {
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.surfaceMuted,
    overflow: "hidden"
  },
  fill: {
    height: "100%",
    borderRadius: 999
  }
});
