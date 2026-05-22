import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { BONUS_TYPES } from "../../constants/categories";
import { colors, fontSize, radius, spacing } from "../../constants/colors";
import { CompanyPicker } from "../../components/work/CompanyPicker";
import { AppDatePicker } from "../ui/AppDatePicker";
import { AppTimePicker } from "../ui/AppTimePicker";
import { StickySaveButton } from "../ui/StickySaveButton";
import { FormSectionCard } from "../ui/FormSectionCard";
import { useWorkHours } from "../../hooks/useWorkHours";
import { useSettings } from "../../hooks/useSettings";
import type { Company } from "../../types/company.types";
import type { WorkShiftInput } from "../../types/work.types";
import type { RootStackParamList } from "../../navigation/types";
import {
  getBreakSuggestion,
  getShiftTimeSuggestion,
  getWageSuggestion,
} from "../../utils/suggestionEngine";
import {
  workShiftSchema,
  type WorkShiftFormValues,
} from "../../validators/work.schema";
import { calculateWorkDuration } from "../../utils/workMath";
import { defaultSettings } from "../../storage/settingsStorage";
import { describeWorkLimit } from "../../utils/workLimit";

type Props = {
  onSubmit: (values: WorkShiftInput) => Promise<void>;
  loading?: boolean;
  initialValues?: Partial<WorkShiftInput>;
  submitLabel?: string;
  currency?: string;
};

function toDateValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function WorkShiftForm({
  onSubmit,
  loading,
  initialValues,
  submitLabel = "Save Work Entry",
  currency = "EUR",
}: Props) {
  const [showMore, setShowMore] = useState(false);
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const settingsHook = useSettings();
  const workSettings = settingsHook.settings ?? defaultSettings;
  const today = toDateValue(new Date());
  const { workShifts } = useWorkHours();
  const defaultValues: WorkShiftFormValues = {
    companyId: initialValues?.companyId ?? null,
    jobName: initialValues?.jobName ?? "",
    date: initialValues?.date ?? today,
    startTime: initialValues?.startTime ?? "09:00",
    endTime: initialValues?.endTime ?? "17:00",
    breakMinutes: initialValues?.breakMinutes ?? 0,
    hourlyWage: initialValues?.hourlyWage ?? 12.5,
    bonusType: initialValues?.bonusType ?? "NONE",
    bonusValue: initialValues?.bonusValue,
    isPublicHoliday: initialValues?.isPublicHoliday ?? false,
    notes: initialValues?.notes ?? "",
  };

  const { control, handleSubmit, setValue, reset, formState } =
    useForm<WorkShiftFormValues>({
      resolver: zodResolver(workShiftSchema) as never,
      defaultValues,
    });

  useEffect(() => {
    reset(defaultValues);
  }, [
    initialValues?.bonusType,
    initialValues?.bonusValue,
    initialValues?.breakMinutes,
    initialValues?.companyId,
    initialValues?.date,
    initialValues?.endTime,
    initialValues?.hourlyWage,
    initialValues?.isPublicHoliday,
    initialValues?.jobName,
    initialValues?.notes,
    initialValues?.startTime,
    reset,
  ]);

  const values = useWatch({ control });
  const selectedDate = values.date ?? today;
  const startTime = values.startTime ?? "09:00";
  const endTime = values.endTime ?? "17:00";
  const breakMinutes = Number(values.breakMinutes ?? 0);
  const duration = calculateWorkDuration(
    selectedDate,
    startTime,
    endTime,
    breakMinutes,
  );
  const workedHours = Math.max(0, duration.hours);
  const income = workedHours * Number(values.hourlyWage ?? 0);
  const currencyLabel = currency === "EUR" ? "EUR" : currency;

  const handleInvalid = () => {
    const firstError =
      formState.errors.jobName?.message ??
      formState.errors.date?.message ??
      formState.errors.startTime?.message ??
      formState.errors.endTime?.message ??
      formState.errors.hourlyWage?.message ??
      formState.errors.breakMinutes?.message ??
      "Please check the highlighted fields.";

    Alert.alert("Check work entry", firstError);
  };

  const handleCompanySelect = (company: Company | null) => {
    if (company) {
      setValue("companyId", company.id, { shouldValidate: true });
      setValue("jobName", company.name, { shouldValidate: true });
      const wage =
        company.defaultHourlyWage ??
        getWageSuggestion(company.name, workShifts.data ?? []);
      const breakSuggest =
        company.defaultBreakMinutes ??
        getBreakSuggestion(company.name, workShifts.data ?? []);
      const shiftTime = getShiftTimeSuggestion(
        company.name,
        workShifts.data ?? [],
      );
      if (wage !== null) setValue("hourlyWage", wage, { shouldValidate: true });
      if (breakSuggest !== null)
        setValue("breakMinutes", breakSuggest, { shouldValidate: true });
      if (company.commonStartTime && company.commonEndTime) {
        setValue("startTime", company.commonStartTime, {
          shouldValidate: true,
        });
        setValue("endTime", company.commonEndTime, { shouldValidate: true });
      } else if (shiftTime) {
        setValue("startTime", shiftTime.startTime, { shouldValidate: true });
        setValue("endTime", shiftTime.endTime, { shouldValidate: true });
      }
      setValue("bonusType", company.defaultBonusType ?? "NONE", {
        shouldValidate: true,
      });
      if (
        company.defaultBonusValue !== null &&
        company.defaultBonusValue !== undefined
      ) {
        setValue("bonusValue", company.defaultBonusValue, {
          shouldValidate: true,
        });
      }
    } else {
      setValue("companyId", null, { shouldValidate: true });
    }
  };

  return (
    <StickySaveButton
      label={submitLabel}
      onPress={handleSubmit(onSubmit, handleInvalid)}
      loading={loading}
      subtitle={
        values.jobName
          ? `${values.jobName} - ${currencyLabel} ${income.toFixed(2)}`
          : "New work entry"
      }
    >
      <ScrollView
        style={styles.scroller}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <FormSectionCard
          title="Shift"
          subtitle="Only the basics are needed. Add details if you want."
          gap="sm"
        >
          <Controller
            control={control}
            name="jobName"
            render={({ field, fieldState }) => (
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Workplace or job</Text>
                <TextInput
                  value={field.value}
                  onChangeText={(value) => {
                    setValue("companyId", null, { shouldValidate: false });
                    field.onChange(value);
                  }}
                  placeholder="Cafe, warehouse, tutoring..."
                  placeholderTextColor={colors.muted}
                  style={styles.input}
                />
                {fieldState.error ? (
                  <Text style={styles.error}>{fieldState.error.message}</Text>
                ) : null}
              </View>
            )}
          />

          <Controller
            control={control}
            name="companyId"
            render={({ field }) => (
              <CompanyPicker
                selectedId={field.value ?? undefined}
                onSelect={handleCompanySelect}
                onCreateNew={() => navigation.navigate("AddEditCompany")}
              />
            )}
          />

          <Controller
            control={control}
            name="date"
            render={({ field, fieldState }) => (
              <AppDatePicker
                label="Date"
                value={field.value}
                onChange={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />

          <View style={styles.timeRow}>
            <View style={styles.timeCol}>
              <Controller
                control={control}
                name="startTime"
                render={({ field, fieldState }) => (
                  <AppTimePicker
                    label="Start"
                    value={field.value}
                    onChange={field.onChange}
                    error={fieldState.error?.message}
                  />
                )}
              />
            </View>
            <View style={styles.timeCol}>
              <Controller
                control={control}
                name="endTime"
                render={({ field, fieldState }) => (
                  <AppTimePicker
                    label="End"
                    value={field.value}
                    onChange={field.onChange}
                    error={fieldState.error?.message}
                  />
                )}
              />
            </View>
          </View>

          <View style={styles.compactRow}>
            <View style={styles.compactCol}>
              <Controller
                control={control}
                name="breakMinutes"
                render={({ field, fieldState }) => (
                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>Break</Text>
                    <View style={styles.breakChips}>
                      {[0, 15, 30, 45, 60].map((minutes) => (
                        <Pressable
                          key={minutes}
                          style={[
                            styles.breakChip,
                            Number(field.value ?? 0) === minutes &&
                              styles.breakChipActive,
                          ]}
                          onPress={() => field.onChange(minutes)}
                        >
                          <Text
                            style={[
                              styles.breakChipText,
                              Number(field.value ?? 0) === minutes &&
                                styles.breakChipTextActive,
                            ]}
                          >
                            {minutes}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                    {fieldState.error ? (
                      <Text style={styles.error}>
                        {fieldState.error.message}
                      </Text>
                    ) : null}
                  </View>
                )}
              />
            </View>

            <View style={styles.compactCol}>
              <Controller
                control={control}
                name="hourlyWage"
                render={({ field, fieldState }) => (
                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>Hourly wage</Text>
                    <View style={styles.wageInput}>
                      <Text style={styles.wageCurrency}>{currencyLabel}</Text>
                      <TextInput
                        value={String(field.value ?? "")}
                        onChangeText={field.onChange}
                        keyboardType="decimal-pad"
                        style={styles.wageNumber}
                        placeholder="14.00"
                        placeholderTextColor={colors.muted}
                      />
                    </View>
                    {fieldState.error ? (
                      <Text style={styles.error}>
                        {fieldState.error.message}
                      </Text>
                    ) : null}
                  </View>
                )}
              />
            </View>
          </View>

          <View style={styles.previewRow}>
            <View style={styles.previewItem}>
              <Text style={styles.previewLabel}>Hours</Text>
              <Text style={styles.previewValue}>{workedHours.toFixed(1)}h</Text>
            </View>
            <View style={styles.previewDivider} />
            <View style={styles.previewItem}>
              <Text style={styles.previewLabel}>Income</Text>
              <Text style={styles.previewValue}>
                {currencyLabel} {income.toFixed(2)}
              </Text>
            </View>
          </View>

          <Text style={styles.limitNote}>
            Active work limit: {describeWorkLimit(workSettings)}
          </Text>

          {duration.warning ? (
            <Text style={styles.warning}>{duration.warning}</Text>
          ) : null}
        </FormSectionCard>

        <Pressable
          accessibilityRole="button"
          onPress={() => setShowMore((value) => !value)}
          style={({ pressed }) => [
            styles.moreButton,
            pressed && styles.pressed,
          ]}
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
              name="bonusType"
              render={({ field }) => (
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Bonus type</Text>
                  <View style={styles.bonusChips}>
                    {BONUS_TYPES.slice(0, 4).map((bonus) => (
                      <Pressable
                        key={bonus}
                        style={[
                          styles.bonusChip,
                          field.value === bonus && styles.bonusChipActive,
                        ]}
                        onPress={() => field.onChange(bonus)}
                      >
                        <Text
                          style={[
                            styles.bonusChipText,
                            field.value === bonus && styles.bonusChipTextActive,
                          ]}
                        >
                          {bonus.replace("_", " ")}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}
            />

            <Controller
              control={control}
              name="notes"
              render={({ field }) => (
                <TextInput
                  value={field.value ?? ""}
                  onChangeText={field.onChange}
                  placeholder="Notes"
                  placeholderTextColor={colors.muted}
                  multiline
                  style={styles.notes}
                />
              )}
            />
          </FormSectionCard>
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
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
  },
  field: {
    gap: spacing.xs,
  },
  fieldLabel: {
    color: colors.text,
    fontSize: fontSize.caption,
    fontWeight: "700",
  },
  input: {
    minHeight: 46,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.body,
    fontWeight: "700",
  },
  error: {
    color: colors.danger,
    fontSize: fontSize.caption,
    fontWeight: "500",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  timeCol: {
    flex: 1,
  },
  compactRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  compactCol: {
    flex: 1,
  },
  breakChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  breakChip: {
    minWidth: 34,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  breakChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  breakChipText: {
    color: colors.text,
    fontSize: fontSize.caption,
    fontWeight: "600",
  },
  breakChipTextActive: {
    color: "white",
    fontWeight: "700",
  },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  previewItem: {
    flex: 1,
    alignItems: "center",
  },
  previewLabel: {
    color: colors.muted,
    fontSize: fontSize.caption,
    fontWeight: "600",
  },
  previewValue: {
    color: colors.text,
    fontSize: fontSize.body,
    fontWeight: "700",
    marginTop: spacing.xs,
  },
  limitNote: {
    color: colors.muted,
    fontSize: fontSize.caption,
    fontWeight: "700",
    lineHeight: 18,
  },
  previewDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  warning: {
    color: colors.warning,
    fontSize: fontSize.caption,
    fontWeight: "600",
    textAlign: "center",
  },
  wageInput: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  wageCurrency: {
    color: colors.muted,
    fontSize: fontSize.caption,
    fontWeight: "800",
    marginRight: spacing.xs,
  },
  wageNumber: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.body,
    fontWeight: "700",
    padding: 0,
  },
  bonusChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  bonusChip: {
    flex: 1,
    minWidth: "48%",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
  },
  bonusChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  bonusChipText: {
    color: colors.text,
    fontSize: fontSize.caption,
    fontWeight: "600",
  },
  bonusChipTextActive: {
    color: "white",
    fontWeight: "700",
  },
  notes: {
    minHeight: 78,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: fontSize.body,
    textAlignVertical: "top",
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
  pressed: {
    opacity: 0.8,
  },
});
