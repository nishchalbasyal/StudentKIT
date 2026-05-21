import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppScreen } from "../../components/ui/AppScreen";
import { EmptyState } from "../../components/ui/EmptyState";
import { LoadingState } from "../../components/ui/LoadingState";
import { searchApi } from "../../api/search.api";
import { colors, fontSize, radius, spacing } from "../../constants/colors";
import type { RootStackParamList } from "../../navigation/types";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function GlobalSearchScreen() {
  const navigation = useNavigation<Navigation>();
  const [query, setQuery] = useState("");
  const results = useQuery({ queryKey: ["search", query], queryFn: () => searchApi(query) });

  const openResult = (result: { route: string; params?: Record<string, string> }) => {
    (navigation.navigate as any)(result.route, result.params);
  };

  return (
    <AppScreen title="Search">
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={20} color={colors.muted} />
        <TextInput placeholder="Search anything..." placeholderTextColor={colors.muted} style={styles.input} value={query} onChangeText={setQuery} autoFocus />
      </View>
      <Text style={styles.section}>{query.trim() ? "Results" : "Recent items"}</Text>
      {results.isLoading ? <LoadingState label="Searching" /> : (results.data ?? []).length === 0 ? (
        <EmptyState title="No results found" message="Try a task, company, expense, grocery, split group, coupon, or event." />
      ) : (results.data ?? []).map((result) => (
        <Pressable key={`${result.type}-${result.id}`} style={({ pressed }) => [styles.row, pressed && styles.pressed]} onPress={() => openResult(result)}>
          <View style={styles.icon}><Ionicons name="search-outline" size={18} color={colors.primary} /></View>
          <View style={styles.body}>
            <Text style={styles.title}>{result.title}</Text>
            <Text style={styles.meta}>{result.type}{result.subtitle ? ` · ${result.subtitle}` : ""}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </Pressable>
      ))}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  searchBox: { height: 52, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.md, gap: spacing.sm },
  input: { flex: 1, color: colors.text, fontSize: fontSize.bodyLarge },
  section: { color: colors.text, fontSize: fontSize.section, fontWeight: "700", marginTop: spacing.sm },
  row: { minHeight: 64, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.md, flexDirection: "row", alignItems: "center", gap: spacing.md },
  pressed: { opacity: 0.84, transform: [{ scale: 0.98 }] },
  icon: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.softGreen, alignItems: "center", justifyContent: "center" },
  body: { flex: 1 },
  title: { color: colors.text, fontSize: fontSize.bodyLarge, fontWeight: "800" },
  meta: { color: colors.muted, fontSize: fontSize.caption, marginTop: 2 },
});
