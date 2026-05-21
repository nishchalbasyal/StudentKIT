import { useMemo, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import DateTimePicker, { DateTimePickerAndroid, type DateTimePickerEvent } from "@react-native-community/datetimepicker";
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
  if (!value) return new Date();
  const date = value.includes("T") ? new Date(value) : new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function toDateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function formatReadableDate(value?: string | null) {
  if (!value) return "";
  const date = parseValue(value);
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

export function AppDatePicker({ label, value, onChange, error, placeholder = "Pick date" }: Props) {
  const [visible, setVisible] = useState(false);
  const date = useMemo(() => parseValue(value), [value]);
  const display = value ? formatReadableDate(value) : placeholder;

  const handleChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS !== "ios") setVisible(false);
    if (selected) onChange(toDateOnly(selected));
  };

  const openPicker = () => {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: date,
        mode: "date",
        display: "default",
        onChange: handleChange,
      });
      return;
    }

    setVisible(true);
  };

  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={[styles.field, error && styles.errorBorder]} onPress={openPicker}>
        <Text style={[styles.value, !value && styles.placeholder]}>{display}</Text>
        <Ionicons name="calendar-outline" size={20} color={colors.primary} />
      </Pressable>
      {visible && Platform.OS !== "android" ? <DateTimePicker value={date} mode="date" display="default" onChange={handleChange} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.xs },
  label: { color: colors.text, fontSize: fontSize.body, fontWeight: "700" },
  field: {
    minHeight: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  errorBorder: { borderColor: colors.danger },
  value: { flex: 1, color: colors.text, fontSize: fontSize.bodyLarge, fontWeight: "600" },
  placeholder: { color: colors.muted },
  error: { color: colors.danger, fontSize: fontSize.caption },
});
