import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppButton } from "../../components/ui/AppButton";
import { AppScreen } from "../../components/ui/AppScreen";
import { EmptyState } from "../../components/ui/EmptyState";
import { LoadingState } from "../../components/ui/LoadingState";
import { getApiErrorMessage } from "../../api/apiClient";
import { colors, fontSize, radius, spacing } from "../../constants/colors";
import { useCleaning } from "../../hooks/useCleaning";
import type { RootStackParamList } from "../../navigation/types";
import type { CleaningTaskInput } from "../../types/cleaning.types";
import { useEffect, useState } from "react";

type Route = RouteProp<RootStackParamList, "AddEditCleaningRoutine">;
type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function AddEditCleaningRoutineScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Navigation>();
  const routineId = route.params?.routineId;
  const { cleaning, createCleaningTask, updateCleaningTask, deleteCleaningTask, isSaving } = useCleaning();
  const routine = cleaning.data?.find((item) => item.id === routineId);
  const [title, setTitle] = useState(route.params?.title ?? "");
  const [intervalDays, setIntervalDays] = useState("7");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!routine) return;
    setTitle(routine.title);
    setIntervalDays(String(routine.intervalDays));
    setNotes(routine.notes ?? "");
  }, [routine]);

  const save = async () => {
    const interval = Number(intervalDays);
    if (!title.trim()) return Alert.alert("Title required", "Enter a cleaning routine title.");
    if (!Number.isFinite(interval) || interval < 1 || interval > 365) {
      return Alert.alert("Check interval", "Interval must be between 1 and 365 days.");
    }

    const input: CleaningTaskInput = {
      title: title.trim(),
      intervalDays: interval,
      notes: notes.trim() || undefined,
    };

    try {
      if (routineId) await updateCleaningTask({ id: routineId, input });
      else await createCleaningTask(input);
      navigation.goBack();
    } catch (error) {
      Alert.alert("Could not save cleaning routine", getApiErrorMessage(error));
    }
  };

  const remove = () => {
    if (!routineId) return;
    Alert.alert("Delete routine?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteCleaningTask(routineId);
            navigation.goBack();
          } catch (error) {
            Alert.alert("Could not delete routine", getApiErrorMessage(error));
          }
        },
      },
    ]);
  };

  if (routineId && cleaning.isLoading) {
    return <LoadingState label="Loading cleaning routine" />;
  }

  if (routineId && !routine) {
    return (
      <AppScreen title="Cleaning Routine">
        <EmptyState title="Cleaning routine not found" message="It may have been deleted or is still loading." />
      </AppScreen>
    );
  }

  return (
    <AppScreen title={routineId ? "Edit Cleaning" : "Add Cleaning"} subtitle="Keep shared routines small and easy to mark done.">
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.label}>Title</Text>
          <TextInput value={title} onChangeText={setTitle} placeholder="Laundry, bathroom, floor..." placeholderTextColor={colors.muted} style={styles.input} />
          <Text style={styles.label}>Repeat every</Text>
          <View style={styles.row}>
            <TextInput value={intervalDays} onChangeText={setIntervalDays} keyboardType="number-pad" style={[styles.input, styles.daysInput]} />
            <Text style={styles.suffix}>days</Text>
          </View>
          <Text style={styles.label}>Notes</Text>
          <TextInput value={notes} onChangeText={setNotes} multiline placeholder="Optional" placeholderTextColor={colors.muted} style={[styles.input, styles.notes]} />
        </View>
        <AppButton title={routineId ? "Save Changes" : "Create Routine"} loading={isSaving} disabled={isSaving} onPress={save} />
        {routineId ? <AppButton title="Delete Routine" icon="trash-outline" variant="danger" loading={isSaving} disabled={isSaving} onPress={remove} /> : null}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.xxl },
  card: { borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.md, gap: spacing.sm },
  label: { color: colors.text, fontSize: fontSize.body, fontWeight: "800" },
  input: { minHeight: 50, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, color: colors.text, paddingHorizontal: spacing.md, fontSize: fontSize.bodyLarge },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  daysInput: { width: 92, textAlign: "center" },
  suffix: { color: colors.muted, fontSize: fontSize.bodyLarge, fontWeight: "700" },
  notes: { minHeight: 96, paddingTop: spacing.md, textAlignVertical: "top" },
});
