import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { AppInput } from "./AppInput";
import { colors, fontSize, radius, spacing } from "../../constants/colors";
import {
  countries,
  describeCountryWorkLimit,
  searchCountries,
  type CountryConfig,
} from "../../config/countries";

export function CountrySelector({
  value,
  onChange,
  label = "Country work-limit rule",
}: {
  value: string;
  onChange: (country: CountryConfig) => void;
  label?: string;
}) {
  const selected = countries.find((country) => country.code === value) ?? null;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(selected?.name ?? "");
  const results = useMemo(() => searchCountries(query), [query]);

  useEffect(() => {
    setQuery(selected?.name ?? "");
  }, [selected?.name]);

  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityRole="button"
        onPress={() => setOpen((current) => !current)}
        style={({ pressed }) => [styles.trigger, pressed && styles.pressed]}
      >
        <View style={styles.triggerCopy}>
          <Text style={styles.triggerLabel}>{label}</Text>
          <Text numberOfLines={1} style={styles.triggerValue}>
            {selected
              ? `${selected.name} (${selected.code})`
              : "Select a country"}
          </Text>
          {selected ? (
            <Text style={styles.triggerMeta}>
              {selected.defaultCurrency} · {selected.defaultTimeFormat} ·{" "}
              {describeCountryWorkLimit(selected)}
            </Text>
          ) : null}
        </View>
        <Text style={styles.triggerChevron}>{open ? "▴" : "▾"}</Text>
      </Pressable>

      {open ? (
        <View style={styles.menu}>
          <AppInput
            label="Search country"
            value={query}
            onChangeText={setQuery}
            autoCapitalize="words"
            placeholder="Germany, Nepal, United States..."
          />
          <ScrollView
            style={styles.resultsScroll}
            contentContainerStyle={styles.results}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {results.map((country) => (
              <Pressable
                key={country.code}
                accessibilityRole="button"
                onPress={() => {
                  setQuery(country.name);
                  onChange(country);
                  setOpen(false);
                }}
                style={({ pressed }) => [
                  styles.option,
                  country.code === value && styles.active,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.name}>{country.name}</Text>
                <Text style={styles.meta}>
                  {country.code} - {country.defaultCurrency} -{" "}
                  {country.defaultTimeFormat} -{" "}
                  {describeCountryWorkLimit(country)}
                </Text>
              </Pressable>
            ))}
            {results.length === 0 ? (
              <Text style={styles.empty}>No countries found.</Text>
            ) : null}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  trigger: {
    minHeight: 72,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  triggerCopy: { flex: 1, gap: 2 },
  triggerLabel: {
    color: colors.muted,
    fontSize: fontSize.caption,
    fontWeight: "800",
  },
  triggerValue: {
    color: colors.text,
    fontSize: fontSize.body,
    fontWeight: "800",
  },
  triggerMeta: {
    color: colors.muted,
    fontSize: fontSize.caption,
    fontWeight: "700",
  },
  triggerChevron: { color: colors.primary, fontSize: 18, fontWeight: "900" },
  menu: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  resultsScroll: {
    maxHeight: 260,
  },
  results: { gap: spacing.xs, paddingBottom: spacing.xs },
  option: {
    minHeight: 46,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    justifyContent: "center",
  },
  active: {
    borderColor: colors.primary,
    backgroundColor: colors.softGreen,
  },
  name: { color: colors.text, fontSize: fontSize.body, fontWeight: "800" },
  meta: { color: colors.muted, fontSize: fontSize.caption, fontWeight: "700" },
  empty: {
    color: colors.muted,
    fontSize: fontSize.caption,
    fontWeight: "700",
    paddingVertical: spacing.sm,
  },
  pressed: { opacity: 0.78 },
});
