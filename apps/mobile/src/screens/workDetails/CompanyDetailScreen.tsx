import { Alert, StyleSheet, Text, View } from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppButton } from "../../components/ui/AppButton";
import { AppScreen } from "../../components/ui/AppScreen";
import { EmptyState } from "../../components/ui/EmptyState";
import { LoadingState } from "../../components/ui/LoadingState";
import { colors, fontSize, radius, spacing } from "../../constants/colors";
import { useCompanies, useCompanyDetail } from "../../hooks/useCompanies";
import { useWorkHours } from "../../hooks/useWorkHours";
import type { RootStackParamList } from "../../navigation/types";
import { formatCurrency } from "../../utils/formatCurrency";

type Route = RouteProp<RootStackParamList, "CompanyDetail">;
type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function CompanyDetailScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Navigation>();
  const companyId = route.params.companyId;
  const { deleteCompany, isDeleting } = useCompanies();
  const detail = useCompanyDetail(companyId ?? "");
  const { workShifts } = useWorkHours();
  const company = detail.data;
  const shifts = workShifts.data?.filter((shift) => companyId ? shift.companyId === companyId : shift.jobName === route.params.companyName) ?? [];
  const hours = shifts.reduce((sum, shift) => sum + shift.calculatedHours, 0);
  const income = shifts.reduce((sum, shift) => sum + shift.calculatedIncome, 0);
  const title = company?.name ?? route.params.companyName ?? "Company";

  if (companyId && detail.isLoading) return <AppScreen title="Company"><LoadingState label="Loading company" /></AppScreen>;

  return (
    <AppScreen title={title} subtitle="Workplace defaults and work history.">
      <View style={styles.card}>
        <Text style={styles.title}>{hours.toFixed(1)}h · {formatCurrency(income)}</Text>
        {company ? (
          <>
            <Text style={styles.meta}>Default wage: {company.defaultHourlyWage ? formatCurrency(company.defaultHourlyWage) : "Not set"}</Text>
            <Text style={styles.meta}>Default break: {company.defaultBreakMinutes ?? 0} min</Text>
            <Text style={styles.meta}>Common shift: {company.commonStartTime && company.commonEndTime ? `${company.commonStartTime} - ${company.commonEndTime}` : "Not set"}</Text>
          </>
        ) : (
          <Text style={styles.meta}>This company was derived from older work entries. Save it as a company to set defaults.</Text>
        )}
        <AppButton title={company ? "Edit Company" : "Create Company"} icon="create-outline" onPress={() => navigation.navigate("AddEditCompany", { companyId, companyName: title })} />
        {company ? (
          <AppButton
            title="Archive Company"
            icon="trash-outline"
            variant="danger"
            loading={isDeleting}
            onPress={() => Alert.alert("Archive company?", "Work history will stay connected.", [
              { text: "Cancel", style: "cancel" },
              { text: "Archive", style: "destructive", onPress: () => void deleteCompany(company.id).then((result: any) => Alert.alert("Company updated", result.message ?? "Company archived.")) },
            ])}
          />
        ) : null}
      </View>
      {shifts.length === 0 ? (
        <EmptyState title="No work logged yet" message="Track your first shift to calculate income and work limits." actionLabel="Log Work Entry" onAction={() => navigation.navigate("AddWorkShift")} />
      ) : shifts.slice(0, 8).map((shift) => (
        <View key={shift.id} style={styles.row}>
          <View style={styles.body}>
            <Text style={styles.rowTitle}>{shift.date}</Text>
            <Text style={styles.meta}>{shift.startTime} - {shift.endTime} · {shift.calculatedHours}h</Text>
          </View>
          <Text style={styles.amount}>{formatCurrency(shift.calculatedIncome)}</Text>
        </View>
      ))}
    </AppScreen>
  );
}

export function WorkHistoryScreen() {
  const navigation = useNavigation<Navigation>();
  const { workShifts } = useWorkHours();
  return (
    <AppScreen title="Work History">
      {(workShifts.data ?? []).length === 0 ? (
        <EmptyState title="No work logged yet" message="Track your first shift to calculate income and work limits." actionLabel="Log Work Entry" onAction={() => navigation.navigate("AddWorkShift")} />
      ) : (workShifts.data ?? []).map((shift) => (
        <View key={shift.id} style={styles.row}>
          <View style={styles.body}>
            <Text style={styles.rowTitle}>{shift.jobName}</Text>
            <Text style={styles.meta}>{shift.date} · {shift.calculatedHours}h</Text>
          </View>
          <AppButton title="Open" variant="secondary" onPress={() => navigation.navigate("WorkEntryDetail", { workShiftId: shift.id })} />
        </View>
      ))}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.lg, gap: spacing.md },
  title: { color: colors.text, fontSize: fontSize.section, fontWeight: "800" },
  meta: { color: colors.muted, fontSize: fontSize.caption, lineHeight: 18 },
  row: { minHeight: 72, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.md, flexDirection: "row", alignItems: "center", gap: spacing.md },
  body: { flex: 1 },
  rowTitle: { color: colors.text, fontSize: fontSize.bodyLarge, fontWeight: "700" },
  amount: { color: colors.primary, fontSize: fontSize.bodyLarge, fontWeight: "800" },
});
