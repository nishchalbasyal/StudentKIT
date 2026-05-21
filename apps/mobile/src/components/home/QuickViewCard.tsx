import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppCard } from "../ui/AppCard";
import { colors, fontSize, radius, spacing } from "../../constants/colors";

export type QuickViewCardData = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  stats: string[];
  color: string;
  actions: {
    label: string;
    onPress: () => void;
  }[];
};

type Props = {
  card: QuickViewCardData;
  onOptionsPress?: () => void;
};

export function QuickViewCard({ card, onOptionsPress }: Props) {
  return (
    <View style={[styles.card, { backgroundColor: card.color }]}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.kicker}>{card.title.toUpperCase()}</Text>
          <Text style={styles.subtitle}>{card.subtitle}</Text>
        </View>
        <View style={styles.iconWrapper}>
          <Ionicons name={card.icon as any} size={32} color={colors.primary} />
        </View>
      </View>

      {card.stats.length > 0 && (
        <View style={styles.statList}>
          {card.stats.map((stat, index) => (
            <Text key={index} style={styles.statText}>
              {stat}
            </Text>
          ))}
        </View>
      )}

      <View style={styles.actionRow}>
        {card.actions.map((action, index) => (
          <Pressable
            key={index}
            onPress={action.onPress}
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.actionButtonPressed,
            ]}
          >
            <Text style={styles.actionLabel}>{action.label}</Text>
          </Pressable>
        ))}

        {onOptionsPress && (
          <Pressable
            onPress={onOptionsPress}
            style={({ pressed }) => [
              styles.optionsButton,
              pressed && styles.optionsButtonPressed,
            ]}
          >
            <Ionicons
              name="ellipsis-vertical"
              size={20}
              color={colors.primary}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  headerContent: {
    flex: 1,
  },
  kicker: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  subtitle: {
    color: colors.text,
    fontSize: fontSize.cardTitle,
    fontWeight: "700",
    marginTop: 4,
    lineHeight: 20,
  },
  iconWrapper: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  statList: {
    gap: spacing.xs,
  },
  statText: {
    color: colors.text,
    fontSize: fontSize.bodyLarge,
    fontWeight: "600",
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
  },
  actionButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonPressed: {
    opacity: 0.7,
  },
  actionLabel: {
    color: colors.primary,
    fontSize: fontSize.body,
    fontWeight: "700",
  },
  optionsButton: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  optionsButtonPressed: {
    opacity: 0.7,
  },
});
