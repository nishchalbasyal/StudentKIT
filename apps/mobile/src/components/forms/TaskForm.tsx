import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppDatePicker } from "../ui/AppDatePicker";
import { AppDateTimePicker } from "../ui/AppDateTimePicker";
import { AppInput } from "../ui/AppInput";
import { AppTimePicker } from "../ui/AppTimePicker";
import { SuggestionChips } from "./SuggestionChips";
import { StickySaveButton } from "../ui/StickySaveButton";
import { FormSectionCard } from "../ui/FormSectionCard";
import { ChipSelector } from "../ui/ChipSelector";
import { PRIORITIES } from "../../constants/categories";
import { colors, fontSize, radius, spacing } from "../../constants/colors";
import { useSmartSuggestions } from "../../hooks/useSmartSuggestions";
import { useTasks } from "../../hooks/useTasks";
import type { TaskInput } from "../../types/task.types";
import { taskSchema, type TaskFormValues } from "../../validators/task.schema";

const taskTypes = [
  { label: "Homework", value: "HOMEWORK" },
  { label: "Assignment", value: "ASSIGNMENT" },
  { label: "Exam", value: "EXAM" },
  { label: "Personal", value: "PERSONAL" },
  { label: "Work", value: "WORK" },
  { label: "Other", value: "OTHER" },
] as const;

function dateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function combineDateTime(date: string, time?: string | null) {
  const [hours = 23, minutes = 59] = (time || "23:59").split(":").map(Number);
  const value = new Date(`${date}T12:00:00`);
  value.setHours(hours, minutes, 0, 0);
  return value.toISOString();
}

function addDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return dateOnly(date);
}

export function TaskForm({
  onSubmit,
  loading,
  initialValues,
  submitLabel = "Save Task",
}: {
  onSubmit: (values: TaskInput) => Promise<void>;
  loading?: boolean;
  initialValues?: Partial<TaskInput>;
  submitLabel?: string;
}) {
  const { tasks } = useTasks();
  const [showMore, setShowMore] = useState(false);
  const initialDueTime = useMemo(() => {
    if (!initialValues?.dueDate) return null;
    const date = new Date(initialValues.dueDate);
    if (Number.isNaN(date.getTime())) return null;
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  }, [initialValues?.dueDate]);
  const [dueTime, setDueTime] = useState<string | null>(initialDueTime);
  const defaultValues: TaskFormValues = {
    title: initialValues?.title ?? "",
    description: initialValues?.description ?? "",
    type: initialValues?.type ?? "ASSIGNMENT",
    dueDate: initialValues?.dueDate,
    priority: initialValues?.priority ?? "MEDIUM",
    reminderAt: initialValues?.reminderAt,
    calendarSyncEnabled: initialValues?.calendarSyncEnabled ?? false,
    calendarEventId: initialValues?.calendarEventId,
    linkedClassId: initialValues?.linkedClassId,
  };
  const { control, handleSubmit, setValue, reset, formState } =
    useForm<TaskFormValues>({
      resolver: zodResolver(taskSchema) as never,
      defaultValues,
    });

  useEffect(() => {
    reset(defaultValues);
    setDueTime(initialDueTime);
  }, [
    initialDueTime,
    initialValues?.calendarEventId,
    initialValues?.calendarSyncEnabled,
    initialValues?.description,
    initialValues?.dueDate,
    initialValues?.linkedClassId,
    initialValues?.priority,
    initialValues?.reminderAt,
    initialValues?.title,
    initialValues?.type,
    reset,
  ]);

  const title = useWatch({ control, name: "title" }) ?? "";
  const dueDate = useWatch({ control, name: "dueDate" });
  const calendarSyncEnabled = useWatch({
    control,
    name: "calendarSyncEnabled",
  });
  const priority = useWatch({ control, name: "priority" });
  const reminderAt = useWatch({ control, name: "reminderAt" });
  const suggestions = useSmartSuggestions({
    tasks: tasks.data ?? [],
    taskQuery: title,
  });

  function setDueDate(date: string) {
    setValue("dueDate", combineDateTime(date, dueTime), {
      shouldValidate: true,
    });
  }

  function setDueOffset(days: number) {
    setDueDate(addDays(days));
  }

  function setReminderOffset(hours: number) {
    if (!dueDate) return;
    const reminder = new Date(dueDate);
    reminder.setHours(reminder.getHours() - hours);
    setValue("reminderAt", reminder.toISOString(), { shouldValidate: true });
  }

  const invalid = () => {
    Alert.alert(
      "Check task",
      formState.errors.title?.message ??
        formState.errors.dueDate?.message ??
        formState.errors.reminderAt?.message ??
        "Please check the highlighted fields.",
    );
  };

  const priorityLabel = priority?.toLowerCase() ?? "medium";

  return (
    <StickySaveButton
      label={submitLabel}
      onPress={handleSubmit(onSubmit, invalid)}
      loading={loading}
      disabled={loading}
      subtitle={title ? `${title} - ${priorityLabel}` : "New task"}
    >
      <ScrollView
        style={styles.scroller}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <FormSectionCard title="Task" gap="sm">
          <Controller
            control={control}
            name="title"
            render={({ field, fieldState }) => (
              <AppInput
                label="Task title"
                value={field.value}
                onChangeText={field.onChange}
                error={fieldState.error?.message}
                placeholder="Assignment, laundry, class..."
              />
            )}
          />

          <View style={styles.datePresets}>
            <Pressable
              style={({ pressed }) => [
                styles.preset,
                pressed && styles.presetPressed,
              ]}
              onPress={() => setDueOffset(0)}
            >
              <Text style={styles.presetText}>Today</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.preset,
                pressed && styles.presetPressed,
              ]}
              onPress={() => setDueOffset(1)}
            >
              <Text style={styles.presetText}>Tomorrow</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.preset,
                pressed && styles.presetPressed,
              ]}
              onPress={() => setDueOffset(3)}
            >
              <Text style={styles.presetText}>3 days</Text>
            </Pressable>
          </View>

          <View style={styles.whenRow}>
            <View style={styles.whenCol}>
              <Controller
                control={control}
                name="dueDate"
                render={({ field, fieldState }) => (
                  <AppDatePicker
                    label="Due date"
                    value={field.value ? dateOnly(new Date(field.value)) : ""}
                    onChange={setDueDate}
                    error={fieldState.error?.message}
                  />
                )}
              />
            </View>
            <View style={styles.whenCol}>
              <AppTimePicker
                label="Time"
                value={dueTime}
                placeholder="No time"
                onChange={(value) => {
                  setDueTime(value);
                  if (dueDate)
                    setValue(
                      "dueDate",
                      combineDateTime(dateOnly(new Date(dueDate)), value),
                      {
                        shouldValidate: true,
                      },
                    );
                }}
              />
            </View>
          </View>

          <Controller
            control={control}
            name="priority"
            render={({ field }) => (
              <ChipSelector
                options={PRIORITIES.map((item) => ({
                  label: item,
                  value: item,
                }))}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </FormSectionCard>

        <Pressable
          accessibilityRole="button"
          onPress={() => setShowMore((value) => !value)}
          style={({ pressed }) => [styles.moreButton, pressed && styles.pressed]}
        >
          <Text style={styles.moreButtonText}>
            {showMore ? "Hide optional details" : "More options"}
          </Text>
          <Ionicons
            name={showMore ? "chevron-up" : "chevron-down"}
            size={18}
            color={colors.primary}
          />
        </Pressable>

        {showMore ? (
          <FormSectionCard title="Optional details" gap="sm">
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Category</Text>
                  <ChipSelector
                    options={[...taskTypes]}
                    value={field.value}
                    onChange={field.onChange}
                  />
                </View>
              )}
            />

            <SuggestionChips
              label="Previous patterns"
              suggestions={suggestions.taskTitles}
              onSelect={(value) => {
                setValue("title", String(value), { shouldValidate: true });
              }}
            />

            <Controller
              control={control}
              name="description"
              render={({ field, fieldState }) => (
                <AppInput
                  label="Notes"
                  value={field.value ?? ""}
                  onChangeText={field.onChange}
                  error={fieldState.error?.message}
                  multiline
                  placeholder="Add useful details..."
                />
              )}
            />

            <Controller
              control={control}
              name="reminderAt"
              render={({ field }) => (
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Reminder</Text>
                  <View style={styles.reminderChips}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.reminderChip,
                        !reminderAt && styles.reminderChipActive,
                        pressed && styles.pressed,
                      ]}
                      onPress={() => field.onChange(undefined)}
                      disabled={!dueDate}
                    >
                      <Text
                        style={[
                          styles.reminderChipText,
                          !reminderAt && styles.reminderChipTextActive,
                        ]}
                      >
                        None
                      </Text>
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [
                        styles.reminderChip,
                        pressed && styles.pressed,
                      ]}
                      onPress={() => setReminderOffset(1)}
                      disabled={!dueDate}
                    >
                      <Text style={styles.reminderChipText}>1h before</Text>
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [
                        styles.reminderChip,
                        pressed && styles.pressed,
                      ]}
                      onPress={() => setReminderOffset(24)}
                      disabled={!dueDate}
                    >
                      <Text style={styles.reminderChipText}>1d before</Text>
                    </Pressable>
                  </View>
                  <AppDateTimePicker
                    label="Custom reminder"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                  />
                </View>
              )}
            />

            <Controller
              control={control}
              name="calendarSyncEnabled"
              render={({ field }) => (
                <Pressable
                  style={styles.toggleRow}
                  onPress={() => field.onChange(!field.value)}
                >
                  <View
                    style={[styles.toggle, field.value && styles.toggleActive]}
                  >
                    {field.value ? (
                      <Ionicons name="checkmark" size={14} color="#FFF" />
                    ) : null}
                  </View>
                  <Text style={styles.toggleText}>Sync with calendar</Text>
                </Pressable>
              )}
            />
            {calendarSyncEnabled ? (
              <Text style={styles.help}>
                Calendar permission will be requested after saving.
              </Text>
            ) : null}
          </FormSectionCard>
        ) : null}

        {formState.errors.root?.message ? (
          <Text style={styles.error}>{formState.errors.root.message}</Text>
        ) : null}
      </ScrollView>
    </StickySaveButton>
  );
}

const styles = StyleSheet.create({
  scroller: {
    flex: 1,
  },
  scroll: {
    gap: spacing.xs,
    paddingTop: 0,
    paddingBottom: spacing.sm,
  },
  field: {
    gap: spacing.xs,
  },
  fieldLabel: {
    color: colors.text,
    fontSize: fontSize.caption,
    fontWeight: "700",
  },
  datePresets: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  preset: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.softGreen,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 36,
  },
  presetPressed: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  presetText: {
    color: colors.primary,
    fontSize: fontSize.caption,
    fontWeight: "700",
  },
  whenRow: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  whenCol: {
    flex: 1,
  },
  reminderChips: {
    flexDirection: "row",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  reminderChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 36,
    flex: 1,
    minWidth: "30%",
  },
  reminderChipActive: {
    backgroundColor: colors.softGreen,
    borderColor: colors.primary,
  },
  reminderChipText: {
    color: colors.text,
    fontSize: fontSize.caption,
    fontWeight: "700",
  },
  reminderChipTextActive: {
    color: colors.primary,
  },
  toggleRow: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  toggle: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  toggleActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  toggleText: {
    color: colors.text,
    fontSize: fontSize.body,
    fontWeight: "700",
  },
  help: {
    color: colors.muted,
    fontSize: fontSize.caption,
    lineHeight: 18,
  },
  moreButton: {
    minHeight: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  moreButtonText: {
    color: colors.primary,
    fontSize: fontSize.body,
    fontWeight: "800",
  },
  error: {
    color: colors.danger,
    fontSize: fontSize.caption,
    fontWeight: "600",
    paddingHorizontal: spacing.md,
  },
  pressed: {
    opacity: 0.8,
  },
});
