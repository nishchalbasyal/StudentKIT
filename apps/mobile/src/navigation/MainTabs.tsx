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
import { Ionicons } from "@expo/vector-icons";
import { useRoute, type RouteProp } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WorkHoursScreen } from "../screens/work/WorkHoursScreen";
import { CalendarScreen } from "../screens/calendar/CalendarScreen";
import { SettingsScreen } from "../screens/settings/SettingsScreen";
import { ProfileScreen } from "../screens/profile/ProfileScreen";
import { colors, fontSize } from "../constants/colors";
import type { MainTabParamList, RootStackParamList } from "./types";

type MainRoute = RouteProp<RootStackParamList, "Main">;

type MainPage = {
  key: keyof Pick<MainTabParamList, "Work" | "Calendar" | "Settings" | "Profile">;
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

  const pages = useMemo<MainPage[]>(() => {
    return [
      {
        key: "Work",
        label: "Work",
        icon: "briefcase-outline",
        render: () => <WorkHoursScreen />,
      },
      {
        key: "Calendar",
        label: "Calendar",
        icon: "calendar-outline",
        render: () => <CalendarScreen />,
      },
      {
        key: "Settings",
        label: "Settings",
        icon: "settings-outline",
        render: () => <SettingsScreen />,
      },
      {
        key: "Profile",
        label: "Profile",
        icon: "person-outline",
        render: () => <ProfileScreen />,
      },
    ];
  }, []);

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

    const normalizedScreen =
      requestedScreen === "Calendar"
        ? "Calendar"
        : requestedScreen === "Settings"
          ? "Settings"
          : requestedScreen === "Profile"
            ? "Profile"
            : "Work";
    const nextIndex = pages.findIndex((page) => page.key === normalizedScreen);
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

  return (
    <View style={styles.shell}>
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
    minHeight: 58,
    paddingHorizontal: 8,
    paddingTop: 2,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerItem: {
    flex: 1,
    height: 44,
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
