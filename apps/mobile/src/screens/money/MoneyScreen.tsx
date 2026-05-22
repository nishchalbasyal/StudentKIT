import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AppHeader } from "../../components/ui/AppHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { FloatingActionButton } from "../../components/ui/FloatingActionButton";
import { LoadingState } from "../../components/ui/LoadingState";
import { SegmentedTabs } from "../../components/ui/SegmentedTabs";
import { colors, fontSize, radius, shadows, spacing } from "../../constants/colors";
import { splitApi } from "../../api/split.api";
import { useExpenses } from "../../hooks/useExpenses";
import { splitKeys, useSplitFriends, useSplitGroups, useSplitSummary } from "../../hooks/useSplit";
import type { RootStackParamList } from "../../navigation/types";
import { useAuthStore } from "../../store/authStore";
import type { Expense } from "../../types/expense.types";
import type { SplitDebt, SplitFriendBalance, SplitGroup } from "../../types/split.types";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatShortDate } from "../../utils/formatDate";

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type MoneyTab = "activity" | "expenses" | "splits" | "friends";

const tabs = [
  { key: "activity", label: "Activity" },
  { key: "expenses", label: "Expenses" },
  { key: "splits", label: "Splits" },
  { key: "friends", label: "Friends" },
] as const;

const typeColors = {
  Personal: colors.info,
  Split: colors.primary,
  Group: colors.warning,
  Pending: colors.danger,
  Settled: colors.success,
};

export function MoneyScreen() {
  const navigation = useNavigation<Navigation>();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const expensesHook = useExpenses();
  const groupsHook = useSplitGroups();
  const splitSummary = useSplitSummary();
  const friends = useSplitFriends();
  const [tab, setTab] = useState<MoneyTab>("activity");
  const [expenseMonthOffset, setExpenseMonthOffset] = useState(0);

  const groups = useMemo(
    () => groupsHook.groups.filter((group) => !group.archivedAt),
    [groupsHook.groups],
  );
  const personalExpenses = expensesHook.expenses.data ?? [];
  const currentMonthDate = useMemo(() => {
    const base = new Date();
    base.setDate(1);
    base.setMonth(base.getMonth() + expenseMonthOffset);
    return base;
  }, [expenseMonthOffset]);
  const monthKey = currentMonthDate.toISOString().slice(0, 7);
  const pendingDebts = useMemo(
    () => groups.flatMap((group) => (group.simplifiedDebts ?? []).map((debt) => ({ group, debt }))),
    [groups],
  );

  const isLoading = expensesHook.expenses.isLoading || expensesHook.summary.isLoading || groupsHook.isLoading || splitSummary.isLoading;
  const isError = expensesHook.expenses.isError || expensesHook.summary.isError || groupsHook.isError || splitSummary.isError;

  if (isLoading) {
    return (
      <SafeAreaView edges={["top"]} style={styles.safe}>
        <LoadingState label="Loading expense" />
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView edges={["top"]} style={styles.safe}>
        <ErrorState
          message="Could not load expense."
          onRetry={() => {
            void expensesHook.expenses.refetch();
            void expensesHook.summary.refetch();
            void groupsHook.refetch();
            void splitSummary.refetch();
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 0) + 132 }]}
        showsVerticalScrollIndicator={false}
      >
        <AppHeader title="Expense" avatarText={user?.name ?? "ST"} showSettings />
        <SegmentedTabs tabs={tabs} value={tab} onChange={setTab} />

        {tab === "activity" ? (
          <ActivityTab groups={groups} items={pendingDebts} currency={user?.currency} />
        ) : tab === "expenses" ? (
          <ExpensesTab
            personalExpenses={personalExpenses}
            groups={groups}
            monthKey={monthKey}
            monthDate={currentMonthDate}
            onPreviousMonth={() => setExpenseMonthOffset((value) => value - 1)}
            onNextMonth={() => setExpenseMonthOffset((value) => value + 1)}
            onCurrentMonth={() => setExpenseMonthOffset(0)}
            currentUserId={user?.id}
            currentUserEmail={user?.email}
            currency={user?.currency}
            navigation={navigation}
          />
        ) : tab === "splits" ? (
          <SplitsTab groups={groups} currency={user?.currency} navigation={navigation} />
        ) : tab === "friends" ? (
          <FriendsTab friends={friends.data ?? []} loading={friends.isLoading} error={friends.isError} navigation={navigation} currency={user?.currency} />
        ) : (
          <ActivityTab groups={groups} items={pendingDebts} currency={user?.currency} />
        )}
      </ScrollView>
      <FloatingActionButton onPress={() => navigation.navigate("AddExpense")} />
    </SafeAreaView>
  );
}

function ExpensesTab({
  personalExpenses,
  groups,
  monthKey,
  monthDate,
  onPreviousMonth,
  onNextMonth,
  onCurrentMonth,
  currentUserId,
  currentUserEmail,
  currency,
  navigation,
}: {
  personalExpenses: Expense[];
  groups: SplitGroup[];
  monthKey: string;
  monthDate: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onCurrentMonth: () => void;
  currentUserId?: string;
  currentUserEmail?: string;
  currency?: string;
  navigation: Navigation;
}) {
  const personalMonthExpenses = personalExpenses.filter((expense) => (
    expense.date.slice(0, 7) === monthKey && (!expense.type || expense.type === "personal")
  ));
  const splitItems = groups
    .flatMap((group) => group.expenses.map((expense) => ({
      group,
      expense,
      shareCents: currentUserShareCents(group, expense, currentUserId, currentUserEmail),
    })))
    .filter(({ expense, shareCents }) => expense.date.slice(0, 7) === monthKey && shareCents > 0);
  const rows = [
    ...personalMonthExpenses.map((expense) => ({
      id: `personal-${expense.id}`,
      amount: expense.amount,
      title: expense.title,
      date: expense.date,
      badge: "Personal" as const,
      paidBy: expense.paidBy ?? "You",
      note: humanize(expense.category),
      onPress: () => navigation.navigate("ExpenseDetail", { expenseId: expense.id }),
    })),
    ...splitItems.map(({ group, expense, shareCents }) => ({
      id: `split-${expense.id}`,
      amount: shareCents / 100,
      title: expense.title,
      date: expense.date,
      badge: (group.members.length > 2 ? "Group" : "Split") as "Group" | "Split",
      paidBy: expense.paidBy?.name ?? "Unknown",
      note: `${group.name} - total ${formatCurrency(expense.amount, currency ?? group.currency)}`,
      onPress: () => navigation.navigate("SplitExpenseDetail", { expenseId: expense.id }),
    })),
  ].sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());
  const monthTotal = rows.reduce((sum, row) => sum + row.amount, 0);

  return (
    <View style={styles.stack}>
      <MonthFilter
        monthDate={monthDate}
        total={monthTotal}
        currency={currency}
        onPrevious={onPreviousMonth}
        onNext={onNextMonth}
        onCurrent={onCurrentMonth}
      />
      {rows.length === 0 ? (
        <EmptyState title="Track your first expense." message="No personal or shared expenses in this month." actionLabel="Add Expense" onAction={() => navigation.navigate("AddExpense")} />
      ) : (
        rows.map((item) => (
          <TransactionRow
            key={item.id}
            amount={item.amount}
            title={item.title}
            date={item.date}
            badge={item.badge}
            paidBy={item.paidBy}
            note={item.note}
            currency={currency}
            onPress={item.onPress}
          />
        ))
      )}
    </View>
  );
}

function SplitsTab({ groups, currency, navigation }: { groups: SplitGroup[]; currency?: string; navigation: Navigation }) {
  const rows = groups.flatMap((group) => group.expenses.map((expense) => ({ group, expense })));
  if (rows.length === 0) {
    return <EmptyState title="Add a shared expense with friends or roommates." message="Splits and group expenses will stay here." actionLabel="Add Expense" onAction={() => navigation.navigate("AddExpense")} />;
  }

  return (
    <View style={styles.stack}>
      {rows.map(({ group, expense }) => {
        const relatedDebts = expense.balanceEffect?.length ? expense.balanceEffect : group.simplifiedDebts ?? [];
        const settled = (group.simplifiedDebts ?? []).length === 0;
        return (
          <Pressable key={expense.id} style={({ pressed }) => [styles.compactCard, pressed && styles.pressed]} onPress={() => navigation.navigate("SplitExpenseDetail", { expenseId: expense.id })}>
            <View style={styles.rowTop}>
              <View style={styles.rowBody}>
                <Text numberOfLines={1} style={styles.rowTitle}>{expense.title}</Text>
                <Text style={styles.meta}>Paid by {expense.paidBy?.name ?? "Unknown"} - {group.members.length} people</Text>
              </View>
              <Text style={styles.amount}>{formatCurrency(expense.amount, currency ?? group.currency)}</Text>
            </View>
            <View style={styles.badgeLine}>
              <Badge label={group.members.length > 2 ? "Group" : "Split"} />
              <Badge label={settled ? "Settled" : "Pending"} />
            </View>
            <Text style={styles.owesText}>
              {relatedDebts.length === 0
                ? "No open balance"
                : relatedDebts.slice(0, 2).map((debt) => `${debt.fromMember.name} owes ${debt.toMember.name} ${formatCurrency(debt.amount, currency ?? group.currency)}`).join(" - ")}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function FriendsTab({
  friends,
  loading,
  error,
  navigation,
  currency,
}: {
  friends: SplitFriendBalance[];
  loading: boolean;
  error: boolean;
  navigation: Navigation;
  currency?: string;
}) {
  if (loading) return <LoadingState label="Loading friends" />;
  if (error) return <ErrorState message="Could not load friends." />;
  if (friends.length === 0) {
    return <EmptyState title="Add friends to split expenses easily." message="Friends appear after you split an expense." actionLabel="Add Expense" onAction={() => navigation.navigate("AddExpense")} />;
  }

  return (
    <View style={styles.table}>
      <View style={styles.tableHeader}>
        <Text style={styles.tableHeadName}>Friend</Text>
        <Text style={styles.tableHeadBalance}>Balance</Text>
      </View>
      {friends.map((friend) => {
        const label =
          friend.balanceCents > 0
            ? `Owes you ${formatCurrency(friend.balance, currency ?? friend.currency)}`
            : friend.balanceCents < 0
              ? `You owe ${formatCurrency(Math.abs(friend.balance), currency ?? friend.currency)}`
              : "Settled";
        return (
          <Pressable key={friend.id} style={({ pressed }) => [styles.tableRow, pressed && styles.pressed]} onPress={() => navigation.navigate("FriendDetail", { friendId: friend.id })}>
            <Text numberOfLines={1} style={styles.tableName}>{friend.name}</Text>
            <Text style={[styles.tableBalance, { color: friend.balanceCents < 0 ? colors.danger : friend.balanceCents > 0 ? colors.primary : colors.muted }]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function ActivityTab({ groups, items, currency }: { groups: SplitGroup[]; items: Array<{ group: SplitGroup; debt: SplitDebt }>; currency?: string }) {
  const queryClient = useQueryClient();
  const pendingTotal = items.reduce((sum, item) => sum + item.debt.amount, 0);
  const settledCount = groups.reduce((sum, group) => sum + group.settlements.length, 0);
  const recentActivity = groups
    .flatMap((group) => [
      ...group.expenses.map((expense) => ({
        id: `expense-${expense.id}`,
        title: expense.title,
        meta: `${group.name} - ${formatCurrency(expense.amount, currency ?? group.currency)}`,
        date: expense.date,
        badge: group.members.length > 2 ? "Group" as const : "Split" as const,
      })),
      ...group.settlements.map((settlement) => ({
        id: `settlement-${settlement.id}`,
        title: `${settlement.fromMember?.name ?? "Friend"} paid ${settlement.toMember?.name ?? "Friend"}`,
        meta: `${group.name} - ${formatCurrency(settlement.amount, currency ?? group.currency)}`,
        date: settlement.date,
        badge: "Settled" as const,
      })),
    ])
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
    .slice(0, 5);
  const mutation = useMutation({
    mutationFn: ({ groupId, debt }: { groupId: string; debt: SplitDebt }) =>
      splitApi.recordSettlement(groupId, {
        fromMemberId: debt.fromMemberId,
        toMemberId: debt.toMemberId,
        amountCents: debt.amountCents,
        date: new Date().toISOString().slice(0, 10),
        notes: "Marked as paid",
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: splitKeys.summary }),
        queryClient.invalidateQueries({ queryKey: splitKeys.groups }),
        queryClient.invalidateQueries({ queryKey: splitKeys.friends }),
      ]);
      Alert.alert("Settlement marked as paid.");
    },
  });

  return (
    <View style={styles.stack}>
      <View style={styles.summaryGrid}>
        <SummaryCard label="Pending amount" value={formatCurrency(pendingTotal, currency)} tone="red" />
        <SummaryCard label="Pending items" value={String(items.length)} tone="amber" />
        <SummaryCard label="Settled payments" value={String(settledCount)} tone="green" />
        <SummaryCard label="Split activity" value={String(recentActivity.length)} tone="blue" />
      </View>

      <SectionTitle title="Pending settlements" />
      {items.length === 0 ? (
        <EmptyState title="No pending settlements" message="Settled balances will stay out of your way." />
      ) : (
        items.map(({ group, debt }) => (
          <View key={`${group.id}-${debt.fromMemberId}-${debt.toMemberId}`} style={styles.compactCard}>
            <Text style={styles.rowTitle}>{debt.fromMember.name} should pay {debt.toMember.name} {formatCurrency(debt.amount, currency ?? group.currency)}</Text>
            <Text style={styles.meta}>{group.name} - pending</Text>
            <View style={styles.actionRow}>
              <SmallAction label="Mark as paid" icon="checkmark" onPress={() => mutation.mutate({ groupId: group.id, debt })} />
              <SmallAction label="Remind friend" icon="notifications-outline" onPress={() => Alert.alert("Reminder", "Reminder saved for this settlement.")} />
              <SmallAction label="Details" icon="eye-outline" onPress={() => Alert.alert(group.name, `${debt.fromMember.name} owes ${debt.toMember.name}.`)} />
            </View>
          </View>
        ))
      )}

      <SectionTitle title="Recent activity" />
      {recentActivity.length === 0 ? (
        <Text style={styles.mutedBox}>No split activity yet.</Text>
      ) : (
        recentActivity.map((item) => (
          <View key={item.id} style={styles.activityItem}>
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>{item.title}</Text>
              <Text style={styles.meta}>{item.meta} - {formatShortDate(item.date)}</Text>
            </View>
            <Badge label={item.badge} />
        </View>
        ))
      )}
    </View>
  );
}

function MonthFilter({
  monthDate,
  total,
  currency,
  onPrevious,
  onNext,
  onCurrent,
}: {
  monthDate: Date;
  total: number;
  currency?: string;
  onPrevious: () => void;
  onNext: () => void;
  onCurrent: () => void;
}) {
  const label = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(monthDate);

  return (
    <View style={styles.monthCard}>
      <View style={styles.monthTop}>
        <Pressable style={styles.monthIcon} onPress={onPrevious}>
          <Ionicons name="chevron-back" size={17} color={colors.primary} />
        </Pressable>
        <View style={styles.monthCenter}>
          <Text style={styles.monthLabel}>{label}</Text>
          <Text style={styles.monthTotal}>{formatCurrency(total, currency)}</Text>
        </View>
        <Pressable style={styles.monthIcon} onPress={onNext}>
          <Ionicons name="chevron-forward" size={17} color={colors.primary} />
        </Pressable>
      </View>
      <Pressable style={({ pressed }) => [styles.currentButton, pressed && styles.pressed]} onPress={onCurrent}>
        <Text style={styles.currentButtonText}>Current month</Text>
      </Pressable>
    </View>
  );
}

function TransactionRow({
  amount,
  title,
  date,
  badge,
  paidBy,
  note,
  currency,
  onPress,
}: {
  amount: number;
  title: string;
  date: string;
  badge: keyof typeof typeColors;
  paidBy: string;
  note?: string | null;
  currency?: string;
  onPress?: () => void;
}) {
  return (
    <Pressable style={({ pressed }) => [styles.transaction, pressed && styles.pressed]} onPress={onPress}>
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text numberOfLines={1} style={styles.rowTitle}>{title || "Expense"}</Text>
          <Text style={styles.amount}>{formatCurrency(amount, currency)}</Text>
        </View>
        <View style={styles.badgeLine}>
          <Badge label={badge} />
          <Text style={styles.meta}>{formatShortDate(date)} - Paid by {paidBy}</Text>
        </View>
        {note ? <Text numberOfLines={1} style={styles.note}>{note}</Text> : null}
      </View>
    </Pressable>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: string; tone: "blue" | "red" | "green" | "amber" | "muted" }) {
  const color = tone === "red" ? colors.danger : tone === "green" ? colors.primary : tone === "amber" ? colors.warning : tone === "muted" ? colors.muted : colors.info;
  return (
    <View style={styles.summaryCard}>
      <Text numberOfLines={2} style={styles.summaryLabel}>{label}</Text>
      <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.summaryValue, { color }]}>{value}</Text>
    </View>
  );
}

function Badge({ label }: { label: keyof typeof typeColors }) {
  return (
    <View style={[styles.badge, { backgroundColor: `${typeColors[label]}18`, borderColor: `${typeColors[label]}55` }]}>
      <Text style={[styles.badgeText, { color: typeColors[label] }]}>{label}</Text>
    </View>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function SmallAction({ label, icon, onPress }: { label: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void }) {
  return (
    <Pressable style={({ pressed }) => [styles.smallAction, pressed && styles.pressed]} onPress={onPress}>
      <Ionicons name={icon} size={14} color={colors.primary} />
      <Text style={styles.smallActionText}>{label}</Text>
    </Pressable>
  );
}

function humanize(value: string) {
  return value.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function currentUserShareCents(
  group: SplitGroup,
  expense: SplitGroup["expenses"][number],
  currentUserId?: string,
  currentUserEmail?: string,
) {
  const currentUserEmailKey = currentUserEmail?.toLowerCase();
  const currentMember = group.members.find((member) =>
    member.isCurrentUser ||
    (!!currentUserId && member.userId === currentUserId) ||
    (!!currentUserEmailKey && member.email?.toLowerCase() === currentUserEmailKey) ||
    member.name.toLowerCase() === "me" ||
    member.name.toLowerCase() === "you"
  );

  if (!currentMember) return 0;
  return expense.shares.find((share) => share.memberId === currentMember.id)?.amountCents ?? 0;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md },
  stack: { gap: spacing.sm },
  summaryGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  summaryCard: {
    width: "48%",
    minHeight: 76,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.sm,
    justifyContent: "space-between",
    ...shadows.soft,
  },
  summaryLabel: { color: colors.muted, fontSize: fontSize.caption, fontWeight: "800", lineHeight: 16 },
  summaryValue: { fontSize: fontSize.bodyLarge, fontWeight: "900" },
  sectionTitle: { color: colors.text, fontSize: fontSize.section, fontWeight: "900", marginTop: spacing.xs },
  transaction: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.sm,
  },
  compactCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  rowTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  rowBody: { flex: 1, minWidth: 0 },
  rowTitle: { flex: 1, color: colors.text, fontSize: fontSize.body, fontWeight: "800" },
  amount: { color: colors.text, fontSize: fontSize.body, fontWeight: "900" },
  meta: { color: colors.muted, fontSize: fontSize.caption, fontWeight: "600" },
  note: { color: colors.muted, fontSize: fontSize.caption, marginTop: 3 },
  badgeLine: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: spacing.xs, marginTop: 4 },
  badge: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 7, paddingVertical: 2 },
  badgeText: { fontSize: 10, fontWeight: "900" },
  owesText: { color: colors.text, fontSize: fontSize.caption, lineHeight: 18 },
  monthCard: { borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.sm, gap: spacing.xs },
  monthTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  monthIcon: { width: 34, height: 34, borderRadius: radius.pill, alignItems: "center", justifyContent: "center", backgroundColor: colors.softGreen },
  monthCenter: { flex: 1, alignItems: "center", gap: 2 },
  monthLabel: { color: colors.text, fontSize: fontSize.body, fontWeight: "900" },
  monthTotal: { color: colors.danger, fontSize: fontSize.bodyLarge, fontWeight: "900" },
  currentButton: { alignSelf: "center", minHeight: 28, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.sm, alignItems: "center", justifyContent: "center" },
  currentButtonText: { color: colors.primary, fontSize: fontSize.caption, fontWeight: "900" },
  activityItem: { minHeight: 50, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.sm, flexDirection: "row", alignItems: "center", gap: spacing.sm },
  mutedBox: { borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.sm, color: colors.muted, fontSize: fontSize.caption, fontWeight: "700" },
  table: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  tableHeader: { minHeight: 36, flexDirection: "row", alignItems: "center", backgroundColor: colors.surfaceMuted, paddingHorizontal: spacing.sm },
  tableHeadName: { flex: 1, color: colors.muted, fontSize: fontSize.caption, fontWeight: "900" },
  tableHeadBalance: { color: colors.muted, fontSize: fontSize.caption, fontWeight: "900" },
  tableRow: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  tableName: { flex: 1, color: colors.text, fontSize: fontSize.body, fontWeight: "800" },
  tableBalance: { fontSize: fontSize.caption, fontWeight: "900" },
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginTop: spacing.xs },
  smallAction: { minHeight: 30, flexDirection: "row", alignItems: "center", gap: 4, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.sm, backgroundColor: colors.surface },
  smallActionText: { color: colors.primary, fontSize: fontSize.caption, fontWeight: "800" },
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
});
