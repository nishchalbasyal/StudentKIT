import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fontSize, radius, spacing } from "../../constants/colors";
import type { Suggestion } from "../../utils/suggestionEngine";

export function SuggestionChips({
  label,
  suggestions,
  onSelect
}: {
  label?: string;
  suggestions: Suggestion[];
  onSelect: (value: Suggestion["value"]) => void;
}) {
  if (suggestions.length === 0) return null;

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.row}>
        {suggestions.map((suggestion) => (
          <Pressable
            key={`${suggestion.label}-${suggestion.value}`}
            accessibilityRole="button"
            onPress={() => onSelect(suggestion.value)}
            style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
          >
            <Text style={styles.chipText}>{suggestion.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs
  },
  label: {
    color: colors.muted,
    fontSize: fontSize.caption,
    fontWeight: "700"
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  chip: {
    minHeight: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.softGreen,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center"
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.86
  },
  chipText: {
    color: colors.primary,
    fontSize: fontSize.caption,
    fontWeight: "800"
  }
});
