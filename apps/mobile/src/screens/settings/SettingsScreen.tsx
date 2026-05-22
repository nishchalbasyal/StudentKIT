import { useState, type ReactNode } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ComingSoonAIToast } from "../../components/ui/ComingSoonAIToast";
import { AppTopBar } from "../../components/ui/AppTopBar";
import { ErrorState } from "../../components/ui/ErrorState";
import { LoadingState } from "../../components/ui/LoadingState";
import {
  colors,
  fontSize,
  radius,
  shadows,
  spacing,
} from "../../constants/colors";
import { useAuth } from "../../hooks/useAuth";
import { useSettings } from "../../hooks/useSettings";
import { useWorkLimitSettings } from "../../hooks/useWorkLimitSettings";
import { useUserProfile } from "../../hooks/useUserProfile";
import type { RootStackParamList } from "../../navigation/types";
import {
  defaultModules,
  getLocalSettings,
  getOnboardingPreferences,
} from "../../storage/settingsStorage";
import { moduleOptions } from "../../services/modulePreferenceService";
import { requestNotificationPermission } from "../../utils/notifications";
import { describeWorkLimitSettings } from "../../utils/workLimit";
import { defaultWorkLimitSettings } from "../../api/workLimit.api";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function SettingsScreen() {
  const navigation = useNavigation<Navigation>();
  const insets = useSafeAreaInsets();
  const { logout, isAuthenticated } = useAuth();
  const profile = useUserProfile();
  const settingsHook = useSettings();
  const settings = settingsHook.settings;
  const workLimitHook = useWorkLimitSettings();
  const workLimitSettings = workLimitHook.settings;
  const isGuest = !isAuthenticated;
  const [toastVisible, setToastVisible] = useState(false);
  const [debugVisible, setDebugVisible] = useState(false);
  const [debugContent, setDebugContent] = useState<string | null>(null);

  if (settingsHook.isLoading || profile.isLoading || workLimitHook.isLoading) {
    return <LoadingState label="Loading settings" />;
  }

  if (
    settingsHook.isError ||
    profile.isError ||
    workLimitHook.isError ||
    !settings
  ) {
    return (
      <ErrorState
        message="Could not load settings."
        onRetry={() => {
          void settingsHook.refetch();
          void profile.refetch();
          void workLimitHook.refetch();
        }}
      />
    );
  }

  const showToast = () => {
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  };

  const deleteAccount = () => {
    Alert.alert(
      "Delete account",
      "This permanently deletes your account and student data.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => void profile.deleteAccount(),
        },
      ],
    );
  };

  const showStorageDebug = async () => {
    try {
      const local = await getLocalSettings();
      const onboard = await getOnboardingPreferences();
      setDebugContent(JSON.stringify({ local, onboard }, null, 2));
      setDebugVisible(true);
    } catch (err) {
      Alert.alert("Debug", "Could not read storage.");
    }
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 0) + 132 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <AppTopBar title="Settings" avatarText={profile.user?.name ?? "ST"} />

        <Section title="Account" defaultExpanded collapsible={false}>
          <ActionRow
            icon="person-outline"
            label="Personal Information"
            detail="Profile"
            onPress={() => navigation.navigate("Profile")}
          />
          <ActionRow
            icon="lock-closed-outline"
            label="Login & Security"
            detail="Password login active"
            onPress={() =>
              Alert.alert(
                "Login & Security",
                "Email and password login is active. Token refresh is handled securely by the app.",
              )
            }
          />
          <ActionRow
            icon="link-outline"
            label="Linked Accounts"
            detail="None connected"
            onPress={() =>
              Alert.alert(
                "Linked accounts",
                "No linked accounts yet. Email login is connected.",
              )
            }
            last
          />
        </Section>

        <Section title="Notifications" defaultExpanded={false} collapsible>
          <ToggleRow
            label="Push Notifications"
            icon="notifications-outline"
            value={settings.notifications.pushNotifications}
            onValueChange={async (value) => {
              if (value) {
                const granted = await requestNotificationPermission();
                if (!granted) {
                  Alert.alert(
                    "Notifications",
                    "StudentKit will keep reminders in-app until push permission is granted.",
                  );
                }
              }
              await settingsHook.updateNotifications({
                pushNotifications: value,
              });
              showToast();
            }}
          />
          <ToggleRow
            label="Email Updates"
            icon="mail-outline"
            value={settings.notifications.emailUpdates}
            onValueChange={(value) =>
              void settingsHook
                .updateNotifications({ emailUpdates: value })
                .then(showToast)
            }
          />
          <Text style={styles.subsection}>Reminder Categories</Text>
          <ToggleRow
            label="Classes"
            icon="school-outline"
            value={settings.notifications.reminderCategories.classes}
            onValueChange={(value) =>
              void settingsHook
                .updateNotifications({
                  reminderCategories: { classes: value },
                })
                .then(showToast)
            }
          />
          <ToggleRow
            label="Tasks"
            icon="checkmark-circle-outline"
            value={settings.notifications.reminderCategories.tasks}
            onValueChange={(value) =>
              void settingsHook
                .updateNotifications({
                  reminderCategories: { tasks: value },
                })
                .then(showToast)
            }
          />
          <ToggleRow
            label="Work"
            icon="briefcase-outline"
            value={settings.notifications.reminderCategories.work}
            onValueChange={(value) =>
              void settingsHook
                .updateNotifications({
                  reminderCategories: { work: value },
                })
                .then(showToast)
            }
          />
          <ToggleRow
            label="Groceries"
            icon="basket-outline"
            value={settings.notifications.reminderCategories.groceries}
            onValueChange={(value) =>
              void settingsHook
                .updateNotifications({
                  reminderCategories: { groceries: value },
                })
                .then(showToast)
            }
          />
          <ToggleRow
            label="Cleaning"
            icon="sparkles-outline"
            value={settings.notifications.reminderCategories.cleaning}
            onValueChange={(value) =>
              void settingsHook
                .updateNotifications({
                  reminderCategories: { cleaning: value },
                })
                .then(showToast)
            }
          />
          <ToggleRow
            label="Split settlements"
            icon="swap-horizontal-outline"
            value={settings.notifications.reminderCategories.splitSettlements}
            onValueChange={(value) =>
              void settingsHook
                .updateNotifications({
                  reminderCategories: { splitSettlements: value },
                })
                .then(showToast)
            }
            last
          />
        </Section>

        <Section title="App Preferences" defaultExpanded={false} collapsible>
          <ChoiceRow
            label="Theme"
            value={settings.preferences.theme}
            options={["SYSTEM", "LIGHT", "DARK"]}
            onSelect={(theme) =>
              void settingsHook.updatePreferences({ theme }).then(showToast)
            }
          />
          <ChoiceRow
            label="Language"
            value={settings.preferences.language}
            options={["en", "de"]}
            onSelect={(language) =>
              void settingsHook.updatePreferences({ language }).then(showToast)
            }
          />
          <ChoiceRow
            label="Currency"
            value={settings.preferences.currency}
            options={["EUR", "USD", "GBP", "NPR"]}
            onSelect={(currency) =>
              void settingsHook.updatePreferences({ currency }).then(showToast)
            }
          />
          <ChoiceRow
            label="Time format"
            value={settings.preferences.timeFormat}
            options={["24H", "12H"]}
            onSelect={(timeFormat) =>
              void settingsHook
                .updatePreferences({ timeFormat })
                .then(showToast)
            }
            last
          />
        </Section>

        <Section title="AI Settings" defaultExpanded={false} collapsible>
          <ToggleRow
            label="Enable AI suggestions"
            icon="sparkles-outline"
            value={false}
            disabled
            onValueChange={() => showToast()}
          />
          <InfoRow label="AI provider status" value="Coming soon" />
          <ToggleRow
            label="Allow AI form suggestions"
            icon="create-outline"
            value={settings.ai.aiFormSuggestionsAllowed}
            onValueChange={(value) =>
              void settingsHook
                .updateAI({ aiFormSuggestionsAllowed: value })
                .then(showToast)
            }
          />
          <ActionRow
            icon="refresh-outline"
            label="Clear AI suggestions cache"
            detail={
              settings.ai.aiSuggestionsCacheClearedAt ? "Cleared" : "Ready"
            }
            onPress={() =>
              void settingsHook.updateAI({ clearCache: true }).then(showToast)
            }
            last
          />
        </Section>

        <Section title="Work Limit" defaultExpanded collapsible={false}>
          <View style={styles.workCardContent}>
            <ActionRow
              icon="briefcase-outline"
              label="Open work limit settings"
              detail={describeWorkLimitSettings(
                workLimitSettings ?? defaultWorkLimitSettings,
              )}
              onPress={() => navigation.navigate("WorkLimitSettings")}
            />
            <InfoRow
              label="Banner"
              value={
                workLimitSettings?.hasDismissedUnlimitedLimitBanner
                  ? "Dismissed"
                  : "Ready to show"
              }
              last
            />
          </View>
        </Section>

        <Section title="Modules" defaultExpanded collapsible={false}>
          {moduleOptions.map((m) => (
            <ToggleRow
              key={m.key}
              icon={m.icon as keyof typeof Ionicons.glyphMap}
              label={m.title}
              value={(settings.userEnabledModules ?? defaultModules)[m.key]}
              onValueChange={(value) =>
                void settingsHook
                  .updateModules({ [m.key]: value } as any)
                  .then(showToast)
              }
            />
          ))}
        </Section>

        <Section title="Danger Zone" defaultExpanded={false} collapsible>
          <InfoRow label="Mode" value={isGuest ? "Guest mode" : "Logged in"} />
          <InfoRow
            label="Selected modules"
            value={summarizeModules(
              settings.userEnabledModules ?? defaultModules,
            )}
          />
          <ActionRow
            icon="log-out-outline"
            label={isGuest ? "Create Account / Login" : "Logout"}
            detail={profile.user?.name ?? "Account"}
            onPress={() =>
              isGuest
                ? navigation.navigate("Auth", { screen: "Login" })
                : void logout()
            }
          />
          <ActionRow
            icon="bug-outline"
            label="Show Storage Debug"
            detail="View persisted settings & onboarding"
            onPress={() => void showStorageDebug()}
          />
          {!isGuest ? (
            <ActionRow
              icon="trash-outline"
              label="Delete Account"
              detail="Permanent"
              danger
              onPress={deleteAccount}
              last
            />
          ) : null}
        </Section>
      </ScrollView>
      <ComingSoonAIToast visible={toastVisible} message="Settings saved." />
      <Modal visible={debugVisible} animationType="slide">
        <SafeAreaView style={styles.safe}>
          <View style={[styles.card, { flex: 1 }]}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                padding: spacing.md,
              }}
            >
              <Text style={{ fontWeight: "800", fontSize: fontSize.section }}>
                Storage Debug
              </Text>
              <Pressable
                onPress={() => setDebugVisible(false)}
                style={({ pressed }) => [
                  styles.quickButton,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons
                  name="close-outline"
                  size={18}
                  color={colors.primary}
                />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
              <Text
                style={{
                  fontFamily: undefined,
                  color: colors.text,
                  fontSize: fontSize.caption,
                  lineHeight: 18,
                }}
              >
                {debugContent}
              </Text>
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function ToggleRow({
  icon,
  label,
  value,
  onValueChange,
  disabled,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  last?: boolean;
}) {
  return (
    <View style={[styles.row, last && styles.last]}>
      <Ionicons name={icon} size={21} color={colors.primary} />
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

function ActionRow({
  icon,
  label,
  detail,
  onPress,
  danger,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  detail?: string;
  onPress: () => void;
  danger?: boolean;
  last?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        last && styles.last,
        pressed && styles.pressed,
      ]}
    >
      <Ionicons
        name={icon}
        size={21}
        color={danger ? colors.danger : colors.primary}
      />
      <View style={styles.rowBody}>
        <Text style={[styles.rowLabel, danger && styles.dangerText]}>
          {label}
        </Text>
        {detail ? <Text style={styles.detail}>{detail}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
}

function InfoRow({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.row, last && styles.last]}>
      <Ionicons name="server-outline" size={21} color={colors.primary} />
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.detailStrong}>{value}</Text>
    </View>
  );
}

function summarizeModules(modules: Record<string, boolean>) {
  const enabled = Object.entries(modules)
    .filter(([, value]) => value)
    .map(([key]) => key);

  if (enabled.length === 0) return "None";
  if (enabled.length <= 3) return enabled.join(", ");
  return `${enabled.slice(0, 3).join(", ")} +${enabled.length - 3} more`;
}

function Section({
  title,
  children,
  defaultExpanded = true,
  collapsible = false,
}: {
  title: string;
  children: ReactNode;
  defaultExpanded?: boolean;
  collapsible?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const isExpanded = !collapsible || expanded;

  return (
    <View style={styles.section}>
      <Pressable
        accessibilityRole={collapsible ? "button" : undefined}
        onPress={collapsible ? () => setExpanded((value) => !value) : undefined}
        style={({ pressed }) => [
          styles.sectionHeader,
          collapsible && styles.sectionHeaderInteractive,
          pressed && collapsible && styles.pressed,
        ]}
      >
        <Text style={styles.sectionTitle}>{title}</Text>
        {collapsible ? (
          <Ionicons
            name={expanded ? "chevron-up-outline" : "chevron-down-outline"}
            size={18}
            color={colors.muted}
          />
        ) : null}
      </Pressable>
      {isExpanded ? <View style={styles.card}>{children}</View> : null}
    </View>
  );
}

function ChoiceRow<T extends string>({
  label,
  value,
  options,
  onSelect,
  last,
  labels,
}: {
  label: string;
  value: T;
  options: T[];
  onSelect: (value: T) => void;
  last?: boolean;
  labels?: Partial<Record<T, string>>;
}) {
  return (
    <View style={[styles.choiceRow, last && styles.last]}>
      <Text style={styles.choiceLabel}>{label}</Text>
      <View style={styles.choices}>
        {options.map((option) => {
          const active = option === value;
          return (
            <Pressable
              key={option}
              onPress={() => onSelect(option)}
              style={[styles.choice, active && styles.choiceActive]}
            >
              <Text
                style={[styles.choiceText, active && styles.choiceTextActive]}
              >
                {labels?.[option] ?? option}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md },
  section: { gap: spacing.sm },
  sectionHeader: {
    minHeight: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionHeaderInteractive: {
    paddingVertical: spacing.xs,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.section,
    fontWeight: "800",
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: "hidden",
    paddingHorizontal: spacing.lg,
    ...shadows.soft,
  },
  quickButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.softGreen,
  },
  workCardContent: {
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  row: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.sm,
  },
  rowBody: { flex: 1, gap: spacing.xs },
  rowLabel: {
    color: colors.text,
    fontSize: fontSize.bodyLarge,
    fontWeight: "700",
  },
  detail: {
    color: colors.muted,
    fontSize: fontSize.caption,
    fontWeight: "500",
    lineHeight: 16,
  },
  detailStrong: {
    color: colors.primary,
    fontSize: fontSize.body,
    fontWeight: "800",
    flexShrink: 1,
    textAlign: "right",
    textTransform: "capitalize",
  },
  last: { borderBottomWidth: 0 },
  subsection: {
    color: colors.muted,
    fontSize: fontSize.caption,
    fontWeight: "900",
    letterSpacing: 0,
    marginTop: spacing.sm,
    marginBottom: -spacing.xs,
  },
  choiceRow: {
    minHeight: 74,
    justifyContent: "center",
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.sm,
  },
  choiceLabel: {
    color: colors.text,
    fontSize: fontSize.bodyLarge,
    fontWeight: "800",
  },
  choices: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  choice: {
    minHeight: 36,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  choiceActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  choiceText: {
    color: colors.text,
    fontSize: fontSize.caption,
    fontWeight: "800",
  },
  choiceTextActive: { color: "#FFFFFF" },
  helpText: {
    color: colors.muted,
    fontSize: fontSize.caption,
    fontWeight: "700",
    paddingBottom: spacing.md,
  },
  dangerText: { color: colors.danger },
  pressed: { opacity: 0.78 },
});
