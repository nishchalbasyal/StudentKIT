import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fontSize, radius, spacing } from "../../constants/colors";

export function ModuleToggleCard({
  title,
  subtitle,
  icon,
  selected,
  onPress,
}: {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        selected && styles.selected,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.icon, selected && styles.iconSelected]}>
        <Ionicons name={icon} size={22} color={selected ? "#FFFFFF" : colors.primary} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <Ionicons
        name={selected ? "checkmark-circle" : "ellipse-outline"}
        size={24}
        color={selected ? colors.primary : colors.muted}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 76,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  selected: {
    borderColor: colors.primary,
    backgroundColor: colors.softGreen,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.softGreen,
    alignItems: "center",
    justifyContent: "center",
  },
  iconSelected: {
    backgroundColor: colors.primary,
  },
  body: { flex: 1, gap: 2 },
  title: { color: colors.text, fontSize: fontSize.bodyLarge, fontWeight: "900" },
  subtitle: { color: colors.muted, fontSize: fontSize.caption, lineHeight: 17 },
  pressed: { opacity: 0.78 },
});
