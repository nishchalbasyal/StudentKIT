import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppHeader } from "../../components/ui/AppHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { FloatingActionButton } from "../../components/ui/FloatingActionButton";
import { ListRow } from "../../components/ui/ListRow";
import { LoadingState } from "../../components/ui/LoadingState";
import { SegmentedTabs } from "../../components/ui/SegmentedTabs";
import { colors, fontSize, radius, shadows, spacing } from "../../constants/colors";
import { getCouponsApi } from "../../api/coupons.api";
import { useBudgetSummary, useCurrentBudgets } from "../../hooks/useBudgets";
import { useExpenses } from "../../hooks/useExpenses";
import type { RootStackParamList } from "../../navigation/types";
import { useAuthStore } from "../../store/authStore";
import type { Expense } from "../../types/expense.types";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatShortDate } from "../../utils/formatDate";

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type Tab = "expenses" | "budgets" | "coupons";

const tabs = [
  { key: "expenses", label: "Expenses" },
  { key: "budgets", label: "Budgets" },
  { key: "coupons", label: "Coupons" },
] as const;

const categoryIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  GROCERIES: "basket-outline",
  RENT: "home-outline",
  TRANSPORT: "bus-outline",
  FOOD: "fast-food-outline",
  STUDY: "book-outline",
  HEALTH: "medkit-outline",
  ENTERTAINMENT: "game-controller-outline",
  BILLS: "document-text-outline",
  SHOPPING: "bag-outline",
  OTHER: "receipt-outline",
};

export function ExpensesScreen() {
  const navigation = useNavigation<Navigation>();
  const user = useAuthStore((state) => state.user);
  const { expenses, summary, deleteExpense, isSaving } = useExpenses();
  const [tab, setTab] = useState<Tab>("expenses");

  if (expenses.isLoading || summary.isLoading) {
    return <SafeAreaView style={styles.safe}><LoadingState label="Loading expense" /></SafeAreaView>;
  }

  if (expenses.isError || summary.isError) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ErrorState
            message="Could not load expense."
            onRetry={() => {
              void expenses.refetch();
              void summary.refetch();
            }}
          />
        </View>
      </SafeAreaView>
    );
  }

  const total = summary.data?.totalExpenses ?? 0;
  const income = summary.data?.totalIncome ?? 0;
  const savings = summary.data?.monthlySavings ?? Math.max(0, income - total);

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AppHeader title="Expense" avatarText={user?.name ?? "ST"} showSettings />

        <SegmentedTabs tabs={tabs} value={tab} onChange={setTab} />

        {tab === "expenses" ? (
          <ExpensesTab
            expenses={expenses.data ?? []}
            income={income}
            total={total}
            savings={savings}
            categoryTotals={summary.data?.categoryTotals ?? []}
            currency={user?.currency}
            navigation={navigation}
            deleteExpense={deleteExpense}
            disabled={isSaving}
          />
        ) : tab === "budgets" ? (
          <BudgetsTab currency={user?.currency} navigation={navigation} />
        ) : (
          <CouponsTab navigation={navigation} />
        )}
      </ScrollView>

      {tab === "expenses" ? <FloatingActionButton onPress={() => navigation.navigate("AddExpense")} /> : null}
    </SafeAreaView>
  );
}

function ExpensesTab({
  expenses,
  income,
  total,
  savings,
  categoryTotals,
  currency,
  navigation,
  deleteExpense,
  disabled,
}: {
  expenses: Expense[];
  income: number;
  total: number;
  savings: number;
  categoryTotals: Array<{ category: string; total: number }>;
  currency?: string;
  navigation: Navigation;
  deleteExpense: (id: string) => Promise<{ id: string }>;
  disabled: boolean;
}) {
  const showActions = (expense: Expense) => {
    Alert.alert(expense.title || "Expense", "Choose an action", [
      { text: "View", onPress: () => navigation.navigate("ExpenseDetail", { expenseId: expense.id }) },
      { text: "Edit", onPress: () => navigation.navigate("AddExpense", { expenseId: expense.id }) },
      { text: "Duplicate", onPress: () => navigation.navigate("AddExpense", { duplicateFromId: expense.id }) },
      { text: "Delete", style: "destructive", onPress: () => void deleteExpense(expense.id) },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <View style={styles.stack}>
      <View style={styles.summaryCard}>
        <Text style={styles.kicker}>This month</Text>
        <View style={styles.moneyGrid}>
          <Metric label="Income" value={formatCurrency(income, currency)} tone="green" onPress={() => navigation.navigate("WorkSummary")} />
          <Metric label="Expenses" value={formatCurrency(total, currency)} tone="red" onPress={() => navigation.navigate("ExpenseReport")} />
          <Metric label="Savings" value={formatCurrency(savings, currency)} tone="blue" onPress={() => navigation.navigate("BudgetSettings")} />
        </View>
      </View>

      {categoryTotals.length > 0 ? (
        <View style={styles.panel}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <Pressable onPress={() => navigation.navigate("CategorySettings")}>
              <Text style={styles.link}>Edit</Text>
            </Pressable>
          </View>
          {categoryTotals.slice(0, 4).map((item) => (
            <ListRow
              key={item.category}
              icon={categoryIcons[item.category] ?? "receipt-outline"}
              title={humanize(item.category)}
              subtitle="Tracked this month"
              rightText={formatCurrency(item.total, currency)}
              onPress={() => navigation.navigate("CategorySettings")}
            />
          ))}
        </View>
      ) : null}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent expenses</Text>
        <Pressable onPress={() => navigation.navigate("AddExpense")}><Text style={styles.link}>Add</Text></Pressable>
      </View>
      {expenses.length === 0 ? (
        <EmptyState
          title="No expenses this month"
          message="Add your first expense and StudentKit will keep the budget picture clear."
          actionLabel="Add Expense"
          onAction={() => navigation.navigate("AddExpense")}
        />
      ) : (
        expenses.map((expense) => (
          <ListRow
            key={expense.id}
            icon={categoryIcons[expense.category] ?? "receipt-outline"}
            title={expense.title || "Expense"}
            subtitle={`${humanize(expense.category)} · ${expense.paymentMethod.replace("_", " ").toLowerCase()}`}
            meta={formatShortDate(expense.date)}
            rightText={formatCurrency(expense.amount, currency)}
            rightTone="red"
            disabled={disabled}
            onPress={() => navigation.navigate("ExpenseDetail", { expenseId: expense.id })}
            onLongPress={() => showActions(expense)}
            onOptionsPress={() => showActions(expense)}
          />
        ))
      )}
    </View>
  );
}

function BudgetsTab({ currency, navigation }: { currency?: string; navigation: Navigation }) {
  const budgets = useCurrentBudgets();
  const now = new Date();
  const summary = useBudgetSummary(now.getFullYear(), now.getMonth() + 1);
  const items = summary.data ?? [];

  if (budgets.isLoading || summary.isLoading) return <LoadingState label="Loading budgets" />;
  if (budgets.isError || summary.isError) return <ErrorState message="Could not load budgets." onRetry={() => { void budgets.refetch(); void summary.refetch(); }} />;

  if ((budgets.data ?? []).length === 0) {
    return (
      <EmptyState
        title="No budget set yet"
        message="Create a weekly, monthly, or category budget to make spending easier to read."
        actionLabel="Set Budget"
        onAction={() => navigation.navigate("BudgetSettings")}
      />
    );
  }

  return (
    <View style={styles.stack}>
      {items.map((item) => (
        <Pressable key={item.id} style={({ pressed }) => [styles.budgetCard, pressed && styles.pressed]} onPress={() => navigation.navigate("BudgetSettings")}>
          <View style={styles.sectionHeader}>
            <Text style={styles.cardTitle}>{item.category ? humanize(item.category) : "Monthly budget"}</Text>
            <Text style={styles.valueStrong}>{formatCurrency(item.remaining, currency)}</Text>
          </View>
          <Text style={styles.meta}>{formatCurrency(item.spentAmount, currency)} spent of {formatCurrency(item.budgetedAmount, currency)}</Text>
          <View style={styles.progress}><View style={[styles.progressFill, { width: `${Math.min(100, Math.max(0, item.percentUsed))}%` }]} /></View>
        </Pressable>
      ))}
      <Pressable style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]} onPress={() => navigation.navigate("BudgetSettings")}>
        <Text style={styles.secondaryButtonText}>Set/Edit Budget</Text>
      </Pressable>
    </View>
  );
}

function CouponsTab({ navigation }: { navigation: Navigation }) {
  const coupons = useQuery({ queryKey: ["coupons"], queryFn: getCouponsApi });

  if (coupons.isLoading) return <LoadingState label="Loading coupons" />;
  if (coupons.isError) return <ErrorState message="Could not load coupons." onRetry={() => void coupons.refetch()} />;

  const items = coupons.data ?? [];
  if (items.length === 0) {
    return <EmptyState title="No coupons right now" message="Server-approved student offers will appear here." actionLabel="Refresh" onAction={() => void coupons.refetch()} />;
  }

  return (
    <View style={styles.stack}>
      <View style={styles.readOnly}>
        <Ionicons name="shield-checkmark-outline" size={22} color={colors.primary} />
        <Text style={styles.readOnlyText}>Coupons are provided by the server and verified before students can use them.</Text>
      </View>
      {items.map((coupon) => (
        <ListRow
          key={coupon.id}
          icon="pricetag-outline"
          title={coupon.title}
          subtitle={coupon.expiresAt ? `Expires ${new Date(coupon.expiresAt).toLocaleDateString()}` : "No expiry"}
          rightText={coupon.discount}
          rightTone="green"
          showChevron
          onPress={() => navigation.navigate("CouponDetails", { couponId: coupon.id })}
        />
      ))}
      <Pressable style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]} onPress={() => navigation.navigate("CouponsList")}>
        <Text style={styles.secondaryButtonText}>Open Coupons List</Text>
      </Pressable>
    </View>
  );
}

function Metric({ label, value, tone, onPress }: { label: string; value: string; tone: "green" | "red" | "blue"; onPress?: () => void }) {
  const color = tone === "green" ? colors.primary : tone === "red" ? colors.danger : colors.info;
  return (
    <Pressable style={styles.metric} onPress={onPress}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
    </Pressable>
  );
}

function humanize(value: string) {
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: "center", padding: spacing.lg },
  content: { padding: spacing.lg, paddingBottom: 132, gap: spacing.md },
  stack: { gap: spacing.sm },
  summaryCard: { borderRadius: radius.xl, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, gap: spacing.md, ...shadows.soft },
  kicker: { color: colors.primary, fontSize: fontSize.caption, fontWeight: "900" },
  moneyGrid: { flexDirection: "row", gap: spacing.sm },
  metric: { flex: 1, gap: 3 },
  metricLabel: { color: colors.muted, fontSize: fontSize.caption, fontWeight: "700" },
  metricValue: { fontSize: fontSize.cardTitle, fontWeight: "900" },
  panel: { gap: spacing.sm },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md },
  sectionTitle: { color: colors.text, fontSize: fontSize.section, fontWeight: "900" },
  link: { color: colors.primary, fontSize: fontSize.body, fontWeight: "900" },
  budgetCard: { borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, gap: spacing.sm },
  cardTitle: { flex: 1, color: colors.text, fontSize: fontSize.rowTitle, fontWeight: "900" },
  valueStrong: { color: colors.primary, fontSize: fontSize.bodyLarge, fontWeight: "900" },
  meta: { color: colors.muted, fontSize: fontSize.caption, fontWeight: "600" },
  progress: { height: 8, borderRadius: radius.pill, backgroundColor: colors.border, overflow: "hidden" },
  progressFill: { height: 8, backgroundColor: colors.primary },
  readOnly: { borderRadius: radius.lg, backgroundColor: colors.softGreen, padding: spacing.md, flexDirection: "row", alignItems: "center", gap: spacing.sm },
  readOnlyText: { flex: 1, color: colors.primary, fontSize: fontSize.caption, fontWeight: "800", lineHeight: 18 },
  secondaryButton: { minHeight: 52, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  secondaryButtonText: { color: colors.primary, fontSize: fontSize.bodyLarge, fontWeight: "900" },
  pressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
});
