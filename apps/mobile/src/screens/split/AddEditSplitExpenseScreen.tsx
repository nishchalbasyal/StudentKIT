import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { AppButton } from "../../components/ui/AppButton";
import { AppDatePicker } from "../../components/ui/AppDatePicker";
import { EmptyState } from "../../components/ui/EmptyState";
import { LoadingState } from "../../components/ui/LoadingState";
import { colors, fontSize, radius, spacing } from "../../constants/colors";
import { useSplitExpenseDetail, useSplitExpenses, useSplitGroupDetail, useSplitGroups } from "../../hooks/useSplit";
import type { RootStackParamList } from "../../navigation/types";
import type { SplitMember, SplitType } from "../../types/split.types";
import { formatCurrency } from "../../utils/formatCurrency";

type Route = RouteProp<RootStackParamList, "AddSplitExpense">;
type Navigation = NativeStackNavigationProp<RootStackParamList>;

function moneyTextToCents(value: string) {
  const normalized = value.replace(",", ".").trim();
  if (!normalized) return 0;
  return Math.round(Number(normalized) * 100);
}

function centsToText(cents: number) {
  return (cents / 100).toFixed(2);
}

function equalShares(amountCents: number, members: SplitMember[], currentMemberId?: string) {
  if (members.length === 0) return [];
  const ordered = currentMemberId
    ? [...members].sort((a, b) => (a.id === currentMemberId ? -1 : b.id === currentMemberId ? 1 : 0))
    : members;
  const base = Math.floor(amountCents / ordered.length);
  let remainder = amountCents % ordered.length;
  return ordered.map((member) => {
    const extra = remainder > 0 ? 1 : 0;
    remainder -= extra;
    return { memberId: member.id, amountCents: base + extra };
  });
}

export function AddEditSplitExpenseScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Navigation>();
  const groups = useSplitGroups();
  const [selectedGroupId, setSelectedGroupId] = useState(route.params?.groupId);
  const expenseId = route.params?.expenseId;
  const groupId = selectedGroupId;
  const expenseDetail = useSplitExpenseDetail(expenseId);
  const { group, isLoading } = useSplitGroupDetail(groupId);
  const { createExpense, updateExpense, isSaving } = useSplitExpenses(groupId);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [paidByMemberId, setPaidByMemberId] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [splitType, setSplitType] = useState<SplitType>("EQUAL");
  const [notes, setNotes] = useState("");
  const [customShares, setCustomShares] = useState<Record<string, string>>({});

  const amountCents = moneyTextToCents(amount);
  const selectedMembers = useMemo(
    () => (group?.members ?? []).filter((member) => selectedMemberIds.includes(member.id)),
    [group?.members, selectedMemberIds],
  );

  useEffect(() => {
    if (!group) return;
    const currentMember = group.members.find((member) => member.isCurrentUser) ?? group.members[0];
    setPaidByMemberId((current) => current || currentMember?.id || "");
    setSelectedMemberIds((current) => current.length ? current : group.members.map((member) => member.id));
  }, [group]);

  useEffect(() => {
    const expense = expenseDetail.data;
    if (!expense) return;
    setSelectedGroupId(expense.groupId);
    setTitle(expense.title);
    setAmount(centsToText(expense.amountCents));
    setDate(expense.date);
    setPaidByMemberId(expense.paidByMemberId);
    setSelectedMemberIds(expense.shares.map((share) => share.memberId));
    setSplitType(expense.splitType);
    setNotes(expense.notes ?? "");
    setCustomShares(Object.fromEntries(expense.shares.map((share) => [share.memberId, centsToText(share.amountCents)])));
  }, [expenseDetail.data]);

  const shares = useMemo(() => {
    if (splitType === "CUSTOM") {
      return selectedMembers
        .map((member) => ({ memberId: member.id, amountCents: moneyTextToCents(customShares[member.id] ?? "") }))
        .filter((share) => share.amountCents > 0);
    }
    return equalShares(amountCents, selectedMembers, paidByMemberId);
  }, [amountCents, customShares, paidByMemberId, selectedMembers, splitType]);

  if (!groupId) {
    return (
      <SafeAreaView edges={["top"]} style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content}>
          <Header title={expenseId ? "Edit Expense" : "Add Expense"} onBack={() => navigation.goBack()} />
          {(groups.groups ?? []).length === 0 ? (
            <EmptyState
              title="Create a group first"
              message="Shared expenses need a split group and members."
              actionLabel="Create Group"
              onAction={() => navigation.navigate("AddEditSplitGroup")}
            />
          ) : (
            <>
              <EmptyState title="Choose a group first" message="Pick where this shared expense belongs." />
              {(groups.groups ?? []).map((item) => (
                <Pressable key={item.id} style={styles.option} onPress={() => setSelectedGroupId(item.id)}>
                  <Text style={styles.optionText}>{item.name}</Text>
                  <Text style={styles.meta}>{item.members.length} members · {item.currency}</Text>
                </Pressable>
              ))}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (isLoading || (expenseId && expenseDetail.isLoading)) {
    return (
      <SafeAreaView edges={["top"]} style={styles.safe}>
        <LoadingState label="Loading group" />
      </SafeAreaView>
    );
  }

  const submit = async () => {
    if (!group) return;
    if (!title.trim()) return Alert.alert("Title required", "Enter what this expense was for.");
    if (amountCents <= 0) return Alert.alert("Amount required", "Enter a positive amount.");
    if (!paidByMemberId) return Alert.alert("Paid by required", "Choose who paid.");
    if (selectedMemberIds.length === 0) return Alert.alert("Split between", "Choose at least one member.");
    const shareTotal = shares.reduce((sum, share) => sum + share.amountCents, 0);
    if (shareTotal !== amountCents) return Alert.alert("Check shares", "Shares must equal the total amount.");

    const input = {
      title: title.trim(),
      amountCents,
      date,
      paidByMemberId,
      splitType,
      notes: notes.trim() || null,
      shares,
    };
    if (expenseId) {
      await updateExpense({ expenseId, input });
    } else {
      await createExpense(input);
    }
    navigation.replace("SplitGroupDetail", { groupId });
  };

  const toggleMember = (memberId: string) => {
    setSelectedMemberIds((current) =>
      current.includes(memberId)
        ? current.filter((id) => id !== memberId)
        : [...current, memberId],
    );
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Header title={expenseId ? "Edit Expense" : "Add Expense"} onBack={() => navigation.goBack()} />

        <View style={styles.groupBanner}>
          <Text style={styles.groupName}>{group?.name}</Text>
          <Text style={styles.meta}>{group?.members.length} members · {group?.currency}</Text>
        </View>

        <Text style={styles.label}>Title</Text>
        <TextInput value={title} onChangeText={setTitle} placeholder="Party, groceries, rent..." placeholderTextColor={colors.muted} style={styles.input} />

        <Text style={styles.label}>Amount ({group?.currency ?? "EUR"})</Text>
        <TextInput value={amount} onChangeText={setAmount} placeholder="0.00" placeholderTextColor={colors.muted} keyboardType="decimal-pad" style={styles.input} />

        <AppDatePicker label="Date" value={date} onChange={setDate} />

        <Text style={styles.label}>Paid by</Text>
        <View style={styles.chips}>
          {group?.members.map((member) => (
            <Pressable key={member.id} style={[styles.chip, paidByMemberId === member.id && styles.chipActive]} onPress={() => setPaidByMemberId(member.id)}>
              <Text style={[styles.chipText, paidByMemberId === member.id && styles.chipTextActive]}>{member.name}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Split between</Text>
        <View style={styles.memberStack}>
          {group?.members.map((member) => {
            const selected = selectedMemberIds.includes(member.id);
            return (
              <Pressable key={member.id} style={[styles.memberRow, selected && styles.memberRowActive]} onPress={() => toggleMember(member.id)}>
                <Ionicons name={selected ? "checkbox" : "square-outline"} size={22} color={selected ? colors.primary : colors.muted} />
                <Text style={styles.memberName}>{member.name}{member.isCurrentUser ? " · me" : ""}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>Split method</Text>
        <View style={styles.segment}>
          <Segment label="Equal" active={splitType === "EQUAL"} onPress={() => setSplitType("EQUAL")} />
          <Segment label="Custom" active={splitType === "CUSTOM"} onPress={() => setSplitType("CUSTOM")} />
        </View>

        {splitType === "CUSTOM" ? (
          <>
            <Text style={styles.label}>Custom amounts</Text>
            {selectedMembers.map((member) => (
              <View key={member.id} style={styles.shareRow}>
                <Text style={styles.shareName}>{member.name}</Text>
                <TextInput
                  value={customShares[member.id] ?? ""}
                  onChangeText={(value) => setCustomShares((current) => ({ ...current, [member.id]: value }))}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={colors.muted}
                  style={styles.shareInput}
                />
              </View>
            ))}
          </>
        ) : (
          <View style={styles.preview}>
            <Text style={styles.previewLabel}>Equal split preview</Text>
            {shares.map((share) => {
              const member = group?.members.find((item) => item.id === share.memberId);
              return (
                <View key={share.memberId} style={styles.previewRow}>
                  <Text style={styles.previewName}>{member?.name}</Text>
                  <Text style={styles.previewValue}>{formatCurrency(share.amountCents / 100, group?.currency)}</Text>
                </View>
              );
            })}
          </View>
        )}

        <Text style={styles.label}>Notes</Text>
        <TextInput value={notes} onChangeText={setNotes} placeholder="Optional" placeholderTextColor={colors.muted} style={[styles.input, styles.notes]} multiline />

        <AppButton title={expenseId ? "Save Changes" : "Save Expense"} loading={isSaving} disabled={!title.trim() || amountCents <= 0 || !paidByMemberId || selectedMemberIds.length === 0} onPress={submit} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onBack} style={styles.backButton}>
        <Ionicons name="chevron-back" size={24} color={colors.primary} />
      </Pressable>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={{ width: 40 }} />
    </View>
  );
}

function Segment({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.segmentItem, active && styles.segmentActive]}>
      <Text style={[styles.segmentText, active && styles.segmentActiveText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, paddingBottom: 120 },
  header: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backButton: { width: 40, height: 40, justifyContent: "center" },
  headerTitle: { color: colors.text, fontSize: fontSize.title, fontWeight: "900" },
  groupBanner: { borderRadius: radius.lg, backgroundColor: colors.softGreen, padding: spacing.md, gap: 2 },
  groupName: { color: colors.primary, fontSize: fontSize.cardTitle, fontWeight: "900" },
  input: { minHeight: 50, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, color: colors.text, paddingHorizontal: spacing.md, fontSize: fontSize.bodyLarge },
  notes: { minHeight: 84, paddingTop: spacing.md, textAlignVertical: "top" },
  label: { color: colors.text, fontSize: fontSize.body, fontWeight: "800", marginTop: spacing.sm },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontSize: fontSize.body, fontWeight: "700" },
  chipTextActive: { color: "#FFFFFF" },
  memberStack: { gap: spacing.sm },
  memberRow: { minHeight: 50, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: spacing.md, flexDirection: "row", alignItems: "center", gap: spacing.sm },
  memberRowActive: { borderColor: colors.primary, backgroundColor: colors.softGreen },
  memberName: { flex: 1, color: colors.text, fontSize: fontSize.bodyLarge, fontWeight: "700" },
  segment: { height: 46, backgroundColor: colors.surfaceMuted, borderRadius: radius.md, padding: 4, flexDirection: "row", borderWidth: 1, borderColor: colors.border },
  segmentItem: { flex: 1, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  segmentActive: { backgroundColor: colors.surface },
  segmentText: { color: colors.muted, fontSize: fontSize.body, fontWeight: "700" },
  segmentActiveText: { color: colors.primary },
  shareRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  shareName: { flex: 1, color: colors.text, fontSize: fontSize.body, fontWeight: "700" },
  shareInput: { width: 120, minHeight: 44, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, color: colors.text, paddingHorizontal: spacing.md, fontSize: fontSize.body },
  preview: { borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.md, gap: spacing.sm },
  previewLabel: { color: colors.muted, fontSize: fontSize.caption, fontWeight: "800" },
  previewRow: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md },
  previewName: { color: colors.text, fontSize: fontSize.body, fontWeight: "700" },
  previewValue: { color: colors.primary, fontSize: fontSize.body, fontWeight: "900" },
  option: { borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.md, gap: 2 },
  optionText: { color: colors.text, fontSize: fontSize.bodyLarge, fontWeight: "800" },
  meta: { color: colors.muted, fontSize: fontSize.caption, lineHeight: 18 },
});
