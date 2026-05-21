import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ComponentProps } from "react";
import { Ionicons } from "@expo/vector-icons";
import { colors, fontSize, radius, spacing } from "../../constants/colors";

type IconName = ComponentProps<typeof Ionicons>["name"];

type Props = {
  icon?: IconName;
  label: string;
  value: string | null;
  placeholder?: string;
  onPress: () => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
};

export function DateTimeField({
  icon = "calendar-outline",
  label,
  value,
  placeholder,
  onPress,
  error,
  disabled = false,
  required = false,
}: Props) {
  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.field,
          error && styles.error,
          disabled && styles.disabled,
          pressed && !disabled && styles.pressed,
        ]}
      >
        <View style={styles.content}>
          {icon && (
            <Ionicons
              name={icon}
              size={18}
              color={colors.muted}
              style={styles.icon}
            />
          )}
          <View style={styles.textBlock}>
            <Text style={styles.label}>
              {label}
              {required && <Text style={styles.required}> *</Text>}
            </Text>
            <Text style={[styles.value, !value && styles.placeholder]}>
              {value || placeholder || "Select"}
            </Text>
          </View>
        </View>
        <Ionicons
          name="chevron-forward"
          size={18}
          color={colors.muted}
          style={styles.chevron}
        />
      </Pressable>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  field: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 48,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  icon: {
    marginTop: 2,
  },
  textBlock: {
    flex: 1,
    gap: 2,
  },
  label: {
    color: colors.muted,
    fontSize: fontSize.caption,
    fontWeight: "600",
  },
  required: {
    color: colors.danger,
  },
  value: {
    color: colors.text,
    fontSize: fontSize.body,
    fontWeight: "700",
  },
  placeholder: {
    color: colors.muted,
    fontWeight: "600",
  },
  chevron: {
    marginLeft: spacing.sm,
  },
  error: {
    borderColor: colors.danger,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    backgroundColor: colors.softGreen,
  },
  errorText: {
    color: colors.danger,
    fontSize: fontSize.caption,
    fontWeight: "600",
    paddingHorizontal: spacing.md,
  },
});
