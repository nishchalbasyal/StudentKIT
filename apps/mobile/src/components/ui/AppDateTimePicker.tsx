import { useMemo, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { colors, fontSize, radius, spacing } from "../../constants/colors";

type Props = {
  label: string;
  value?: string | null;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
};

function parseValue(value?: string | null) {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function formatDateTime(value?: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(parseValue(value));
}

export function AppDateTimePicker({ label, value, onChange, error, placeholder = "Pick date and time" }: Props) {
  const [step, setStep] = useState<"date" | "time" | null>(null);
  const date = useMemo(() => parseValue(value), [value]);

  const handleDate = (_event: DateTimePickerEvent, selected?: Date) => {
    if (!selected) {
      if (Platform.OS !== "ios") setStep(null);
      return;
    }
    const next = new Date(date);
    next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
    onChange(next.toISOString());
    setStep("time");
  };

  const handleTime = (_event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS !== "ios") setStep(null);
    if (!selected) return;
    const next = new Date(date);
    next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
    onChange(next.toISOString());
  };

  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={[styles.field, error && styles.errorBorder]} onPress={() => setStep("date")}>
        <Text style={[styles.value, !value && styles.placeholder]}>{value ? formatDateTime(value) : placeholder}</Text>
        <Ionicons name="notifications-outline" size={20} color={colors.primary} />
      </Pressable>
      {step === "date" ? <DateTimePicker value={date} mode="date" display="default" onChange={handleDate} /> : null}
      {step === "time" ? <DateTimePicker value={date} mode="time" is24Hour display="default" onChange={handleTime} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.xs },
  label: { color: colors.text, fontSize: fontSize.body, fontWeight: "700" },
  field: { minHeight: 50, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: spacing.md, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  errorBorder: { borderColor: colors.danger },
  value: { flex: 1, color: colors.text, fontSize: fontSize.bodyLarge, fontWeight: "600" },
  placeholder: { color: colors.muted },
  error: { color: colors.danger, fontSize: fontSize.caption },
});
