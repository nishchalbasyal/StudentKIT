import { Alert } from "react-native";
import * as Calendar from "expo-calendar";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { TaskForm } from "../../components/forms/TaskForm";
import { AppScreen } from "../../components/ui/AppScreen";
import { EmptyState } from "../../components/ui/EmptyState";
import { LoadingState } from "../../components/ui/LoadingState";
import { getApiErrorMessage } from "../../api/apiClient";
import { useTasks } from "../../hooks/useTasks";
import type { RootStackParamList } from "../../navigation/types";
import type { TaskInput } from "../../types/task.types";

type Route = RouteProp<RootStackParamList, "AddTask">;
type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function AddTaskScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Navigation>();
  const { tasks, createTask, updateTask, isSaving } = useTasks();
  const editId = route.params?.taskId;
  const duplicateFromId = route.params?.duplicateFromId;
  const sourceTask = tasks.data?.find(
    (task) => task.id === (editId ?? duplicateFromId),
  );
  const initialValues: Partial<TaskInput> | undefined = sourceTask
    ? {
        title: sourceTask.title,
        description: sourceTask.description ?? "",
        type: sourceTask.type,
        dueDate: sourceTask.dueDate ?? undefined,
        priority: sourceTask.priority,
        reminderAt: sourceTask.reminderAt ?? undefined,
        calendarSyncEnabled: duplicateFromId
          ? false
          : sourceTask.calendarSyncEnabled,
        calendarEventId: duplicateFromId
          ? undefined
          : (sourceTask.calendarEventId ?? undefined),
        linkedClassId: sourceTask.linkedClassId ?? undefined,
      }
    : undefined;

  async function handleSubmit(values: TaskInput) {
    try {
      const task = editId
        ? await updateTask({ id: editId, input: values })
        : await createTask(values);

      if (values.calendarSyncEnabled && values.dueDate && !editId) {
        const permission = await Calendar.requestCalendarPermissionsAsync();
        if (!permission.granted) {
          Alert.alert(
            "Calendar permission needed",
            "Task saved, but StudentKit could not add it to your calendar.",
          );
        } else {
          const calendars = await Calendar.getCalendarsAsync(
            Calendar.EntityTypes.EVENT,
          );
          const calendar =
            calendars.find((item) => item.allowsModifications) ?? calendars[0];
          if (calendar) {
            const startDate = new Date(values.dueDate);
            const endDate = new Date(startDate.getTime() + 30 * 60 * 1000);
            const calendarEventId = await Calendar.createEventAsync(
              calendar.id,
              {
                title: values.title,
                notes: values.description,
                startDate,
                endDate,
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              },
            );
            await updateTask({ id: task.id, input: { calendarEventId } });
          }
        }
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert("Could not save task", getApiErrorMessage(error));
    }
  }

  if ((editId || duplicateFromId) && tasks.isLoading) {
    return <LoadingState label="Loading task" />;
  }

  if ((editId || duplicateFromId) && !sourceTask) {
    return (
      <AppScreen title="Task">
        <EmptyState
          title="Task not found"
          message="It may have been deleted or is still loading."
        />
      </AppScreen>
    );
  }

  return (
    <AppScreen
      title={
        editId ? "Edit task" : duplicateFromId ? "Duplicate task" : "Add task"
      }
      subtitle="Add the essentials first. Optional details can stay hidden."
      scroll={false}
      showBack
      onBack={() => navigation.goBack()}
    >
      <TaskForm
        onSubmit={handleSubmit}
        loading={isSaving}
        initialValues={initialValues}
        submitLabel={editId ? "Save Changes" : "Save Task"}
      />
    </AppScreen>
  );
}
