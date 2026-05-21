import { StyleSheet, Text, View } from "react-native";
import { AppCard } from "../ui/AppCard";
import { EmptyState } from "../ui/EmptyState";
import { ReminderBadge } from "../ui/ReminderBadge";
import { colors, spacing } from "../../constants/colors";
import type { Reminder } from "../../types/reminder.types";
import { formatShortDate } from "../../utils/formatDate";

export function ReminderCard({ reminders }: { reminders: Reminder[] }) {
  return (
    <AppCard title="Reminders">
      {reminders.length === 0 ? (
        <EmptyState title="No reminders due" message="Nothing urgent is queued for today." />
      ) : (
        <View style={styles.list}>
          {reminders.slice(0, 4).map((reminder) => (
            <View key={reminder.id} style={styles.row}>
              <View style={styles.body}>
                <Text style={styles.title}>{reminder.title}</Text>
                <Text style={styles.meta}>{formatShortDate(reminder.scheduledAt)}</Text>
              </View>
              <ReminderBadge label={reminder.type.toLowerCase()} />
            </View>
          ))}
        </View>
      )}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm
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

