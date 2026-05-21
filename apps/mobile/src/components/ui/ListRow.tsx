import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AvatarCircle } from "./AvatarCircle";
import { colors, fontSize, radius, spacing } from "../../constants/colors";

type Props = {
  title: string;
  subtitle?: string | null;
  meta?: string | null;
  icon?: keyof typeof Ionicons.glyphMap;
  avatarText?: string;
  rightText?: string | null;
  rightTone?: "default" | "green" | "red" | "orange" | "blue" | "muted";
  showChevron?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  onOptionsPress?: () => void;
  disabled?: boolean;
};

export function ListRow({
  title,
  subtitle,
  meta,
  icon,
  avatarText,
  rightText,
  rightTone = "default",
  showChevron = false,
  onPress,
  onLongPress,
  onOptionsPress,
  disabled = false,
}: Props) {
  const rightColor =
    rightTone === "green"
      ? colors.primary
      : rightTone === "red"
        ? colors.danger
        : rightTone === "orange"
          ? colors.warning
          : rightTone === "blue"
            ? colors.info
            : rightTone === "muted"
              ? colors.muted
              : colors.text;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed, disabled && styles.disabled]}
    >
      <AvatarCircle
        label={avatarText ?? title}
        icon={icon ? <Ionicons name={icon} size={22} color={colors.primary} /> : undefined}
      />
      <View style={styles.body}>
        <Text numberOfLines={1} style={styles.title}>{title}</Text>
        {subtitle ? <Text numberOfLines={1} style={styles.subtitle}>{subtitle}</Text> : null}
        {meta ? <Text numberOfLines={1} style={styles.meta}>{meta}</Text> : null}
      </View>
      {rightText ? <Text numberOfLines={2} style={[styles.rightText, { color: rightColor }]}>{rightText}</Text> : null}
      {onOptionsPress ? (
        <Pressable
          accessibilityRole="button"
          onPress={onOptionsPress}
          hitSlop={8}
          style={({ pressed }) => [styles.optionsButton, pressed && styles.pressed]}
        >
          <Ionicons name="ellipsis-horizontal" size={20} color={colors.muted} />
        </Pressable>
      ) : showChevron ? (
        <Ionicons name="chevron-forward" size={19} color={colors.muted} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 76,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.rowTitle,
    fontWeight: "800",
  },
  subtitle: {
    color: colors.muted,
    fontSize: fontSize.caption,
    marginTop: 3,
  },
  meta: {
    color: colors.muted,
    fontSize: fontSize.badge,
    marginTop: 2,
  },
  rightText: {
    maxWidth: 96,
    textAlign: "right",
    fontSize: fontSize.body,
    fontWeight: "900",
  },
  optionsButton: {
    width: 30,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.84,
    transform: [{ scale: 0.985 }],
  },
  disabled: {
    opacity: 0.6,
  },
});
