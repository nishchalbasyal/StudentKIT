import { StyleSheet, Text, View } from "react-native";
import {
  colors,
  fontSize,
  radius,
  spacing,
  shadows,
} from "../../constants/colors";

export type ReceiptRow = {
  label: string;
  value: string;
  valueTone?: "default" | "green" | "red" | "orange" | "muted";
  bold?: boolean;
  divider?: boolean;
};

type Props = {
  title?: string;
  rows: ReceiptRow[];
};

export function ReceiptCard({ title, rows }: Props) {
  return (
    <View style={styles.card}>
      {title && <Text style={styles.title}>{title}</Text>}
      <View style={styles.rows}>
        {rows.map((row, index) => {
          const valueColor =
            row.valueTone === "green"
              ? colors.primary
              : row.valueTone === "red"
                ? colors.danger
                : row.valueTone === "orange"
                  ? colors.warning
                  : row.valueTone === "muted"
                    ? colors.muted
                    : colors.text;

          return (
            <View key={index}>
              <View style={styles.row}>
                <Text style={[styles.label, row.bold && styles.boldLabel]}>
                  {row.label}
                </Text>
                <Text
                  style={[
                    styles.value,
                    { color: valueColor },
                    row.bold && styles.boldValue,
                  ]}
                >
                  {row.value}
                </Text>
              </View>
              {row.divider && <View style={styles.divider} />}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.soft,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.body,
    fontWeight: "700",
    marginBottom: spacing.sm,
  },
  rows: {
    gap: 0,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 32,
    paddingVertical: spacing.xs,
  },
  label: {
    color: colors.muted,
    fontSize: fontSize.caption,
    fontWeight: "600",
    flex: 1,
  },
  boldLabel: {
    color: colors.text,
    fontWeight: "700",
    fontSize: fontSize.body,
  },
  value: {
    color: colors.text,
    fontSize: fontSize.caption,
    fontWeight: "700",
    textAlign: "right",
  },
  boldValue: {
    fontSize: fontSize.body,
    fontWeight: "800",
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
});
