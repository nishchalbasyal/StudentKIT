import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ComponentProps } from "react";
import { Ionicons } from "@expo/vector-icons";
import { colors, fontSize, radius, spacing } from "../../constants/colors";

type IconName = ComponentProps<typeof Ionicons>["name"];

export type CompactActionButton = {
  label: string;
  icon?: IconName;
  onPress: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger";
};

type Props = {
  actions: CompactActionButton[];
};

export function CompactActionRow({ actions }: Props) {
  return (
    <View style={styles.row}>
      {actions.map((action, index) => (
        <Pressable
          key={index}
          accessibilityRole="button"
          disabled={action.disabled}
          onPress={action.onPress}
          style={({ pressed }) => [
            styles.button,
            styles[action.variant || "secondary"],
            action.disabled && styles.disabled,
            pressed && !action.disabled && styles.pressed,
          ]}
        >
          <View style={styles.content}>
            {action.icon && (
              <Ionicons
                name={action.icon}
                size={16}
                color={
                  action.variant === "danger"
                    ? colors.danger
                    : action.variant === "primary"
                      ? "#FFF"
                      : colors.primary
                }
              />
            )}
            <Text
              style={[
                styles.label,
                action.variant === "danger" && styles.dangerLabel,
                action.variant === "primary" && styles.primaryLabel,
              ]}
            >
              {action.label}
            </Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
  },
  button: {
    flex: 1,
    minHeight: 40,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  label: {
    fontSize: fontSize.caption,
    fontWeight: "700",
  },
  primaryLabel: {
    color: "#FFF",
  },
  dangerLabel: {
    color: colors.danger,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.primary,
  },
  danger: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.8,
  },
});
