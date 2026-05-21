import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../../constants/colors";

export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <View style={styles.state}>
      <ActivityIndicator color={colors.primary} />
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  state: {
    minHeight: 140,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm
  },
  text: {
    color: colors.muted,
    fontSize: 14
  }
});

