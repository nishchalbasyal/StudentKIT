import { StyleSheet, Text, View } from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppButton } from "../../components/ui/AppButton";
import { AppScreen } from "../../components/ui/AppScreen";
import { EmptyState } from "../../components/ui/EmptyState";
import { colors, fontSize, radius, spacing } from "../../constants/colors";
import { useGroceries } from "../../hooks/useGroceries";
import type { RootStackParamList } from "../../navigation/types";

type Route = RouteProp<RootStackParamList, "GroceryDetails">;
type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function GroceryItemDetailScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Navigation>();
  const { groceries } = useGroceries();
  const item = groceries.data?.find((grocery) => grocery.id === route.params?.groceryItemId);

  if (!item && route.params?.groceryItemId) {
    return <AppScreen title="Grocery Detail"><EmptyState title="Grocery item not found." message="It may have been deleted or is still loading." /></AppScreen>;
  }

  return (
    <AppScreen title={item?.name ?? route.params?.name ?? "Grocery Detail"} subtitle="Shopping memory and price history">
      <View style={styles.card}>
        <Text style={styles.title}>{item?.name ?? "Grocery item"}</Text>
        <Text style={styles.meta}>Category: {item?.category ?? "uncategorized"}</Text>
        <Text style={styles.meta}>Usually lasts: {item?.estimatedDaysLasts ?? 4} days</Text>
        <Text style={styles.meta}>Price memory comes from your grocery history.</Text>
        {item ? <AppButton title="Edit Item" icon="create-outline" variant="secondary" onPress={() => navigation.navigate("AddGroceryItem", { groceryItemId: item.id })} /> : null}
        <AppButton title="View Price History" icon="trending-up-outline" onPress={() => navigation.navigate("StoreComparison", { groceryItemId: item?.id })} />
        <AppButton title="Mark Bought" icon="checkmark-outline" variant="secondary" />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.lg, gap: spacing.md },
  title: { color: colors.text, fontSize: fontSize.section, fontWeight: "800" },
  meta: { color: colors.muted, fontSize: fontSize.body, lineHeight: 20 }
});
