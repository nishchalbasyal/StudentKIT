import { Pressable, StyleSheet, Text, View } from "react-native";
import { AppCard } from "../ui/AppCard";
import { colors, radius, spacing } from "../../constants/colors";
import type { WorkLimitOverview } from "../../utils/workLimit";

export function WorkLimitCard({
  overview,
  onPress,
}: {
  overview: WorkLimitOverview;
  onPress?: () => void;
}) {
  const percent = Math.min(Math.max(overview.percentUsed, 0), 100);
  const statusColor =
    overview.statusTone === "danger"
      ? colors.danger
      : overview.statusTone === "warning"
        ? colors.warning
        : overview.statusTone === "success"
          ? colors.success
          : colors.muted;

  const Container = onPress ? Pressable : View;

  return (
    <Container
      accessibilityRole={onPress ? "button" : undefined}
      onPress={onPress}
      style={({ pressed }: { pressed: boolean }) => [
        styles.cardWrap,
        pressed && onPress && styles.pressed,
      ]}
    >
      <AppCard title={overview.title} subtitle={overview.description}>
        <View style={styles.headerRow}>
          <View style={styles.stack}>
            <Text style={styles.limit}>{overview.limitLabel}</Text>
            <Text style={[styles.status, { color: statusColor }]}>
              {overview.statusLabel}
            </Text>
          </View>
          <Text style={[styles.percent, { color: statusColor }]}>
            {Math.round(percent)}%
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${percent}%`, backgroundColor: statusColor },
            ]}
          />
        </View>
        {overview.usedLabel ? (
          <Text style={styles.meta}>{overview.usedLabel}</Text>
        ) : null}
        {overview.remainingLabel ? (
          <Text style={styles.meta}>{overview.remainingLabel}</Text>
        ) : null}
        {overview.monthlyAllowedLabel ? (
          <Text style={styles.meta}>{overview.monthlyAllowedLabel}</Text>
        ) : null}
        <Text style={[styles.action, { color: colors.primary }]}>
          {overview.actionLabel}
        </Text>
      </AppCard>
    </Container>
  );
}

const styles = StyleSheet.create({
  cardWrap: {
    borderRadius: radius.lg,
  },
  pressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  stack: {
    flex: 1,
    gap: 2,
  },
  limit: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900",
  },
  status: {
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  percent: {
    fontSize: 18,
    fontWeight: "900",
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: colors.surfaceMuted,
    marginTop: spacing.xs,
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },
  meta: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  action: {
    marginTop: spacing.xs,
    fontSize: 13,
    fontWeight: "900",
  },
});
