import { StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../../constants/colors";
import type { WorkSummary } from "../../types/work.types";
import { formatCurrency } from "../../utils/formatCurrency";

export function WorkCompanySummaryCard({
  summary,
  currency
}: {
  summary?: WorkSummary | null;
  currency?: string;
}) {
  const companies = summary?.companies ?? [];
  const bestCompany = companies[0];

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Work by Company</Text>
        <Text style={styles.total}>
          {summary?.totalHours ?? 0}h | {formatCurrency(summary?.totalIncome ?? 0, currency)}
        </Text>
      </View>

      {bestCompany ? (
        <Text style={styles.best}>
          Best earning job: {bestCompany.companyName} at{" "}
          {formatCurrency(bestCompany.averageHourlyIncome, currency)}/h avg.
        </Text>
      ) : (
        <Text style={styles.best}>Add shifts to compare your part-time jobs.</Text>
      )}

      <View style={styles.list}>
        {companies.slice(0, 3).map((company) => (
          <View key={company.companyName} style={styles.row}>
            <View style={styles.companyDot} />
            <View style={styles.body}>
              <Text style={styles.company}>{company.companyName}</Text>
              <Text style={styles.meta}>
                {company.totalHours}h | {company.shiftCount} shifts
              </Text>
            </View>
            <Text style={styles.income}>{formatCurrency(company.totalIncome, currency)}</Text>
          </View>
        ))}
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
    gap: spacing.sm
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900"
  },
  total: {
    color: colors.income,
    fontSize: 13,
    fontWeight: "900"
  },
  best: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19
  },
  list: {
    gap: spacing.sm
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm
  },
  companyDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.income
  },
  body: {
    flex: 1
  },
  company: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900"
  },
  meta: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2
  },
  income: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900"
  }
});
