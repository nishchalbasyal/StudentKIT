import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, Vibration, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fontSize, radius, spacing } from "../../constants/colors";

type QuickCaptureAction = {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  actions: QuickCaptureAction[];
  onAddWithAI?: () => void;
};

const examples = [
  "I worked at McDonald's from 9 to 5 with 30 min break",
  "I spent EUR 12.50 at Aldi",
  "Remind me to clean bathroom every Sunday",
  "Add milk and eggs to grocery list"
];

export function QuickCaptureModal({ visible, onClose, actions, onAddWithAI }: Props) {
  const [manualOpen, setManualOpen] = useState(false);

  function close() {
    setManualOpen(false);
    onClose();
  }

  function run(action: QuickCaptureAction) {
    Vibration.vibrate(10);
    close();
    action.onPress();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close}>
        <Pressable style={styles.sheet}>
          <View style={styles.handle} />
          <Pressable accessibilityRole="button" onPress={close} style={styles.closeButton}>
            <Ionicons name="close" size={22} color={colors.text} />
          </Pressable>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <Text style={styles.title}>Quick Add</Text>
            <Text style={styles.subtitle}>Add with AI or manually.</Text>

            <Pressable
              accessibilityRole="button"
              onPress={() => {
                Vibration.vibrate(12);
                close();
                onAddWithAI?.();
              }}
              style={({ pressed }) => [styles.choiceCard, styles.aiCard, pressed && styles.pressed]}
            >
              <View style={styles.iconWrap}>
                <Ionicons name="sparkles-outline" size={28} color={colors.primary} />
              </View>
              <View style={styles.choiceBody}>
                <Text style={styles.choiceTitle}>Add with AI</Text>
                <Text style={styles.choiceText}>Type or say what happened. AI will organize it and ask before saving.</Text>
              </View>
            </Pressable>

            <View style={styles.examples}>
              {examples.map((example) => <Text key={example} style={styles.example}>{example}</Text>)}
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() => {
                Vibration.vibrate(8);
                setManualOpen((value) => !value);
              }}
              style={({ pressed }) => [styles.choiceCard, pressed && styles.pressed]}
            >
              <View style={[styles.iconWrap, styles.manualIcon]}>
                <Ionicons name="list-outline" size={28} color={colors.text} />
              </View>
              <View style={styles.choiceBody}>
                <Text style={styles.choiceTitle}>Add Manually</Text>
                <Text style={styles.choiceText}>Choose what you want to add.</Text>
              </View>
              <Ionicons name={manualOpen ? "chevron-up" : "chevron-down"} size={20} color={colors.muted} />
            </Pressable>

            {manualOpen ? (
              <View style={styles.manualGrid}>
                {actions.map((action) => (
                  <Pressable
                    key={action.id}
                    accessibilityRole="button"
                    onPress={() => run(action)}
                    style={({ pressed }) => [styles.manualAction, pressed && styles.pressed]}
                  >
                    <View style={styles.manualActionIcon}>
                      <Ionicons name={action.icon} size={21} color={colors.primary} />
                    </View>
                    <View style={styles.manualActionBody}>
                      <Text style={styles.manualActionTitle}>{action.title}</Text>
                      <Text style={styles.manualActionSub}>{action.subtitle}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(17,24,39,0.28)"
  },
  sheet: {
    minHeight: "56%",
    maxHeight: "88%",
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl
  },
  scrollContent: {
    gap: spacing.md,
    paddingBottom: spacing.md
  },
  handle: {
    alignSelf: "center",
    width: 60,
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    marginBottom: spacing.lg
  },
  closeButton: {
    position: "absolute",
    right: spacing.lg,
    top: spacing.lg,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center"
  },
  title: {
    color: colors.text,
    fontSize: fontSize.title,
    fontWeight: "700"
  },
  subtitle: {
    color: colors.muted,
    fontSize: fontSize.body,
    lineHeight: 20
  },
  choiceCard: {
    minHeight: 96,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md
  },
  aiCard: {
    borderColor: colors.action,
    backgroundColor: colors.softGreen
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.86
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center"
  },
  manualIcon: {
    backgroundColor: colors.surfaceMuted
  },
  choiceBody: {
    flex: 1,
    gap: 4,
    minWidth: 0
  },
  choiceTitle: {
    color: colors.text,
    fontSize: fontSize.cardTitle,
    fontWeight: "700"
  },
  choiceText: {
    color: colors.muted,
    fontSize: fontSize.caption,
    lineHeight: 18
  },
  examples: {
    gap: spacing.xs
  },
  example: {
    color: colors.muted,
    fontSize: fontSize.caption,
    lineHeight: 18
  },
  manualGrid: {
    gap: spacing.sm
  },
  manualAction: {
    minHeight: 66,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md
  },
  manualActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: colors.softGreen,
    alignItems: "center",
    justifyContent: "center"
  },
  manualActionBody: {
    flex: 1
  },
  manualActionTitle: {
    color: colors.text,
    fontSize: fontSize.bodyLarge,
    fontWeight: "700"
  },
  manualActionSub: {
    color: colors.muted,
    fontSize: fontSize.caption,
    marginTop: 2
  }
});
