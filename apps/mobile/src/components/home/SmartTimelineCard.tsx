import { StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../../constants/colors";
import type { Dashboard } from "../../types/dashboard.types";
import type { WorkSummary } from "../../types/work.types";

type TimelineItem = {
  id: string;
  time: string;
  title: string;
  subtitle: string;
};

function buildTimeline(data: Dashboard, workSummary?: WorkSummary | null): TimelineItem[] {
  const items: TimelineItem[] = [];

  for (const classItem of data.todayClasses) {
    items.push({
      id: `class-${classItem.id}`,
      time: classItem.startTime,
      title: classItem.courseName,
      subtitle: classItem.attendanceType.toLowerCase()
    });
  }

  for (const task of data.todayTasks) {
    items.push({
      id: `task-${task.id}`,
      time: task.dueDate && task.dueDate.length > 11 ? task.dueDate.slice(11, 16) : "Today",
      title: task.title,
      subtitle: task.type.toLowerCase()
    });
  }

  for (const shift of workSummary?.shifts ?? []) {
    if (!shift.date.startsWith(data.date)) continue;

    items.push({
      id: `work-${shift.id}`,
      time: shift.startTime,
      title: `${shift.jobName} shift`,
      subtitle: `${shift.calculatedHours}h`
    });
  }

  for (const reminder of data.reminders) {
    items.push({
      id: `reminder-${reminder.id}`,
      time: reminder.scheduledAt.slice(11, 16),
      title: reminder.title,
      subtitle: reminder.type.toLowerCase()
    });
  }

  return items
    .sort((a, b) => a.time.localeCompare(b.time))
    .slice(0, 6);
}

export function SmartTimelineCard({
  dashboard,
  workSummary
}: {
  dashboard: Dashboard;
  workSummary?: WorkSummary | null;
}) {
  const items = buildTimeline(dashboard, workSummary);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Smart Timeline</Text>
      {items.length === 0 ? (
        <Text style={styles.empty}>No timed items today.</Text>
      ) : (
        <View style={styles.list}>
          {items.map((item) => (
            <View key={item.id} style={styles.row}>
              <Text style={styles.time}>{item.time}</Text>
              <View style={styles.dot} />
              <View style={styles.body}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.subtitle}>{item.subtitle}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900"
  },
  list: {
    gap: spacing.sm
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm
  },
  time: {
    width: 48,
    color: colors.muted,
    fontSize: 12,
    fontWeight: "900"
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 999,
    backgroundColor: colors.primary
  },
  body: {
    flex: 1,
    paddingVertical: spacing.xs
  },
  itemTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900"
  },
  subtitle: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2
  },
  empty: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19
  }
});
