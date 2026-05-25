import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { WorkShiftForm } from "../../components/forms/WorkShiftForm";
import { EmptyState } from "../../components/ui/EmptyState";
import { LoadingState } from "../../components/ui/LoadingState";
import { getApiErrorMessage } from "../../api/apiClient";
import { colors, fontSize, spacing } from "../../constants/colors";
import { useWorkHours } from "../../hooks/useWorkHours";
import type { RootStackParamList } from "../../navigation/types";
import { useAuthStore } from "../../store/authStore";
import { showToast } from "../../utils/showToast";
import type { WorkShiftInput } from "../../types/work.types";
import type { WorkShiftFormValues } from "../../validators/work.schema";

type Route = RouteProp<RootStackParamList, "AddWorkShift">;
type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function AddWorkShiftScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Navigation>();
  const user = useAuthStore((state) => state.user);
  const { workShifts, createWorkShift, updateWorkShift, isSaving } = useWorkHours();
  const editId = route.params?.workShiftId;
  const duplicateFromId = route.params?.duplicateFromId;
  const sourceShift = workShifts.data?.find((shift) => shift.id === (editId ?? duplicateFromId));
  const initialValues: Partial<WorkShiftFormValues> | undefined = sourceShift
    ? {
        workplace: sourceShift.jobName,
        date: sourceShift.date,
        startTime: sourceShift.startTime,
        endTime: sourceShift.endTime,
        breakMinutes: sourceShift.breakMinutes,
        hourlyWage: sourceShift.hourlyWage,
        note: sourceShift.notes ?? "",
      }
    : undefined;

  if ((editId || duplicateFromId) && workShifts.isLoading) {
    return <SafeAreaView edges={["top"]} style={styles.safe}><LoadingState label="Loading work entry" /></SafeAreaView>;
  }

  if ((editId || duplicateFromId) && !sourceShift) {
    return (
      <SafeAreaView edges={["top"]} style={styles.safe}>
        <EmptyState title="Work entry not found" message="It may have been deleted or is still loading." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text numberOfLines={1} style={styles.title}>{editId ? "Edit Work Entry" : "Add Work Entry"}</Text>
        <View style={styles.iconButton}><Ionicons name="briefcase-outline" size={20} color={colors.primary} /></View>
      </View>

      <WorkShiftForm
        onSubmit={async (values, company) => {
          const payload: WorkShiftInput = {
            companyId: company.id,
            jobName: values.workplace?.trim() || company.name || "Work shift",
            date: values.date,
            startTime: values.startTime,
            endTime: values.endTime,
            breakMinutes: Number(values.breakMinutes),
            hourlyWage: Number(values.hourlyWage),
            bonusType: "NONE",
            isPublicHoliday: false,
            notes: values.note?.trim() || undefined,
          };

          try {
            if (editId) {
              await updateWorkShift({ id: editId, input: payload });
            } else {
              await createWorkShift(payload);
            }
            showToast(editId ? "Work entry saved." : "Work entry saved.");
            navigation.goBack();
          } catch (error) {
            Alert.alert("Could not save work entry", getApiErrorMessage(error));
          }
        }}
        loading={isSaving}
        initialValues={initialValues}
        initialCompanyId={sourceShift?.companyId ?? null}
        submitLabel={editId ? "Save Changes" : "Save Work Entry"}
        currency={user?.currency}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { minHeight: 62, paddingHorizontal: spacing.lg, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: colors.background },
  iconButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  title: { flex: 1, textAlign: "center", color: colors.text, fontSize: fontSize.title, fontWeight: "700" },
});
