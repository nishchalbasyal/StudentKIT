import { StyleSheet, Text, View } from "react-native";
import type { ComponentProps } from "react";
import { Ionicons } from "@expo/vector-icons";
import { colors, fontSize, spacing } from "../../constants/colors";

type IconName = ComponentProps<typeof Ionicons>["name"];

type Props = {
  icon?: IconName;
  label: string;
  value: string;
  valueTone?: "default" | "green" | "red" | "orange" | "muted";
};

export function InfoRow({ icon, label, value, valueTone = "default" }: Props) {
  const valueColor =
    valueTone === "green"
      ? colors.primary
      : valueTone === "red"
        ? colors.danger
        : valueTone === "orange"
          ? colors.warning
          : valueTone === "muted"
            ? colors.muted
            : colors.text;

  return (
    <View style={styles.row}>
      {icon && (
        <Ionicons
          name={icon}
          size={18}
          color={colors.muted}
          style={styles.icon}
        />
      )}
      <View style={styles.body}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: 48,
    paddingVertical: spacing.sm,
  },
  icon: {
    marginTop: 2,
  },
  body: {
    flex: 1,
  },
  label: {
    color: colors.muted,
    fontSize: fontSize.caption,
    fontWeight: "600",
    marginBottom: 2,
  },
  value: {
    color: colors.text,
    fontSize: fontSize.body,
    fontWeight: "700",
  },
});
