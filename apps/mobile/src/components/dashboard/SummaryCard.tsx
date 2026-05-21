import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "../../constants/colors";

type Tone = "income" | "expense" | "savings" | "primary";

const toneStyles: Record<Tone, { backgroundColor: string; color: string }> = {
  income: { backgroundColor: colors.incomeSoft, color: colors.income },
  expense: { backgroundColor: colors.expenseSoft, color: colors.expense },
  savings: { backgroundColor: colors.primarySoft, color: colors.savings },
  primary: { backgroundColor: colors.surfaceMuted, color: colors.primary }
};

export function SummaryCard({
  label,
  value,
  tone = "primary",
  icon
}: {
  label: string;
  value: string;
  tone?: Tone;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  const toneStyle = toneStyles[tone];

  return (
    <View style={[styles.card, { backgroundColor: toneStyle.backgroundColor }]}>
      <View style={styles.topRow}>
        <Text style={styles.label}>{label}</Text>
        <Ionicons name={icon} size={18} color={toneStyle.color} />
      </View>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 92,
    borderRadius: 8,
    padding: spacing.md,
    justifyContent: "space-between"
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm
  },
  label: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  value: {
    color: colors.text,
    fontSize: 19,
    fontWeight: "900"
  }
});

