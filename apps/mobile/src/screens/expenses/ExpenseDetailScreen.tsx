import { Alert, StyleSheet, Text, View } from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppButton } from "../../components/ui/AppButton";
import { AppScreen } from "../../components/ui/AppScreen";
import { EmptyState } from "../../components/ui/EmptyState";
import { colors, fontSize, radius, spacing } from "../../constants/colors";
import { useExpenses } from "../../hooks/useExpenses";
import type { RootStackParamList } from "../../navigation/types";
import { formatCurrency } from "../../utils/formatCurrency";

type Route = RouteProp<RootStackParamList, "ExpenseDetail">;
type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function ExpenseDetailScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Navigation>();
  const { expenses, deleteExpense, isSaving } = useExpenses();
  const expense = expenses.data?.find((item) => item.id === route.params.expenseId);

  if (!expense) return <AppScreen title="Expense"><EmptyState title="Expense not found." message="It may have been deleted or is still loading." /></AppScreen>;

  return (
    <AppScreen title="Expense Detail" subtitle={expense.date}>
      <View style={styles.card}>
        <Text style={styles.amount}>{formatCurrency(expense.amount)}</Text>
        <Info label="Title" value={expense.title} />
        <Info label="Category" value={expense.category.toLowerCase()} />
        <Info label="Payment" value={expense.paymentMethod.toLowerCase().replace("_", " ")} />
        {expense.notes ? <Info label="Notes" value={expense.notes} /> : null}
        <AppButton title="Edit Expense" icon="create-outline" onPress={() => navigation.navigate("AddExpense", { expenseId: expense.id })} />
        <AppButton
          title="Delete Expense"
          icon="trash-outline"
          variant="danger"
          loading={isSaving}
          onPress={() => Alert.alert("Delete expense?", "This cannot be undone.", [{ text: "Cancel" }, { text: "Delete", style: "destructive", onPress: () => void deleteExpense(expense.id).then(() => navigation.goBack()) }])}
        />
      </View>
    </AppScreen>
  );
}

export function CategorySettingsScreen() {
  const categories = ["Groceries", "Rent", "Food", "Transport", "Study", "Health", "Entertainment", "Bills", "Shopping", "Other"];
  return (
    <AppScreen title="Expense Categories" subtitle="Default categories can be hidden, custom categories can be added when the API is connected.">
      {categories.map((category) => (
        <View key={category} style={styles.row}>
          <View style={styles.body}>
            <Text style={styles.title}>{category}</Text>
            <Text style={styles.meta}>Default category · monthly budget configurable</Text>
          </View>
          <Text style={styles.badge}>Active</Text>
        </View>
      ))}
      <AppButton title="Add Custom Category" icon="add-outline" variant="secondary" />
    </AppScreen>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <View><Text style={styles.meta}>{label}</Text><Text style={styles.title}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.lg, gap: spacing.md },
  amount: { color: colors.primary, fontSize: 24, fontWeight: "800" },
  title: { color: colors.text, fontSize: fontSize.bodyLarge, fontWeight: "700" },
  meta: { color: colors.muted, fontSize: fontSize.caption, lineHeight: 18 },
  row: { minHeight: 72, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.md, flexDirection: "row", alignItems: "center", gap: spacing.md },
  body: { flex: 1 },
  badge: { overflow: "hidden", borderRadius: radius.pill, backgroundColor: colors.softGreen, color: colors.primary, paddingHorizontal: spacing.sm, paddingVertical: 4, fontSize: fontSize.badge, fontWeight: "800" }
});
