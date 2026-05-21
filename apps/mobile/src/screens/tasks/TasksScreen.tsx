import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, Vibration, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppHeader } from "../../components/ui/AppHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { FloatingActionButton } from "../../components/ui/FloatingActionButton";
import { ListRow } from "../../components/ui/ListRow";
import { LoadingState } from "../../components/ui/LoadingState";
import { SegmentedTabs } from "../../components/ui/SegmentedTabs";
import { colors, fontSize, radius, spacing } from "../../constants/colors";
import { useReminders } from "../../hooks/useReminders";
import { useTasks } from "../../hooks/useTasks";
import type { RootStackParamList } from "../../navigation/types";
import { useAuthStore } from "../../store/authStore";
import type { Reminder } from "../../types/reminder.types";
import type { StudentTask } from "../../types/task.types";
import { formatShortDate } from "../../utils/formatDate";

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type Tab = "today" | "upcoming" | "reminders" | "completed";

const tabs = [
  { key: "today", label: "Today" },
  { key: "upcoming", label: "Upcoming" },
  { key: "reminders", label: "Reminders" },
  { key: "completed", label: "Completed" },
] as const;

const taskIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  HOMEWORK: "book-outline",
  ASSIGNMENT: "document-text-outline",
  EXAM: "school-outline",
  PERSONAL: "person-outline",
  WORK: "briefcase-outline",
  OTHER: "checkmark-circle-outline",
};

const reminderIcons: Record<Reminder["type"], keyof typeof Ionicons.glyphMap> = {
  CLASS: "school-outline",
  TASK: "checkmark-circle-outline",
  GROCERY: "basket-outline",
  CLEANING: "sparkles-outline",
  WORK: "briefcase-outline",
  EXPENSE: "wallet-outline",
  AI: "sparkles-outline",
  CUSTOM: "notifications-outline",
};

export function TasksScreen() {
  const navigation = useNavigation<Navigation>();
  const user = useAuthStore((state) => state.user);
  const { tasks, completeTask, deleteTask, isSaving } = useTasks();
  const { reminders, completeReminder, isSaving: reminderSaving } = useReminders();
  const [tab, setTab] = useState<Tab>("today");

  const grouped = useMemo(() => groupTasks(tasks.data ?? []), [tasks.data]);

  if (tasks.isLoading || reminders.isLoading) {
    return <SafeAreaView style={styles.safe}><LoadingState label="Loading tasks" /></SafeAreaView>;
  }

  if (tasks.isError || reminders.isError) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ErrorState
            message="Could not load tasks."
            onRetry={() => {
              void tasks.refetch();
              void reminders.refetch();
            }}
          />
        </View>
      </SafeAreaView>
    );
  }

  const activeTasks = tab === "today" ? grouped.today : tab === "upcoming" ? grouped.upcoming : tab === "completed" ? grouped.completed : [];

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AppHeader title="Tasks" avatarText={user?.name ?? "ST"} showSettings />
        <SegmentedTabs tabs={tabs} value={tab} onChange={setTab} />

        {tab === "reminders" ? (
          <ReminderList
            items={(reminders.data ?? []).filter((item) => !item.isCompleted)}
            completeReminder={completeReminder}
            disabled={reminderSaving}
            navigation={navigation}
          />
        ) : (
          <TaskList
            items={activeTasks}
            completeTask={completeTask}
            deleteTask={deleteTask}
            disabled={isSaving}
            navigation={navigation}
            emptyTitle={tab === "completed" ? "No completed tasks yet" : tab === "upcoming" ? "No upcoming tasks" : "No tasks for today"}
          />
        )}
      </ScrollView>

      <FloatingActionButton onPress={() => navigation.navigate("AddTask")} />
    </SafeAreaView>
  );
}

function TaskList({
  items,
  completeTask,
  deleteTask,
  disabled,
  navigation,
  emptyTitle,
}: {
  items: StudentTask[];
  completeTask: (id: string) => Promise<StudentTask>;
  deleteTask: (id: string) => Promise<{ id: string }>;
  disabled: boolean;
  navigation: Navigation;
  emptyTitle: string;
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        message="Capture the next thing before it has to live in your head."
        actionLabel="Add Task"
        onAction={() => navigation.navigate("AddTask")}
      />
    );
  }

  const done = (id: string) => {
    Vibration.vibrate(10);
    void completeTask(id);
  };

  const showActions = (task: StudentTask) => {
    Alert.alert(task.title, "Choose an action", [
      { text: "View", onPress: () => navigation.navigate("TaskDetail", { taskId: task.id }) },
      { text: "Mark Complete", onPress: () => done(task.id) },
      { text: "Edit", onPress: () => navigation.navigate("AddTask", { taskId: task.id }) },
      { text: "Duplicate", onPress: () => navigation.navigate("AddTask", { duplicateFromId: task.id }) },
      { text: "Delete", style: "destructive", onPress: () => void deleteTask(task.id) },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <View style={styles.stack}>
      {items.map((task) => (
          <Pressable
          key={task.id}
          disabled={disabled}
          onPress={() => navigation.navigate("TaskDetail", { taskId: task.id })}
          onLongPress={() => showActions(task)}
          style={({ pressed }) => [styles.taskRow, pressed && styles.pressed, disabled && styles.disabled]}
        >
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: task.status === "COMPLETED" }}
            onPress={() => done(task.id)}
            style={[styles.checkBox, task.status === "COMPLETED" && styles.checkBoxDone]}
          >
            {task.status === "COMPLETED" ? <Ionicons name="checkmark" size={18} color="#FFFFFF" /> : null}
          </Pressable>
          <View style={styles.taskBody}>
            <Text numberOfLines={1} style={styles.taskTitle}>{task.title}</Text>
            <Text numberOfLines={1} style={styles.taskMeta}>
              {humanize(task.type)} · {task.dueDate ? formatShortDate(task.dueDate) : "No due date"}
            </Text>
          </View>
          <View style={[styles.priorityBadge, priorityStyle(task.priority)]}>
            <Text style={styles.priorityText}>{humanize(task.priority)}</Text>
          </View>
          <Pressable onPress={() => showActions(task)} hitSlop={8} style={styles.optionsButton}>
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.muted} />
          </Pressable>
        </Pressable>
      ))}
    </View>
  );
}

function ReminderList({
  items,
  completeReminder,
  disabled,
  navigation,
}: {
  items: Reminder[];
  completeReminder: (id: string) => Promise<Reminder>;
  disabled: boolean;
  navigation: Navigation;
}) {
  if (items.length === 0) {
    return <EmptyState title="No reminders" message="Reminders from tasks, groceries, cleaning, work, and AI will appear here." actionLabel="Add Reminder" onAction={() => navigation.navigate("AddTask")} />;
  }

  return (
    <View style={styles.stack}>
      {items.map((reminder) => (
        <ListRow
          key={reminder.id}
          icon={reminderIcons[reminder.type]}
          title={reminder.title}
          subtitle={reminder.message ?? humanize(reminder.type)}
          meta={formatShortDate(reminder.scheduledAt)}
          rightText="Done"
          rightTone="green"
          disabled={disabled}
          onPress={() => navigation.navigate("ReminderDetail", { reminderId: reminder.id, title: reminder.title })}
          onOptionsPress={() => void completeReminder(reminder.id)}
          onLongPress={() => void completeReminder(reminder.id)}
        />
      ))}
    </View>
  );
}

function groupTasks(tasks: StudentTask[]) {
  const today = new Date().toISOString().slice(0, 10);
  const active = tasks.filter((task) => task.status !== "CANCELLED");
  return {
    today: active.filter((task) => task.status !== "COMPLETED" && (task.dueDate?.startsWith(today) || !task.dueDate)),
    upcoming: active.filter((task) => task.status !== "COMPLETED" && task.dueDate && !task.dueDate.startsWith(today)),
    completed: active.filter((task) => task.status === "COMPLETED"),
  };
}

function priorityStyle(priority: string) {
  if (priority === "HIGH") return { backgroundColor: colors.dangerSoft };
  if (priority === "MEDIUM") return { backgroundColor: colors.warningSoft };
  return { backgroundColor: colors.softGreen };
}

function humanize(value: string) {
  return value.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: "center", padding: spacing.lg },
  content: { padding: spacing.lg, paddingBottom: 132, gap: spacing.md },
  stack: { gap: spacing.sm },
  taskRow: {
    minHeight: 76,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  checkBox: {
    width: 27,
    height: 27,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  checkBoxDone: { backgroundColor: colors.primary },
  taskBody: { flex: 1, minWidth: 0 },
  taskTitle: { color: colors.text, fontSize: fontSize.rowTitle, fontWeight: "800" },
  taskMeta: { color: colors.muted, fontSize: fontSize.caption, marginTop: 3 },
  priorityBadge: { borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  priorityText: { color: colors.text, fontSize: fontSize.badge, fontWeight: "900" },
  optionsButton: { width: 28, height: 34, alignItems: "center", justifyContent: "center" },
  pressed: { opacity: 0.84, transform: [{ scale: 0.985 }] },
  disabled: { opacity: 0.6 },
});
