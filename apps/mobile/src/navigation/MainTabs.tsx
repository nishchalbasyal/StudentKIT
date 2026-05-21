import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ListRenderItemInfo,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, type RouteProp } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DashboardScreen } from "../screens/dashboard/DashboardScreen";
import { WorkHoursScreen } from "../screens/work/WorkHoursScreen";
import { ExpensesScreen } from "../screens/expenses/ExpensesScreen";
import { TasksScreen } from "../screens/tasks/TasksScreen";
import { MoreScreen } from "../screens/more/MoreScreen";
import { SplitGroupsScreen } from "../screens/split/SplitGroupsScreen";
import { colors, fontSize, radius, spacing } from "../constants/colors";
import { modulePreferenceService } from "../services/modulePreferenceService";
import { useSettings } from "../hooks/useSettings";
import type { UserEnabledModules } from "../storage/settingsStorage";
import type { MainTabParamList, RootStackParamList } from "./types";

type MainRoute = RouteProp<RootStackParamList, "Main">;

type MainPage = {
  key: keyof Pick<
    MainTabParamList,
    "Dashboard" | "Work" | "Expenses" | "Tasks" | "Splits" | "More"
  >;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  render: () => ReactNode;
};

export function MainTabs() {
  const route = useRoute<MainRoute>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList<MainPage>>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [modules, setModules] = useState<UserEnabledModules | null>(null);
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const settingsHook = useSettings();

  useEffect(() => {
    // initial load from onboarding preferences
    void modulePreferenceService.get().then(setModules);
  }, []);

  useEffect(() => {
    // react to settings changes from settings screen (userEnabledModules)
    if (settingsHook.settings?.userEnabledModules) {
      setModules(
        settingsHook.settings.userEnabledModules as UserEnabledModules,
      );
    }
  }, [settingsHook.settings]);

  const pages = useMemo<MainPage[]>(() => {
    const enabled = modules ?? {
      work: true,
      money: true,
      splits: true,
      tasks: true,
      groceries: true,
      cleaning: true,
      ai: false,
    };
    const next: MainPage[] = [
      {
        key: "Dashboard",
        label: "Home",
        icon: "home-outline",
        render: () => <DashboardScreen />,
      },
    ];

    if (enabled.work)
      next.push({
        key: "Work",
        label: "Work",
        icon: "briefcase-outline",
        render: () => <WorkHoursScreen />,
      });

    if (enabled.money || enabled.groceries)
      next.push({
        key: "Expenses",
        label: "Money",
        icon: "cash-outline",
        render: () => <ExpensesScreen />,
      });

    if (enabled.splits)
      next.push({
        key: "Splits",
        label: "Splits",
        icon: "people-outline",
        render: () => <SplitGroupsScreen />,
      });

    if (enabled.tasks)
      next.push({
        key: "Tasks",
        label: "Tasks",
        icon: "checkmark-circle-outline",
        render: () => <TasksScreen />,
      });

    next.push({
      key: "More",
      label: "More",
      icon: "grid-outline",
      render: () => <MoreScreen />,
    });

    return next;
  }, [modules]);

  const goToIndex = useCallback(
    (index: number, animated = true) => {
      const nextIndex = Math.max(0, Math.min(pages.length - 1, index));
      setActiveIndex(nextIndex);
      listRef.current?.scrollToIndex({ index: nextIndex, animated });
    },
    [pages.length],
  );

  useEffect(() => {
    const requestedScreen = route.params?.screen;
    if (!requestedScreen) return;

    const nextIndex = pages.findIndex((page) => page.key === requestedScreen);
    if (nextIndex >= 0) {
      requestAnimationFrame(() => goToIndex(nextIndex, false));
    }
  }, [goToIndex, pages, route.params?.screen]);

  const handleMomentumEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setActiveIndex(Math.max(0, Math.min(pages.length - 1, nextIndex)));
  };

  const renderItem = ({ item }: ListRenderItemInfo<MainPage>) => (
    <View style={[styles.page, { width }]}>{item.render()}</View>
  );

  const bottomGap = Math.max(insets.bottom, 10);
  const quickBottom = bottomGap + 74;

  return (
    <View style={styles.shell}>
      {activeIndex !== 0 ? (
        <View style={[styles.quickActions, { bottom: quickBottom }]} pointerEvents="box-none">
          <Pressable
            accessibilityRole="button"
            onPress={() => goToIndex(0)}
            style={({ pressed }) => [
              styles.quickButton,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="home-outline" size={18} color={colors.primary} />
            <Text style={styles.quickText}>Home</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              navigation.canGoBack() ? navigation.goBack() : goToIndex(0)
            }
            style={({ pressed }) => [
              styles.quickButton,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              name="arrow-back-outline"
              size={18}
              color={colors.primary}
            />
            <Text style={styles.quickText}>Back</Text>
          </Pressable>
        </View>
      ) : null}
      <FlatList
        ref={listRef}
        data={pages}
        renderItem={renderItem}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        initialNumToRender={pages.length}
        maxToRenderPerBatch={pages.length}
        windowSize={pages.length}
        removeClippedSubviews={false}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        onMomentumScrollEnd={handleMomentumEnd}
        keyboardShouldPersistTaps="handled"
      />

      <View style={[styles.footer, { paddingBottom: bottomGap }]}>
        {pages.map((page, index) => {
          const focused = index === activeIndex;

          return (
            <Pressable
              key={page.key}
              accessibilityRole="button"
              onPress={() => goToIndex(index)}
              style={({ pressed }) => [
                styles.footerItem,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                name={page.icon}
                size={focused ? 23 : 22}
                color={focused ? colors.primary : colors.muted}
              />
              <Text
                style={[
                  styles.footerLabel,
                  focused && styles.footerLabelActive,
                ]}
              >
                {page.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: colors.background,
  },
  page: {
    flex: 1,
    backgroundColor: colors.background,
  },
  footer: {
    minHeight: 64,
    paddingHorizontal: 8,
    paddingTop: 4,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  quickActions: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.sm,
    zIndex: 20,
    backgroundColor: "transparent",
  },
  quickButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickText: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: fontSize.caption,
  },
  footerItem: {
    flex: 1,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
  },
  pressed: {
    opacity: 0.72,
  },
  footerLabel: {
    color: colors.muted,
    fontSize: fontSize.tab,
    fontWeight: "500",
  },
  footerLabelActive: {
    color: colors.primary,
    fontWeight: "600",
  },
});
