import { StyleSheet, Text, View } from "react-native";
import { AppCard } from "../ui/AppCard";
import { EmptyState } from "../ui/EmptyState";
import { PriorityBadge } from "../ui/PriorityBadge";
import { colors, spacing } from "../../constants/colors";
import type { ClassSchedule } from "../../types/class.types";

export function TodayClassesCard({ classes }: { classes: ClassSchedule[] }) {
  return (
    <AppCard title="Today's classes">
      {classes.length === 0 ? (
        <EmptyState title="No classes today" message="A rare bit of breathing room." />
      ) : (
        <View style={styles.list}>
          {classes.slice(0, 3).map((item) => (
            <View key={item.id} style={styles.row}>
              <View style={styles.body}>
                <Text style={styles.title}>{item.courseName}</Text>
                <Text style={styles.meta}>
                  {item.startTime} - {item.endTime}
                  {item.location ? ` · ${item.location}` : ""}
                </Text>
              </View>
              <PriorityBadge priority={item.priority} />
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

