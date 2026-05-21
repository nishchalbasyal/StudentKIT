import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppButton } from "../../components/ui/AppButton";
import { AppScreen } from "../../components/ui/AppScreen";
import { colors, fontSize, radius, spacing } from "../../constants/colors";
import { useAuth } from "../../hooks/useAuth";
import type { RootStackParamList } from "../../navigation/types";
import { getOnboardingPreferences } from "../../storage/settingsStorage";
import { modulePreferenceService } from "../../services/modulePreferenceService";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function AuthChoiceScreen() {
  const navigation = useNavigation<Navigation>();
  const { continueAsGuest } = useAuth();

  async function useGuestMode() {
    const preferences = await getOnboardingPreferences();
    await modulePreferenceService.completeOnboarding(preferences.userEnabledModules, true);
    await continueAsGuest();
  }

  async function useAccount() {
    const preferences = await getOnboardingPreferences();
    await modulePreferenceService.completeOnboarding(preferences.userEnabledModules, false);
    navigation.navigate("Auth", { screen: "Login" });
  }

  return (
    <AppScreen title="StudentKit" subtitle="You can use the app without an account.">
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.title}>Do you want to use StudentKit without login?</Text>
          <Text style={styles.copy}>
            Guest mode saves your tasks, reminders, work hours, expenses, groceries,
            cleaning routines, and basic split groups locally on this device.
          </Text>
        </View>
        <AppButton title="Continue as Guest" icon="phone-portrait-outline" onPress={useGuestMode} />
        <AppButton title="Create Account / Login" variant="secondary" icon="person-circle-outline" onPress={useAccount} />
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.xxl },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: { color: colors.text, fontSize: fontSize.title, fontWeight: "900", lineHeight: 30 },
  copy: { color: colors.muted, fontSize: fontSize.body, lineHeight: 21 },
});
