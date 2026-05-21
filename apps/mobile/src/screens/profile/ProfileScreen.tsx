import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppButton } from "../../components/ui/AppButton";
import { AppInput } from "../../components/ui/AppInput";
import { AppScreen } from "../../components/ui/AppScreen";
import { AppSelect } from "../../components/ui/AppSelect";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { LoadingState } from "../../components/ui/LoadingState";
import { colors, fontSize, radius, shadows, spacing } from "../../constants/colors";
import { useAuth } from "../../hooks/useAuth";
import { useSettings } from "../../hooks/useSettings";
import { useUserProfile } from "../../hooks/useUserProfile";
import type { StudentStatus } from "../../types/auth.types";
import { formatCurrency } from "../../utils/formatCurrency";

const statusOptions: Array<{ label: string; value: StudentStatus }> = [
  { label: "International", value: "INTERNATIONAL" },
  { label: "EU/EEA/Swiss", value: "EU_EEA_SWISS" },
  { label: "German", value: "GERMAN" },
  { label: "Other", value: "OTHER" },
];

function countryLabel(country?: string | null) {
  if (country?.toUpperCase() === "DE") return "Germany";
  return country?.toUpperCase() ?? "Germany";
}

function statusLabel(status?: StudentStatus) {
  return statusOptions.find((item) => item.value === status)?.label ?? "Student";
}

export function ProfileScreen() {
  const profile = useUserProfile();
  const settings = useSettings();
  const { logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [country, setCountry] = useState("DE");
  const [currency, setCurrency] = useState("EUR");
  const [studentStatus, setStudentStatus] = useState<StudentStatus>("INTERNATIONAL");
  const [hourlyWage, setHourlyWage] = useState("");
  const [yearlyLimit, setYearlyLimit] = useState("140");
  const [university, setUniversity] = useState("");
  const [course, setCourse] = useState("");

  const user = profile.user;
  const summary = profile.summary;
  const workSettings = settings.settings?.work;

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setCountry(user.country || "DE");
    setCurrency(user.currency || "EUR");
    setStudentStatus(user.studentStatus);
    setHourlyWage(user.hourlyWageDefault ? String(user.hourlyWageDefault) : "");
    setUniversity(user.university ?? "");
    setCourse(user.course ?? "");
  }, [user]);

  useEffect(() => {
    if (workSettings?.yearlyWorkLimitDays) {
      setYearlyLimit(String(workSettings.yearlyWorkLimitDays));
    }
  }, [workSettings?.yearlyWorkLimitDays]);

  const initials = useMemo(() => {
    return (user?.name ?? "Student Kit")
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [user?.name]);

  if (profile.isLoading || settings.isLoading) {
    return <LoadingState label="Loading profile" />;
  }

  if (profile.isError || settings.isError) {
    return <ErrorState message="Could not load your profile." onRetry={() => { void profile.refetch(); void settings.refetch(); }} />;
  }

  if (!user) {
    return (
      <AppScreen title="Profile" subtitle="Your account summary.">
        <EmptyState title="Complete your student setup" message="Sign in again to refresh your account details." />
      </AppScreen>
    );
  }

  const save = async () => {
    const parsedWage = hourlyWage.trim() ? Number(hourlyWage) : null;
    const parsedLimit = yearlyLimit.trim() ? Number(yearlyLimit) : undefined;
    if (!name.trim()) return Alert.alert("Name required", "Enter your name.");
    if (parsedWage !== null && (!Number.isFinite(parsedWage) || parsedWage <= 0)) {
      return Alert.alert("Check wage", "Default hourly wage must be a positive number.");
    }
    if (parsedLimit !== undefined && (!Number.isFinite(parsedLimit) || parsedLimit < 1 || parsedLimit > 366)) {
      return Alert.alert("Check work limit", "Yearly work limit must be between 1 and 366 days.");
    }

    await profile.updateProfile({
      name: name.trim(),
      country: country.trim().toUpperCase(),
      currency: currency.trim().toUpperCase(),
      studentStatus,
      hourlyWageDefault: parsedWage,
      yearlyWorkLimitDays: parsedLimit,
      university: university.trim() || null,
      course: course.trim() || null,
    });
    setEditing(false);
  };

  const deleteAccount = () => {
    Alert.alert("Delete account", "This permanently deletes your account and student data.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => void profile.deleteAccount() },
    ]);
  };

  return (
    <AppScreen title="Profile" subtitle="Your account summary.">
      <View style={styles.headerCard}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.meta}>{user.email}</Text>
        <Text style={styles.meta}>{countryLabel(user.country)} - {user.currency}</Text>
        <View style={styles.statusPill}><Text style={styles.statusText}>{statusLabel(user.studentStatus)}</Text></View>
        <AppButton title={editing ? "Cancel Editing" : "Edit Profile"} variant="secondary" icon="create-outline" onPress={() => setEditing((value) => !value)} />
      </View>

      {editing ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Edit Profile</Text>
          <AppInput label="Full name" value={name} onChangeText={setName} />
          <AppInput label="Country code" value={country} onChangeText={setCountry} autoCapitalize="characters" maxLength={2} />
          <AppInput label="Currency" value={currency} onChangeText={setCurrency} autoCapitalize="characters" maxLength={3} />
          <AppSelect label="Student status" value={studentStatus} options={statusOptions} onChange={setStudentStatus} />
          <AppInput label="Default hourly wage" value={hourlyWage} onChangeText={setHourlyWage} keyboardType="decimal-pad" placeholder="14.05" />
          <AppInput label="Yearly work limit days" value={yearlyLimit} onChangeText={setYearlyLimit} keyboardType="number-pad" />
          <AppInput label="University" value={university} onChangeText={setUniversity} placeholder="Optional" />
          <AppInput label="Course" value={course} onChangeText={setCourse} placeholder="Optional" />
          <AppButton title="Save Profile" loading={profile.isSaving} disabled={profile.isSaving} onPress={save} />
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Student Setup</Text>
        <InfoRow label="Work country" value={countryLabel(workSettings?.workCountry ?? user.country)} />
        <InfoRow label="Yearly work limit" value={`${workSettings?.yearlyWorkLimitDays ?? 140} days`} />
        <InfoRow label="Default wage" value={`${formatCurrency(Number(workSettings?.defaultHourlyWage ?? user.hourlyWageDefault ?? 14.05), user.currency)}/h`} />
        <InfoRow label="University" value={user.university || "Optional"} />
        <InfoRow label="Course" value={user.course || "Optional"} last />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Your Progress</Text>
        <View style={styles.statsGrid}>
          <Stat label="Saved" value={formatCurrency(summary?.totalSaved ?? 0, summary?.currency ?? user.currency)} tone="green" />
          <Stat label="Work streak" value={`${summary?.workStreak ?? 0} days`} tone="blue" />
          <Stat label="Expenses" value={`${summary?.expensesTracked ?? 0}`} tone="red" />
          <Stat label="Tasks done" value={`${summary?.tasksCompleted ?? 0}`} tone="blue" />
          <Stat label="Split groups" value={`${summary?.activeSplitGroups ?? 0}`} tone="green" />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Account</Text>
        <ActionRow icon="create-outline" label="Edit Profile" onPress={() => setEditing(true)} />
        <ActionRow icon="link-outline" label="Linked Accounts" onPress={() => Alert.alert("Linked accounts", "No linked accounts yet. Email login is active for this account.")} />
        <ActionRow icon="download-outline" label="Export My Data" onPress={() => Alert.alert("Export my data", "Your export includes profile, settings, tasks, expenses, work entries, and split data.")} />
        <ActionRow icon="shield-checkmark-outline" label="Privacy" onPress={() => Alert.alert("Privacy", "Your data is scoped to your account. Split groups are visible only to group members.")} />
        <ActionRow icon="trash-outline" label="Delete Account" danger onPress={deleteAccount} last />
      </View>

      <AppButton title="Logout" icon="log-out-outline" variant="danger" onPress={() => void logout()} />
    </AppScreen>
  );
}

function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.infoRow, last && styles.last]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: "green" | "blue" | "red" }) {
  const toneStyle = tone === "green" ? styles.green : tone === "blue" ? styles.blue : styles.red;
  return (
    <View style={[styles.stat, toneStyle]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ActionRow({ icon, label, onPress, danger, last }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; danger?: boolean; last?: boolean }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.actionRow, last && styles.last, pressed && styles.pressed]}>
      <Ionicons name={icon} size={21} color={danger ? colors.danger : colors.primary} />
      <Text style={[styles.actionLabel, danger && styles.dangerText]}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headerCard: { borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.xxl, alignItems: "center", gap: spacing.sm, ...shadows.soft },
  avatar: { width: 76, height: 76, borderRadius: 38, backgroundColor: colors.action, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#FFFFFF", fontSize: 24, fontWeight: "900" },
  name: { color: colors.text, fontSize: fontSize.title, fontWeight: "800", textAlign: "center" },
  meta: { color: colors.muted, fontSize: fontSize.body, textAlign: "center" },
  statusPill: { minHeight: 32, borderRadius: radius.pill, paddingHorizontal: spacing.md, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" },
  statusText: { color: colors.primary, fontSize: fontSize.caption, fontWeight: "800" },
  card: { borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.lg, gap: spacing.md, ...shadows.soft },
  sectionTitle: { color: colors.text, fontSize: fontSize.section, fontWeight: "800" },
  infoRow: { minHeight: 42, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  last: { borderBottomWidth: 0 },
  infoLabel: { color: colors.muted, fontSize: fontSize.body, fontWeight: "700", flex: 1 },
  infoValue: { color: colors.text, fontSize: fontSize.body, fontWeight: "800", flex: 1, textAlign: "right" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  stat: { minWidth: "47%", flex: 1, borderRadius: radius.md, padding: spacing.md, gap: 2 },
  green: { backgroundColor: colors.incomeSoft },
  blue: { backgroundColor: colors.infoSoft },
  red: { backgroundColor: colors.dangerSoft },
  statValue: { color: colors.text, fontSize: fontSize.cardTitle, fontWeight: "900" },
  statLabel: { color: colors.muted, fontSize: fontSize.caption, fontWeight: "700" },
  actionRow: { minHeight: 52, flexDirection: "row", alignItems: "center", gap: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  actionLabel: { flex: 1, color: colors.text, fontSize: fontSize.bodyLarge, fontWeight: "700" },
  dangerText: { color: colors.danger },
  pressed: { opacity: 0.78 },
});
