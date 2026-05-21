import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StyleSheet, Text, View } from "react-native";
import { getApiErrorMessage } from "../../api/apiClient";
import { AppButton } from "../../components/ui/AppButton";
import { AppCard } from "../../components/ui/AppCard";
import { AppScreen } from "../../components/ui/AppScreen";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { LoadingState } from "../../components/ui/LoadingState";
import { PriorityBadge } from "../../components/ui/PriorityBadge";
import { colors, spacing } from "../../constants/colors";
import { useClasses } from "../../hooks/useClasses";
import type { PlannerStackParamList } from "../../navigation/types";

type Navigation = NativeStackNavigationProp<PlannerStackParamList>;

export function ClassesScreen() {
  const navigation = useNavigation<Navigation>();
  const { classes } = useClasses();

  return (
    <AppScreen
      title="Planner"
      subtitle="Classes, tasks, and reminders for the week."
      action={<AppButton title="Task" icon="checkmark-circle-outline" variant="secondary" onPress={() => navigation.navigate("Tasks")} />}
    >
      <View style={styles.actions}>
        <AppButton title="Add class" icon="add-outline" onPress={() => navigation.navigate("AddClass")} />
        <AppButton title="Reminders" icon="notifications-outline" variant="secondary" onPress={() => navigation.navigate("Reminders")} />
      </View>
      <AppCard title="Weekly classes">
        {classes.isLoading ? <LoadingState /> : classes.isError ? (
          <ErrorState message={getApiErrorMessage(classes.error)} />
        ) : !classes.data || classes.data.length === 0 ? (
          <EmptyState title="No classes saved" message="Add mandatory and optional classes to build your week." />
        ) : (
          <View style={styles.list}>
            {classes.data.map((item) => (
              <View key={item.id} style={styles.row}>
                <View style={styles.body}>
                  <Text style={styles.title}>{item.courseName}</Text>
                  <Text style={styles.meta}>{item.dayOfWeek.toLowerCase()} · {item.startTime}-{item.endTime}{item.location ? ` · ${item.location}` : ""}</Text>
                  <Text style={styles.meta}>{item.attendanceType.toLowerCase()}</Text>
                </View>
                <PriorityBadge priority={item.priority} />
              </View>
            ))}
          </View>
        )}
      </AppCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: spacing.sm
  },
  list: {
    gap: spacing.sm
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xs
  },
  body: {
    flex: 1
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800"
  },
  meta: {
    color: colors.muted,
    fontSize: 13
  }
});

