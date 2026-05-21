import { Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, shadows, spacing } from "../../constants/colors";

type Props = {
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

export function FloatingActionButton({ icon = "add", onPress }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.fab,
        { bottom: Math.max(insets.bottom, 0) + 82 },
        pressed && styles.pressed,
      ]}
    >
      <Ionicons name={icon} size={28} color="#FFFFFF" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.fab,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.96 }],
  },
});
