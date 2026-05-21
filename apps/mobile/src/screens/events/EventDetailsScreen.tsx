import { Alert, Linking, StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { RouteProp, useRoute } from "@react-navigation/native";
import { AppButton } from "../../components/ui/AppButton";
import { AppScreen } from "../../components/ui/AppScreen";
import { EmptyState } from "../../components/ui/EmptyState";
import { LoadingState } from "../../components/ui/LoadingState";
import { getEventApi } from "../../api/events.api";
import { colors, fontSize, radius, spacing } from "../../constants/colors";
import type { RootStackParamList } from "../../navigation/types";

type Route = RouteProp<RootStackParamList, "EventDetails">;

export function EventDetailsScreen() {
  const route = useRoute<Route>();
  const eventId = route.params?.eventId;
  const event = useQuery({ queryKey: ["event", eventId], queryFn: () => getEventApi(eventId!), enabled: !!eventId });

  if (!eventId) return <AppScreen title="Event details"><EmptyState title="Choose an event first" message="Open an event from the events list." /></AppScreen>;
  if (event.isLoading) return <AppScreen title="Event details"><LoadingState /></AppScreen>;
  if (!event.data) return <AppScreen title="Event details"><EmptyState title="Event not found" message="This event may no longer be available." /></AppScreen>;

  return (
    <AppScreen title="Event details" subtitle="Save a reminder only after confirming.">
      <View style={styles.image} />
      <View style={styles.card}>
        <Text style={styles.title}>{event.data.title}</Text>
        <Text style={styles.meta}>{new Date(event.data.startsAt).toLocaleString()}</Text>
        <Text style={styles.meta}>{event.data.location ?? "Location TBA"}</Text>
        <Text style={styles.copy}>{event.data.description}</Text>
        <Text style={styles.organizer}>Organizer: {event.data.organizer ?? "Student Kit"}</Text>
        <AppButton title="Save Reminder" icon="notifications-outline" onPress={() => Alert.alert("Save reminder?", "Student Kit will create one reminder for this event.", [{ text: "Cancel" }, { text: "Save" }])} />
        {event.data.url ? <AppButton title="Open Link" icon="open-outline" variant="secondary" onPress={() => void Linking.openURL(event.data!.url!)} /> : null}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  image: { height: 170, borderRadius: radius.xl, backgroundColor: colors.infoSoft },
  card: { borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.lg, gap: spacing.md },
  title: { color: colors.text, fontSize: fontSize.section, fontWeight: "700" },
  meta: { color: colors.muted, fontSize: fontSize.body, fontWeight: "600" },
  copy: { color: colors.text, fontSize: fontSize.body, lineHeight: 21 },
  organizer: { color: colors.primary, fontSize: fontSize.body, fontWeight: "700" },
});
