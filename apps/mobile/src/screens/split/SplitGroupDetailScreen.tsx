import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { GroupedTableCard } from "../../components/ui/GroupedTableCard";
import { CompactActionRow } from "../../components/ui/CompactActionRow";
import { AppButton } from "../../components/ui/AppButton";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { LoadingState } from "../../components/ui/LoadingState";
import { colors, fontSize, radius, spacing } from "../../constants/colors";
import {
  useSplitBalances,
  useSplitGroupDetail,
  useSplitSettlements,
} from "../../hooks/useSplit";
import type { RootStackParamList } from "../../navigation/types";
import { formatCurrency } from "../../utils/formatCurrency";

type Route = RouteProp<RootStackParamList, "SplitGroupDetail">;
type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function SplitGroupDetailScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Navigation>();
  const groupId = route.params?.groupId;
  const { group, isLoading, isError } = useSplitGroupDetail(groupId);
  const balances = useSplitBalances(groupId);
  const settlements = useSplitSettlements(groupId);

  if (!groupId) {
    return (
      <SafeAreaView edges={["top"]} style={styles.safe}>
        <EmptyState
          title="Choose a group first"
          message="Open a group before adding expenses or settlements."
          actionLabel="Go to Groups"
          onAction={() => navigation.navigate("Main", { screen: "Splits" })}
        />
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView edges={["top"]} style={styles.safe}>
        <LoadingState label="Loading group" />
      </SafeAreaView>
    );
  }

  if (isError || !group) {
    return (
      <SafeAreaView edges={["top"]} style={styles.safe}>
        <ErrorState message="Could not load split group." />
      </SafeAreaView>
    );
  }

  const currentBalanceCents = group.currentUserBalanceCents ?? 0;
  const statusText =
    currentBalanceCents > 0
      ? `You are owed ${formatCurrency(currentBalanceCents / 100, group.currency)}`
      : currentBalanceCents < 0
        ? `You owe ${formatCurrency(Math.abs(currentBalanceCents) / 100, group.currency)}`
        : "Everyone is settled up";
  const currentMember = group.members.find((member) => member.isCurrentUser);
  const currentBalance = (balances.data ?? group.balances ?? []).find(
    (balance) => balance.memberId === currentMember?.id,
  );
  const debts = group.simplifiedDebts ?? [];

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={24} color={colors.primary} />
          </Pressable>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>{group.name}</Text>
            <Text style={styles.headerMeta}>
              {group.members.length} members · {group.currency}
            </Text>
          </View>
          <Pressable
            onPress={() =>
              navigation.navigate("SplitGroupSettings", { groupId })
            }
            style={styles.settingsButton}
          >
            <Ionicons
              name="settings-outline"
              size={24}
              color={colors.primary}
            />
          </Pressable>
        </View>

        <View style={styles.summaryCard}>
          <Text
            style={[
              styles.status,
              {
                color:
                  currentBalanceCents < 0
                    ? colors.danger
                    : currentBalanceCents > 0
                      ? colors.primary
                      : colors.muted,
              },
            ]}
          >
            {statusText}
          </Text>
          <View style={styles.summaryGrid}>
            <Metric
              label="Total spending"
              value={formatCurrency(
                group.totalAmountCents / 100,
                group.currency,
              )}
            />
            <Metric
              label="Your share"
              value={formatCurrency(
                (currentBalance?.totalShareCents ?? 0) / 100,
                group.currency,
              )}
            />
            <Metric
              label="You paid"
              value={formatCurrency(
                (currentBalance?.totalPaidCents ?? 0) / 100,
                group.currency,
              )}
            />
            <Metric
              label="Net"
              value={formatCurrency(
                Math.abs(currentBalanceCents) / 100,
                group.currency,
              )}
            />
          </View>
        </View>

        <View style={styles.actionRow}>
          <CompactActionRow
            actions={[
              {
                label: "Expense",
                icon: "add-circle",
                variant: "primary",
                onPress: () =>
                  navigation.navigate("AddSplitExpense", { groupId }),
              },
              {
                label: "Settle",
                icon: "swap-horizontal",
                variant: "secondary",
                onPress: () => navigation.navigate("Settlement", { groupId }),
              },
              {
                label: "Member",
                icon: "person-add",
                variant: "secondary",
                onPress: () =>
                  navigation.navigate("SplitGroupSettings", { groupId }),
              },
            ]}
          />
        </View>

        <Section title="Who owes whom" />
        {debts.length === 0 ? (
          <Text style={styles.mutedCard}>Everyone is settled up.</Text>
        ) : (
          debts.map((debt) => (
            <View
              key={`${debt.fromMemberId}-${debt.toMemberId}`}
              style={styles.balanceRow}
            >
              <Text style={styles.rowTitle}>
                {debt.fromMember.isCurrentUser ? "You" : debt.fromMember.name}{" "}
                owes {debt.toMember.isCurrentUser ? "you" : debt.toMember.name}
              </Text>
              <Text style={styles.amount}>
                {formatCurrency(debt.amountCents / 100, group.currency)}
              </Text>
            </View>
          ))
        )}

        <Section title="Expenses" />
        {group.expenses.length === 0 ? (
          <EmptyState
            title="No expenses yet"
            message="Add the first shared expense."
            actionLabel="Add Expense"
            onAction={() => navigation.navigate("AddSplitExpense", { groupId })}
          />
        ) : (
          group.expenses.map((expense) => (
            <Pressable
              key={expense.id}
              style={({ pressed }) => [styles.card, pressed && styles.pressed]}
              onPress={() =>
                navigation.navigate("SplitExpenseDetail", {
                  expenseId: expense.id,
                })
              }
            >
              <View style={styles.rowBetween}>
                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle}>{expense.title}</Text>
                  <Text style={styles.meta}>
                    Paid by{" "}
                    {expense.paidBy?.isCurrentUser
                      ? "you"
                      : (expense.paidBy?.name ?? "Unknown")}{" "}
                    · {expense.date}
                  </Text>
                </View>
                <Text style={styles.amount}>
                  {formatCurrency(expense.amountCents / 100, group.currency)}
                </Text>
              </View>
            </Pressable>
          ))
        )}

        <Section title="Members" />
        {(balances.data ?? group.balances ?? []).length === 0 ? (
          <Text style={styles.mutedCard}>No members</Text>
        ) : (
          <GroupedTableCard
            headers={["Name", "Paid", "Share", "Net"]}
            columnWidths={[0.3, 0.23, 0.23, 0.24]}
            rows={(balances.data ?? group.balances ?? []).map((balance) => ({
              columns: [
                {
                  label:
                    balance.member.name +
                    (balance.member.isCurrentUser ? " (you)" : ""),
                  value:
                    balance.member.name +
                    (balance.member.isCurrentUser ? " (you)" : ""),
                },
                {
                  label: "Paid",
                  value: formatCurrency(
                    balance.totalPaidCents / 100,
                    group.currency,
                  ),
                },
                {
                  label: "Share",
                  value: formatCurrency(
                    balance.totalShareCents / 100,
                    group.currency,
                  ),
                },
                {
                  label: "Net",
                  value: formatCurrency(
                    Math.abs(balance.netCents) / 100,
                    group.currency,
                  ),
                  tone:
                    balance.netCents < 0
                      ? "red"
                      : balance.netCents > 0
                        ? "green"
                        : "muted",
                },
              ],
              divider: true,
            }))}
          />
        )}

        <Section title="Settlements" />
        {(settlements.data ?? []).length === 0 ? (
          <EmptyState
            title="No settlements recorded"
            message="When someone pays back, record it here."
            actionLabel="Settle Up"
            onAction={() => navigation.navigate("Settlement", { groupId })}
          />
        ) : (
          (settlements.data ?? []).map((settlement) => (
            <View key={settlement.id} style={styles.balanceRow}>
              <Text style={styles.rowTitle}>
                {settlement.fromMember?.name} paid {settlement.toMember?.name}
              </Text>
              <Text style={styles.amount}>
                {formatCurrency(settlement.amountCents / 100, group.currency)}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function Section({ title }: { title: string }) {
  return <Text style={styles.section}>{title}</Text>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: {
    gap: spacing.md,
    paddingBottom: 120,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  backButton: { width: 40, height: 40, justifyContent: "center" },
  headerInfo: { flex: 1 },
  headerTitle: {
    color: colors.text,
    fontSize: fontSize.title,
    fontWeight: "900",
  },
  headerMeta: {
    color: colors.muted,
    fontSize: fontSize.caption,
    marginTop: spacing.xs,
  },
  settingsButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  summaryCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    gap: spacing.md,
  },
  status: { fontSize: 24, fontWeight: "900" },
  summaryGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  metric: {
    width: "48%",
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.md,
    gap: 3,
  },
  metricLabel: {
    color: colors.muted,
    fontSize: fontSize.caption,
    fontWeight: "700",
  },
  metricValue: {
    color: colors.text,
    fontSize: fontSize.bodyLarge,
    fontWeight: "900",
  },
  actions: { gap: spacing.sm },
  section: {
    color: colors.text,
    fontSize: fontSize.section,
    fontWeight: "800",
    marginTop: spacing.sm,
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
    gap: spacing.sm,
  },
  mutedCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
    color: colors.muted,
    fontSize: fontSize.body,
    fontWeight: "700",
  },
  balanceRow: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  rowBody: { flex: 1 },
  rowTitle: {
    color: colors.text,
    fontSize: fontSize.bodyLarge,
    fontWeight: "800",
  },
  balanceValue: { fontSize: fontSize.body, fontWeight: "900" },
  amount: {
    color: colors.primary,
    fontSize: fontSize.bodyLarge,
    fontWeight: "900",
  },
  meta: {
    color: colors.muted,
    fontSize: fontSize.caption,
    lineHeight: 18,
    marginTop: 2,
  },
  pressed: { opacity: 0.86, transform: [{ scale: 0.98 }] },
});
