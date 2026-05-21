import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  Vibration,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  ActionSheet,
  type ActionSheetItem,
} from "../../components/ui/ActionSheet";
import { AppHeader } from "../../components/ui/AppHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { FloatingActionButton } from "../../components/ui/FloatingActionButton";
import { ListRow } from "../../components/ui/ListRow";
import { LoadingState } from "../../components/ui/LoadingState";
import {
  colors,
  fontSize,
  radius,
  shadows,
  spacing,
} from "../../constants/colors";
import { getApiErrorMessage } from "../../api/apiClient";
import { useHomeSummary } from "../../hooks/useHomeSummary";
import type { RootStackParamList } from "../../navigation/types";
import { useAuthStore } from "../../store/authStore";
import type {
  FocusItemType,
  TodayFocusItem,
} from "../../utils/homePriorityEngine";
import { formatCurrency } from "../../utils/formatCurrency";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

const quickActions = [
  { label: "Add with AI", icon: "sparkles-outline", route: "AIAssistant" },
  { label: "Add Work", icon: "briefcase-outline", route: "AddWorkShift" },
  { label: "Add Expense", icon: "receipt-outline", route: "AddExpense" },
  { label: "Add Task", icon: "checkmark-circle-outline", route: "AddTask" },
  { label: "Add Grocery", icon: "basket-outline", route: "AddGroceryItem" },
  { label: "Mark Cleaning Done", icon: "sparkles-outline", route: "Cleaning" },
] as const;

const focusIcons: Record<FocusItemType, keyof typeof Ionicons.glyphMap> = {
  task: "book-outline",
  class: "school-outline",
  work: "time-outline",
  cleaning: "sparkles-outline",
  grocery: "basket-outline",
  budget: "wallet-outline",
  reminder: "notifications-outline",
  motivation: "leaf-outline",
};

export function DashboardScreen() {
  const navigation = useNavigation<Navigation>();
  const user = useAuthStore((state) => state.user);
  const home = useHomeSummary(user?.currency);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const firstName = user?.name?.split(" ")[0] ?? "Student";
  const quickAddActions = useMemo<ActionSheetItem[]>(
    () =>
      quickActions.map((action) => ({
        label: action.label,
        icon: action.icon,
        onPress: () => navigation.navigate(action.route as never),
      })),
    [navigation],
  );

  if (home.isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingState label="Loading your day" />
      </SafeAreaView>
    );
  }

  if (home.isError || !home.dashboard.data) {
    const errorMessage = [
      home.dashboard.error,
      home.monthlySummary.error,
      home.weeklySummary.error,
      home.workShifts.error,
    ].find(Boolean);

    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ErrorState
            message={
              errorMessage
                ? getApiErrorMessage(errorMessage)
                : "Could not load your day."
            }
            onRetry={() => {
              void home.dashboard.refetch();
              void home.monthlySummary.refetch();
              void home.weeklySummary.refetch();
              void home.workShifts.refetch();
            }}
          />
        </View>
      </SafeAreaView>
    );
  }

  const dashboard = home.dashboard.data;
  const taskCount = dashboard.todayTasks.filter(
    (task) => task.status !== "COMPLETED" && task.status !== "CANCELLED",
  ).length;
  const moneyLeft = dashboard.month.savings;
  const workToday = home.focusItems.some((item) => item.type === "work")
    ? 1
    : 0;
  const feed = home.feed
    .filter((item) => !item.id.endsWith("placeholder"))
    .slice(0, 3);

  function openFocusItem(item: TodayFocusItem) {
    const [, id] = item.id.split(/-(.*)/s);
    if (item.type === "task" && id)
      navigation.navigate("TaskDetail", { taskId: id });
    else if (item.type === "work" && id)
      navigation.navigate("WorkEntryDetail", { workShiftId: id });
    else if (item.type === "grocery") navigation.navigate("Groceries");
    else if (item.type === "cleaning") navigation.navigate("Cleaning");
    else if (item.type === "budget") navigation.navigate("BudgetSettings");
    else if (item.type === "class")
      navigation.navigate("Main", { screen: "Tasks" });
    else navigation.navigate("AIAssistant");
  }

  function openQuickAdd() {
    Vibration.vibrate(10);
    setQuickAddOpen(true);
  }

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <AppHeader title="StudentKit" avatarText={user?.name ?? "ST"} />

        <View style={styles.greetingCard}>
          <View style={styles.greetingIcon}>
            <Ionicons name="leaf-outline" size={22} color={colors.primary} />
          </View>
          <View style={styles.greetingBody}>
            <Text style={styles.greeting}>Good morning, {firstName}</Text>
            <Text style={styles.greetingSub}>Your day is ready.</Text>
            <Text style={styles.greetingMeta}>
              {taskCount} tasks · {formatCurrency(moneyLeft, user?.currency)}{" "}
              saved · {workToday} work shift
            </Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today</Text>
          <Pressable onPress={() => navigation.navigate("GlobalSearch")}>
            <Text style={styles.sectionAction}>Search</Text>
          </Pressable>
        </View>
        {home.focusItems.length === 0 ? (
          <EmptyState
            title="Nothing urgent today"
            message="Add a task, shift, expense, or grocery item when something comes up."
            actionLabel="Quick Add"
            onAction={openQuickAdd}
          />
        ) : (
          <View style={styles.stack}>
            {home.focusItems.map((item) => (
              <ListRow
                key={item.id}
                icon={focusIcons[item.type]}
                title={item.title}
                subtitle={item.subtitle}
                rightText={
                  item.tone === "high"
                    ? "High"
                    : item.tone === "medium"
                      ? "Today"
                      : "Open"
                }
                rightTone={
                  item.tone === "high"
                    ? "red"
                    : item.tone === "medium"
                      ? "orange"
                      : "green"
                }
                onPress={() => openFocusItem(item)}
                onLongPress={openQuickAdd}
                onOptionsPress={openQuickAdd}
              />
            ))}
          </View>
        )}

        <View style={styles.quickRow}>
          {quickActions.slice(1, 5).map((action) => (
            <Pressable
              key={action.label}
              accessibilityRole="button"
              onPress={() => navigation.navigate(action.route as never)}
              style={({ pressed }) => [
                styles.quickButton,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons name={action.icon} size={21} color={colors.primary} />
              <Text numberOfLines={1} style={styles.quickText}>
                {action.label.replace("Add ", "")}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Smart feed</Text>
          <Pressable onPress={() => navigation.navigate("AIAssistant")}>
            <Text style={styles.sectionAction}>Ask AI</Text>
          </Pressable>
        </View>
        <View style={styles.stack}>
          {feed.map((item) => {
            let destination: string = "AIAssistant";
            let feedIcon: keyof typeof Ionicons.glyphMap = "bulb-outline";

            if (item.type === "money") {
              destination = "BudgetSettings";
              feedIcon = "wallet-outline";
            } else if (item.type === "study") {
              destination = "Main";
              feedIcon = "book-outline";
            } else if (item.type === "grocery") {
              destination = "Groceries";
              feedIcon = "basket-outline";
            } else if (item.type === "cleaning") {
              destination = "Cleaning";
              feedIcon = "sparkles-outline";
            } else if (item.type === "quote") {
              destination = "AIAssistant";
              feedIcon = "leaf-outline";
            } else if (item.type === "ai") {
              destination = "AIAssistant";
              feedIcon = "sparkles-outline";
            }

            const handleNavigate = () => {
              if (destination === "Main") {
                if (item.type === "study") {
                  navigation.navigate("Main", { screen: "Tasks" });
                }
              } else {
                navigation.navigate(destination as never);
              }
            };

            return (
              <ListRow
                key={item.id}
                icon={feedIcon}
                title={item.title}
                subtitle={item.message}
                rightText={destination === "AIAssistant" ? undefined : "View"}
                rightTone="green"
                showChevron
                onPress={handleNavigate}
              />
            );
          })}
        </View>
      </ScrollView>

      <FloatingActionButton onPress={openQuickAdd} />
      <ActionSheet
        visible={quickAddOpen}
        title="Quick Add"
        actions={quickAddActions}
        onClose={() => setQuickAddOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: "center", padding: spacing.lg },
  content: { padding: spacing.lg, paddingBottom: 132, gap: spacing.md },
  greetingCard: {
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    flexDirection: "row",
    gap: spacing.md,
    ...shadows.soft,
  },
  greetingIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.softGreen,
    alignItems: "center",
    justifyContent: "center",
  },
  greetingBody: { flex: 1 },
  greeting: { color: colors.text, fontSize: 20, fontWeight: "900" },
  greetingSub: {
    color: colors.muted,
    fontSize: fontSize.bodyLarge,
    marginTop: 2,
  },
  greetingMeta: {
    color: colors.primary,
    fontSize: fontSize.caption,
    fontWeight: "800",
    marginTop: spacing.xs,
  },
  sectionHeader: {
    minHeight: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.xs,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.section,
    fontWeight: "900",
  },
  sectionAction: {
    color: colors.primary,
    fontSize: fontSize.body,
    fontWeight: "900",
  },
  stack: { gap: spacing.sm },
  quickRow: { flexDirection: "row", gap: spacing.sm },
  quickButton: {
    flex: 1,
    minHeight: 66,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  quickText: {
    color: colors.text,
    fontSize: fontSize.badge,
    fontWeight: "800",
  },
  pressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
});
