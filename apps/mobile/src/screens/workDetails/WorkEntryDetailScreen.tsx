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
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { AppTopBar } from "../../components/ui/AppTopBar";
import { EmptyState } from "../../components/ui/EmptyState";
import { colors, fontSize, radius, spacing } from "../../constants/colors";
import { useWorkHours } from "../../hooks/useWorkHours";
import type { RootStackParamList } from "../../navigation/types";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatDisplayDate } from "../../utils/formatDate";

type Route = RouteProp<RootStackParamList, "WorkEntryDetail">;
type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function WorkEntryDetailScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Navigation>();
  const insets = useSafeAreaInsets();
  const { workShifts, deleteWorkShift, isSaving } = useWorkHours();
  const shift = workShifts.data?.find(
    (item) => item.id === route.params.workShiftId,
  );

  if (!shift) {
    return (
      <SafeAreaView edges={["top"]} style={styles.safe}>
        <AppTopBar title="Work Entry" />
        <View style={styles.center}>
          <EmptyState
            title="Work entry not found."
            message="It may have been deleted or is still loading."
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 0) + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <AppTopBar title="Work Entry" />

        <View style={styles.header}>
          <Text style={styles.headerTitle}>{shift.jobName}</Text>
          <Text style={styles.headerDate}>{formatDisplayDate(shift.date)}</Text>
        </View>

        <View style={styles.receiptCard}>
          <ReceiptRow label="Company" value={shift.jobName} />
          <ReceiptRow label="Date" value={formatDisplayDate(shift.date)} />
          <ReceiptRow
            label="Time"
            value={`${shift.startTime} - ${shift.endTime}`}
          />
          <ReceiptRow label="Break" value={`${shift.breakMinutes} min`} />
          <View style={styles.divider} />
          <ReceiptRow
            label="Hours worked"
            value={`${shift.calculatedHours}h`}
            bold
          />
          <ReceiptRow
            label="Hourly rate"
            value={formatCurrency(shift.hourlyWage) + "/h"}
            bold
          />
          <View style={styles.divider} />
          <ReceiptRow
            label="Income"
            value={formatCurrency(shift.calculatedIncome)}
            highlight
          />
          {shift.notes && (
            <>
              <View style={styles.divider} />
              <View style={styles.notesRow}>
                <Text style={styles.notesLabel}>Notes</Text>
                <Text style={styles.notesValue}>{shift.notes}</Text>
              </View>
            </>
          )}
        </View>

        <View style={styles.actionRow}>
          <Pressable
            style={({ pressed }) => [
              styles.compactButton,
              styles.secondaryButton,
              pressed && styles.pressed,
            ]}
            onPress={() =>
              navigation.navigate("AddWorkShift", { workShiftId: shift.id })
            }
            disabled={isSaving}
          >
            <Ionicons name="create" size={18} color={colors.primary} />
            <Text style={[styles.compactButtonText, { color: colors.primary }]}>
              Edit
            </Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.compactButton,
              styles.secondaryButton,
              pressed && styles.pressed,
            ]}
            onPress={() =>
              navigation.navigate("AddWorkShift", { duplicateFromId: shift.id })
            }
            disabled={isSaving}
          >
            <Ionicons name="copy" size={18} color={colors.primary} />
            <Text style={[styles.compactButtonText, { color: colors.primary }]}>
              Duplicate
            </Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.compactButton,
              styles.dangerButton,
              pressed && styles.pressed,
            ]}
            onPress={() =>
              Alert.alert("Delete work entry?", "This cannot be undone.", [
                { text: "Cancel" },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: () =>
                    void deleteWorkShift(shift.id).then(() =>
                      navigation.goBack(),
                    ),
                },
              ])
            }
            disabled={isSaving}
          >
            <Ionicons name="trash" size={18} color={colors.danger} />
            <Text style={[styles.compactButtonText, { color: colors.danger }]}>
              Delete
            </Text>
          </Pressable>
        </View>

        <View style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <Ionicons name="bulb" size={20} color={colors.warning} />
            <Text style={styles.insightTitle}>Work Insight</Text>
          </View>
          <Text style={styles.insightText}>
            This entry adds {formatCurrency(shift.calculatedIncome)} to your
            monthly income.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ReceiptRow({
  label,
  value,
  bold,
  highlight,
}: {
  label: string;
  value: string;
  bold?: boolean;
  highlight?: boolean;
}) {
  return (
    <View style={styles.receiptRow}>
      <Text
        style={[
          styles.receiptLabel,
          bold && styles.bold,
          highlight && styles.highlightLabel,
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.receiptValue,
          bold && styles.bold,
          highlight && styles.highlightValue,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  content: { padding: spacing.lg, gap: spacing.md },
  header: {
    marginBottom: spacing.sm,
  },
  headerTitle: {
    color: colors.text,
    fontSize: fontSize.section,
    fontWeight: "800",
  },
  headerDate: {
    color: colors.muted,
    fontSize: fontSize.body,
    marginTop: spacing.xs,
  },
  receiptCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  receiptRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  receiptLabel: {
    color: colors.muted,
    fontSize: fontSize.body,
    fontWeight: "600",
  },
  receiptValue: {
    color: colors.text,
    fontSize: fontSize.body,
    fontWeight: "600",
    textAlign: "right",
  },
  bold: {
    fontWeight: "800",
    color: colors.text,
  },
  highlightLabel: {
    color: colors.primary,
    fontWeight: "800",
  },
  highlightValue: {
    color: colors.primary,
    fontWeight: "800",
    fontSize: fontSize.bodyLarge,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  notesRow: {
    gap: spacing.xs,
  },
  notesLabel: {
    color: colors.muted,
    fontSize: fontSize.caption,
    fontWeight: "700",
  },
  notesValue: {
    color: colors.text,
    fontSize: fontSize.body,
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
  },
  compactButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  dangerButton: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  compactButtonText: {
    fontSize: fontSize.caption,
    fontWeight: "700",
  },
  pressed: { opacity: 0.7 },
  insightCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.warning + "30",
    backgroundColor: colors.warning + "10",
    padding: spacing.lg,
    gap: spacing.sm,
  },
  insightHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  insightTitle: {
    color: colors.text,
    fontSize: fontSize.bodyLarge,
    fontWeight: "800",
  },
  insightText: {
    color: colors.text,
    fontSize: fontSize.body,
    lineHeight: 20,
  },
});
