import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fontSize, radius, spacing } from "../../constants/colors";

export type ActionSheetItem = {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  danger?: boolean;
  onPress: () => void;
};

type Props = {
  visible: boolean;
  title: string;
  actions: ActionSheetItem[];
  onClose: () => void;
};

export function ActionSheet({ visible, title, actions, onClose }: Props) {
  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>{title}</Text>
          {actions.map((action) => (
            <Pressable
              key={action.label}
              accessibilityRole="button"
              onPress={() => {
                onClose();
                action.onPress();
              }}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            >
              {action.icon ? (
                <Ionicons name={action.icon} size={22} color={action.danger ? colors.danger : colors.primary} />
              ) : null}
              <Text style={[styles.rowText, action.danger && styles.dangerText]}>{action.label}</Text>
            </Pressable>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: colors.overlay,
  },
  sheet: {
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    backgroundColor: colors.background,
    padding: spacing.xxl,
    gap: spacing.sm,
  },
  handle: {
    alignSelf: "center",
    width: 58,
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.title,
    fontWeight: "900",
    marginBottom: spacing.xs,
  },
  row: {
    minHeight: 56,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  rowText: {
    color: colors.text,
    fontSize: fontSize.bodyLarge,
    fontWeight: "800",
  },
  dangerText: {
    color: colors.danger,
  },
  pressed: {
    opacity: 0.82,
  },
});
