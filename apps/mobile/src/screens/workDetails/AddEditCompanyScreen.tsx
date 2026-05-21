import { useEffect } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Controller, useForm } from "react-hook-form";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { AppButton } from "../../components/ui/AppButton";
import { AppInput } from "../../components/ui/AppInput";
import { AppSelect } from "../../components/ui/AppSelect";
import { AppTimePicker } from "../../components/ui/AppTimePicker";
import { AppScreen } from "../../components/ui/AppScreen";
import { getApiErrorMessage } from "../../api/apiClient";
import { colors, fontSize, radius, spacing } from "../../constants/colors";
import { BONUS_TYPES } from "../../constants/categories";
import { useCompanies, useCompanyDetail } from "../../hooks/useCompanies";
import type { RootStackParamList } from "../../navigation/types";
import type { CompanyInput } from "../../types/company.types";

type Route = RouteProp<RootStackParamList, "AddEditCompany">;

export function AddEditCompanyScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation();
  const companyId = route.params?.companyId;
  const detail = useCompanyDetail(companyId ?? "");
  const { createCompany, updateCompany, isCreating, isUpdating } = useCompanies();
  const { control, handleSubmit, reset } = useForm<CompanyInput>({
    defaultValues: {
      name: route.params?.companyName ?? "",
      defaultBreakMinutes: 30,
      defaultBonusType: "NONE",
      color: "#2E7D1F",
    },
  });

  useEffect(() => {
    if (detail.data) {
      reset({
        name: detail.data.name,
        defaultHourlyWage: detail.data.defaultHourlyWage,
        defaultBreakMinutes: detail.data.defaultBreakMinutes,
        defaultBonusType: detail.data.defaultBonusType,
        defaultBonusValue: detail.data.defaultBonusValue,
        color: detail.data.color,
        commonStartTime: detail.data.commonStartTime,
        commonEndTime: detail.data.commonEndTime,
        notes: detail.data.notes,
      });
    }
  }, [detail.data, reset]);

  const save = async (values: CompanyInput) => {
    if (!values.name.trim()) {
      Alert.alert("Name required", "Please enter a company name.");
      return;
    }
    try {
      if (companyId) await updateCompany({ id: companyId, input: values });
      else await createCompany(values);
      navigation.goBack();
    } catch (error) {
      Alert.alert("Could not save company", getApiErrorMessage(error));
    }
  };

  const invalid = () => {
    Alert.alert("Check company", "Please check the highlighted company fields.");
  };

  return (
    <AppScreen title={companyId ? "Edit Company" : "Add Company"} subtitle="Defaults make work logging faster.">
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Controller control={control} name="name" render={({ field }) => <AppInput label="Name" value={field.value} onChangeText={field.onChange} placeholder="Bakery" />} />
          <Controller control={control} name="defaultHourlyWage" render={({ field }) => <AppInput label="Default hourly wage" value={field.value === null || field.value === undefined ? "" : String(field.value)} onChangeText={(value) => field.onChange(value ? Number(value) : null)} keyboardType="decimal-pad" placeholder="14.05" />} />
          <Controller control={control} name="defaultBreakMinutes" render={({ field }) => <AppInput label="Default break minutes" value={String(field.value ?? 0)} onChangeText={(value) => field.onChange(Number(value || 0))} keyboardType="number-pad" />} />
          <Controller control={control} name="defaultBonusType" render={({ field }) => <AppSelect label="Default bonus type" value={field.value ?? "NONE"} onChange={field.onChange} options={BONUS_TYPES.map((value) => ({ label: value.replace("_", " ").toLowerCase(), value }))} />} />
          <Controller control={control} name="defaultBonusValue" render={({ field }) => <AppInput label="Default bonus value" value={field.value === null || field.value === undefined ? "" : String(field.value)} onChangeText={(value) => field.onChange(value ? Number(value) : null)} keyboardType="decimal-pad" placeholder="0" />} />
          <Controller control={control} name="commonStartTime" render={({ field }) => <AppTimePicker label="Common start time" value={field.value ?? ""} onChange={field.onChange} />} />
          <Controller control={control} name="commonEndTime" render={({ field }) => <AppTimePicker label="Common end time" value={field.value ?? ""} onChange={field.onChange} />} />
          <Controller control={control} name="color" render={({ field }) => <AppInput label="Color" value={field.value ?? ""} onChangeText={field.onChange} placeholder="#2E7D1F" />} />
          <Controller control={control} name="notes" render={({ field }) => (
            <View style={styles.notesWrap}>
              <Text style={styles.label}>Notes</Text>
              <TextInput value={field.value ?? ""} onChangeText={field.onChange} multiline style={styles.notes} placeholder="Manager, payday, shift notes..." placeholderTextColor={colors.muted} />
            </View>
          )} />
        </View>
        <AppButton title="Save Company" loading={isCreating || isUpdating} disabled={isCreating || isUpdating} onPress={handleSubmit(save, invalid)} />
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.xxl },
  card: { borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.md, gap: spacing.md },
  notesWrap: { gap: spacing.xs },
  label: { color: colors.text, fontSize: fontSize.body, fontWeight: "700" },
  notes: { minHeight: 96, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, color: colors.text, textAlignVertical: "top" },
});
