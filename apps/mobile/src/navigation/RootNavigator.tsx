import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { AuthNavigator } from "./AuthNavigator";
import { MainTabs } from "./MainTabs";
import { ModuleSelectionScreen } from "../screens/onboarding/ModuleSelectionScreen";
import { AuthChoiceScreen } from "../screens/onboarding/AuthChoiceScreen";
import { AddWorkShiftScreen } from "../screens/work/AddWorkShiftScreen";
import { WorkSummaryScreen } from "../screens/work/WorkSummaryScreen";
import { AddExpenseScreen } from "../screens/expenses/AddExpenseScreen";
import { BudgetScreen } from "../screens/expenses/BudgetScreen";
import { AddTaskScreen } from "../screens/tasks/AddTaskScreen";
import { AddGroceryItemScreen } from "../screens/groceries/AddGroceryItemScreen";
import { GroceryScreen } from "../screens/groceries/GroceryScreen";
import { GroceryItemDetailScreen } from "../screens/groceries/GroceryItemDetailScreen";
import { CleaningScreen } from "../screens/cleaning/CleaningScreen";
import { AddEditCleaningRoutineScreen } from "../screens/cleaning/AddEditCleaningRoutineScreen";
import { AIAssistantScreen } from "../screens/ai/AIAssistantScreen";
import { CouponsListScreen } from "../screens/coupons/CouponsListScreen";
import { CouponDetailsScreen } from "../screens/coupons/CouponDetailsScreen";
import { EventsListScreen } from "../screens/events/EventsListScreen";
import { EventDetailsScreen } from "../screens/events/EventDetailsScreen";
import { GlobalSearchScreen } from "../screens/search/GlobalSearchScreen";
import { SettingsScreen } from "../screens/settings/SettingsScreen";
import { WorkLimitSettingsScreen } from "../screens/settings/WorkLimitSettingsScreen";
import { ProfileScreen } from "../screens/profile/ProfileScreen";
import {
  ComingSoonScreen,
  EmptyStateScreen,
} from "../screens/system/ComingSoonScreen";
import { WorkEntryDetailScreen } from "../screens/workDetails/WorkEntryDetailScreen";
import {
  CompanyDetailScreen,
  WorkHistoryScreen,
} from "../screens/workDetails/CompanyDetailScreen";
import { AddEditCompanyScreen } from "../screens/workDetails/AddEditCompanyScreen";
import {
  CategorySettingsScreen,
  ExpenseDetailScreen,
} from "../screens/expenses/ExpenseDetailScreen";
import {
  ReminderDetailScreen,
  TaskDetailScreen,
} from "../screens/tasks/TaskDetailScreen";
import {
  AddEditSplitGroupScreen,
  AddSplitExpenseScreen,
  FriendDetailScreen,
  MemberBalanceDetailScreen,
  SettlementScreen,
  SplitExpenseDetailScreen,
  SplitGroupSettingsScreen,
  SplitGroupDetailScreen,
} from "../screens/split/SplitScreens";
import { useAuthBootstrap } from "../hooks/useAuth";
import { useAuthStore } from "../store/authStore";
import { colors } from "../constants/colors";
import type { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const isHydrated = useAuthBootstrap();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isGuest = useAuthStore((state) => state.isGuest);
  const hasCompletedOnboarding = useAuthStore(
    (state) => state.hasCompletedOnboarding,
  );

  if (!isHydrated) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!hasCompletedOnboarding ? (
          <>
            <Stack.Screen
              name="ModuleSelection"
              component={ModuleSelectionScreen}
            />
            <Stack.Screen name="AuthChoice" component={AuthChoiceScreen} />
            <Stack.Screen name="Auth" component={AuthNavigator} />
          </>
        ) : isAuthenticated || isGuest ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="Auth" component={AuthNavigator} />
            <Stack.Screen name="AddWorkShift" component={AddWorkShiftScreen} />
            <Stack.Screen name="WorkSummary" component={WorkSummaryScreen} />
            <Stack.Screen name="AddExpense" component={AddExpenseScreen} />
            <Stack.Screen name="Budget" component={BudgetScreen} />
            <Stack.Screen name="AddTask" component={AddTaskScreen} />
            <Stack.Screen
              name="AddGroceryItem"
              component={AddGroceryItemScreen}
            />
            <Stack.Screen name="Groceries" component={GroceryScreen} />
            <Stack.Screen
              name="GroceryDetails"
              component={GroceryItemDetailScreen}
            />
            <Stack.Screen name="Cleaning" component={CleaningScreen} />
            <Stack.Screen name="AIAssistant" component={AIAssistantScreen} />
            <Stack.Screen name="CouponsList" component={CouponsListScreen} />
            <Stack.Screen
              name="CouponDetails"
              component={CouponDetailsScreen}
            />
            <Stack.Screen name="EventsList" component={EventsListScreen} />
            <Stack.Screen name="EventDetails" component={EventDetailsScreen} />
            <Stack.Screen name="GlobalSearch" component={GlobalSearchScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen
              name="WorkLimitSettings"
              component={WorkLimitSettingsScreen}
            />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen
              name="WorkEntryDetail"
              component={WorkEntryDetailScreen}
            />
            <Stack.Screen name="WorkHistory" component={WorkHistoryScreen} />
            <Stack.Screen
              name="CompanyDetail"
              component={CompanyDetailScreen}
            />
            <Stack.Screen
              name="AddEditCompany"
              component={AddEditCompanyScreen}
            />
            <Stack.Screen
              name="WeekWorkDetail"
              component={ComingSoonScreen as never}
              initialParams={{ title: "Week Work Detail" }}
            />
            <Stack.Screen
              name="ExpenseDetail"
              component={ExpenseDetailScreen}
            />
            <Stack.Screen name="ExpenseReport" component={BudgetScreen} />
            <Stack.Screen name="BudgetSettings" component={BudgetScreen} />
            <Stack.Screen
              name="CategorySettings"
              component={CategorySettingsScreen}
            />
            <Stack.Screen
              name="SplitGroupDetail"
              component={SplitGroupDetailScreen}
            />
            <Stack.Screen
              name="SplitGroupSettings"
              component={SplitGroupSettingsScreen}
            />
            <Stack.Screen
              name="AddEditSplitGroup"
              component={AddEditSplitGroupScreen}
            />
            <Stack.Screen
              name="AddSplitExpense"
              component={AddSplitExpenseScreen}
            />
            <Stack.Screen
              name="SplitExpenseDetail"
              component={SplitExpenseDetailScreen}
            />
            <Stack.Screen name="Settlement" component={SettlementScreen} />
            <Stack.Screen name="FriendDetail" component={FriendDetailScreen} />
            <Stack.Screen
              name="MemberBalanceDetail"
              component={MemberBalanceDetailScreen}
            />
            <Stack.Screen name="TaskDetail" component={TaskDetailScreen} />
            <Stack.Screen
              name="ReminderDetail"
              component={ReminderDetailScreen}
            />
            <Stack.Screen
              name="AddEditReminder"
              component={ComingSoonScreen as never}
              initialParams={{ title: "Add/Edit Reminder" }}
            />
            <Stack.Screen
              name="CleaningRoutineDetail"
              component={AddEditCleaningRoutineScreen as never}
            />
            <Stack.Screen
              name="AddEditCleaningRoutine"
              component={AddEditCleaningRoutineScreen}
            />
            <Stack.Screen name="AddWithAI" component={AIAssistantScreen} />
            <Stack.Screen
              name="AIPreview"
              component={AIAssistantScreen as never}
            />
            <Stack.Screen
              name="StoreComparison"
              component={ComingSoonScreen as never}
              initialParams={{ title: "Store Comparison" }}
            />
            <Stack.Screen
              name="EmptyStateScreen"
              component={EmptyStateScreen}
            />
            <Stack.Screen name="ComingSoon" component={ComingSoonScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Auth" component={AuthNavigator} />
            <Stack.Screen
              name="ModuleSelection"
              component={ModuleSelectionScreen}
            />
            <Stack.Screen name="AuthChoice" component={AuthChoiceScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
});
