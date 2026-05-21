import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fontSize, radius, spacing } from "../../constants/colors";

export type ChipOption = {
  label: string;
  value: string | number;
  disabled?: boolean;
};

type Props = {
  options: ChipOption[];
  value?: string | number | null;
  onChange: (value: string | number) => void;
  label?: string;
  multiple?: boolean;
  selectedValues?: (string | number)[];
};

export function ChipSelector({
  options,
  value,
  onChange,
  label,
  multiple = false,
  selectedValues,
}: Props) {
  const isSelected = (optionValue: string | number) => {
    if (multiple && selectedValues) {
      return selectedValues.includes(optionValue);
    }
    return value === optionValue;
  };

  const handlePress = (optionValue: string | number) => {
    if (multiple && selectedValues) {
      if (selectedValues.includes(optionValue)) {
        onChange(optionValue); // Component parent handles multi-select toggling
      } else {
        onChange(optionValue);
      }
    } else {
      onChange(optionValue);
    }
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.chips}>
        {options.map((option) => (
          <Pressable
            key={option.value}
            disabled={option.disabled}
            onPress={() => handlePress(option.value)}
            style={({ pressed }) => [
              styles.chip,
              isSelected(option.value) && styles.chipSelected,
              option.disabled && styles.chipDisabled,
              pressed && !option.disabled && styles.chipPressed,
            ]}
          >
            <Text
              style={[
                styles.chipText,
                isSelected(option.value) && styles.chipTextSelected,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  label: {
    color: colors.text,
    fontSize: fontSize.caption,
    fontWeight: "700",
    paddingHorizontal: spacing.sm,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  chipSelected: {
    backgroundColor: colors.softGreen,
    borderColor: colors.primary,
  },
  chipDisabled: {
    opacity: 0.5,
  },
  chipPressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.8,
  },
  chipText: {
    color: colors.text,
    fontSize: fontSize.caption,
    fontWeight: "700",
  },
  chipTextSelected: {
    color: colors.primary,
  },
});
