import { Pressable, StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppButton } from "../../components/ui/AppButton";
import { AppScreen } from "../../components/ui/AppScreen";
import { LoadingState } from "../../components/ui/LoadingState";
import { getEventsApi } from "../../api/events.api";
import { colors, fontSize, radius, spacing } from "../../constants/colors";
import type { RootStackParamList } from "../../navigation/types";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function EventsListScreen() {
  const navigation = useNavigation<Navigation>();
  const events = useQuery({ queryKey: ["events"], queryFn: getEventsApi });

  return (
    <AppScreen title="Events" subtitle="Public events are provided by admin or trusted sources.">
      {events.isLoading ? <LoadingState /> : (events.data ?? []).length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No events near you right now</Text>
          <Text style={styles.emptyText}>Events will appear here when available.</Text>
          <AppButton title="Refresh" variant="secondary" icon="calendar-outline" onPress={() => void events.refetch()} />
        </View>
      ) : (events.data ?? []).map((event) => (
        <Pressable key={event.id} accessibilityRole="button" onPress={() => navigation.navigate("EventDetails", { eventId: event.id })} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
          <View style={styles.image} />
          <View style={styles.body}>
            <Text style={styles.title}>{event.title}</Text>
            <Text style={styles.meta}>{new Date(event.startsAt).toLocaleString()} · {event.location ?? "Location TBA"}</Text>
            <Text style={styles.desc}>{event.description}</Text>
          </View>
        </Pressable>
      ))}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, overflow: "hidden" },
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.88 },
  image: { height: 104, backgroundColor: colors.infoSoft },
  body: { padding: spacing.lg, gap: spacing.xs },
  title: { color: colors.text, fontSize: fontSize.cardTitle, fontWeight: "700" },
  meta: { color: colors.muted, fontSize: fontSize.caption, fontWeight: "600" },
  desc: { color: colors.text, fontSize: fontSize.body, lineHeight: 20 },
  empty: { borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.xxl, alignItems: "center", gap: spacing.sm },
  emptyTitle: { color: colors.text, fontSize: fontSize.cardTitle, fontWeight: "700", textAlign: "center" },
  emptyText: { color: colors.muted, fontSize: fontSize.body, textAlign: "center" },
});
