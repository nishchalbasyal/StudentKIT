import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AvatarCircle } from "./AvatarCircle";
import { colors, fontSize, spacing } from "../../constants/colors";
import type { RootStackParamList } from "../../navigation/types";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

type Props = {
  title: string;
  avatarText?: string;
  avatarUri?: string | null;
  showBack?: boolean;
  showSettings?: boolean;
  aiTarget?: "AIAssistant" | "AddWithAI";
  onBackPress?: () => void;
  onAvatarPress?: () => void;
  onSearchPress?: () => void;
  onSettingsPress?: () => void;
  onMagicPress?: () => void;
};

export function AppHeader({
  title,
  avatarText = "SK",
  avatarUri,
  showBack = false,
  showSettings = false,
  aiTarget = "AIAssistant",
  onBackPress,
  onAvatarPress,
  onSearchPress,
  onSettingsPress,
  onMagicPress,
}: Props) {
  const navigation = useNavigation<Navigation>();

  return (
    <View style={styles.header}>
      {showBack ? (
        <Pressable
          accessibilityRole="button"
          onPress={onBackPress ?? navigation.goBack}
          style={({ pressed }) => [styles.circleButton, pressed && styles.pressed]}
        >
          <Ionicons name="chevron-back" size={23} color={colors.text} />
        </Pressable>
      ) : (
        <Pressable
          accessibilityRole="button"
          onPress={onAvatarPress ?? (() => navigation.navigate("Profile"))}
          style={({ pressed }) => [styles.avatarButton, pressed && styles.pressed]}
        >
          <AvatarCircle label={avatarText} uri={avatarUri} size={38} />
        </Pressable>
      )}

      <Text numberOfLines={1} style={styles.title}>{title}</Text>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          onPress={onMagicPress ?? (() => navigation.navigate(aiTarget))}
          style={({ pressed }) => [styles.circleButton, pressed && styles.pressed]}
        >
          <Ionicons name="sparkles-outline" size={21} color={colors.primary} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={onSearchPress ?? (() => navigation.navigate("GlobalSearch"))}
          style={({ pressed }) => [styles.circleButton, pressed && styles.pressed]}
        >
          <Ionicons name="search-outline" size={21} color={colors.text} />
        </Pressable>
        {showSettings ? (
          <Pressable
            accessibilityRole="button"
            onPress={onSettingsPress ?? (() => navigation.navigate("Settings"))}
            style={({ pressed }) => [styles.circleButton, pressed && styles.pressed]}
          >
            <Ionicons name="settings-outline" size={21} color={colors.text} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  avatarButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    color: colors.text,
    fontSize: 21,
    fontWeight: "900",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  circleButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.97 }],
  },
});
