import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "../../constants/colors";

export type QuickViewFeature = {
  id: string;
  icon: string;
  label: string;
};

type Props = {
  features: QuickViewFeature[];
  selectedId: string;
  onSelect: (id: string) => void;
};

const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
  work: "briefcase-outline",
  money: "wallet-outline",
  tasks: "checkmark-circle-outline",
  grocery: "basket-outline",
  cleaning: "sparkles-outline",
  ai: "sparkles-outline",
  goals: "flag-outline",
  search: "search-outline",
};

export function QuickViewSwitcher({ features, selectedId, onSelect }: Props) {
  return (
    <View style={styles.container}>
      {features.map((feature) => {
        const isSelected = feature.id === selectedId;
        const iconName = (iconMap[feature.id] ||
          "help-outline") as keyof typeof Ionicons.glyphMap;

        return (
          <Pressable
            key={feature.id}
            onPress={() => onSelect(feature.id)}
            style={({ pressed }) => [
              styles.button,
              isSelected && styles.buttonActive,
              pressed && styles.buttonPressed,
            ]}
          >
            <View
              style={[
                styles.iconWrapper,
                isSelected && styles.iconWrapperActive,
              ]}
            >
              <Ionicons
                name={iconName}
                size={24}
                color={isSelected ? colors.primary : colors.muted}
              />
            </View>
            <Text style={[styles.label, isSelected && styles.labelActive]}>
              {feature.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "nowrap",
    justifyContent: "space-between",
    gap: spacing.sm,
    marginVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  button: {
    alignItems: "center",
    gap: spacing.xs,
    width: 56,
  },
  buttonActive: {
    // Active state styling
  },
  buttonPressed: {
    opacity: 0.7,
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapperActive: {
    backgroundColor: colors.softGreen,
    borderWidth: 2,
    borderColor: colors.action,
  },
  label: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    width: 64,
  },
  labelActive: {
    color: colors.primary,
    fontWeight: "800",
  },
});
