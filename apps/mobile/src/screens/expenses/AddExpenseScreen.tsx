import { useEffect, useState } from "react";
import type { ComponentProps } from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, ToastAndroid, View } from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { AppDatePicker } from "../../components/ui/AppDatePicker";
import { AppScreen } from "../../components/ui/AppScreen";
import { EmptyState } from "../../components/ui/EmptyState";
import { LoadingState } from "../../components/ui/LoadingState";
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from "../../constants/categories";
import { colors, fontSize, radius, spacing } from "../../constants/colors";
import { getApiErrorMessage } from "../../api/apiClient";
import { splitApi } from "../../api/split.api";
import { usersApi, type SearchUserResult } from "../../api/users.api";
import { useExpenses } from "../../hooks/useExpenses";
import { useSplitExpenses, useSplitGroups } from "../../hooks/useSplit";
import type { RootStackParamList } from "../../navigation/types";
import type { ExpenseCategory, ExpenseInput, PaymentMethod } from "../../types/expense.types";
import type { CreateSplitExpenseInput, CreateSplitGroupInput, SplitGroup, SplitMember, SplitType } from "../../types/split.types";
import { formatCurrency } from "../../utils/formatCurrency";

type Route = RouteProp<RootStackParamList, "AddExpense">;
type Navigation = NativeStackNavigationProp<RootStackParamList>;
type ExpenseFor = "personal" | "friends" | "group";
type FriendDraft = {
  key: string;
  name: string;
  email?: string | null;
  userId?: string | null;
  isRegisteredUser?: boolean;
};

const splitTypes: Array<{ key: SplitType; label: string }> = [
  { key: "EQUAL", label: "Equal split" },
  { key: "CUSTOM", label: "Custom amount" },
  { key: "PERCENTAGE", label: "Percentage" },
];

function moneyToCents(value: string) {
  const normalized = value.replace(",", ".").trim();
  if (!normalized) return 0;
  return Math.round(Number(normalized) * 100);
}

function centsToText(cents: number) {
  return (cents / 100).toFixed(2);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function showToast(message: string) {
  if (Platform.OS === "android") ToastAndroid.show(message, ToastAndroid.SHORT);
  else Alert.alert(message);
}

export function AddExpenseScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Navigation>();
  const { expenses, createExpense, updateExpense, isSaving } = useExpenses();
  const splitGroups = useSplitGroups();
  const editId = route.params?.expenseId;
  const duplicateFromId = route.params?.duplicateFromId;
  const sourceExpense = expenses.data?.find((expense) => expense.id === (editId ?? duplicateFromId));
  const [expenseFor, setExpenseFor] = useState<ExpenseFor | null>(editId || duplicateFromId ? "personal" : null);

  if ((editId || duplicateFromId) && expenses.isLoading) {
    return <LoadingState label="Loading expense" />;
  }

  if ((editId || duplicateFromId) && !sourceExpense) {
    return (
      <AppScreen title="Expense" showBack onBack={() => navigation.goBack()}>
        <EmptyState title="Expense not found" message="It may have been deleted or is still loading." />
      </AppScreen>
    );
  }

  return (
    <AppScreen
      title={editId ? "Edit Expense" : "Add Expense"}
      subtitle="Choose who it is for, then fill only what matters."
      showBack
      onBack={() => navigation.goBack()}
    >
      {!expenseFor ? (
        <ChoiceStep onChoose={setExpenseFor} />
      ) : expenseFor === "personal" ? (
        <PersonalExpenseForm
          initialValues={sourceExpense ? {
            title: sourceExpense.title,
            amount: sourceExpense.amount,
            category: sourceExpense.category,
            date: sourceExpense.date,
            paymentMethod: sourceExpense.paymentMethod,
            notes: sourceExpense.notes ?? sourceExpense.note ?? undefined,
            note: sourceExpense.note ?? sourceExpense.notes ?? undefined,
            type: sourceExpense.type,
            paidBy: sourceExpense.paidBy,
          } : undefined}
          loading={isSaving}
          submitLabel={editId ? "Save" : "Save"}
          onBack={() => setExpenseFor(null)}
          onSubmit={async (values) => {
            try {
              if (editId) await updateExpense({ id: editId, input: values });
              else await createExpense(values);
              showToast("Expense saved successfully.");
              navigation.goBack();
            } catch (error) {
              Alert.alert("Could not save expense", getApiErrorMessage(error));
            }
          }}
        />
      ) : (
        <SharedExpenseForm
          mode={expenseFor}
          groups={splitGroups.groups}
          groupsLoading={splitGroups.isLoading}
          createGroup={splitGroups.createGroup}
          onBack={() => setExpenseFor(null)}
          onSaved={() => {
            showToast("Split created. Balances updated.");
            navigation.goBack();
          }}
        />
      )}
    </AppScreen>
  );
}

function ChoiceStep({ onChoose }: { onChoose: (value: ExpenseFor) => void }) {
  return (
    <View style={styles.stack}>
      <View style={styles.choiceCard}>
        <Text style={styles.choiceTitle}>Who is this expense for?</Text>
        <View style={styles.choiceRow}>
          <ChoiceButton icon="person-outline" label="Only me" onPress={() => onChoose("personal")} />
          <ChoiceButton icon="people-outline" label="With friends" onPress={() => onChoose("friends")} />
          <ChoiceButton icon="home-outline" label="Group" onPress={() => onChoose("group")} />
        </View>
      </View>
    </View>
  );
}

function ChoiceButton({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <Pressable style={({ pressed }) => [styles.choiceButton, pressed && styles.pressed]} onPress={onPress}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <Text style={styles.choiceText}>{label}</Text>
    </Pressable>
  );
}

function PersonalExpenseForm({
  initialValues,
  loading,
  submitLabel,
  onBack,
  onSubmit,
}: {
  initialValues?: Partial<ExpenseInput>;
  loading: boolean;
  submitLabel: string;
  onBack: () => void;
  onSubmit: (values: ExpenseInput) => Promise<void>;
}) {
  const [amount, setAmount] = useState(initialValues?.amount ? String(initialValues.amount) : "");
  const [category, setCategory] = useState<ExpenseCategory>(initialValues?.category ?? "GROCERIES");
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [date, setDate] = useState(initialValues?.date ?? today());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(initialValues?.paymentMethod ?? "CARD");
  const [notes, setNotes] = useState(initialValues?.notes ?? initialValues?.note ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function save() {
    const nextErrors: Record<string, string> = {};
    const numericAmount = Number(amount.replace(",", "."));
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) nextErrors.amount = "Amount must be greater than 0.";
    if (!date) nextErrors.date = "Date is required.";
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    await onSubmit({
      title: title.trim() || humanize(category),
      amount: numericAmount,
      category,
      date,
      paymentMethod,
      notes: notes.trim() || undefined,
      note: notes.trim() || undefined,
      type: "personal",
      paidBy: "You",
    });
  }

  return (
    <View style={styles.stack}>
      <CompactInput label="Amount" value={amount} onChangeText={setAmount} placeholder="12.50" keyboardType="decimal-pad" error={errors.amount} />
      <ChipField label="Category" value={category} items={EXPENSE_CATEGORIES.map((item) => ({ key: item, label: humanize(item) }))} onChange={(value) => setCategory(value as ExpenseCategory)} />
      <AppDatePicker label="Date" value={date} onChange={setDate} error={errors.date} />
      <ChipField label="Payment" value={paymentMethod} items={PAYMENT_METHODS.map((item) => ({ key: item, label: humanize(item) }))} onChange={(value) => setPaymentMethod(value as PaymentMethod)} />
      <CompactInput label="Note optional" value={notes} onChangeText={setNotes} placeholder="Lunch after class" />
      <CompactInput label="Title optional" value={title} onChangeText={setTitle} placeholder="Used if you want a custom name" />
      <FormActions primaryLabel={submitLabel} loading={loading} onPrimary={save} onSecondary={onBack} />
    </View>
  );
}

function SharedExpenseForm({
  mode,
  groups,
  groupsLoading,
  createGroup,
  onBack,
  onSaved,
}: {
  mode: "friends" | "group";
  groups: SplitGroup[];
  groupsLoading: boolean;
  createGroup: (input: CreateSplitGroupInput) => Promise<SplitGroup>;
  onBack: () => void;
  onSaved: () => void;
}) {
  const [selectedGroupId, setSelectedGroupId] = useState(mode === "group" ? groups[0]?.id : undefined);
  const selectedGroup = groups.find((group) => group.id === selectedGroupId);
  const splitExpenses = useSplitExpenses(selectedGroupId);
  const [groupName, setGroupName] = useState("");
  const [friends, setFriends] = useState<FriendDraft[]>([]);
  const [groupDraftMembers, setGroupDraftMembers] = useState<FriendDraft[]>([]);
  const [friendName, setFriendName] = useState("");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("FOOD");
  const [date, setDate] = useState(today());
  const [notes, setNotes] = useState("");
  const [paidByKey, setPaidByKey] = useState("Me");
  const [selectedKeys, setSelectedKeys] = useState<string[]>(["Me"]);
  const [splitType, setSplitType] = useState<SplitType>("EQUAL");
  const [customShares, setCustomShares] = useState<Record<string, string>>({});
  const [percentages, setPercentages] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const groupMembers = selectedGroup?.members ?? [];
  const participantOptions = mode === "group" && selectedGroup
    ? [
        ...groupMembers.map((member) => ({ key: member.id, label: member.isCurrentUser ? "Me" : member.name, member })),
        ...groupDraftMembers.map((member) => ({ key: member.key, label: member.name })),
      ]
    : [{ key: "Me", label: "Me" }, ...friends.map((friend) => ({ key: friend.key, label: friend.name }))];

  useEffect(() => {
    if (mode !== "group" || !selectedGroup) return;
    const current = selectedGroup.members.find((member) => member.isCurrentUser) ?? selectedGroup.members[0];
    setPaidByKey(current?.id ?? "");
    setSelectedKeys(selectedGroup.members.map((member) => member.id));
  }, [mode, selectedGroup]);

  function addDraft(draft: FriendDraft) {
    const targetList = mode === "group" && selectedGroup ? groupDraftMembers : friends;
    if (!draft.name.trim() || targetList.some((item) => item.key === draft.key || normalizedName(item.name) === normalizedName(draft.name))) return;
    if (mode === "group" && selectedGroup) {
      setGroupDraftMembers((current) => [...current, draft]);
    } else {
      setFriends((current) => [...current, draft]);
    }
    setSelectedKeys((current) => Array.from(new Set([...current, draft.key])));
    if (!paidByKey) setPaidByKey(draft.key);
    setFriendName("");
  }

  function addTypedFriend() {
    const value = friendName.trim();
    if (!value) return;
    addDraft({
      key: `manual:${value.toLowerCase()}`,
      name: value,
      email: value.includes("@") ? value : null,
      isRegisteredUser: false,
    });
  }

  function removeDraft(key: string) {
    setFriends((current) => current.filter((item) => item.key !== key));
    setGroupDraftMembers((current) => current.filter((item) => item.key !== key));
    setSelectedKeys((current) => current.filter((item) => item !== key));
    if (paidByKey === key) setPaidByKey("Me");
  }

  function toggleSelected(key: string) {
    setSelectedKeys((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]);
  }

  async function save() {
    const amountCents = moneyToCents(amount);
    const nextErrors: Record<string, string> = {};
    if (amountCents <= 0) nextErrors.amount = "Amount must be greater than 0.";
    if (!title.trim()) nextErrors.title = "Title is required.";
    if (!date) nextErrors.date = "Date is required.";
    if (!paidByKey) nextErrors.paidBy = "Paid by is required.";
    if (selectedKeys.length < 2) nextErrors.participants = "Choose at least 2 people.";
    if (mode === "group" && !selectedGroup && !groupName.trim()) nextErrors.group = "Select or name a group.";
    if (mode === "friends" && friends.length === 0) nextErrors.participants = "Add at least one friend.";

    const sharePreview = buildShares({ amountCents, selectedKeys, splitType, customShares, percentages });
    if (sharePreview.error) nextErrors.shares = sharePreview.error;
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    try {
      let group = selectedGroup;
      if (!group) {
        group = await createGroup({
          name: mode === "friends" ? title.trim() || "Friends" : groupName.trim(),
          description: mode === "friends" ? "Friends expense" : null,
          currency: "EUR",
          members: (mode === "friends" ? friends : groupDraftMembers).map((friend) => ({
            name: friend.name,
            email: friend.email ?? null,
            userId: friend.userId ?? null,
            isRegisteredUser: friend.isRegisteredUser,
          })),
        });
      } else if (mode === "group" && groupDraftMembers.length > 0) {
        for (const member of groupDraftMembers) {
          await splitApi.addMember(group.id, {
            name: member.name,
            email: member.email ?? null,
            userId: member.userId ?? null,
            isRegisteredUser: member.isRegisteredUser,
          });
        }
        group = await splitApi.getGroupDetail(group.id);
      }

      const memberByKey = mapMembersByKey(group.members, mode === "group" ? "id" : "draft", mode === "group" ? groupDraftMembers : friends);
      const paidByMember = memberByKey.get(paidByKey) ?? group.members.find((member) => member.isCurrentUser) ?? group.members[0];
      if (!paidByMember) {
        setErrors({ participants: "Add at least 2 people." });
        return;
      }
      const shares = sharePreview.shares
        .map((share) => {
          const member = memberByKey.get(share.key);
          return member ? { memberId: member.id, amountCents: share.amountCents, percentage: "percentage" in share ? share.percentage : undefined } : null;
        })
        .filter(Boolean) as CreateSplitExpenseInput["shares"];

      const input: CreateSplitExpenseInput = {
        paidByMemberId: paidByMember.id,
        title: title.trim(),
        category,
        amountCents,
        date,
        splitType,
        notes: notes.trim() || null,
        shares,
      };

      if (selectedGroupId) await splitExpenses.createExpense(input);
      else await splitApi.createExpense(group.id, input);
      onSaved();
    } catch (error) {
      Alert.alert("Could not save split", getApiErrorMessage(error));
    }
  }

  const sharePreview = buildShares({ amountCents: moneyToCents(amount), selectedKeys, splitType, customShares, percentages });

  if (mode === "group" && groupsLoading) return <LoadingState label="Loading groups" />;

  return (
    <ScrollView contentContainerStyle={styles.stack} keyboardShouldPersistTaps="handled" scrollEnabled={false}>
      {mode === "group" ? (
        groups.length > 0 ? (
          <>
            <ChipField label="Group" value={selectedGroupId ?? ""} items={groups.map((group) => ({ key: group.id, label: group.name }))} onChange={setSelectedGroupId} error={errors.group} />
            <FriendBuilder
              people={groupDraftMembers}
              value={friendName}
              onChangeText={setFriendName}
              onAdd={addTypedFriend}
              onAddDraft={addDraft}
              onRemove={removeDraft}
              label="Add members"
            />
          </>
        ) : (
          <>
            <CompactInput label="Group" value={groupName} onChangeText={setGroupName} placeholder="Roommates" error={errors.group} />
            <FriendBuilder
              people={groupDraftMembers}
              value={friendName}
              onChangeText={setFriendName}
              onAdd={addTypedFriend}
              onAddDraft={addDraft}
              onRemove={removeDraft}
              label="Group members"
            />
          </>
        )
      ) : (
        <FriendBuilder
          people={friends}
          value={friendName}
          onChangeText={setFriendName}
          onAdd={addTypedFriend}
          onAddDraft={addDraft}
          onRemove={removeDraft}
          label="Friends involved"
        />
      )}

      <CompactInput label="Total amount" value={amount} onChangeText={setAmount} placeholder="24.00" keyboardType="decimal-pad" error={errors.amount} />
      <CompactInput label="Title/category" value={title} onChangeText={setTitle} placeholder="Groceries" error={errors.title} />
      <ChipField label="Category" value={category} items={EXPENSE_CATEGORIES.map((item) => ({ key: item, label: humanize(item) }))} onChange={(value) => setCategory(value as ExpenseCategory)} />
      <ChipField label="Paid by" value={paidByKey} items={participantOptions.map((item) => ({ key: item.key, label: item.label }))} onChange={setPaidByKey} error={errors.paidBy} />

      <Text style={styles.label}>{mode === "group" ? "Members involved" : "Friends involved"}</Text>
      <View style={styles.chips}>
        {participantOptions.map((item) => (
          <Pressable key={item.key} style={[styles.checkboxChip, selectedKeys.includes(item.key) && styles.checkboxChipActive]} onPress={() => toggleSelected(item.key)}>
            <Ionicons name={selectedKeys.includes(item.key) ? "checkbox" : "square-outline"} size={16} color={selectedKeys.includes(item.key) ? colors.primary : colors.muted} />
            <Text style={styles.chipText}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
      <ErrorText value={errors.participants} />

      <ChipField label="Split type" value={splitType} items={splitTypes.map((item) => ({ key: item.key, label: item.label }))} onChange={(value) => setSplitType(value as SplitType)} />
      {splitType === "CUSTOM" ? (
        <ShareInputs keysList={selectedKeys} labels={participantOptions} values={customShares} onChange={setCustomShares} suffix="amount" />
      ) : splitType === "PERCENTAGE" ? (
        <ShareInputs keysList={selectedKeys} labels={participantOptions} values={percentages} onChange={setPercentages} suffix="%" />
      ) : (
        <View style={styles.preview}>
          <Text style={styles.previewTitle}>Equal split preview</Text>
          {sharePreview.shares.map((share) => (
            <Text key={share.key} style={styles.previewText}>{participantOptions.find((item) => item.key === share.key)?.label ?? share.key}: {formatCurrency(share.amountCents / 100)}</Text>
          ))}
        </View>
      )}
      <ErrorText value={errors.shares} />

      <AppDatePicker label="Date" value={date} onChange={setDate} error={errors.date} />
      <CompactInput label="Note optional" value={notes} onChangeText={setNotes} placeholder="Paid after class" />
      <FormActions primaryLabel="Save" loading={splitExpenses.isSaving} onPrimary={save} onSecondary={onBack} />
    </ScrollView>
  );
}

function buildShares({
  amountCents,
  selectedKeys,
  splitType,
  customShares,
  percentages,
}: {
  amountCents: number;
  selectedKeys: string[];
  splitType: SplitType;
  customShares: Record<string, string>;
  percentages: Record<string, string>;
}): {
  shares: Array<{ key: string; amountCents: number; percentage?: number }>;
  error?: string;
} {
  if (selectedKeys.length === 0) return { shares: [], error: undefined };
  if (splitType === "CUSTOM") {
    const shares = selectedKeys.map((key) => ({ key, amountCents: moneyToCents(customShares[key] ?? "") }));
    const total = shares.reduce((sum, share) => sum + share.amountCents, 0);
    return { shares, error: amountCents > 0 && total !== amountCents ? "Custom split total must match total amount." : undefined };
  }
  if (splitType === "PERCENTAGE") {
    const shares = selectedKeys.map((key) => {
      const percentage = Number((percentages[key] ?? "").replace(",", "."));
      return { key, percentage, amountCents: Math.round((amountCents * percentage) / 100) };
    });
    const percentTotal = shares.reduce((sum, share) => sum + (Number.isFinite(share.percentage) ? share.percentage : 0), 0);
    const centTotal = shares.reduce((sum, share) => sum + share.amountCents, 0);
    const fixedShares = shares.length ? [...shares] : shares;
    const lastShare = fixedShares[fixedShares.length - 1];
    if (lastShare) fixedShares[fixedShares.length - 1] = { ...lastShare, amountCents: lastShare.amountCents + (amountCents - centTotal) };
    return { shares: fixedShares, error: Math.round(percentTotal * 100) !== 10000 ? "Percentage split must equal 100%." : undefined };
  }
  const base = Math.floor(amountCents / selectedKeys.length);
  let remainder = amountCents % selectedKeys.length;
  return {
    shares: selectedKeys.map((key) => {
      const extra = remainder > 0 ? 1 : 0;
      remainder -= extra;
      return { key, amountCents: base + extra };
    }),
    error: undefined,
  };
}

function mapMembersByKey(members: SplitMember[], keyMode: "id" | "draft", drafts: FriendDraft[] = []) {
  const map = new Map<string, SplitMember>();
  for (const member of members) {
    if (member.isCurrentUser) map.set("Me", member);
    if (keyMode === "id") map.set(member.id, member);
    const draft = drafts.find((item) =>
      item.userId ? item.userId === member.userId : normalizedName(item.name) === normalizedName(member.name) || item.email?.toLowerCase() === member.email?.toLowerCase()
    );
    if (draft) map.set(draft.key, member);
  }
  return map;
}

function FriendBuilder({
  people,
  value,
  label,
  onChangeText,
  onAdd,
  onAddDraft,
  onRemove,
}: {
  people: FriendDraft[];
  value: string;
  label: string;
  onChangeText: (value: string) => void;
  onAdd: () => void;
  onAddDraft: (draft: FriendDraft) => void;
  onRemove: (key: string) => void;
}) {
  const [suggestions, setSuggestions] = useState<SearchUserResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    let active = true;
    const query = value.trim();
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    const timeout = setTimeout(() => {
      usersApi.searchUsers(query)
        .then((results) => {
          if (active) setSuggestions(results.slice(0, 4));
        })
        .catch(() => {
          if (active) setSuggestions([]);
        })
        .finally(() => {
          if (active) setIsSearching(false);
        });
    }, 250);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [value]);

  const addSuggestion = (user: SearchUserResult) => {
    onAddDraft({
      key: `user:${user.id}`,
      name: user.name,
      email: user.email,
      userId: user.id,
      isRegisteredUser: true,
    });
    setSuggestions([]);
  };

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inlineInputRow}>
        <TextInput value={value} onChangeText={onChangeText} placeholder="Name, email, or username" placeholderTextColor={colors.muted} style={styles.inlineInput} autoCapitalize="none" />
        <Pressable style={styles.addSmall} onPress={onAdd}>
          <Ionicons name="add" size={18} color="#FFFFFF" />
        </Pressable>
      </View>
      {isSearching ? <Text style={styles.hint}>Searching...</Text> : null}
      {suggestions.length > 0 ? (
        <View style={styles.suggestionBox}>
          {suggestions.map((user) => (
            <Pressable key={user.id} style={styles.suggestionRow} onPress={() => addSuggestion(user)}>
              <View style={styles.rowBody}>
                <Text style={styles.suggestionName}>{user.name}</Text>
                <Text style={styles.hint}>{user.email}</Text>
              </View>
              <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
            </Pressable>
          ))}
        </View>
      ) : value.trim().length >= 2 ? (
        <Text style={styles.hint}>Tap + to add "{value.trim()}" manually.</Text>
      ) : null}
      <View style={styles.chips}>
        {people.map((person) => (
          <Pressable key={person.key} style={styles.removeChip} onPress={() => onRemove(person.key)}>
            <Text style={styles.chipText}>{person.name}</Text>
            <Ionicons name="close" size={14} color={colors.muted} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function ShareInputs({
  keysList,
  labels,
  values,
  suffix,
  onChange,
}: {
  keysList: string[];
  labels: Array<{ key: string; label: string }>;
  values: Record<string, string>;
  suffix: string;
  onChange: (value: Record<string, string>) => void;
}) {
  return (
    <View style={styles.shareBox}>
      {keysList.map((key) => (
        <View key={key} style={styles.shareRow}>
          <Text style={styles.shareName}>{labels.find((item) => item.key === key)?.label ?? key}</Text>
          <TextInput
            value={values[key] ?? ""}
            onChangeText={(value) => onChange({ ...values, [key]: value })}
            keyboardType="decimal-pad"
            placeholder={suffix === "%" ? "50" : "0.00"}
            placeholderTextColor={colors.muted}
            style={styles.shareInput}
          />
          <Text style={styles.shareSuffix}>{suffix}</Text>
        </View>
      ))}
    </View>
  );
}

function ChipField({
  label,
  value,
  items,
  onChange,
  error,
}: {
  label: string;
  value: string;
  items: Array<{ key: string; label: string }>;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.chips}>
        {items.map((item) => (
          <Pressable key={item.key} style={[styles.chip, value === item.key && styles.chipActive]} onPress={() => onChange(item.key)}>
            <Text style={[styles.chipText, value === item.key && styles.chipTextActive]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
      <ErrorText value={error} />
    </View>
  );
}

function CompactInput({ label, error, style, ...props }: { label: string; error?: string } & ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput placeholderTextColor={colors.muted} style={[styles.input, error && styles.inputError, style]} {...props} />
      <ErrorText value={error} />
    </View>
  );
}

function FormActions({ primaryLabel, loading, onPrimary, onSecondary }: { primaryLabel: string; loading: boolean; onPrimary: () => void; onSecondary: () => void }) {
  return (
    <View style={styles.formActions}>
      <Pressable style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]} onPress={onSecondary}>
        <Text style={styles.secondaryText}>Back</Text>
      </Pressable>
      <Pressable disabled={loading} style={({ pressed }) => [styles.primaryButton, loading && styles.disabled, pressed && !loading && styles.pressed]} onPress={onPrimary}>
        <Text style={styles.primaryText}>{loading ? "Saving..." : primaryLabel}</Text>
      </Pressable>
    </View>
  );
}

function ErrorText({ value }: { value?: string }) {
  return value ? <Text style={styles.error}>{value}</Text> : null;
}

function humanize(value: string) {
  return value.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizedName(value: string) {
  return value.trim().toLowerCase();
}

const styles = StyleSheet.create({
  stack: { gap: spacing.sm },
  choiceCard: { borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.md, gap: spacing.md },
  choiceTitle: { color: colors.text, fontSize: fontSize.section, fontWeight: "900" },
  choiceRow: { flexDirection: "row", gap: spacing.sm },
  choiceButton: { flex: 1, minHeight: 58, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceMuted, alignItems: "center", justifyContent: "center", gap: 4, paddingHorizontal: spacing.xs },
  choiceText: { color: colors.text, fontSize: fontSize.caption, fontWeight: "900", textAlign: "center" },
  field: { gap: spacing.xs },
  label: { color: colors.text, fontSize: fontSize.body, fontWeight: "800" },
  input: { minHeight: 42, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, color: colors.text, paddingHorizontal: spacing.sm, fontSize: fontSize.body },
  inputError: { borderColor: colors.danger },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  chip: { minHeight: 32, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, justifyContent: "center", paddingHorizontal: spacing.sm },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.softGreen },
  chipText: { color: colors.text, fontSize: fontSize.caption, fontWeight: "800" },
  chipTextActive: { color: colors.primary },
  checkboxChip: { minHeight: 34, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: spacing.sm },
  checkboxChipActive: { borderColor: colors.primary, backgroundColor: colors.softGreen },
  inlineInputRow: { flexDirection: "row", gap: spacing.xs },
  inlineInput: { flex: 1, minHeight: 40, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, color: colors.text, paddingHorizontal: spacing.sm },
  addSmall: { width: 40, minHeight: 40, borderRadius: radius.sm, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  removeChip: { minHeight: 32, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: spacing.sm },
  suggestionBox: { borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, overflow: "hidden" },
  suggestionRow: { minHeight: 42, flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  suggestionName: { color: colors.text, fontSize: fontSize.body, fontWeight: "800" },
  hint: { color: colors.muted, fontSize: fontSize.caption, fontWeight: "700" },
  rowBody: { flex: 1, minWidth: 0 },
  preview: { borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.sm, gap: 3 },
  previewTitle: { color: colors.muted, fontSize: fontSize.caption, fontWeight: "900" },
  previewText: { color: colors.text, fontSize: fontSize.caption, fontWeight: "700" },
  shareBox: { borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.sm, gap: spacing.xs },
  shareRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  shareName: { flex: 1, color: colors.text, fontSize: fontSize.caption, fontWeight: "800" },
  shareInput: { width: 82, minHeight: 36, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.sm, color: colors.text },
  shareSuffix: { width: 48, color: colors.muted, fontSize: fontSize.caption, fontWeight: "800" },
  formActions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  secondaryButton: { flex: 1, minHeight: 42, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  primaryButton: { flex: 1.4, minHeight: 42, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  secondaryText: { color: colors.primary, fontSize: fontSize.body, fontWeight: "900" },
  primaryText: { color: "#FFFFFF", fontSize: fontSize.body, fontWeight: "900" },
  error: { color: colors.danger, fontSize: fontSize.caption, fontWeight: "700" },
  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
});
