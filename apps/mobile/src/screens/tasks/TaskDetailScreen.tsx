import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { CompactActionRow } from "../../components/ui/CompactActionRow";
import { FormSectionCard } from "../../components/ui/FormSectionCard";
import { AppTopBar } from "../../components/ui/AppTopBar";
import { EmptyState } from "../../components/ui/EmptyState";
import { colors, fontSize, radius, spacing } from "../../constants/colors";
import { useTasks } from "../../hooks/useTasks";
import type { RootStackParamList } from "../../navigation/types";
import { formatRelativeDueDate } from "../../utils/formatDate";

type Route = RouteProp<RootStackParamList, "TaskDetail">;
type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function TaskDetailScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Navigation>();
  const insets = useSafeAreaInsets();
  const { tasks, completeTask, deleteTask, isSaving } = useTasks();
  const task = tasks.data?.find((item) => item.id === route.params.taskId);

  if (!task) {
    return (
      <SafeAreaView edges={["top"]} style={styles.safe}>
        <AppTopBar title="Task Detail" />
        <View style={styles.center}>
          <EmptyState
            title="Task not found."
            message="It may have been completed, deleted, or is still loading."
          />
        </View>
      </SafeAreaView>
    );
  }

  const isCompleted = task.status === "COMPLETED";
  const isCancelled = task.status === "CANCELLED";
  const isDone = isCompleted || isCancelled;

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 0) + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <AppTopBar title="Task Detail" />

        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>{task.title}</Text>
            <View style={styles.badgeRow}>
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor:
                      task.priority === "HIGH"
                        ? colors.danger
                        : task.priority === "MEDIUM"
                          ? colors.warning
                          : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    {
                      color:
                        task.priority === "HIGH" || task.priority === "MEDIUM"
                          ? "#FFF"
                          : colors.muted,
                    },
                  ]}
                >
                  {task.priority}
                </Text>
              </View>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: isDone ? colors.border : colors.primary },
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    { color: isDone ? colors.muted : "#FFF" },
                  ]}
                >
                  {isCompleted ? "Done" : isCancelled ? "Cancelled" : "Todo"}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.infoSection}>
            {task.dueDate && (
              <InfoRow
                icon="calendar-outline"
                label="Due"
                value={formatRelativeDueDate(task.dueDate)}
              />
            )}
            {task.type && (
              <InfoRow
                icon="pricetag-outline"
                label="Category"
                value={task.type}
              />
            )}
            {task.description && (
              <View style={styles.descriptionRow}>
                <Text style={styles.descriptionLabel}>Notes</Text>
                <Text style={styles.descriptionText}>{task.description}</Text>
              </View>
            )}
          </View>

          <CompactActionRow
            actions={[
              {
                label: "Complete",
                icon: "checkmark",
                variant: "primary",
                onPress: () =>
                  void completeTask(task.id).then(() => navigation.goBack()),
                disabled: isSaving,
              },
              {
                label: "Edit",
                icon: "create",
                variant: "secondary",
                onPress: () =>
                  navigation.navigate("AddTask", { taskId: task.id }),
                disabled: isSaving,
              },
              {
                label: "Delete",
                icon: "trash",
                variant: "danger",
                onPress: () =>
                  Alert.alert("Delete task?", "This cannot be undone.", [
                    { text: "Cancel" },
                    {
                      text: "Delete",
                      style: "destructive",
                      onPress: () =>
                        void deleteTask(task.id).then(() =>
                          navigation.goBack(),
                        ),
                    },
                  ]),
                disabled: isSaving,
              },
            ]}
          />
        </View>

        <View style={styles.card}>
          <View style={styles.suggestionHeader}>
            <Ionicons name="sparkles" size={20} color={colors.primary} />
            <Text style={styles.suggestionTitle}>AI Suggestion</Text>
          </View>
          <Text style={styles.suggestionText}>
            Want to break this task into smaller study steps?
          </Text>
          <AppButton
            title="Create Subtasks"
            icon="git-branch-outline"
            variant="secondary"
            onPress={() =>
              Alert.alert(
                "Coming soon",
                "Subtasks will help you break down complex tasks.",
              )
            }
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.relatedTitle}>Related Actions</Text>
          <Pressable
            style={({ pressed }) => [
              styles.relatedRow,
              pressed && styles.pressed,
            ]}
            onPress={() =>
              Alert.alert(
                "Add reminder",
                "Set when you want to be reminded about this task.",
              )
            }
          >
            <Ionicons
              name="notifications-outline"
              size={18}
              color={colors.primary}
            />
            <Text style={styles.relatedText}>Add reminder</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.muted} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.relatedRow,
              pressed && styles.pressed,
            ]}
            onPress={() =>
              Alert.alert("Add to calendar", "Save this task to your calendar.")
            }
          >
            <Ionicons
              name="calendar-outline"
              size={18}
              color={colors.primary}
            />
            <Text style={styles.relatedText}>Add to calendar</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.muted} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.relatedRow,
              styles.last,
              pressed && styles.pressed,
            ]}
            onPress={() =>
              navigation.navigate("AddTask", { duplicateFromId: task.id })
            }
          >
            <Ionicons name="copy-outline" size={18} color={colors.primary} />
            <Text style={styles.relatedText}>Duplicate task</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.muted} />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export function ReminderDetailScreen() {
  const route = useRoute<RouteProp<RootStackParamList, "ReminderDetail">>();
  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <AppTopBar title="Reminder Detail" />
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.title}>{route.params?.title ?? "Reminder"}</Text>
          <Text style={styles.copy}>
            Repeat rule, next reminder date, linked routine, edit, delete, mark
            done, and snooze actions live here.
          </Text>
        </View>
        <View style={styles.actionRow}>
          <AppButton
            title="Mark Done"
            icon="checkmark-outline"
            onPress={() => {}}
          />
          <AppButton
            title="Snooze"
            icon="time-outline"
            variant="secondary"
            onPress={() => {}}
          />
          <AppButton
            title="Edit Reminder"
            icon="create-outline"
            variant="secondary"
            onPress={() => {}}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={16} color={colors.muted} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  content: { flex: 1, padding: spacing.lg, gap: spacing.md },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: { gap: spacing.md },
  title: { color: colors.text, fontSize: fontSize.section, fontWeight: "800" },
  copy: { color: colors.text, fontSize: fontSize.body, lineHeight: 20 },
  badgeRow: { flexDirection: "row", gap: spacing.sm },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    fontSize: fontSize.caption,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  infoSection: { gap: spacing.md },
  infoRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  infoLabel: {
    color: colors.muted,
    fontSize: fontSize.caption,
    fontWeight: "600",
    minWidth: 60,
  },
  infoValue: {
    color: colors.text,
    fontSize: fontSize.body,
    fontWeight: "600",
    flex: 1,
  },
  descriptionRow: { gap: spacing.xs },
  descriptionLabel: {
    color: colors.muted,
    fontSize: fontSize.caption,
    fontWeight: "700",
  },
  descriptionText: {
    color: colors.text,
    fontSize: fontSize.body,
    lineHeight: 20,
  },
  suggestionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  suggestionTitle: {
    color: colors.text,
    fontSize: fontSize.bodyLarge,
    fontWeight: "800",
  },
  suggestionText: {
    color: colors.text,
    fontSize: fontSize.body,
    lineHeight: 20,
  },
  relatedTitle: {
    color: colors.text,
    fontSize: fontSize.bodyLarge,
    fontWeight: "800",
    marginBottom: spacing.sm,
  },
  relatedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.md,
    marginHorizontal: -spacing.lg,
  },
  relatedText: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.body,
    fontWeight: "600",
  },
  last: { borderBottomWidth: 0 },
});
