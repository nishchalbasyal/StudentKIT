import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { AppButton } from "../../components/ui/AppButton";
import { AppScreen } from "../../components/ui/AppScreen";
import { colors, fontSize, radius, spacing } from "../../constants/colors";
import type { RootStackParamList } from "../../navigation/types";
import { modulePreferenceService } from "../../services/modulePreferenceService";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function ModuleSelectionScreen() {
  const navigation = useNavigation<Navigation>();

  async function continueToAuthChoice() {
    await modulePreferenceService.set({ work: true, ai: true });
    navigation.navigate("AuthChoice");
  }

  return (
    <AppScreen
      title="StudentKit"
      subtitle="Built around work hours now, with AI ready in the same flow."
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>What&apos;s included right now</Text>
        <FeatureCard
          icon="briefcase-outline"
          title="Work hours"
          subtitle="Log shifts, track income, manage companies, and monitor work limits."
        />
        <FeatureCard
          icon="sparkles-outline"
          title="AI workspace"
          subtitle="A dedicated AI area is kept in the app, currently focused on future work-hour assistance."
        />
        <Text style={styles.note}>
          Other modules are hidden for now so the app stays focused on working hours.
        </Text>
        <AppButton title="Continue" icon="arrow-forward-outline" onPress={continueToAuthChoice} />
      </ScrollView>
    </AppScreen>
  );
}

function FeatureCard({
  icon,
  title,
  subtitle,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={22} color={colors.primary} />
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.xxl },
  title: { color: colors.text, fontSize: fontSize.title, fontWeight: "900", lineHeight: 30 },
  card: {
    flexDirection: "row",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: "center",
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.softGreen,
  },
  cardBody: { flex: 1, gap: spacing.xs },
  cardTitle: { color: colors.text, fontSize: fontSize.bodyLarge, fontWeight: "800" },
  cardSubtitle: { color: colors.muted, fontSize: fontSize.body, lineHeight: 20 },
  note: { color: colors.muted, fontSize: fontSize.caption, fontWeight: "700", lineHeight: 18 },
});
