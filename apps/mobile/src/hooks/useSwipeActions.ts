import { Alert, Platform, ToastAndroid, Vibration } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import type { SwipeCardType } from "../components/swipe/swipeActions";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

type UseSwipeActionsInput = {
  navigation: Navigation;
  onQuickCapture: () => void;
  onMessage: (title: string, message: string) => void;
};

function notify(message: string) {
  Vibration.vibrate(12);

  if (Platform.OS === "android") {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  }
}

export function useSwipeActions({
  navigation,
  onQuickCapture,
  onMessage
}: UseSwipeActionsInput) {
  function openAdd(cardType: SwipeCardType) {
    notify("Opening quick action");

    if (cardType === "work") {
      navigation.navigate("AddWorkShift");
      return;
    }

    if (cardType === "expense") {
      navigation.navigate("AddExpense");
      return;
    }

    if (cardType === "task" || cardType === "today") {
      navigation.navigate("AddTask");
      return;
    }

    if (cardType === "grocery") {
      navigation.navigate("AddGroceryItem");
      return;
    }

    if (cardType === "cleaning") {
      navigation.navigate("Main", { screen: "More", params: { screen: "Cleaning" } });
      return;
    }

    onQuickCapture();
  }

  function openDetails(cardType: SwipeCardType) {
    notify("Opening details");

    if (cardType === "work") {
      navigation.navigate("Main", { screen: "Work" });
      return;
    }

    if (cardType === "expense") {
      navigation.navigate("Main", { screen: "Expenses" });
      return;
    }

    if (cardType === "task" || cardType === "today") {
      navigation.navigate("Main", { screen: "Planner", params: { screen: "Tasks" } });
      return;
    }

    if (cardType === "grocery") {
      navigation.navigate("Main", { screen: "More", params: { screen: "ShoppingList" } });
      return;
    }

    if (cardType === "cleaning") {
      navigation.navigate("Main", { screen: "More", params: { screen: "Cleaning" } });
      return;
    }

    if (cardType === "ai") {
      navigation.navigate("Main", { screen: "More", params: { screen: "AIAssistant" } });
      return;
    }

    if (cardType === "feed") {
      navigation.navigate("Main", { screen: "More", params: { screen: "Groceries" } });
      return;
    }

    Alert.alert("Monthly goals", "Goal editing can be connected once goal storage is added.");
  }

  function showVerticalMessage(title: string, message: string) {
    notify(title);
    onMessage(title, message);
  }

  return {
    openAdd,
    openDetails,
    showVerticalMessage
  };
}
