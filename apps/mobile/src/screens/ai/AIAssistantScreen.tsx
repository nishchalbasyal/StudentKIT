import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AppButton } from "../../components/ui/AppButton";
import { ComingSoonAIToast } from "../../components/ui/ComingSoonAIToast";
import { AppTopBar } from "../../components/ui/AppTopBar";
import { colors, fontSize, radius, spacing } from "../../constants/colors";
import { useAuthStore } from "../../store/authStore";

const examples = [
  "I worked 5 hours today",
  "I worked at the cafe from 16:00 to 22:00 with a 30 min break",
  "Show me a quick summary of this week's shifts",
  "Help me check if I am close to my work limit",
];

export function AIAssistantScreen() {
  const user = useAuthStore((state) => state.user);
  const [prompt, setPrompt] = useState("");
  const [preview, setPreview] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

  function showComingSoon() {
    setSheetVisible(true);
  }

  function previewPrompt() {
    setPreview(true);
  }

  function savePrompt() {
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
    setPreview(false);
  }

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AppTopBar title="AI Assistant" avatarText={user?.name ?? "ST"} />

        <Text style={styles.sectionTitle}>Work AI</Text>
        <View style={styles.suggestions}>
          <Suggestion label="Shift summary" icon="time-outline" onPress={showComingSoon} />
          <Suggestion label="Work insight" icon="briefcase-outline" onPress={showComingSoon} />
          <Suggestion label="Limit warning" icon="alert-circle-outline" onPress={showComingSoon} />
          <Suggestion label="Weekly recap" icon="calendar-outline" onPress={showComingSoon} />
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>AI is reserved for work-hour help</Text>
          <Text style={styles.copy}>
            The app is trimmed down to work tracking right now. This AI space stays available for future shift parsing, summaries, and work-limit guidance.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Add with AI</Text>
        <View style={styles.addCard}>
          <TextInput
            value={prompt}
            onChangeText={(value) => {
              setPrompt(value);
              setPreview(false);
            }}
            placeholder="Tell me what happened..."
            placeholderTextColor={colors.muted}
            multiline
            style={styles.prompt}
          />
          <View style={styles.exampleRow}>
            {examples.map((example) => (
              <Pressable key={example} onPress={() => setPrompt(example)} style={styles.chip}>
                <Text style={styles.chipText}>{example}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.buttonRow}>
            <AppButton title="Preview" icon="sparkles-outline" onPress={previewPrompt} />
            <Pressable style={styles.voice}><Ionicons name="mic-outline" size={22} color={colors.primary} /></Pressable>
          </View>
        </View>

        {preview ? (
          <View style={styles.previewCard}>
            <Text style={styles.cardTitle}>Does this look correct?</Text>
            <Info label="Type" value="Work Shift" />
            <Info label="Parsed text" value={prompt || "I worked at the bakery from 16:00 to 22:00 with a 30 min break"} />
            <View style={styles.previewActions}>
              <AppButton title="Save" icon="checkmark-outline" onPress={savePrompt} />
              <AppButton title="Edit" variant="secondary" icon="create-outline" onPress={() => setPreview(false)} />
              <AppButton title="Cancel" variant="ghost" onPress={() => setPreview(false)} />
            </View>
          </View>
        ) : null}
      </ScrollView>
      <Modal transparent visible={sheetVisible} animationType="slide" onRequestClose={() => setSheetVisible(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setSheetVisible(false)}>
          <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.sheetTitle}>AI features coming soon</Text>
            <Text style={styles.sheetCopy}>
              StudentKit will later help you turn natural language into work entries, summaries, and work-limit guidance. Manual work logging is ready now.
            </Text>
            <AppButton title="Got it" onPress={() => setSheetVisible(false)} />
          </Pressable>
        </Pressable>
      </Modal>
      <ComingSoonAIToast visible={toastVisible} />
    </SafeAreaView>
  );
}

function Suggestion({ label, icon, onPress }: { label: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.suggestion}>
      <Ionicons name={icon} size={21} color={colors.primary} />
      <Text style={styles.suggestionText}>{label}</Text>
    </Pressable>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.info}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 96, gap: spacing.md },
  sectionTitle: { color: colors.text, fontSize: fontSize.section, fontWeight: "700" },
  suggestions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  suggestion: { minHeight: 42, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, flexDirection: "row", alignItems: "center", gap: spacing.xs },
  suggestionText: { color: colors.text, fontSize: fontSize.caption, fontWeight: "700" },
  error: { color: colors.danger, fontSize: fontSize.body },
  card: { borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.lg, gap: spacing.sm },
  cardTitle: { color: colors.text, fontSize: fontSize.cardTitle, fontWeight: "700" },
  copy: { color: colors.muted, fontSize: fontSize.body, lineHeight: 20 },
  addCard: { borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.lg, gap: spacing.md },
  prompt: { minHeight: 96, color: colors.text, fontSize: fontSize.bodyLarge, textAlignVertical: "top" },
  exampleRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: { borderRadius: radius.pill, backgroundColor: colors.softGreen, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  chipText: { color: colors.primary, fontSize: fontSize.caption, fontWeight: "700" },
  buttonRow: { flexDirection: "row", gap: spacing.sm, alignItems: "center" },
  voice: { width: 50, height: 50, borderRadius: 17, backgroundColor: colors.softGreen, alignItems: "center", justifyContent: "center" },
  previewCard: { borderRadius: radius.xl, borderWidth: 1, borderColor: colors.action, backgroundColor: colors.softGreen, padding: spacing.lg, gap: spacing.md },
  info: { gap: 2 },
  infoLabel: { color: colors.primary, fontSize: fontSize.caption, fontWeight: "800" },
  infoValue: { color: colors.text, fontSize: fontSize.body, lineHeight: 20 },
  previewActions: { gap: spacing.sm }
  ,
  sheetBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.32)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    backgroundColor: colors.surface,
    padding: spacing.xl,
    gap: spacing.md,
  },
  sheetTitle: {
    color: colors.text,
    fontSize: fontSize.title,
    fontWeight: "900",
  },
  sheetCopy: {
    color: colors.muted,
    fontSize: fontSize.body,
    lineHeight: 21,
  },
});
