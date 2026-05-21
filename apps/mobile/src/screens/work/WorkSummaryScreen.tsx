import { StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppScreen } from "../../components/ui/AppScreen";
import { LoadingState } from "../../components/ui/LoadingState";
import { ErrorState } from "../../components/ui/ErrorState";
import { EmptyState } from "../../components/ui/EmptyState";
import { AppButton } from "../../components/ui/AppButton";
import { SummaryCard } from "../../components/dashboard/SummaryCard";
import { WorkLimitCard } from "../../components/dashboard/WorkLimitCard";
import { spacing } from "../../constants/colors";
import { useWorkHours } from "../../hooks/useWorkHours";
import { useAuthStore } from "../../store/authStore";
import { getApiErrorMessage } from "../../api/apiClient";
import { formatCurrency } from "../../utils/formatCurrency";
import type { RootStackParamList } from "../../navigation/types";

export function WorkSummaryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const user = useAuthStore((state) => state.user);
  const { monthlySummary, weeklySummary } = useWorkHours();

  if (monthlySummary.isLoading || weeklySummary.isLoading) {
    return <AppScreen title="Work summary"><LoadingState label="Loading summary" /></AppScreen>;
  }

  if ((monthlySummary.data?.shiftCount ?? 0) === 0) {
    return (
      <AppScreen title="Work summary">
        <EmptyState
          title="No work logged yet"
          message="Track your first shift to calculate income and work limits."
          actionLabel="Log Work Entry"
          onAction={() => navigation.navigate("AddWorkShift")}
        />
        <AppButton title="Add Company" variant="secondary" icon="briefcase-outline" onPress={() => navigation.navigate("AddEditCompany")} />
      </AppScreen>
    );
  }

  if (monthlySummary.isError || weeklySummary.isError) {
    return (
      <AppScreen title="Work summary">
        <ErrorState message={getApiErrorMessage(monthlySummary.error ?? weeklySummary.error)} />
      </AppScreen>
    );
  }

  return (
    <AppScreen title="Work summary">
      <View style={styles.grid}>
        <SummaryCard label="Week hours" value={`${weeklySummary.data?.totalHours ?? 0}h`} icon="calendar-outline" />
        <SummaryCard label="Week income" value={formatCurrency(weeklySummary.data?.totalIncome ?? 0, user?.currency)} tone="income" icon="cash-outline" />
      </View>
      <View style={styles.grid}>
        <SummaryCard label="Month hours" value={`${monthlySummary.data?.totalHours ?? 0}h`} icon="time-outline" />
        <SummaryCard label="Month income" value={formatCurrency(monthlySummary.data?.totalIncome ?? 0, user?.currency)} tone="income" icon="trending-up-outline" />
      </View>
      {monthlySummary.data ? <WorkLimitCard usage={monthlySummary.data.workLimit.usage} /> : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    gap: spacing.md
  }
});
