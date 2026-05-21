import type { ComponentProps } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fontSize, radius } from "../../constants/colors";

type IconName = ComponentProps<typeof Ionicons>["name"];

type Props = {
  title: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  loading?: boolean;
  disabled?: boolean;
  icon?: IconName;
};

export function AppButton({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  icon
}: Props) {
  const isDisabled = disabled || loading;
  const isSolid = variant === "primary" || variant === "danger";
  const iconColor = isSolid ? "#FFFFFF" : colors.primary;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        styles[variant],
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed
      ]}
    >
      {loading ? (
        <ActivityIndicator color={iconColor} />
      ) : (
        <View style={styles.content}>
          {icon ? <Ionicons name={icon} size={20} color={iconColor} /> : null}
          <Text style={[styles.label, isSolid && styles.lightLabel]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  primary: {
    backgroundColor: colors.primary
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border
  },
  danger: {
    backgroundColor: colors.danger
  },
  ghost: {
    backgroundColor: "transparent"
  },
  disabled: {
    opacity: 0.55
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.86
  },
  label: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: fontSize.bodyLarge
  },
  lightLabel: {
    color: "#FFFFFF"
  }
});
