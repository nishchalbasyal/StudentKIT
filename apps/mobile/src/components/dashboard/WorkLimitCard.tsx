import { StyleSheet, Text, View } from "react-native";
import { AppCard } from "../ui/AppCard";
import { colors, spacing } from "../../constants/colors";
import type { WorkLimitUsage } from "../../types/work.types";

export function WorkLimitCard({ usage }: { usage: WorkLimitUsage }) {
  const percent = Math.min(Math.max(usage.percentUsed, 0), 100);
  const statusColor =
    usage.warningLevel === "exceeded" || usage.warningLevel === "critical"
      ? colors.danger
      : usage.warningLevel === "near"
        ? colors.warning
        : colors.success;

  return (
    <AppCard title="German student work limit">
      <View style={styles.row}>
        <Text style={styles.value}>{usage.remainingFullDayUnits} days left</Text>
        <Text style={[styles.status, { color: statusColor }]}>{usage.warningLevel}</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${percent}%`, backgroundColor: statusColor }]} />
      </View>
      <Text style={styles.meta}>
        {usage.usedFullDayUnits} of {usage.limitFullDayUnits} full-day units used this year.
      </Text>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  value: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900"
  },
  status: {
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: colors.surfaceMuted,
    marginTop: spacing.xs
  },
  progressFill: {
    height: "100%",
    borderRadius: 999
  },
  meta: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18
  }
});

