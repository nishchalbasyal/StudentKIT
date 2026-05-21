import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "../../constants/colors";

type Props = {
  loggedExpenses: number;
  cleaningDue: number;
  tasksToday: number;
};

export function StreakCard({ loggedExpenses, cleaningDue, tasksToday }: Props) {
  const wins = [
    {
      id: "expenses",
      label: "Expense memory",
      value: loggedExpenses > 0 ? `${loggedExpenses} logged` : "ready",
      icon: "receipt-outline" as const
    },
    {
      id: "cleaning",
      label: "Routine care",
      value: cleaningDue === 0 ? "clear" : `${cleaningDue} due`,
      icon: "sparkles-outline" as const
    },
    {
      id: "tasks",
      label: "Study focus",
      value: tasksToday === 0 ? "clear" : `${tasksToday} today`,
      icon: "checkmark-done-outline" as const
    }
  ];

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Small Wins</Text>
      <View style={styles.row}>
        {wins.map((win) => (
          <View key={win.id} style={styles.win}>
            <Ionicons name={win.icon} size={18} color={colors.primary} />
            <Text style={styles.value}>{win.value}</Text>
            <Text style={styles.label}>{win.label}</Text>
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
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900"
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm
  },
  win: {
    flex: 1,
    minHeight: 92,
    borderRadius: 12,
    padding: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceMuted,
    gap: 3
  },
  value: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900",
    textAlign: "center"
  },
  label: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center"
  }
});
