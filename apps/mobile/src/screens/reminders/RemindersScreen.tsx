import { StyleSheet, Text, View } from "react-native";
import { getApiErrorMessage } from "../../api/apiClient";
import { AppButton } from "../../components/ui/AppButton";
import { AppCard } from "../../components/ui/AppCard";
import { AppScreen } from "../../components/ui/AppScreen";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { LoadingState } from "../../components/ui/LoadingState";
import { ReminderBadge } from "../../components/ui/ReminderBadge";
import { colors, spacing } from "../../constants/colors";
import { useReminders } from "../../hooks/useReminders";
import { formatDate } from "../../utils/formatDate";

export function RemindersScreen() {
  const { reminders, completeReminder, isSaving } = useReminders();

  return (
    <AppScreen title="Reminders" subtitle="Classes, tasks, groceries, and cleaning in one list.">
      <AppCard title="All reminders">
        {reminders.isLoading ? <LoadingState /> : reminders.isError ? (
          <ErrorState message={getApiErrorMessage(reminders.error)} />
        ) : !reminders.data || reminders.data.length === 0 ? (
          <EmptyState title="No reminders" message="Reminders will appear here when classes, tasks, groceries, or cleaning need attention." />
        ) : (
          <View style={styles.list}>
            {reminders.data.map((reminder) => (
              <View key={reminder.id} style={styles.row}>
                <View style={styles.body}>
                  <Text style={[styles.title, reminder.isCompleted && styles.done]}>{reminder.title}</Text>
                  <Text style={styles.meta}>{formatDate(reminder.scheduledAt)}</Text>
                </View>
                <ReminderBadge label={reminder.type.toLowerCase()} />
                {!reminder.isCompleted ? (
                  <AppButton title="Done" variant="secondary" loading={isSaving} onPress={() => void completeReminder(reminder.id)} />
                ) : null}
              </View>
            ))}
          </View>
        )}
      </AppCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm
  },
  row: {
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  body: {
    gap: 2
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800"
  },
  done: {
    color: colors.muted,
    textDecorationLine: "line-through"
  },
  meta: {
    color: colors.muted,
    fontSize: 13
  }
});

