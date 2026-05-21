import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function ComingSoonAIToast({ visible, message = "AI features are coming soon." }: { visible: boolean; message?: string }) {
  const insets = useSafeAreaInsets();
  if (!visible) return null;

  return (
    <View style={[styles.toast, { bottom: Math.max(insets.bottom, 12) + 12 }]}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    left: 18,
    right: 18,
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  text: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "900",
  },
});
