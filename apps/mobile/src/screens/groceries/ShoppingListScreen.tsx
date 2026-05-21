import { StyleSheet, Text, View } from "react-native";
import { getApiErrorMessage } from "../../api/apiClient";
import { AppButton } from "../../components/ui/AppButton";
import { AppCard } from "../../components/ui/AppCard";
import { AppScreen } from "../../components/ui/AppScreen";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { LoadingState } from "../../components/ui/LoadingState";
import { colors, spacing } from "../../constants/colors";
import { useGroceries } from "../../hooks/useGroceries";

export function ShoppingListScreen() {
  const { shoppingList, markShoppingListItemBought, isSaving } = useGroceries();

  return (
    <AppScreen title="Shopping list">
      <AppCard title="Pending items">
        {shoppingList.isLoading ? <LoadingState /> : shoppingList.isError ? (
          <ErrorState message={getApiErrorMessage(shoppingList.error)} />
        ) : !shoppingList.data || shoppingList.data.length === 0 ? (
          <EmptyState title="Shopping list is empty" message="Add items from your grocery list when you need them." />
        ) : (
          <View style={styles.list}>
            {shoppingList.data.map((item) => (
              <View key={item.id} style={styles.row}>
                <View style={styles.body}>
                  <Text style={styles.title}>{item.groceryItem?.name ?? "Grocery item"}</Text>
                  <Text style={styles.meta}>{item.quantity} · {item.status.toLowerCase()}</Text>
                </View>
                {item.status === "PENDING" ? (
                  <AppButton title="Bought" loading={isSaving} onPress={() => void markShoppingListItemBought({ id: item.id, input: { quantity: item.quantity } })} />
                ) : null}
              </View>
            ))}
          </View>
        )}
      </AppCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm
  },
  row: {
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  body: {
    gap: 2
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800"
  },
  meta: {
    color: colors.muted,
    fontSize: 13
  }
});

