import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppButton } from "../../components/ui/AppButton";
import { AppScreen } from "../../components/ui/AppScreen";
import { LoadingState } from "../../components/ui/LoadingState";
import { getCouponsApi } from "../../api/coupons.api";
import { colors, fontSize, radius, spacing } from "../../constants/colors";
import type { RootStackParamList } from "../../navigation/types";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function CouponsListScreen() {
  const navigation = useNavigation<Navigation>();
  const coupons = useQuery({ queryKey: ["coupons"], queryFn: getCouponsApi });

  return (
    <AppScreen title="Coupons" subtitle="Read-only student offers from trusted sources.">
      {coupons.isLoading ? <LoadingState /> : (coupons.data ?? []).length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="pricetag-outline" size={38} color={colors.primary} />
          <Text style={styles.emptyTitle}>No student offers available right now</Text>
          <Text style={styles.emptyText}>Check again later for student offers.</Text>
          <AppButton title="Refresh" variant="secondary" icon="refresh-outline" onPress={() => void coupons.refetch()} />
        </View>
      ) : (coupons.data ?? []).map((coupon) => (
        <Pressable key={coupon.id} accessibilityRole="button" onPress={() => navigation.navigate("CouponDetails", { couponId: coupon.id })} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
          <View style={styles.banner}><Text style={styles.discount}>{coupon.discount}</Text></View>
          <View style={styles.body}>
            <Text style={styles.title}>{coupon.title}</Text>
            <Text style={styles.meta}>{coupon.expiresAt ? `Expires ${new Date(coupon.expiresAt).toLocaleDateString()}` : "No expiry"}</Text>
            <Text style={styles.terms}>{coupon.description ?? coupon.terms}</Text>
            <Text style={styles.link}>View Details</Text>
          </View>
        </Pressable>
      ))}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, overflow: "hidden" },
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.88 },
  banner: { height: 92, backgroundColor: colors.softGreen, justifyContent: "center", paddingHorizontal: spacing.lg },
  discount: { alignSelf: "flex-start", overflow: "hidden", borderRadius: radius.pill, backgroundColor: colors.primary, color: "#FFFFFF", paddingHorizontal: spacing.md, paddingVertical: spacing.xs, fontSize: fontSize.cardTitle, fontWeight: "800" },
  body: { padding: spacing.lg, gap: spacing.xs },
  title: { color: colors.text, fontSize: fontSize.cardTitle, fontWeight: "700" },
  meta: { color: colors.muted, fontSize: fontSize.caption, fontWeight: "500" },
  terms: { color: colors.text, fontSize: fontSize.body, lineHeight: 20 },
  link: { color: colors.primary, fontSize: fontSize.body, fontWeight: "700", marginTop: spacing.xs },
  empty: { borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.xxl, alignItems: "center", gap: spacing.sm },
  emptyTitle: { color: colors.text, fontSize: fontSize.cardTitle, fontWeight: "700", textAlign: "center" },
  emptyText: { color: colors.muted, fontSize: fontSize.body, textAlign: "center" },
});
