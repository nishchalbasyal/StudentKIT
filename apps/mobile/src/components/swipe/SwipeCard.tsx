import { StyleSheet, Text, View } from "react-native";
import type { SwipeDeckCard } from "./swipeActions";
import { SwipeHint } from "./SwipeHint";
import { colors, spacing } from "../../constants/colors";

type Props = {
  card: SwipeDeckCard;
  index: number;
  total: number;
};

export function SwipeCard({ card, index, total }: Props) {
  return (
    <View style={[styles.card, { borderTopColor: card.accentColor }]}>
      <View style={styles.header}>
        <View style={styles.counter}>
          <Text style={styles.counterText}>
            {index + 1}/{total}
          </Text>
        </View>
        <Text style={styles.title}>{card.title}</Text>
        <Text style={styles.subtitle}>{card.subtitle}</Text>
      </View>

      <View style={styles.metrics}>
        {card.metrics.map((metric) => (
          <View key={metric.label} style={styles.metric}>
            <Text style={styles.metricLabel}>{metric.label}</Text>
            <Text style={styles.metricValue}>{metric.value}</Text>
          </View>
        ))}
      </View>

      <SwipeHint
        left={card.leftAction}
        right={card.rightAction}
        up={card.upAction}
        down={card.downAction}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 220,
    borderRadius: 18,
    borderWidth: 1,
    borderTopWidth: 5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    gap: spacing.lg,
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2
  },
  header: {
    gap: spacing.xs
  },
  counter: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    backgroundColor: colors.surfaceMuted
  },
  counterText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "900"
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900"
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20
  },
  metrics: {
    flexDirection: "row",
    gap: spacing.sm
  },
  metric: {
    flex: 1,
    borderRadius: 14,
    padding: spacing.md,
    backgroundColor: colors.surfaceMuted
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800"
  },
  metricValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
    marginTop: 4
  }
});
