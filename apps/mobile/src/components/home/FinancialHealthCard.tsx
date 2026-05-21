import { StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../../constants/colors";
import { formatCurrency } from "../../utils/formatCurrency";

type Props = {
  income: number;
  expenses: number;
  savings: number;
  workLimitUsed: number;
  workLimitTotal: number;
  currency?: string;
};

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, value));
}

export function FinancialHealthCard({
  income,
  expenses,
  savings,
  workLimitUsed,
  workLimitTotal,
  currency
}: Props) {
  const expensePercent = income > 0 ? clampPercent((expenses / income) * 100) : 0;
  const workPercent = workLimitTotal > 0 ? clampPercent((workLimitUsed / workLimitTotal) * 100) : 0;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>This Month</Text>
        <Text style={[styles.badge, savings < 0 && styles.badgeDanger]}>
          {savings >= 0 ? "under control" : "watch spend"}
        </Text>
      </View>

      <View style={styles.grid}>
        <Metric label="Income" value={formatCurrency(income, currency)} tone={colors.income} />
        <Metric label="Expenses" value={formatCurrency(expenses, currency)} tone={colors.expense} />
        <Metric label="Savings" value={formatCurrency(savings, currency)} tone={colors.savings} />
      </View>

      <Progress label="Expense pressure" percent={expensePercent} color={colors.expense} />
      <Progress
        label={`Germany work limit: ${workLimitUsed}/${workLimitTotal} days`}
        percent={workPercent}
        color={workPercent > 80 ? colors.warning : colors.income}
      />
    </View>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, { color: tone }]}>{value}</Text>
    </View>
  );
}

function Progress({ label, percent, color }: { label: string; percent: number; color: string }) {
  return (
    <View style={styles.progressBlock}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>{label}</Text>
        <Text style={styles.progressLabel}>{Math.round(percent)}%</Text>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900"
  },
  badge: {
    color: colors.income,
    backgroundColor: colors.incomeSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "900"
  },
  badgeDanger: {
    color: colors.expense,
    backgroundColor: colors.expenseSoft
  },
  grid: {
    flexDirection: "row",
    gap: spacing.sm
  },
  metric: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
    padding: spacing.md
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800"
  },
  metricValue: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: "900"
  },
  progressBlock: {
    gap: spacing.xs
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  progressLabel: {
    color: colors.muted,
    fontSize: 12,
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
