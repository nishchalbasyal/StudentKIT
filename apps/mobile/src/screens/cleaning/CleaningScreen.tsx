import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { getApiErrorMessage } from "../../api/apiClient";
import { AppButton } from "../../components/ui/AppButton";
import { AppScreen } from "../../components/ui/AppScreen";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { LoadingState } from "../../components/ui/LoadingState";
import { colors, fontSize, radius, spacing } from "../../constants/colors";
import { useCleaning } from "../../hooks/useCleaning";
import type { RootStackParamList } from "../../navigation/types";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

const defaults = [
  { title: "Floor Cleaning", days: 9, every: 7 },
  { title: "Bathroom Cleaning", days: 5, every: 7 },
  { title: "Laundry", days: 6, every: 7 }
];

export function CleaningScreen() {
  const navigation = useNavigation<Navigation>();
  const { cleaning, completeCleaningTask, isSaving } = useCleaning();
  const tasks = cleaning.data?.length ? cleaning.data.map((task) => ({ id: task.id, title: task.title, days: task.daysSinceLastDone ?? 0, every: task.intervalDays })) : [];

  return (
    <AppScreen title="Cleaning" subtitle="Small routines that keep student life from piling up.">
      <View style={styles.topCard}>
        <Text style={styles.status}>Your room is mostly okay</Text>
        <Text style={styles.meta}>2 tasks overdue</Text>
      </View>
      {cleaning.isLoading ? <LoadingState /> : cleaning.isError ? (
        <ErrorState message={getApiErrorMessage(cleaning.error)} />
      ) : tasks.length === 0 ? (
        <>
          <EmptyState title="No cleaning routine yet." message="Start with floor, bathroom, or laundry." actionLabel="Create Routine" />
          {defaults.map((task) => <CleaningRow key={task.title} title={task.title} days={task.days} every={task.every} onOpen={() => navigation.navigate("AddEditCleaningRoutine", { title: task.title })} />)}
        </>
      ) : (
        tasks.map((task) => (
          <CleaningRow key={task.id} title={task.title} days={task.days} every={task.every} loading={isSaving} onDone={() => void completeCleaningTask(task.id)} onOpen={() => navigation.navigate("AddEditCleaningRoutine", { routineId: task.id, title: task.title })} />
        ))
      )}
      <AppButton title="Add custom cleaning task" icon="add-outline" variant="secondary" onPress={() => navigation.navigate("AddEditCleaningRoutine")} />
    </AppScreen>
  );
}

function CleaningRow({ title, days, every, loading, onDone, onOpen }: { title: string; days: number; every: number; loading?: boolean; onDone?: () => void; onOpen?: () => void }) {
  const overdue = days > every;
  return (
    <Pressable style={({ pressed }) => [styles.row, pressed && styles.pressed]} onPress={onOpen}>
      <View style={[styles.iconSoft, overdue && styles.iconWarn]}><Ionicons name="sparkles-outline" size={21} color={overdue ? colors.warning : colors.primary} /></View>
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.meta}>Last done {days} days ago</Text>
        <Text style={styles.meta}>Recommended every {every} days</Text>
      </View>
      <Pressable disabled={loading} onPress={onDone} style={styles.doneButton}><Text style={styles.doneText}>Mark Done</Text></Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  topCard: { borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.softGreen, padding: spacing.lg, gap: spacing.xs },
  status: { color: colors.primary, fontSize: fontSize.section, fontWeight: "700" },
  row: { minHeight: 92, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.md, flexDirection: "row", alignItems: "center", gap: spacing.md },
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.88 },
  iconSoft: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.softGreen, alignItems: "center", justifyContent: "center" },
  iconWarn: { backgroundColor: colors.warningSoft },
  body: { flex: 1 },
  title: { color: colors.text, fontSize: fontSize.bodyLarge, fontWeight: "700" },
  meta: { color: colors.muted, fontSize: fontSize.caption, lineHeight: 18 },
  doneButton: { borderRadius: radius.pill, backgroundColor: colors.softGreen, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  doneText: { color: colors.primary, fontSize: fontSize.badge, fontWeight: "800" }
});
