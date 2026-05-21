import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "../../constants/colors";
import { formatCurrency } from "../../utils/formatCurrency";

type Props = {
  name?: string | null;
  completedToday: number;
  budgetBalance: number;
  tomorrowClasses: number;
  currency?: string;
};

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
}

export function SmartGreetingHeader({
  name,
  completedToday,
  budgetBalance,
  tomorrowClasses,
  currency
}: Props) {
  const firstName = name?.split(" ")[0] ?? "there";
  const dateLabel = new Intl.DateTimeFormat("en-DE", {
    weekday: "long",
    month: "short",
    day: "numeric"
  }).format(new Date());

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.date}>{dateLabel}</Text>
          <Text style={styles.title}>
            {getGreeting()} {firstName}
          </Text>
        </View>
        <View style={styles.weather}>
          <Ionicons name="partly-sunny-outline" size={18} color="#FFFFFF" />
          <Text style={styles.weatherText}>Weather</Text>
        </View>
      </View>

      <Text style={styles.summary}>
        {completedToday > 0
          ? `You completed ${completedToday} thing${completedToday === 1 ? "" : "s"} today.`
          : "Open the app, pick one next step, and let the rest wait calmly."}
      </Text>

      <View style={styles.pills}>
        <View style={styles.pill}>
          <Text style={styles.pillLabel}>Month balance</Text>
          <Text style={styles.pillValue}>{formatCurrency(budgetBalance, currency)}</Text>
        </View>
        <View style={styles.pill}>
          <Text style={styles.pillLabel}>Tomorrow</Text>
          <Text style={styles.pillValue}>{tomorrowClasses} classes</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.primary,
    shadowColor: "#0F172A",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md
  },
  date: {
    color: "#DBEAFE",
    fontSize: 13,
    fontWeight: "700"
  },
  title: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 4
  },
  weather: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.16)"
  },
  weatherText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800"
  },
  summary: {
    color: "#EFF6FF",
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "700"
  },
  pills: {
    flexDirection: "row",
    gap: spacing.sm
  },
  pill: {
    flex: 1,
    borderRadius: 14,
    padding: spacing.md,
    backgroundColor: "rgba(255,255,255,0.14)"
  },
  pillLabel: {
    color: "#DBEAFE",
    fontSize: 12,
    fontWeight: "700"
  },
  pillValue: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    marginTop: 3
  }
});
