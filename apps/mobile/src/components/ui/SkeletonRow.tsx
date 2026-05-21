import { StyleSheet, View } from "react-native";
import { colors, radius, spacing } from "../../constants/colors";

export function SkeletonRow() {
  return (
    <View style={styles.row}>
      <View style={styles.avatar} />
      <View style={styles.body}>
        <View style={styles.lineStrong} />
        <View style={styles.line} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 76,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.surfaceMuted,
  },
  body: {
    flex: 1,
    gap: spacing.sm,
  },
  lineStrong: {
    width: "70%",
    height: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
  },
  line: {
    width: "45%",
    height: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
  },
});
