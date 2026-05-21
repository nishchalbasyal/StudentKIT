import { Alert } from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { GroceryForm } from "../../components/forms/GroceryForm";
import { AppScreen } from "../../components/ui/AppScreen";
import { EmptyState } from "../../components/ui/EmptyState";
import { LoadingState } from "../../components/ui/LoadingState";
import { getApiErrorMessage } from "../../api/apiClient";
import { useGroceries } from "../../hooks/useGroceries";
import type { RootStackParamList } from "../../navigation/types";
import type { GroceryInput } from "../../types/grocery.types";

type Route = RouteProp<RootStackParamList, "AddGroceryItem">;
type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function AddGroceryItemScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Navigation>();
  const { groceries, createGroceryItem, updateGroceryItem, isSaving } = useGroceries();
  const editId = route.params?.groceryItemId;
  const duplicateFromId = route.params?.duplicateFromId;
  const sourceItem = groceries.data?.find((item) => item.id === (editId ?? duplicateFromId));
  const initialValues: Partial<GroceryInput> | undefined = sourceItem
    ? {
        name: sourceItem.name,
        category: sourceItem.category ?? "",
        defaultQuantity: sourceItem.defaultQuantity ?? "",
        estimatedDaysLasts: sourceItem.estimatedDaysLasts ?? 7,
        isEssential: sourceItem.isEssential,
      }
    : undefined;

  async function handleSubmit(values: GroceryInput) {
    try {
      if (editId) {
        await updateGroceryItem({ id: editId, input: values });
      } else {
        await createGroceryItem(values);
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert("Could not save grocery item", getApiErrorMessage(error));
    }
  }

  if ((editId || duplicateFromId) && groceries.isLoading) {
    return <LoadingState label="Loading grocery item" />;
  }

  if ((editId || duplicateFromId) && !sourceItem) {
    return (
      <AppScreen title="Grocery item">
        <EmptyState title="Grocery item not found" message="It may have been deleted or is still loading." />
      </AppScreen>
    );
  }

  return (
    <AppScreen
      title={editId ? "Edit grocery item" : duplicateFromId ? "Duplicate grocery item" : "Add grocery item"}
      subtitle="Track essentials, expected finish dates, and price history."
    >
      <GroceryForm
        onSubmit={handleSubmit}
        loading={isSaving}
        initialValues={initialValues}
        submitLabel={editId ? "Save Changes" : "Save grocery item"}
      />
    </AppScreen>
  );
}
