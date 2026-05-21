import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, StyleSheet, Text, View } from "react-native";
import { AppButton } from "../ui/AppButton";
import { AppDatePicker } from "../ui/AppDatePicker";
import { AppInput } from "../ui/AppInput";
import { SuggestionChips } from "./SuggestionChips";
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from "../../constants/categories";
import { colors, fontSize, radius, spacing } from "../../constants/colors";
import { useExpenses } from "../../hooks/useExpenses";
import { useSmartSuggestions } from "../../hooks/useSmartSuggestions";
import type { ExpenseCategory, ExpenseInput, PaymentMethod } from "../../types/expense.types";
import { expenseSchema, type ExpenseFormValues } from "../../validators/expense.schema";

export function ExpenseForm({
  onSubmit,
  loading,
  initialValues,
  submitLabel = "Save Expense",
}: {
  onSubmit: (values: ExpenseInput) => Promise<void>;
  loading?: boolean;
  initialValues?: Partial<ExpenseInput>;
  submitLabel?: string;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const { expenses } = useExpenses();
  const defaultValues: ExpenseFormValues = {
    title: initialValues?.title ?? "",
    amount: initialValues?.amount ?? 0,
    category: initialValues?.category ?? "GROCERIES",
    date: initialValues?.date ?? today,
    paymentMethod: initialValues?.paymentMethod ?? "CARD",
    notes: initialValues?.notes ?? "",
  };
  const { control, handleSubmit, setValue, reset, formState } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema) as never,
    defaultValues,
  });

  useEffect(() => {
    reset(defaultValues);
  }, [
    initialValues?.amount,
    initialValues?.category,
    initialValues?.date,
    initialValues?.notes,
    initialValues?.paymentMethod,
    initialValues?.title,
    reset,
  ]);
  const title = useWatch({ control, name: "title" }) ?? "";
  const suggestions = useSmartSuggestions({ expenses: expenses.data ?? [], expenseQuery: title });

  function selectCategory(category: ExpenseCategory) {
    setValue("category", category, { shouldValidate: true });
  }

  function selectPayment(paymentMethod: PaymentMethod) {
    setValue("paymentMethod", paymentMethod, { shouldValidate: true });
  }

  const invalid = () => {
    Alert.alert(
      "Check expense",
      formState.errors.title?.message ??
        formState.errors.amount?.message ??
        formState.errors.date?.message ??
        "Please check the highlighted fields.",
    );
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.helper}>Small entry. Smart tracking.</Text>
      <Controller control={control} name="title" render={({ field, fieldState }) => (
        <View style={styles.card}>
          <AppInput label="What did you spend on?" value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} placeholder="Aldi" />
          <SuggestionChips label="Suggestions" suggestions={suggestions.expenseTitles} onSelect={(value) => field.onChange(String(value))} />
        </View>
      )} />
      <Controller control={control} name="amount" render={({ field, fieldState }) => (
        <View style={styles.card}>
          <AppInput label="Amount" value={String(field.value ?? "")} onChangeText={field.onChange} error={fieldState.error?.message} keyboardType="decimal-pad" placeholder="12.50" />
          <SuggestionChips label="Usually" suggestions={suggestions.expenseAmounts} onSelect={(value) => field.onChange(Number(value))} />
        </View>
      )} />
      <Controller control={control} name="category" render={({ field, fieldState }) => (
        <View style={styles.card}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Category</Text>
            {suggestions.expenseCategory ? <Text style={styles.aiHint}>AI suggests: {suggestions.expenseCategory.toLowerCase()}</Text> : null}
          </View>
          <View style={styles.chipRow}>
            {EXPENSE_CATEGORIES.map((category) => (
              <Text
                key={category}
                onPress={() => selectCategory(category)}
                style={[styles.choiceChip, field.value === category && styles.choiceChipActive]}
              >
                {category.toLowerCase()}
              </Text>
            ))}
          </View>
          {fieldState.error ? <Text style={styles.error}>{fieldState.error.message}</Text> : null}
        </View>
      )} />
      <View style={styles.card}>
        <Controller control={control} name="date" render={({ field, fieldState }) => (
          <AppDatePicker label="Date" value={field.value} onChange={field.onChange} error={fieldState.error?.message} />
        )} />
      </View>
      <Controller control={control} name="paymentMethod" render={({ field, fieldState }) => (
        <View style={styles.card}>
          <Text style={styles.label}>Payment</Text>
          <View style={styles.chipRow}>
            {PAYMENT_METHODS.map((method) => (
              <Text
                key={method}
                onPress={() => selectPayment(method)}
                style={[styles.choiceChip, field.value === method && styles.choiceChipActive]}
              >
                {method.toLowerCase().replace("_", " ")}
              </Text>
            ))}
          </View>
          <SuggestionChips label="Often used" suggestions={suggestions.paymentMethods} onSelect={(value) => field.onChange(value as PaymentMethod)} />
          {fieldState.error ? <Text style={styles.error}>{fieldState.error.message}</Text> : null}
        </View>
      )} />
      <Controller control={control} name="notes" render={({ field, fieldState }) => (
        <View style={styles.card}>
          <AppInput label="Notes optional" value={field.value ?? ""} onChangeText={field.onChange} error={fieldState.error?.message} multiline />
        </View>
      )} />
      <AppButton title={submitLabel} loading={loading} disabled={loading} onPress={handleSubmit(onSubmit, invalid)} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  helper: { color: colors.muted, fontSize: fontSize.body, lineHeight: 20 },
  card: { borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.md, gap: spacing.sm },
  labelRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  label: { color: colors.text, fontSize: fontSize.body, fontWeight: "700" },
  aiHint: { color: colors.primary, fontSize: fontSize.caption, fontWeight: "700" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  choiceChip: { overflow: "hidden", borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceMuted, color: colors.muted, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: fontSize.caption, fontWeight: "700" },
  choiceChipActive: { backgroundColor: colors.softGreen, borderColor: colors.action, color: colors.primary },
  error: { color: colors.danger, fontSize: fontSize.caption }
});
