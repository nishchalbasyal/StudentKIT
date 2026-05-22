import { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
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
import { AppButton } from "../../components/ui/AppButton";
import { AppHeader } from "../../components/ui/AppHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { FloatingActionButton } from "../../components/ui/FloatingActionButton";
import { LoadingState } from "../../components/ui/LoadingState";
import { SegmentedTabs } from "../../components/ui/SegmentedTabs";
import {
  colors,
  fontSize,
  radius,
  shadows,
  spacing,
} from "../../constants/colors";
import {
  useSplitActivity,
  useSplitFriends,
  useSplitGroups,
  useSplitSummary,
} from "../../hooks/useSplit";
import type { RootStackParamList } from "../../navigation/types";
import { useAuthStore } from "../../store/authStore";
import type {
  SplitActivity,
  SplitFriendBalance,
  SplitGroup,
} from "../../types/split.types";
import { formatCurrency } from "../../utils/formatCurrency";

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type Tab = "groups" | "friends" | "activity";

const tabs = [
  { key: "groups", label: "Groups" },
  { key: "friends", label: "Friends" },
  { key: "activity", label: "Activity" },
] as const;

export function SplitGroupsScreen() {
  const navigation = useNavigation<Navigation>();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const groupsQuery = useSplitGroups();
  const summary = useSplitSummary();
  const [activeTab, setActiveTab] = useState<Tab>("groups");

  const groups = useMemo(
    () => groupsQuery.groups.filter((group) => !group.archivedAt),
    [groupsQuery.groups],
  );

  if (groupsQuery.isLoading || summary.isLoading) {
    return (
      <SafeAreaView edges={["top"]} style={styles.safe}>
        <LoadingState label="Loading splits" />
      </SafeAreaView>
    );
  }

  if (groupsQuery.isError || summary.isError) {
    return (
      <SafeAreaView edges={["top"]} style={styles.safe}>
        <ErrorState
          message="Could not load splits."
          onRetry={() => {
            void groupsQuery.refetch();
            void summary.refetch();
          }}
        />
      </SafeAreaView>
    );
  }

  const balanceCents = summary.data?.balanceCents ?? 0;
  const balanceText =
    balanceCents > 0
      ? `You are owed ${formatCurrency(balanceCents / 100, summary.data?.currency ?? user?.currency)}`
      : balanceCents < 0
        ? `You owe ${formatCurrency(Math.abs(balanceCents) / 100, summary.data?.currency ?? user?.currency)}`
        : "You are settled up";

  const fabAction = () => {
    if (activeTab === "groups") {
      navigation.navigate(
        groups.length ? "AddSplitExpense" : "AddEditSplitGroup",
      );
      return;
    }
    if (activeTab === "friends") {
      navigation.navigate("AddEditSplitGroup");
      return;
    }
    navigation.navigate(
      groups.length ? "AddSplitExpense" : "AddEditSplitGroup",
    );
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 0) + 140 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <AppHeader
          title="Splits"
          avatarText={user?.name ?? "ST"}
          showSettings
        />

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Overall balance</Text>
          <Text
            style={[
              styles.summaryAmount,
              {
                color:
                  balanceCents > 0
                    ? colors.primary
                    : balanceCents < 0
                      ? colors.danger
                      : colors.muted,
              },
            ]}
          >
            {balanceText}
          </Text>
          <Text style={styles.summaryMeta}>
            {summary.data?.groupsCount ?? groups.length} groups -{" "}
            {summary.data?.expenseCount ?? 0} expenses
          </Text>
        </View>

        <SegmentedTabs tabs={tabs} value={activeTab} onChange={setActiveTab} />

        {activeTab === "groups" ? (
          <GroupsTab
            groups={groups}
            navigation={navigation}
            onArchive={groupsQuery.archiveGroup}
            onDelete={groupsQuery.deleteGroup}
          />
        ) : activeTab === "friends" ? (
          <FriendsTab navigation={navigation} />
        ) : (
          <ActivityTab navigation={navigation} groupsCount={groups.length} />
        )}
      </ScrollView>

      <FloatingActionButton onPress={fabAction} />
    </SafeAreaView>
  );
}

function GroupsTab({
  groups,
  navigation,
  onArchive,
  onDelete,
}: {
  groups: SplitGroup[];
  navigation: Navigation;
  onArchive: (id: string) => Promise<SplitGroup>;
  onDelete: (id: string) => Promise<{ id: string }>;
}) {
  if (groups.length === 0) {
    return (
      <EmptyState
        title="No split groups yet"
        message="Create a Expense  to split rent, groceries, trips, or parties."
        actionLabel="Create Expense"
        onAction={() => navigation.navigate("AddEditSplitGroup")}
      />
    );
  }

  const showActions = (group: SplitGroup) => {
    Alert.alert(group.name, "Choose an action", [
      {
        text: "View",
        onPress: () =>
          navigation.navigate("SplitGroupDetail", { groupId: group.id }),
      },
      {
        text: "Add Expense",
        onPress: () =>
          navigation.navigate("AddSplitExpense", { groupId: group.id }),
      },
      {
        text: "Edit Group",
        onPress: () =>
          navigation.navigate("AddEditSplitGroup", { groupId: group.id }),
      },
      {
        text: "Add Member",
        onPress: () =>
          navigation.navigate("SplitGroupSettings", { groupId: group.id }),
      },
      {
        text: "View Balances",
        onPress: () =>
          navigation.navigate("SplitGroupDetail", { groupId: group.id }),
      },
      { text: "Archive Group", onPress: () => void onArchive(group.id) },
      {
        text: "Delete Group",
        style: "destructive",
        onPress: () => void onDelete(group.id),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <View style={styles.stack}>
      {groups.map((group) => {
        const balanceCents = group.currentUserBalanceCents ?? 0;
        const balanceLabel =
          balanceCents > 0
            ? `You are owed ${formatCurrency(balanceCents / 100, group.currency)}`
            : balanceCents < 0
              ? `You owe ${formatCurrency(Math.abs(balanceCents) / 100, group.currency)}`
              : "You are settled up";

        return (
          <Pressable
            key={group.id}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
            onPress={() =>
              navigation.navigate("SplitGroupDetail", { groupId: group.id })
            }
            onLongPress={() => showActions(group)}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardBody}>
                <Text numberOfLines={1} style={styles.cardTitle}>
                  {group.name}
                </Text>
                <Text numberOfLines={1} style={styles.cardMeta}>
                  {group.members.length} members · {group.expenses.length}{" "}
                  {group.expenses.length === 1 ? "expense" : "expenses"}
                </Text>
              </View>
              <Pressable
                style={styles.iconButton}
                onPress={() => showActions(group)}
                hitSlop={8}
              >
                <Ionicons
                  name="ellipsis-horizontal"
                  size={18}
                  color={colors.muted}
                />
              </Pressable>
            </View>
            <Text
              style={[
                styles.balanceText,
                {
                  color:
                    balanceCents < 0
                      ? colors.danger
                      : balanceCents > 0
                        ? colors.primary
                        : colors.muted,
                },
              ]}
            >
              {balanceLabel}
            </Text>
            <View style={styles.cardFooter}>
              <Pressable
                style={styles.compactAction}
                onPress={() =>
                  navigation.navigate("SplitGroupDetail", { groupId: group.id })
                }
              >
                <Ionicons name="eye-outline" size={14} color={colors.primary} />
                <Text style={styles.compactActionText}>View</Text>
              </Pressable>
              <Pressable
                style={styles.compactAction}
                onPress={() =>
                  navigation.navigate("AddSplitExpense", { groupId: group.id })
                }
              >
                <Ionicons name="add" size={14} color={colors.primary} />
                <Text style={styles.compactActionText}>Add</Text>
              </Pressable>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function FriendsTab({ navigation }: { navigation: Navigation }) {
  const friends = useSplitFriends();

  if (friends.isLoading) return <LoadingState label="Loading friends" />;
  if (friends.isError)
    return <ErrorState message="Could not load friend balances." />;

  const items = friends.data ?? [];
  if (items.length === 0) {
    return (
      <EmptyState
        title="No friends yet"
        message="Add friends or create a group to see friend-wise balances."
        actionLabel="Create Expense"
        onAction={() => navigation.navigate("AddEditSplitGroup")}
      />
    );
  }

  return (
    <View style={styles.stack}>
      {items.map((friend: SplitFriendBalance) => {
        const groupNames = friend.groups
          .map((group) => group.groupName)
          .join(", ");
        const label =
          friend.balanceCents > 0
            ? `You are owed ${formatCurrency(friend.balanceCents / 100, friend.currency)}`
            : friend.balanceCents < 0
              ? `You owe ${formatCurrency(Math.abs(friend.balanceCents) / 100, friend.currency)}`
              : "Settled up";
        return (
          <View key={friend.id} style={styles.friendRow}>
            <Pressable
              style={({ pressed }) => [
                styles.friendPress,
                pressed && styles.pressed,
              ]}
              onPress={() =>
                navigation.navigate("FriendDetail", { friendId: friend.id })
              }
            >
              <View style={styles.avatarSmall}>
                <Text style={styles.avatarSmallText}>
                  {friend.name.slice(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle}>{friend.name}</Text>
                <Text
                  style={[
                    styles.rowAmount,
                    {
                      color:
                        friend.balanceCents < 0
                          ? colors.danger
                          : friend.balanceCents > 0
                            ? colors.primary
                            : colors.muted,
                    },
                  ]}
                >
                  {label}
                </Text>
                <Text style={styles.cardMeta}>
                  From: {groupNames || "Split groups"}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.muted} />
            </Pressable>
            <AppButton
              title="Settle Up"
              icon="swap-horizontal-outline"
              variant="secondary"
              onPress={() =>
                navigation.navigate("Settlement", {
                  groupId: friend.groups[0]?.groupId,
                })
              }
            />
          </View>
        );
      })}
    </View>
  );
}

function ActivityTab({
  navigation,
  groupsCount,
}: {
  navigation: Navigation;
  groupsCount: number;
}) {
  const activity = useSplitActivity();

  if (activity.isLoading) return <LoadingState label="Loading activity" />;
  if (activity.isError)
    return <ErrorState message="Could not load split activity." />;

  const items = activity.data ?? [];
  if (items.length === 0) {
    return (
      <EmptyState
        title="No activity yet"
        message="Expenses, settlements, and group updates will appear here."
        actionLabel="Create Group"
        onAction={() => navigation.navigate("AddEditSplitGroup")}
      />
    );
  }

  const openActivity = (item: SplitActivity) => {
    const expenseId =
      typeof item.metadata?.expenseId === "string"
        ? item.metadata.expenseId
        : undefined;
    if (expenseId) {
      navigation.navigate("SplitExpenseDetail", { expenseId });
      return;
    }
    navigation.navigate("SplitGroupDetail", { groupId: item.groupId });
  };

  return (
    <View style={styles.stack}>
      {items.map((item) => (
        <Pressable
          key={item.id}
          style={({ pressed }) => [
            styles.activityRow,
            pressed && styles.pressed,
          ]}
          onPress={() => openActivity(item)}
        >
          <View style={styles.iconSoft}>
            <Ionicons
              name={activityIcon(item.type)}
              size={20}
              color={colors.primary}
            />
          </View>
          <View style={styles.rowBody}>
            <Text style={styles.rowTitle}>{item.message}</Text>
            <Text style={styles.cardMeta}>
              {item.group?.name ?? "Split group"} -{" "}
              {new Date(item.createdAt).toLocaleString()}
            </Text>
          </View>
        </Pressable>
      ))}
      {groupsCount > 0 ? (
        <AppButton
          title="Add Expense"
          icon="add-circle-outline"
          onPress={() => navigation.navigate("AddSplitExpense")}
        />
      ) : null}
    </View>
  );
}

function activityIcon(type: string): keyof typeof Ionicons.glyphMap {
  if (type.includes("EXPENSE")) return "receipt-outline";
  if (type.includes("SETTLEMENT")) return "swap-horizontal-outline";
  if (type.includes("MEMBER")) return "person-add-outline";
  return "git-branch-outline";
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md },
  summaryCard: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.xs,
    ...shadows.soft,
  },
  summaryLabel: {
    color: colors.muted,
    fontSize: fontSize.caption,
    fontWeight: "800",
  },
  summaryAmount: { fontSize: 24, fontWeight: "900" },
  summaryMeta: {
    color: colors.muted,
    fontSize: fontSize.caption,
    fontWeight: "700",
  },
  stack: { gap: spacing.md },
  card: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.soft,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  cardBody: { flex: 1, minWidth: 0 },
  cardTitle: {
    color: colors.text,
    fontSize: fontSize.bodyLarge,
    fontWeight: "800",
  },
  cardMeta: { color: colors.muted, fontSize: fontSize.caption, marginTop: 2 },
  balanceText: {
    fontSize: fontSize.bodyLarge,
    fontWeight: "900",
    marginVertical: spacing.xs,
  },
  cardFooter: {
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "flex-start",
  },
  compactAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: colors.border + "20",
  },
  compactActionText: {
    color: colors.primary,
    fontSize: fontSize.caption,
    fontWeight: "700",
  },
  iconButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceMuted,
    marginTop: -2,
  },
  friendRow: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
    gap: spacing.md,
  },
  friendPress: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  activityRow: {
    minHeight: 76,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  rowBody: { flex: 1 },
  rowTitle: {
    color: colors.text,
    fontSize: fontSize.bodyLarge,
    fontWeight: "800",
  },
  rowAmount: { fontSize: fontSize.body, fontWeight: "800", marginTop: 2 },
  avatarSmall: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: colors.action,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarSmallText: {
    color: "#FFFFFF",
    fontSize: fontSize.badge,
    fontWeight: "900",
  },
  iconSoft: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.softGreen,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.88 },
});
