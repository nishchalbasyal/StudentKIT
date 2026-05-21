export { SplitGroupDetailScreen } from "./SplitGroupDetailScreen";
export { AddEditSplitExpenseScreen as AddSplitExpenseScreen } from "./AddEditSplitExpenseScreen";

import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { AppButton } from "../../components/ui/AppButton";
import { AppDatePicker } from "../../components/ui/AppDatePicker";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { LoadingState } from "../../components/ui/LoadingState";
import { colors, fontSize, radius, spacing } from "../../constants/colors";
import { splitApi } from "../../api/split.api";
import { usersApi } from "../../api/users.api";
import {
  useSplitExpenseDetail,
  useSplitExpenses,
  useSplitFriendDetail,
  useSplitGroupDetail,
  useSplitGroups,
  useSplitSettlement,
} from "../../hooks/useSplit";
import type { RootStackParamList } from "../../navigation/types";
import type { SearchUserResult } from "../../api/users.api";
import type { SplitMember } from "../../types/split.types";
import { formatCurrency } from "../../utils/formatCurrency";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

function moneyTextToCents(value: string) {
  return Math.round(Number(value.replace(",", ".") || 0) * 100);
}

export function AddEditSplitGroupScreen() {
  const route = useRoute<RouteProp<RootStackParamList, "AddEditSplitGroup">>();
  const navigation = useNavigation<Navigation>();
  const groupId = route.params?.groupId;
  const { group, updateGroup, isSaving } = useSplitGroupDetail(groupId);
  const { createGroup } = useSplitGroups();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [members, setMembers] = useState<Array<{ name: string; email?: string | null; userId?: string | null; isRegisteredUser?: boolean }>>([]);

  useEffect(() => {
    if (!group) return;
    setName(group.name);
    setDescription(group.description ?? "");
    setCurrency(group.currency);
    setMembers(group.members.map((member) => ({
      name: member.name,
      email: member.email,
      userId: member.userId,
      isRegisteredUser: member.isRegisteredUser,
    })));
  }, [group]);

  const save = async () => {
    if (!name.trim()) return Alert.alert("Group name required", "Enter a split group name.");

    if (groupId) {
      await updateGroup({ name: name.trim(), description: description.trim() || null, currency: currency.trim().toUpperCase() || "EUR" });
      navigation.replace("SplitGroupDetail", { groupId });
      return;
    }

    const created = await createGroup({
      name: name.trim(),
      description: description.trim() || null,
      currency: currency.trim().toUpperCase() || "EUR",
      members,
    });
    navigation.replace("SplitGroupDetail", { groupId: created.id });
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Header title={groupId ? "Edit Group" : "Create Group"} onBack={() => navigation.goBack()} />
        <Text style={styles.label}>Group name</Text>
        <TextInput value={name} onChangeText={setName} placeholder="House party, rent, trip..." placeholderTextColor={colors.muted} style={styles.input} />
        <Text style={styles.label}>Description</Text>
        <TextInput value={description} onChangeText={setDescription} placeholder="Optional" placeholderTextColor={colors.muted} style={styles.input} />
        <Text style={styles.label}>Currency</Text>
        <TextInput value={currency} onChangeText={setCurrency} placeholder="EUR" placeholderTextColor={colors.muted} autoCapitalize="characters" style={styles.input} />
        {!groupId ? (
          <MemberBuilder members={members} onChange={setMembers} />
        ) : (
          <AppButton title="Manage Members" variant="secondary" icon="people-outline" onPress={() => navigation.navigate("SplitGroupSettings", { groupId })} />
        )}
        <AppButton title={groupId ? "Save Group" : "Create Group"} loading={isSaving} onPress={save} />
      </ScrollView>
    </SafeAreaView>
  );
}

function MemberBuilder({
  members,
  onChange,
}: {
  members: Array<{ name: string; email?: string | null; userId?: string | null; isRegisteredUser?: boolean }>;
  onChange: (members: Array<{ name: string; email?: string | null; userId?: string | null; isRegisteredUser?: boolean }>) => void;
}) {
  const [manualName, setManualName] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUserResult[]>([]);
  const searchMutation = useMutation({
    mutationFn: (q: string) => usersApi.searchUsers(q),
    onSuccess: setSearchResults,
  });

  useEffect(() => {
    if (searchQuery.trim().length >= 2) searchMutation.mutate(searchQuery.trim());
    else setSearchResults([]);
  }, [searchQuery]);

  const addRegistered = (user: SearchUserResult) => {
    if (members.some((member) => member.userId === user.id || member.email === user.email)) return;
    onChange([...members, { name: user.name, email: user.email, userId: user.id, isRegisteredUser: true }]);
    setSearchQuery("");
    setSearchResults([]);
  };

  const addManual = () => {
    if (!manualName.trim()) return Alert.alert("Name required", "Enter the member's name.");
    onChange([...members, { name: manualName.trim(), email: manualEmail.trim() || null, isRegisteredUser: false }]);
    setManualName("");
    setManualEmail("");
  };

  return (
    <>
      <Text style={styles.label}>Members</Text>
      {members.map((member, index) => (
        <View key={`${member.name}-${index}`} style={styles.memberItem}>
          <View style={styles.rowBody}>
            <Text style={styles.rowTitle}>{member.name}</Text>
            <Text style={styles.meta}>{member.email || "Manual member"}{member.isRegisteredUser ? " · Registered user" : ""}</Text>
          </View>
          <Pressable onPress={() => onChange(members.filter((_, i) => i !== index))}>
            <Ionicons name="close" size={20} color={colors.danger} />
          </Pressable>
        </View>
      ))}
      <TextInput value={searchQuery} onChangeText={setSearchQuery} placeholder="Search email, username, or name" placeholderTextColor={colors.muted} style={styles.input} />
      {searchResults.map((user) => (
        <Pressable key={user.id} style={styles.memberItem} onPress={() => addRegistered(user)}>
          <View style={styles.rowBody}>
            <Text style={styles.rowTitle}>{user.name}</Text>
            <Text style={styles.meta}>{user.email} · Registered user</Text>
          </View>
          <Ionicons name="add-circle" size={22} color={colors.primary} />
        </Pressable>
      ))}
      {searchQuery.trim().length >= 2 ? (
        <Pressable style={styles.memberItem} onPress={() => {
          setManualName(searchQuery.trim());
          setSearchQuery("");
          setSearchResults([]);
        }}>
          <Text style={styles.rowTitle}>Add "{searchQuery.trim()}" as manual member</Text>
        </Pressable>
      ) : null}
      <Text style={styles.label}>Manual member</Text>
      <TextInput value={manualName} onChangeText={setManualName} placeholder="Name" placeholderTextColor={colors.muted} style={styles.input} />
      <TextInput value={manualEmail} onChangeText={setManualEmail} placeholder="Email optional" placeholderTextColor={colors.muted} autoCapitalize="none" keyboardType="email-address" style={styles.input} />
      <AppButton title="Add Manual Member" icon="person-add-outline" variant="secondary" onPress={addManual} />
    </>
  );
}

export function SplitGroupSettingsScreen() {
  const route = useRoute<RouteProp<RootStackParamList, "SplitGroupSettings">>();
  const navigation = useNavigation<Navigation>();
  const groupId = route.params?.groupId;
  const { group, addMember, removeMember, isSaving } = useSplitGroupDetail(groupId);

  if (!groupId) {
    return <EmptyShell title="Choose a group first" onAction={() => navigation.navigate("Main", { screen: "Splits" })} />;
  }
  if (!group) {
    return (
      <SafeAreaView edges={["top"]} style={styles.safe}>
        <LoadingState label="Loading settings" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Header title="Group Settings" onBack={() => navigation.goBack()} />
        <Text style={styles.titleSmall}>{group.name}</Text>
        <MemberBuilder
          members={[]}
          onChange={(next) => {
            const member = next[next.length - 1];
            if (member) void addMember(member);
          }}
        />
        <Text style={styles.section}>Current members</Text>
        {group.members.map((member) => (
          <View key={member.id} style={styles.memberItem}>
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>{member.name}{member.isCurrentUser ? " · me" : ""}</Text>
              <Text style={styles.meta}>{member.email || "Manual member"}{member.isRegisteredUser ? " · Registered user" : ""}</Text>
            </View>
            {!member.isCurrentUser ? (
              <Pressable disabled={isSaving} onPress={() => void removeMember(member.id)}>
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
              </Pressable>
            ) : null}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

export function SplitExpenseDetailScreen() {
  const route = useRoute<RouteProp<RootStackParamList, "SplitExpenseDetail">>();
  const navigation = useNavigation<Navigation>();
  const expenseId = route.params?.expenseId;
  const expense = useSplitExpenseDetail(expenseId);
  const groupId = expense.data?.groupId;
  const expenses = useSplitExpenses(groupId);

  if (!expenseId) return <EmptyShell title="Choose an expense first" onAction={() => navigation.navigate("Main", { screen: "Splits" })} />;
  if (expense.isLoading) return <LoadingShell label="Loading expense" />;
  if (expense.isError || !expense.data) return <ErrorShell message="Could not load expense." />;

  const item = expense.data;
  const currency = item.group?.currency ?? item.currency ?? "EUR";

  const deleteExpense = () => {
    Alert.alert(item.title, "Delete this split expense?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        await expenses.deleteExpense(item.id);
        navigation.navigate("SplitGroupDetail", { groupId: item.groupId });
      } },
    ]);
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Header title="Expense" onBack={() => navigation.goBack()} />
        <View style={styles.heroCard}>
          <Text style={styles.titleSmall}>{item.title}</Text>
          <Text style={styles.heroAmount}>{formatCurrency(item.amountCents / 100, currency)}</Text>
          <Text style={styles.meta}>Paid by {item.paidBy?.name ?? "Unknown"} · {item.date}</Text>
        </View>
        <Text style={styles.section}>Split {item.splitType.toLowerCase()}</Text>
        {item.shares.map((share) => (
          <View key={share.memberId} style={styles.memberItem}>
            <Text style={styles.rowTitle}>{share.member?.name}</Text>
            <Text style={styles.amount}>{formatCurrency(share.amountCents / 100, currency)}</Text>
          </View>
        ))}
        <Text style={styles.section}>Balance</Text>
        {(item.balanceEffect ?? []).length === 0 ? (
          <Text style={styles.mutedCard}>No one owes anything for this expense.</Text>
        ) : (
          item.balanceEffect?.map((debt) => (
            <View key={`${debt.fromMemberId}-${debt.toMemberId}`} style={styles.memberItem}>
              <Text style={styles.rowTitle}>{debt.fromMember.name} owes {debt.toMember.name}</Text>
              <Text style={styles.amount}>{formatCurrency(debt.amountCents / 100, currency)}</Text>
            </View>
          ))
        )}
        <View style={styles.buttonRow}>
          <AppButton title="Edit" variant="secondary" icon="create-outline" onPress={() => navigation.navigate("AddSplitExpense", { groupId: item.groupId, expenseId: item.id })} />
          <AppButton title="Delete" variant="danger" icon="trash-outline" loading={expenses.isSaving} onPress={deleteExpense} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export function SettlementScreen() {
  const route = useRoute<RouteProp<RootStackParamList, "Settlement">>();
  const navigation = useNavigation<Navigation>();
  const groupId = route.params?.groupId;
  const { group } = useSplitGroupDetail(groupId);
  const { recordSettlement, isLoading } = useSplitSettlement(groupId);
  const [fromMemberId, setFromMemberId] = useState("");
  const [toMemberId, setToMemberId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!group || fromMemberId || toMemberId) return;
    const current = group.members.find((member) => member.isCurrentUser);
    const debt = group.simplifiedDebts?.find((item) => item.fromMemberId === current?.id || item.toMemberId === current?.id) ?? group.simplifiedDebts?.[0];
    if (debt) {
      setFromMemberId(debt.fromMemberId);
      setToMemberId(debt.toMemberId);
      setAmount((debt.amountCents / 100).toFixed(2));
    }
  }, [fromMemberId, group, toMemberId]);

  if (!groupId) return <EmptyShell title="Choose a group first" onAction={() => navigation.navigate("Main", { screen: "Splits" })} />;
  const members = group?.members ?? [];

  const save = async () => {
    const amountCents = moneyTextToCents(amount);
    if (!fromMemberId || !toMemberId || amountCents <= 0) return Alert.alert("Check settlement", "Choose both members and enter a positive amount.");
    if (fromMemberId === toMemberId) return Alert.alert("Check settlement", "Settlement members must be different.");
    await recordSettlement({ fromMemberId, toMemberId, amountCents, date, notes: notes.trim() || null });
    navigation.replace("SplitGroupDetail", { groupId });
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Header title="Settle Up" onBack={() => navigation.goBack()} />
        <MemberChoice label="From" members={members} value={fromMemberId} onChange={setFromMemberId} />
        <MemberChoice label="To" members={members} value={toMemberId} onChange={setToMemberId} />
        <Text style={styles.label}>Amount</Text>
        <TextInput value={amount} onChangeText={setAmount} placeholder="0.00" keyboardType="decimal-pad" placeholderTextColor={colors.muted} style={styles.input} />
        <AppDatePicker label="Date" value={date} onChange={setDate} />
        <TextInput value={notes} onChangeText={setNotes} placeholder="Note optional" placeholderTextColor={colors.muted} style={styles.input} />
        <AppButton title="Record Settlement" loading={isLoading} disabled={isLoading} onPress={save} />
      </ScrollView>
    </SafeAreaView>
  );
}

export function FriendDetailScreen() {
  const route = useRoute<RouteProp<RootStackParamList, "FriendDetail">>();
  const navigation = useNavigation<Navigation>();
  const friendId = route.params?.friendId;
  const friend = useSplitFriendDetail(friendId);

  if (!friendId) return <EmptyShell title="Choose a friend first" onAction={() => navigation.navigate("Main", { screen: "Splits" })} />;
  if (friend.isLoading) return <LoadingShell label="Loading friend" />;
  if (friend.isError || !friend.data) return <ErrorShell message="Could not load friend balance." />;

  const item = friend.data;
  const label = item.balanceCents > 0
    ? `You are owed ${formatCurrency(item.balanceCents / 100, item.currency)}`
    : item.balanceCents < 0
      ? `You owe ${formatCurrency(Math.abs(item.balanceCents) / 100, item.currency)}`
      : "Settled up";

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Header title={item.name} onBack={() => navigation.goBack()} />
        <View style={styles.heroCard}>
          <Text style={[styles.heroAmount, { color: item.balanceCents < 0 ? colors.danger : item.balanceCents > 0 ? colors.primary : colors.muted }]}>{label}</Text>
          <Text style={styles.meta}>{item.email ?? "Manual friend"}</Text>
        </View>
        <AppButton title="Settle Up" icon="swap-horizontal-outline" onPress={() => navigation.navigate("Settlement", { groupId: item.groups[0]?.groupId })} />
        <Text style={styles.section}>Shared groups</Text>
        {item.groups.map((group) => (
          <Pressable key={group.groupId} style={styles.memberItem} onPress={() => navigation.navigate("SplitGroupDetail", { groupId: group.groupId })}>
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>{group.groupName}</Text>
              <Text style={styles.meta}>{group.expenses?.length ?? 0} expenses · {group.settlements?.length ?? 0} settlements</Text>
            </View>
            <Text style={[styles.amount, { color: group.balanceCents < 0 ? colors.danger : colors.primary }]}>{formatCurrency(Math.abs(group.balanceCents) / 100, item.currency)}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

export function MemberBalanceDetailScreen() {
  return <EmptyShell title="Member balance" message="Open a group or friend to view detailed balances." />;
}

function MemberChoice({ label, members, value, onChange }: { label: string; members: SplitMember[]; value: string; onChange: (id: string) => void }) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.chips}>
        {members.map((member) => (
          <Pressable key={member.id} style={[styles.chip, value === member.id && styles.chipActive]} onPress={() => onChange(member.id)}>
            <Text style={[styles.chipText, value === member.id && styles.chipTextActive]}>{member.name}</Text>
          </Pressable>
        ))}
      </View>
    </>
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

function EmptyShell({ title, message, onAction }: { title: string; message?: string; onAction?: () => void }) {
  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <View style={styles.center}>
        <EmptyState title={title} message={message ?? "Go back to split groups to continue."} actionLabel={onAction ? "Go to Groups" : undefined} onAction={onAction} />
      </View>
    </SafeAreaView>
  );
}

function LoadingShell({ label }: { label: string }) {
  return <SafeAreaView edges={["top"]} style={styles.safe}><LoadingState label={label} /></SafeAreaView>;
}

function ErrorShell({ message }: { message: string }) {
  return <SafeAreaView edges={["top"]} style={styles.safe}><ErrorState message={message} /></SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: "center", padding: spacing.lg },
  content: { gap: spacing.md, paddingBottom: 120, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  header: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backButton: { width: 40, height: 40, justifyContent: "center" },
  headerTitle: { color: colors.text, fontSize: fontSize.title, fontWeight: "900" },
  titleSmall: { color: colors.text, fontSize: fontSize.section, fontWeight: "900" },
  heroCard: { borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.lg, gap: spacing.xs },
  heroAmount: { color: colors.primary, fontSize: 26, fontWeight: "900" },
  section: { color: colors.text, fontSize: fontSize.section, fontWeight: "800", marginTop: spacing.sm },
  label: { color: colors.text, fontSize: fontSize.body, fontWeight: "800", marginTop: spacing.sm },
  input: { minHeight: 50, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, color: colors.text, paddingHorizontal: spacing.md, fontSize: fontSize.bodyLarge },
  memberItem: { minHeight: 62, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.md, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md },
  rowBody: { flex: 1 },
  rowTitle: { color: colors.text, fontSize: fontSize.bodyLarge, fontWeight: "800" },
  meta: { color: colors.muted, fontSize: fontSize.caption, lineHeight: 18, marginTop: 2 },
  amount: { color: colors.primary, fontSize: fontSize.bodyLarge, fontWeight: "900" },
  mutedCard: { borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.md, color: colors.muted, fontSize: fontSize.body, fontWeight: "700" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontSize: fontSize.body, fontWeight: "700" },
  chipTextActive: { color: "#FFFFFF" },
  buttonRow: { gap: spacing.sm },
});
