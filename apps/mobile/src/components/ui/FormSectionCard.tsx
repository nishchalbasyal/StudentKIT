import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  colors,
  fontSize,
  radius,
  spacing,
  shadows,
} from "../../constants/colors";

type Props = {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  gap?: "sm" | "md" | "lg";
};

export function FormSectionCard({
  title,
  subtitle,
  children,
  gap = "md",
}: Props) {
  const gapValue =
    gap === "sm" ? spacing.sm : gap === "lg" ? spacing.lg : spacing.md;

  return (
    <View style={styles.card}>
      {title && (
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      )}
      <View style={[styles.content, { gap: gapValue }]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
    ...shadows.soft,
  },
  header: {
    gap: spacing.xs,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.body,
    fontWeight: "700",
  },
  subtitle: {
    color: colors.muted,
    fontSize: fontSize.caption,
    lineHeight: 18,
  },
  content: {
    gap: spacing.md,
  },
});
