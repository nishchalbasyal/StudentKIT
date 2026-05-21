import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "../../constants/colors";
import type { TodayFocusItem } from "../../utils/homePriorityEngine";

const iconByType: Record<TodayFocusItem["type"], keyof typeof Ionicons.glyphMap> = {
  task: "create-outline",
  class: "school-outline",
  work: "briefcase-outline",
  cleaning: "sparkles-outline",
  grocery: "basket-outline",
  budget: "wallet-outline",
  reminder: "notifications-outline",
  motivation: "leaf-outline"
};

const toneColor: Record<TodayFocusItem["tone"], string> = {
  high: colors.high,
  medium: colors.medium,
  low: colors.low,
  calm: colors.primary
};

export function TodayFocusCard({ items }: { items: TodayFocusItem[] }) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.kicker}>Today Focus</Text>
        <Text style={styles.title}>What matters today</Text>
      </View>

      <View style={styles.list}>
        {items.slice(0, 5).map((item) => (
          <View key={item.id} style={styles.row}>
            <View style={[styles.iconWrap, { backgroundColor: `${toneColor[item.tone]}18` }]}>
              <Ionicons name={iconByType[item.type]} size={18} color={toneColor[item.tone]} />
            </View>
            <View style={styles.body}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.subtitle}>{item.subtitle}</Text>
            </View>
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
    gap: 2
  },
  kicker: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900"
  },
  list: {
    gap: spacing.md
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  body: {
    flex: 1
  },
  itemTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900"
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2
  }
});
