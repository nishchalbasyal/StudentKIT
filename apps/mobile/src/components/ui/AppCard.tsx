import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, fontSize, radius, shadows, spacing } from "../../constants/colors";

type Props = {
  title?: string;
  subtitle?: string;
  children?: ReactNode;
};

export function AppCard({ title, subtitle, children }: Props) {
  return (
    <View style={styles.card}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadows.soft
  },
  title: {
    color: colors.text,
    fontSize: fontSize.cardTitle,
    fontWeight: "700"
  },
  subtitle: {
    color: colors.muted,
    fontSize: fontSize.caption,
    lineHeight: 19
  }
});
