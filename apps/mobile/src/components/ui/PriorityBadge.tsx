import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../constants/colors";
import type { Priority } from "../../types/class.types";

export function PriorityBadge({ priority }: { priority: Priority }) {
  const color = priority === "HIGH" ? colors.high : priority === "MEDIUM" ? colors.medium : colors.low;

  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <Text style={[styles.text, { color }]}>{priority.toLowerCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3
  },
  text: {
    fontSize: 12,
    fontWeight: "800"
  }
});

