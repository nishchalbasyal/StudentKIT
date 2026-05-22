import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { AppButton } from "../../components/ui/AppButton";
import { AppInput } from "../../components/ui/AppInput";
import { AppScreen } from "../../components/ui/AppScreen";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { LoadingState } from "../../components/ui/LoadingState";
import { colors, fontSize, radius, spacing } from "../../constants/colors";
import { EXPENSE_CATEGORIES } from "../../constants/categories";
import { useBudgets, useBudgetSummary } from "../../hooks/useBudgets";
import type { ExpenseCategory } from "../../types/budget.types";
import { formatCurrency } from "../../utils/formatCurrency";

export function BudgetScreen() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const { budgets, isLoading, isError, createBudget, updateBudget, deleteBudget } = useBudgets();
  const summary = useBudgetSummary(year, month);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const currentBudgets = (budgets ?? []).filter((budget) => budget.year === year && budget.month === month);

  const save = async () => {
    const value = Number(amount);
    if (!value || value <= 0) {
      Alert.alert("Budget amount required", "Enter a positive budget amount.");
      return;
    }
    if (editingId) await updateBudget({ id: editingId, input: { year, month, category, amount: value } });
    else await createBudget({ year, month, category, amount: value });
    setAmount("");
    setCategory(null);
    setEditingId(null);
  };

  return (
    <AppScreen title="Budgets" subtitle="Set weekly, monthly, and category spending limits.">
      <View style={styles.card}>
        <Text style={styles.title}>{editingId ? "Edit Budget" : "Set Budget"}</Text>
        <AppInput label="Amount" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="250" />
        <Text style={styles.label}>Category optional</Text>
        <View style={styles.chips}>
          <Pressable style={[styles.chip, category === null && styles.chipActive]} onPress={() => setCategory(null)}><Text style={styles.chipText}>Monthly</Text></Pressable>
          {EXPENSE_CATEGORIES.map((item) => (
            <Pressable key={item} style={[styles.chip, category === item && styles.chipActive]} onPress={() => setCategory(item as ExpenseCategory)}>
              <Text style={styles.chipText}>{item.toLowerCase()}</Text>
            </Pressable>
          ))}
        </View>
        <AppButton title={editingId ? "Save Budget" : "Set Budget"} icon="wallet-outline" onPress={save} />
      </View>

      {isLoading || summary.isLoading ? <LoadingState /> : isError || summary.isError ? (
        <ErrorState message="Could not load budgets." />
      ) : currentBudgets.length === 0 ? (
        <EmptyState title="No budget set yet" message="Create a budget to track weekly and monthly spending." actionLabel="Set Budget" onAction={save} />
      ) : (
        (summary.data ?? []).map((item) => (
          <View key={item.id} style={styles.row}>
            <View style={styles.body}>
              <Text style={styles.rowTitle}>{item.category ?? "Monthly budget"}</Text>
              <Text style={styles.meta}>{formatCurrency(item.spentAmount)} spent of {formatCurrency(item.budgetedAmount)}</Text>
              <Text style={styles.meta}>{formatCurrency(item.remaining)} remaining</Text>
            </View>
            <View style={styles.actions}>
              <AppButton title="Edit" variant="secondary" onPress={() => {
                setEditingId(item.id);
                setAmount(String(item.budgetedAmount));
                setCategory(item.category ?? null);
              }} />
              <AppButton title="Delete" variant="danger" onPress={() => Alert.alert("Delete budget?", "This cannot be undone.", [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => void deleteBudget(item.id) },
              ])} />
            </View>
          </View>
        ))
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.md, gap: spacing.md },
  title: { color: colors.text, fontSize: fontSize.section, fontWeight: "800" },
  label: { color: colors.text, fontSize: fontSize.body, fontWeight: "700" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: { borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.surface },
  chipActive: { backgroundColor: colors.softGreen, borderColor: colors.primary },
  chipText: { color: colors.primary, fontSize: fontSize.caption, fontWeight: "800" },
  row: { borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.md, gap: spacing.md },
  body: { gap: spacing.xs },
  rowTitle: { color: colors.text, fontSize: fontSize.bodyLarge, fontWeight: "800" },
  meta: { color: colors.muted, fontSize: fontSize.caption },
  actions: { flexDirection: "row", gap: spacing.sm },
});
