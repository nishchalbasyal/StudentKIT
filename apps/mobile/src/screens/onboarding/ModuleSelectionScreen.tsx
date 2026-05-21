import { useState } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppButton } from "../../components/ui/AppButton";
import { AppScreen } from "../../components/ui/AppScreen";
import { ModuleToggleCard } from "../../components/ui/ModuleToggleCard";
import { colors, fontSize, spacing } from "../../constants/colors";
import type { RootStackParamList } from "../../navigation/types";
import { defaultModules, type UserEnabledModules } from "../../storage/settingsStorage";
import { moduleOptions, modulePreferenceService } from "../../services/modulePreferenceService";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function ModuleSelectionScreen() {
  const navigation = useNavigation<Navigation>();
  const [modules, setModules] = useState<UserEnabledModules>({
    ...defaultModules,
    ai: false,
  });

  function toggle(key: keyof UserEnabledModules) {
    setModules((current) => ({
      ...current,
      [key]: key === "ai" ? false : !current[key],
    }));
  }

  async function continueToAuthChoice() {
    await modulePreferenceService.set(modules);
    navigation.navigate("AuthChoice");
  }

  return (
    <AppScreen title="StudentKit" subtitle="Set up the app around what you actually need.">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>What do you want StudentKit to help with?</Text>
        {moduleOptions.map((option) => (
          <ModuleToggleCard
            key={option.key}
            title={option.title}
            subtitle={option.key === "ai" ? "Coming soon. You can turn on everything else now." : option.subtitle}
            icon={option.icon as never}
            selected={modules[option.key]}
            onPress={() => toggle(option.key)}
          />
        ))}
        <Text style={styles.note}>AI is listed for planning, but paid AI calls are disabled for now.</Text>
        <AppButton title="Continue" icon="arrow-forward-outline" onPress={continueToAuthChoice} />
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.xxl },
  title: { color: colors.text, fontSize: fontSize.title, fontWeight: "900", lineHeight: 30 },
  note: { color: colors.muted, fontSize: fontSize.caption, fontWeight: "700", lineHeight: 18 },
});
