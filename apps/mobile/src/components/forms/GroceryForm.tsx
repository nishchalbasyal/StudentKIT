import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { View } from "react-native";
import { AppButton } from "../ui/AppButton";
import { AppInput } from "../ui/AppInput";
import { AppSelect } from "../ui/AppSelect";
import { spacing } from "../../constants/colors";
import type { GroceryInput } from "../../types/grocery.types";
import { grocerySchema, type GroceryFormValues } from "../../validators/grocery.schema";

export function GroceryForm({
  onSubmit,
  loading,
  initialValues,
  submitLabel = "Save grocery item",
}: {
  onSubmit: (values: GroceryInput) => Promise<void>;
  loading?: boolean;
  initialValues?: Partial<GroceryInput>;
  submitLabel?: string;
}) {
  const defaultValues: GroceryFormValues = {
    name: initialValues?.name ?? "",
    category: initialValues?.category ?? "",
    defaultQuantity: initialValues?.defaultQuantity ?? "",
    estimatedDaysLasts: initialValues?.estimatedDaysLasts ?? 7,
    isEssential: initialValues?.isEssential ?? true,
  };
  const { control, handleSubmit, reset } = useForm<GroceryFormValues>({
    resolver: zodResolver(grocerySchema) as never,
    defaultValues,
  });

  useEffect(() => {
    reset(defaultValues);
  }, [
    initialValues?.category,
    initialValues?.defaultQuantity,
    initialValues?.estimatedDaysLasts,
    initialValues?.isEssential,
    initialValues?.name,
    reset,
  ]);

  return (
    <View style={{ gap: spacing.md }}>
      <Controller control={control} name="name" render={({ field, fieldState }) => (
        <AppInput label="Name" value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} />
      )} />
      <Controller control={control} name="category" render={({ field, fieldState }) => (
        <AppInput label="Category" value={field.value ?? ""} onChangeText={field.onChange} error={fieldState.error?.message} />
      )} />
      <Controller control={control} name="defaultQuantity" render={({ field, fieldState }) => (
        <AppInput label="Default quantity" value={field.value ?? ""} onChangeText={field.onChange} error={fieldState.error?.message} placeholder="1 pack, 2 kg" />
      )} />
      <Controller control={control} name="estimatedDaysLasts" render={({ field, fieldState }) => (
        <AppInput label="Estimated days lasts" value={String(field.value ?? "")} onChangeText={field.onChange} error={fieldState.error?.message} keyboardType="number-pad" />
      )} />
      <Controller control={control} name="isEssential" render={({ field, fieldState }) => (
        <AppSelect label="Essential" value={field.value ? "YES" : "NO"} onChange={(value) => field.onChange(value === "YES")} options={[{ label: "yes", value: "YES" }, { label: "no", value: "NO" }]} error={fieldState.error?.message} />
      )} />
      <AppButton title={submitLabel} loading={loading} disabled={loading} onPress={handleSubmit(onSubmit)} />
    </View>
  );
}
