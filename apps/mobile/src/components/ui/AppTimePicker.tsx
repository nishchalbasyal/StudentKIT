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

function parseTime(value?: string | null) {
  const date = new Date();
  const [hours = 9, minutes = 0] = (value || "09:00").split(":").map(Number);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function toTime(value: Date) {
  return `${String(value.getHours()).padStart(2, "0")}:${String(value.getMinutes()).padStart(2, "0")}`;
}

export function AppTimePicker({ label, value, onChange, error, placeholder = "Pick time" }: Props) {
  const [visible, setVisible] = useState(false);
  const date = useMemo(() => parseTime(value), [value]);

  const handleChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS !== "ios") setVisible(false);
    if (selected) onChange(toTime(selected));
  };

  const openPicker = () => {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: date,
        mode: "time",
        is24Hour: true,
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
        <Text style={[styles.value, !value && styles.placeholder]}>{value || placeholder}</Text>
        <Ionicons name="time-outline" size={20} color={colors.primary} />
      </Pressable>
      {visible && Platform.OS !== "android" ? <DateTimePicker value={date} mode="time" is24Hour display="default" onChange={handleChange} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.xs },
  label: { color: colors.text, fontSize: fontSize.body, fontWeight: "700" },
  field: { minHeight: 50, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: spacing.md, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  errorBorder: { borderColor: colors.danger },
  value: { flex: 1, color: colors.text, fontSize: fontSize.bodyLarge, fontWeight: "700" },
  placeholder: { color: colors.muted, fontWeight: "600" },
  error: { color: colors.danger, fontSize: fontSize.caption },
});
