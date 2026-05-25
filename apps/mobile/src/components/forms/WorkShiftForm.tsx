import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CompanyPicker } from "../work/CompanyPicker";
import { AppDatePicker } from "../ui/AppDatePicker";
import { AppInput } from "../ui/AppInput";
import { AppTimePicker } from "../ui/AppTimePicker";
import { StickySaveButton } from "../ui/StickySaveButton";
import { colors, fontSize, radius, spacing } from "../../constants/colors";
import { useCompanies } from "../../hooks/useCompanies";
import { calculateWorkDuration } from "../../utils/workMath";
import type { Company } from "../../types/company.types";
import { workShiftSchema, type WorkShiftFormValues } from "../../validators/work.schema";

type Props = {
  onSubmit: (values: WorkShiftFormValues, company: { id: string | null; name: string | null }) => Promise<void>;
  loading?: boolean;
  initialValues?: Partial<WorkShiftFormValues>;
  initialCompanyId?: string | null;
  submitLabel?: string;
  currency?: string;
};

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

export function WorkShiftForm({
  onSubmit,
  loading = false,
  initialValues,
  initialCompanyId = null,
  submitLabel = "Save",
  currency = "EUR",
}: Props) {
  const [formError, setFormError] = useState<string | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(initialCompanyId);
  const { companies } = useCompanies();
  const defaultValues: WorkShiftFormValues = {
    workplace: initialValues?.workplace ?? "",
    date: initialValues?.date ?? getTodayDate(),
    startTime: initialValues?.startTime ?? "09:00",
    endTime: initialValues?.endTime ?? "17:00",
    breakMinutes: initialValues?.breakMinutes ?? 0,
    hourlyWage: initialValues?.hourlyWage ?? 12,
    note: initialValues?.note ?? "",
  };

  const {
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<WorkShiftFormValues>({
    resolver: zodResolver(workShiftSchema) as never,
    defaultValues,
  });

  const selectedCompany = useMemo(
    () => companies.data?.find((company) => company.id === selectedCompanyId) ?? null,
    [companies.data, selectedCompanyId],
  );

  useEffect(() => {
    setSelectedCompanyId(initialCompanyId);
  }, [initialCompanyId]);

  useEffect(() => {
    reset(defaultValues);
  }, [
    defaultValues.breakMinutes,
    defaultValues.date,
    defaultValues.endTime,
    defaultValues.hourlyWage,
    defaultValues.note,
    defaultValues.startTime,
    defaultValues.workplace,
    reset,
  ]);

  const values = watch();
  const duration = useMemo(
    () =>
      calculateWorkDuration(
        values.date ?? getTodayDate(),
        values.startTime ?? "09:00",
        values.endTime ?? "17:00",
        Number(values.breakMinutes ?? 0),
      ),
    [values.breakMinutes, values.date, values.endTime, values.startTime],
  );
  const totalHours = Math.max(0, duration.hours);
  const estimatedIncome = totalHours * Number(values.hourlyWage ?? 0);

  function applyCompanyDefaults(company: Company | null) {
    setSelectedCompanyId(company?.id ?? null);

    if (!company) {
      return;
    }

    setValue("workplace", company.name, { shouldDirty: true });

    if (company.defaultHourlyWage !== null && company.defaultHourlyWage !== undefined) {
      setValue("hourlyWage", company.defaultHourlyWage, { shouldDirty: true });
    }

    setValue("breakMinutes", company.defaultBreakMinutes ?? 0, { shouldDirty: true });

    if (company.commonStartTime) {
      setValue("startTime", company.commonStartTime, { shouldDirty: true });
    }

    if (company.commonEndTime) {
      setValue("endTime", company.commonEndTime, { shouldDirty: true });
    }
  }

  async function submit(valuesToSave: WorkShiftFormValues) {
    setFormError(null);
    await onSubmit(valuesToSave, {
      id: selectedCompanyId,
      name: selectedCompany?.name ?? null,
    });
  }

  const firstError =
    errors.date?.message ||
    errors.startTime?.message ||
    errors.endTime?.message ||
    errors.breakMinutes?.message ||
    errors.hourlyWage?.message ||
    formError;

  return (
    <StickySaveButton
      label={submitLabel}
      loading={loading}
      onPress={handleSubmit((nextValues) => void submit(nextValues))}
      subtitle={`${totalHours.toFixed(1)}h · ${currency} ${estimatedIncome.toFixed(2)}`}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Work entry</Text>
          <View style={styles.companyBlock}>
            <Text style={styles.helperTitle}>Company or workplace</Text>
            <Text style={styles.helperText}>
              Choose a saved company to auto-fill the wage, break, and common shift times.
            </Text>
            <CompanyPicker selectedId={selectedCompanyId} onSelect={applyCompanyDefaults} />
            <Text style={styles.helperText}>
              If this is a one-off shift, type a custom workplace name below instead.
            </Text>
          </View>
          <Controller
            control={control}
            name="date"
            render={({ field }) => (
              <AppDatePicker
                label="Date"
                value={field.value}
                onChange={field.onChange}
                error={errors.date?.message}
              />
            )}
          />
          <View style={styles.row}>
            <View style={styles.half}>
              <Controller
                control={control}
                name="startTime"
                render={({ field }) => (
                  <AppTimePicker
                    label="Start time"
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.startTime?.message}
                  />
                )}
              />
            </View>
            <View style={styles.half}>
              <Controller
                control={control}
                name="endTime"
                render={({ field }) => (
                  <AppTimePicker
                    label="End time"
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.endTime?.message}
                  />
                )}
              />
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.half}>
              <Controller
                control={control}
                name="breakMinutes"
                render={({ field }) => (
                  <AppInput
                    label="Break minutes"
                    value={String(field.value ?? 0)}
                    onChangeText={field.onChange}
                    keyboardType="number-pad"
                    error={errors.breakMinutes?.message}
                  />
                )}
              />
            </View>
            <View style={styles.half}>
              <Controller
                control={control}
                name="hourlyWage"
                render={({ field }) => (
                  <AppInput
                    label="Hourly wage"
                    value={String(field.value ?? "")}
                    onChangeText={field.onChange}
                    keyboardType="decimal-pad"
                    error={errors.hourlyWage?.message}
                  />
                )}
              />
            </View>
          </View>
          <Controller
            control={control}
            name="workplace"
            render={({ field }) => (
              <AppInput
                label="Custom workplace optional"
                value={field.value ?? ""}
                onChangeText={field.onChange}
                placeholder="Night shift, campus job, or other workplace"
              />
            )}
          />
          <Controller
            control={control}
            name="note"
            render={({ field }) => (
              <AppInput
                label="Note optional"
                value={field.value ?? ""}
                onChangeText={field.onChange}
                multiline
                style={styles.noteInput}
              />
            )}
          />
          <View style={styles.summaryBox}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total hours</Text>
              <Text style={styles.summaryValue}>{totalHours.toFixed(2)}h</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Estimated income</Text>
              <Text style={styles.summaryValue}>
                {currency} {estimatedIncome.toFixed(2)}
              </Text>
            </View>
          </View>
          {duration.warning ? <Text style={styles.warning}>{duration.warning}</Text> : null}
          {firstError ? <Text style={styles.errorText}>{firstError}</Text> : null}
        </View>
      </ScrollView>
    </StickySaveButton>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
    gap: spacing.sm,
  },
  companyBlock: {
    gap: spacing.xs,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.body,
    fontWeight: "800",
  },
  helperTitle: {
    color: colors.text,
    fontSize: fontSize.caption,
    fontWeight: "800",
  },
  helperText: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 16,
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  half: {
    flex: 1,
  },
  noteInput: {
    minHeight: 86,
    textAlignVertical: "top",
    paddingTop: 10,
  },
  summaryBox: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  summaryItem: {
    flex: 1,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    gap: 2,
  },
  summaryLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
  },
  summaryValue: {
    color: colors.text,
    fontSize: fontSize.caption,
    fontWeight: "800",
  },
  warning: {
    color: colors.warning,
    fontSize: fontSize.caption,
    lineHeight: 16,
  },
  errorText: {
    color: colors.danger,
    fontSize: fontSize.caption,
    lineHeight: 16,
  },
});
