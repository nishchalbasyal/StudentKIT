import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { View } from "react-native";
import { AppButton } from "../ui/AppButton";
import { AppInput } from "../ui/AppInput";
import { AppSelect } from "../ui/AppSelect";
import { DAYS_OF_WEEK, PRIORITIES } from "../../constants/categories";
import { spacing } from "../../constants/colors";
import type { ClassInput } from "../../types/class.types";
import { classSchema, type ClassFormValues } from "../../validators/class.schema";

export function ClassForm({ onSubmit, loading }: { onSubmit: (values: ClassInput) => Promise<void>; loading?: boolean }) {
  const { control, handleSubmit } = useForm<ClassFormValues>({
    resolver: zodResolver(classSchema) as never,
    defaultValues: {
      courseName: "",
      professorName: "",
      dayOfWeek: "MONDAY",
      startTime: "09:00",
      endTime: "10:30",
      location: "",
      attendanceType: "FLEXIBLE",
      priority: "MEDIUM",
      reminderMinutesBefore: 30,
      notes: ""
    }
  });

  return (
    <View style={{ gap: spacing.md }}>
      <Controller control={control} name="courseName" render={({ field, fieldState }) => (
        <AppInput label="Course name" value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} />
      )} />
      <Controller control={control} name="professorName" render={({ field, fieldState }) => (
        <AppInput label="Professor" value={field.value ?? ""} onChangeText={field.onChange} error={fieldState.error?.message} />
      )} />
      <Controller control={control} name="dayOfWeek" render={({ field, fieldState }) => (
        <AppSelect label="Day" value={field.value} onChange={field.onChange} options={DAYS_OF_WEEK.map((value) => ({ label: value.slice(0, 3), value }))} error={fieldState.error?.message} />
      )} />
      <Controller control={control} name="startTime" render={({ field, fieldState }) => (
        <AppInput label="Start time" value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} />
      )} />
      <Controller control={control} name="endTime" render={({ field, fieldState }) => (
        <AppInput label="End time" value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} />
      )} />
      <Controller control={control} name="location" render={({ field, fieldState }) => (
        <AppInput label="Location" value={field.value ?? ""} onChangeText={field.onChange} error={fieldState.error?.message} />
      )} />
      <Controller control={control} name="attendanceType" render={({ field, fieldState }) => (
        <AppSelect label="Attendance" value={field.value} onChange={field.onChange} options={["MANDATORY", "OPTIONAL", "FLEXIBLE"].map((value) => ({ label: value.toLowerCase(), value: value as ClassFormValues["attendanceType"] }))} error={fieldState.error?.message} />
      )} />
      <Controller control={control} name="priority" render={({ field, fieldState }) => (
        <AppSelect label="Priority" value={field.value} onChange={field.onChange} options={PRIORITIES.map((value) => ({ label: value.toLowerCase(), value }))} error={fieldState.error?.message} />
      )} />
      <Controller control={control} name="reminderMinutesBefore" render={({ field, fieldState }) => (
        <AppInput label="Reminder minutes before" value={String(field.value ?? "")} onChangeText={field.onChange} error={fieldState.error?.message} keyboardType="number-pad" />
      )} />
      <Controller control={control} name="notes" render={({ field, fieldState }) => (
        <AppInput label="Notes" value={field.value ?? ""} onChangeText={field.onChange} error={fieldState.error?.message} multiline />
      )} />
      <AppButton title="Save class" loading={loading} onPress={handleSubmit(onSubmit)} />
    </View>
  );
}
