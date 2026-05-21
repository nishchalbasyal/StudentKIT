import { useQuery } from "@tanstack/react-query";
import { useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import { StyleSheet, Text, View } from "react-native";
import { getApiErrorMessage } from "../../api/apiClient";
import { getPriceHistoryApi } from "../../api/groceries.api";
import { AppCard } from "../../components/ui/AppCard";
import { AppScreen } from "../../components/ui/AppScreen";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { LoadingState } from "../../components/ui/LoadingState";
import { colors, spacing } from "../../constants/colors";
import type { MoreStackParamList } from "../../navigation/types";
import { formatCurrency } from "../../utils/formatCurrency";

type Route = RouteProp<MoreStackParamList, "PriceHistory">;

export function PriceHistoryScreen() {
  const route = useRoute<Route>();
  const history = useQuery({
    queryKey: ["groceries", "priceHistory", route.params.groceryItemId],
    queryFn: () => getPriceHistoryApi(route.params.groceryItemId)
  });

  return (
    <AppScreen title={route.params.name ?? "Price history"}>
      <AppCard title="Trend">
        {history.isLoading ? <LoadingState /> : history.isError ? (
          <ErrorState message={getApiErrorMessage(history.error)} />
        ) : !history.data || history.data.purchases.length === 0 ? (
          <EmptyState title="No prices yet" message="Mark items as bought with price to build history." />
        ) : (
          <View style={styles.list}>
            <Text style={styles.title}>Latest: {history.data.latestPrice ? formatCurrency(history.data.latestPrice) : "unknown"}</Text>
            <Text style={styles.meta}>Recent average: {history.data.averageRecentPrice ? formatCurrency(history.data.averageRecentPrice) : "unknown"} · {history.data.trend}</Text>
            {history.data.purchases.map((purchase) => (
              <View key={purchase.id} style={styles.row}>
                <Text style={styles.title}>{formatCurrency(purchase.price)}</Text>
                <Text style={styles.meta}>{purchase.storeName ?? "store"} · {purchase.quantity} · {purchase.purchaseDate}</Text>
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
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
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

