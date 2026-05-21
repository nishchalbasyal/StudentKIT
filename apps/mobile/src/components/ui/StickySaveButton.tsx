import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ComponentProps } from "react";
import { Ionicons } from "@expo/vector-icons";
import { colors, fontSize, radius, spacing } from "../../constants/colors";

type IconName = ComponentProps<typeof Ionicons>["name"];

type Props = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: IconName;
  subtitle?: string;
  children?: ReactNode; // Content above button
};

export function StickySaveButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  icon,
  subtitle,
  children,
}: Props) {
  const insets = useSafeAreaInsets();
  const isDisabled = disabled || loading;

  return (
    <View style={styles.container}>
      {children ? <View style={styles.contentArea}>{children}</View> : null}

      <View
        style={[
          styles.sticky,
          {
            paddingBottom: Math.max(insets.bottom, spacing.md),
            paddingHorizontal: spacing.md,
          },
        ]}
      >
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        <Pressable
          accessibilityRole="button"
          disabled={isDisabled}
          onPress={onPress}
          style={({ pressed }) => [
            styles.button,
            isDisabled && styles.disabled,
            pressed && !isDisabled && styles.pressed,
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <View style={styles.content}>
              {icon && <Ionicons name={icon} size={18} color="#FFF" />}
              <Text style={styles.label}>{label}</Text>
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentArea: {
    flex: 1,
  },
  sticky: {
    gap: spacing.sm,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.md,
  },
  subtitle: {
    color: colors.muted,
    fontSize: fontSize.caption,
    lineHeight: 16,
    textAlign: "center",
  },
  button: {
    minHeight: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  label: {
    color: "#FFF",
    fontSize: fontSize.body,
    fontWeight: "700",
  },
  disabled: {
    opacity: 0.55,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.88,
  },
});
