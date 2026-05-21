import { StyleSheet, Text, View } from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { AppButton } from "../../components/ui/AppButton";
import { AppScreen } from "../../components/ui/AppScreen";
import { colors, fontSize, radius, spacing } from "../../constants/colors";
import type { RootStackParamList } from "../../navigation/types";

type Route = RouteProp<RootStackParamList, "ComingSoon">;

export function ComingSoonScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation();
  return (
    <AppScreen title={route.params.title} subtitle={route.params.message ?? "This feature needs one more safe setup step before it can modify your data."}>
      <View style={styles.card}>
        <Text style={styles.title}>Action unavailable</Text>
        <Text style={styles.copy}>Student Kit will never save or change data here until the full flow is ready and confirmed.</Text>
        <AppButton title="Go Back" variant="secondary" icon="arrow-back-outline" onPress={() => navigation.goBack()} />
      </View>
    </AppScreen>
  );
}

export function EmptyStateScreen() {
  return (
    <AppScreen title="Nothing here yet">
      <View style={styles.card}>
        <Text style={styles.title}>Nothing saved here yet</Text>
        <Text style={styles.copy}>Create an item first and details will appear here.</Text>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.xxl, gap: spacing.sm, alignItems: "center" },
  title: { color: colors.text, fontSize: fontSize.cardTitle, fontWeight: "700", textAlign: "center" },
  copy: { color: colors.muted, fontSize: fontSize.body, lineHeight: 20, textAlign: "center" }
});
