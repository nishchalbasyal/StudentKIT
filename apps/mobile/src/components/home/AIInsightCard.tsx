import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "../../constants/colors";
import type { HomeInsight } from "../../utils/insightFormatter";

export function AIInsightCard({ insights }: { insights: HomeInsight[] }) {
  const primary = insights[0];

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.icon}>
          <Ionicons name="sparkles-outline" size={18} color={colors.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Smart Suggestions</Text>
          <Text style={styles.subtitle}>Cached or local, never guessed.</Text>
        </View>
      </View>

      <Text style={styles.message}>
        {primary?.message ?? "Generate an AI insight once, and it will appear here later."}
      </Text>

      {insights.length > 1 ? (
        <View style={styles.chips}>
          {insights.slice(1, 4).map((insight) => (
            <Text key={insight.id} style={styles.chip}>
              {insight.title}
            </Text>
          ))}
        </View>
      ) : null}
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
    gap: spacing.md
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft
  },
  headerText: {
    flex: 1
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900"
  },
  subtitle: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2
  },
  message: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "700"
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  chip: {
    color: colors.primary,
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "capitalize"
  }
});
