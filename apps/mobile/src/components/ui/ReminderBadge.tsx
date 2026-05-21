import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../constants/colors";

export function ReminderBadge({ label }: { label: string }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: colors.warningSoft,
    paddingHorizontal: 8,
    paddingVertical: 3
  },
  text: {
    color: colors.warning,
    fontSize: 12,
    fontWeight: "800"
  }
});

