import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fontSize, radius, spacing } from "../../constants/colors";

export function EmptyState({
  title,
  message,
  actionLabel,
  onAction
}: {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.state}>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {actionLabel ? (
        <Pressable accessibilityRole="button" onPress={onAction} style={styles.action}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  state: {
    minHeight: 136,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface
  },
  title: {
    color: colors.text,
    fontSize: fontSize.cardTitle,
    fontWeight: "700",
    textAlign: "center"
  },
  message: {
    color: colors.muted,
    fontSize: fontSize.body,
    lineHeight: 20,
    textAlign: "center"
  },
  action: {
    minHeight: 42,
    borderRadius: radius.pill,
    backgroundColor: colors.softGreen,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xs
  },
  actionText: {
    color: colors.primary,
    fontSize: fontSize.body,
    fontWeight: "800"
  }
});
