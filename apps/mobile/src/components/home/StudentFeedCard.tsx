import { StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../../constants/colors";
import type { StudentFeedItem } from "../../utils/feedEngine";

export function StudentFeedCard({ feed }: { feed: StudentFeedItem[] }) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Student Feed</Text>
        <Text style={styles.subtitle}>Useful, finite, and calm.</Text>
      </View>

      <View style={styles.list}>
        {feed.slice(0, 4).map((item) => (
          <View key={item.id} style={styles.item}>
            <Text style={styles.itemType}>{item.type}</Text>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.message}>{item.message}</Text>
          </View>
        ))}
      </View>
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
  header: {
    gap: 2
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900"
  },
  subtitle: {
    color: colors.muted,
    fontSize: 12
  },
  list: {
    gap: spacing.sm
  },
  item: {
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.surfaceMuted,
    gap: 3
  },
  itemType: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  itemTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900"
  },
  message: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18
  }
});
