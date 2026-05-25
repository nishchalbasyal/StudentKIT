import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { AuthNavigator } from "./AuthNavigator";
import { MainTabs } from "./MainTabs";
import { AuthChoiceScreen } from "../screens/onboarding/AuthChoiceScreen";
import { AddWorkShiftScreen } from "../screens/work/AddWorkShiftScreen";
import { WorkSummaryScreen } from "../screens/work/WorkSummaryScreen";
import { SettingsScreen } from "../screens/settings/SettingsScreen";
import { WorkLimitSettingsScreen } from "../screens/settings/WorkLimitSettingsScreen";
import { WorkEntryDetailScreen } from "../screens/workDetails/WorkEntryDetailScreen";
import {
  CompanyDetailScreen,
  WorkHistoryScreen,
} from "../screens/workDetails/CompanyDetailScreen";
import { AddEditCompanyScreen } from "../screens/workDetails/AddEditCompanyScreen";
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
            <Stack.Screen name="AuthChoice" component={AuthChoiceScreen} />
            <Stack.Screen name="Auth" component={AuthNavigator} />
          </>
        ) : isAuthenticated || isGuest ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="Auth" component={AuthNavigator} />
            <Stack.Screen name="AddWorkShift" component={AddWorkShiftScreen} />
            <Stack.Screen name="WorkSummary" component={WorkSummaryScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen
              name="WorkLimitSettings"
              component={WorkLimitSettingsScreen}
            />
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
          </>
        ) : (
          <>
            <Stack.Screen name="Auth" component={AuthNavigator} />
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
