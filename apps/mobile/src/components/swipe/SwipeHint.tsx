import { StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../../constants/colors";

type Props = {
  left: string;
  right: string;
  up: string;
  down: string;
};

export function SwipeHint({ left, right, up, down }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.hint}>Left: {left}</Text>
      <Text style={styles.hint}>Right: {right}</Text>
      <Text style={styles.hint}>Up: {up}</Text>
      <Text style={styles.hint}>Down: {down}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.xs
  },
  hint: {
    color: colors.muted,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: 11,
    fontWeight: "800"
  }
});
