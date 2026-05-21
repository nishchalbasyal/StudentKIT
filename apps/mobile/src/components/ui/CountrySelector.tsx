import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AppInput } from "./AppInput";
import { colors, fontSize, radius, spacing } from "../../constants/colors";
import { countries, searchCountries, type CountryConfig } from "../../config/countries";

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
  const [query, setQuery] = useState(selected?.name ?? value);
  const results = useMemo(() => searchCountries(query), [query]);

  return (
    <View style={styles.wrap}>
      <AppInput
        label={label}
        value={query}
        onChangeText={setQuery}
        autoCapitalize="words"
        placeholder="Germany, Nepal, United States..."
      />
      <View style={styles.results}>
        {results.map((country) => (
          <Pressable
            key={country.code}
            accessibilityRole="button"
            onPress={() => {
              setQuery(country.name);
              onChange(country);
            }}
            style={({ pressed }) => [
              styles.option,
              country.code === value && styles.active,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.name}>{country.name}</Text>
            <Text style={styles.meta}>
              {country.code} - {country.defaultCurrency} - {country.defaultTimeFormat}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  results: { gap: spacing.xs },
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
  pressed: { opacity: 0.78 },
});
