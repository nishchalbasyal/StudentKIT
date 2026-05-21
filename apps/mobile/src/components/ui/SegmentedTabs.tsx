import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fontSize, radius, shadows } from "../../constants/colors";

export type SegmentedTab<T extends string> = {
  key: T;
  label: string;
};

type Props<T extends string> = {
  tabs: ReadonlyArray<SegmentedTab<T>>;
  value: T;
  onChange: (value: T) => void;
};

export function SegmentedTabs<T extends string>({ tabs, value, onChange }: Props<T>) {
  return (
    <View style={styles.wrap}>
      {tabs.map((tab) => {
        const active = tab.key === value;
        return (
          <Pressable
            key={tab.key}
            accessibilityRole="button"
            onPress={() => onChange(tab.key)}
            style={[styles.item, active && styles.activeItem]}
          >
            <Text style={[styles.text, active && styles.activeText]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    minHeight: 46,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: 4,
    flexDirection: "row",
    borderWidth: 1,
    borderColor: colors.border,
  },
  item: {
    flex: 1,
    minHeight: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  activeItem: {
    backgroundColor: colors.surface,
    ...shadows.soft,
  },
  text: {
    color: colors.muted,
    fontSize: fontSize.body,
    fontWeight: "800",
  },
  activeText: {
    color: colors.primary,
  },
});
