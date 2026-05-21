import { Alert } from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ExpenseForm } from "../../components/forms/ExpenseForm";
import { AppScreen } from "../../components/ui/AppScreen";
import { EmptyState } from "../../components/ui/EmptyState";
import { LoadingState } from "../../components/ui/LoadingState";
import { getApiErrorMessage } from "../../api/apiClient";
import { useExpenses } from "../../hooks/useExpenses";
import type { RootStackParamList } from "../../navigation/types";
import type { ExpenseInput } from "../../types/expense.types";

type Route = RouteProp<RootStackParamList, "AddExpense">;
type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function AddExpenseScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Navigation>();
  const { expenses, createExpense, updateExpense, isSaving } = useExpenses();
  const editId = route.params?.expenseId;
  const duplicateFromId = route.params?.duplicateFromId;
  const sourceExpense = expenses.data?.find((expense) => expense.id === (editId ?? duplicateFromId));
  const initialValues: Partial<ExpenseInput> | undefined = sourceExpense
    ? {
        title: sourceExpense.title,
        amount: sourceExpense.amount,
        category: sourceExpense.category,
        date: sourceExpense.date,
        paymentMethod: sourceExpense.paymentMethod,
        notes: sourceExpense.notes ?? "",
      }
    : undefined;

  async function handleSubmit(values: ExpenseInput) {
    try {
      if (editId) {
        await updateExpense({ id: editId, input: values });
      } else {
        await createExpense(values);
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert("Could not save expense", getApiErrorMessage(error));
    }
  }

  if ((editId || duplicateFromId) && expenses.isLoading) {
    return <LoadingState label="Loading expense" />;
  }

  if ((editId || duplicateFromId) && !sourceExpense) {
    return (
      <AppScreen title="Expense">
        <EmptyState title="Expense not found" message="It may have been deleted or is still loading." />
      </AppScreen>
    );
  }

  return (
    <AppScreen
      title={editId ? "Edit Expense" : duplicateFromId ? "Duplicate Expense" : "Add Expense"}
      subtitle="Small entries are enough. The app handles totals."
    >
      <ExpenseForm
        onSubmit={handleSubmit}
        loading={isSaving}
        initialValues={initialValues}
        submitLabel={editId ? "Save Changes" : "Save Expense"}
      />
    </AppScreen>
  );
}
