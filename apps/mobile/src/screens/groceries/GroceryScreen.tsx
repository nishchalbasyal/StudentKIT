import { Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { getApiErrorMessage } from "../../api/apiClient";
import { AppButton } from "../../components/ui/AppButton";
import { AppScreen } from "../../components/ui/AppScreen";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { LoadingState } from "../../components/ui/LoadingState";
import { colors, fontSize, radius, spacing } from "../../constants/colors";
import { useGroceries } from "../../hooks/useGroceries";
import type { RootStackParamList } from "../../navigation/types";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function GroceryScreen() {
  const navigation = useNavigation<Navigation>();
  const { groceries } = useGroceries();
  const items = groceries.data ?? [];

  return (
    <AppScreen title="Groceries" subtitle="Shopping memory, finish-soon reminders, and price history.">
      <View style={styles.topCard}>
        <View>
          <Text style={styles.kicker}>Shopping List</Text>
          <Text style={styles.count}>{items.length || 5} items</Text>
        </View>
        <AppButton title="Add item" icon="add-outline" onPress={() => navigation.navigate("AddGroceryItem")} />
      </View>

      {groceries.isLoading ? <LoadingState /> : groceries.isError ? (
        <ErrorState message={getApiErrorMessage(groceries.error)} />
      ) : items.length === 0 ? (
        <EmptyState title="Your shopping list is empty." message="Add groceries you buy often to track prices and reminders." actionLabel="Add Grocery" onAction={() => navigation.navigate("AddGroceryItem")} />
      ) : (
        <>
          <Text style={styles.sectionTitle}>Need to buy</Text>
          {items.slice(0, 5).map((item) => (
            <Pressable key={item.id} style={styles.itemCard} onPress={() => navigation.navigate("GroceryDetails", { groceryItemId: item.id, name: item.name })}>
              <View style={styles.iconSoft}><Ionicons name="basket-outline" size={21} color={colors.primary} /></View>
              <View style={styles.body}>
                <Text style={styles.title}>{item.name}</Text>
                <Text style={styles.meta}>Last bought: EUR 1.29 at Aldi</Text>
                <Text style={styles.meta}>Usually lasts: {item.estimatedDaysLasts ?? 4} days · May finish tomorrow</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </Pressable>
          ))}
        </>
      )}

      <Text style={styles.sectionTitle}>Price memory</Text>
      <View style={styles.infoCard}>
        <Text style={styles.title}>Cheapest known store</Text>
        <Text style={styles.meta}>Milk: Aldi · Eggs: Lidl · Rice: Rewe</Text>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  topCard: { borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.lg, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md },
  kicker: { color: colors.muted, fontSize: fontSize.caption, fontWeight: "700" },
  count: { color: colors.text, fontSize: 22, fontWeight: "800", marginTop: 2 },
  sectionTitle: { color: colors.text, fontSize: fontSize.section, fontWeight: "700", marginTop: spacing.xs },
  itemCard: { minHeight: 86, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.md, flexDirection: "row", alignItems: "center", gap: spacing.md },
  iconSoft: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.softGreen, alignItems: "center", justifyContent: "center" },
  body: { flex: 1 },
  title: { color: colors.text, fontSize: fontSize.bodyLarge, fontWeight: "700" },
  meta: { color: colors.muted, fontSize: fontSize.caption, lineHeight: 18 },
  infoCard: { borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.lg, gap: spacing.xs }
});
