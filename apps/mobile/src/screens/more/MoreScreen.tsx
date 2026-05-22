import { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppHeader } from "../../components/ui/AppHeader";
import { ListRow } from "../../components/ui/ListRow";
import { colors, fontSize, spacing } from "../../constants/colors";
import type { RootStackParamList } from "../../navigation/types";
import {
  moduleOptions,
  modulePreferenceService,
} from "../../services/modulePreferenceService";
import { useAuthStore } from "../../store/authStore";
import type { UserEnabledModules } from "../../storage/settingsStorage";
import { useSettings } from "../../hooks/useSettings";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

const sections = [
  {
    title: "Life",
    items: [
      {
        label: "Groceries",
        subtitle: "Shopping list and price memory",
        icon: "basket-outline" as const,
        route: "Groceries" as const,
      },
      {
        label: "Cleaning",
        subtitle: "Roommate routines and reminders",
        icon: "sparkles-outline" as const,
        route: "Cleaning" as const,
      },
      {
        label: "AI Assistant",
        subtitle: "Ask StudentKit to organize something",
        icon: "chatbubble-ellipses-outline" as const,
        route: "AIAssistant" as const,
      },
    ],
  },
  {
    title: "Discover",
    items: [
      {
        label: "Coupons",
        subtitle: "Verified student offers",
        icon: "pricetag-outline" as const,
        route: "CouponsList" as const,
      },
      {
        label: "Events",
        subtitle: "Campus and city events",
        icon: "calendar-number-outline" as const,
        route: "EventsList" as const,
      },
    ],
  },
  {
    title: "Account",
    items: [
      {
        label: "Settings",
        subtitle: "Notifications, AI, language, work rules",
        icon: "settings-outline" as const,
        route: "Settings" as const,
      },
      {
        label: "Profile",
        subtitle: "Identity, student setup, app summary",
        icon: "person-outline" as const,
        route: "Profile" as const,
      },
    ],
  },
];

export function MoreScreen() {
  const navigation = useNavigation<Navigation>();
  const user = useAuthStore((state) => state.user);
  const settings = useSettings();
  const [modules, setModules] = useState<UserEnabledModules | null>(null);
  const disabledModules = useMemo(
    () =>
      moduleOptions.filter(
        (item) => item.key !== "ai" && Boolean(modules && !modules[item.key]),
      ),
    [modules],
  );
  const visibleSections = useMemo(() => {
    if (!modules) return sections;
    return sections.map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (item.route === "Groceries") return modules.groceries;
        if (item.route === "Cleaning") return modules.cleaning;
        if (item.route === "CouponsList") return modules.coupons;
        if (item.route === "EventsList") return modules.events;
        if (item.route === "AIAssistant") return true;
        return true;
      }),
    }));
  }, [modules]);

  useEffect(() => {
    void modulePreferenceService.get().then(setModules);
  }, []);

  useEffect(() => {
    if (settings.settings?.userEnabledModules) {
      setModules(settings.settings.userEnabledModules);
    }
  }, [settings.settings?.userEnabledModules]);

  const openFeature = (key: keyof UserEnabledModules) => {
    if (key === "money") navigation.navigate("Main", { screen: "Expenses" });
    else if (key === "splits")
      navigation.navigate("Main", { screen: "Splits" });
    else if (key === "tasks") navigation.navigate("Main", { screen: "Tasks" });
    else if (key === "work") navigation.navigate("Main", { screen: "Work" });
    else if (key === "groceries") navigation.navigate("Groceries");
    else if (key === "cleaning") navigation.navigate("Cleaning");
    else if (key === "coupons") navigation.navigate("CouponsList");
    else if (key === "events") navigation.navigate("EventsList");
  };

  const enableFeature = async (key: keyof UserEnabledModules) => {
    try {
      const next = { ...(modules ?? {}), [key]: true } as UserEnabledModules;
      setModules(next);
      await settings.updateModules({ [key]: true });
      openFeature(key);
    } catch {
      Alert.alert(
        "Feature settings",
        "Could not turn on this feature right now.",
      );
    }
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <AppHeader title="More" avatarText={user?.name ?? "ST"} showSettings />
        {disabledModules.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Turn On Features</Text>
            <View style={styles.stack}>
              {disabledModules.map((item) => (
                <ListRow
                  key={item.key}
                  title={item.title}
                  subtitle="Enable and open this feature"
                  icon={item.icon as keyof typeof Ionicons.glyphMap}
                  rightText="On"
                  rightTone="green"
                  showChevron
                  onPress={() => void enableFeature(item.key)}
                />
              ))}
              <ListRow
                title="Manage all modules"
                subtitle="Change your home tabs anytime"
                icon="options-outline"
                showChevron
                onPress={() => navigation.navigate("Settings")}
              />
            </View>
          </View>
        ) : null}
        {visibleSections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.stack}>
              {section.items.map((item) => (
                <ListRow
                  key={item.label}
                  title={item.label}
                  subtitle={item.subtitle}
                  icon={item.icon}
                  showChevron
                  onPress={() => navigation.navigate(item.route)}
                />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 132, gap: spacing.lg },
  section: { gap: spacing.sm },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.section,
    fontWeight: "900",
  },
  stack: { gap: spacing.sm },
});
