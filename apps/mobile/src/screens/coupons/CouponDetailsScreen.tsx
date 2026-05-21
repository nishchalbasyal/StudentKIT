import { Alert, Linking, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { RouteProp, useRoute } from "@react-navigation/native";
import * as Clipboard from "expo-clipboard";
import { AppButton } from "../../components/ui/AppButton";
import { AppScreen } from "../../components/ui/AppScreen";
import { EmptyState } from "../../components/ui/EmptyState";
import { LoadingState } from "../../components/ui/LoadingState";
import { getCouponApi } from "../../api/coupons.api";
import { colors, fontSize, radius, spacing } from "../../constants/colors";
import type { RootStackParamList } from "../../navigation/types";

type Route = RouteProp<RootStackParamList, "CouponDetails">;

export function CouponDetailsScreen() {
  const route = useRoute<Route>();
  const couponId = route.params?.couponId;
  const coupon = useQuery({ queryKey: ["coupon", couponId], queryFn: () => getCouponApi(couponId!), enabled: !!couponId });

  if (!couponId) return <AppScreen title="Coupon details"><EmptyState title="Choose a coupon first" message="Open a coupon from the coupons list." /></AppScreen>;
  if (coupon.isLoading) return <AppScreen title="Coupon details"><LoadingState /></AppScreen>;
  if (!coupon.data) return <AppScreen title="Coupon details"><EmptyState title="Coupon not found" message="This offer may have expired." /></AppScreen>;

  return (
    <AppScreen title="Coupon details" subtitle="This offer is read-only and managed by Student Kit.">
      <View style={styles.image}><Text style={styles.discount}>{coupon.data.discount}</Text></View>
      <View style={styles.card}>
        <Text style={styles.title}>{coupon.data.title}</Text>
        <Info icon="storefront-outline" label="Source" value={coupon.data.source ?? "Admin verified offer"} />
        <Info icon="calendar-outline" label="Expiry" value={coupon.data.expiresAt ? new Date(coupon.data.expiresAt).toLocaleDateString() : "No expiry"} />
        {coupon.data.code ? <Info icon="ticket-outline" label="Code" value={coupon.data.code} /> : null}
        <Text style={styles.section}>Terms and conditions</Text>
        <Text style={styles.copy}>{coupon.data.terms ?? coupon.data.description ?? "No terms provided."}</Text>
        {coupon.data.code ? <AppButton title="Copy Code" icon="copy-outline" onPress={() => void Clipboard.setStringAsync(coupon.data!.code!).then(() => Alert.alert("Copied", "Coupon code copied."))} /> : null}
        {coupon.data.url ? <AppButton title="Open Link" icon="open-outline" variant="secondary" onPress={() => void Linking.openURL(coupon.data!.url!)} /> : null}
      </View>
    </AppScreen>
  );
}

function Info({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.info}>
      <Ionicons name={icon} size={20} color={colors.primary} />
      <View style={styles.infoBody}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  image: { height: 160, borderRadius: radius.xl, backgroundColor: colors.softGreen, justifyContent: "flex-end", padding: spacing.lg },
  discount: { color: colors.primary, fontSize: 20, fontWeight: "800" },
  card: { borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.lg, gap: spacing.md },
  title: { color: colors.text, fontSize: fontSize.section, fontWeight: "700" },
  info: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  infoBody: { flex: 1 },
  infoLabel: { color: colors.muted, fontSize: fontSize.caption, fontWeight: "600" },
  infoValue: { color: colors.text, fontSize: fontSize.body, fontWeight: "600", marginTop: 2 },
  section: { color: colors.text, fontSize: fontSize.cardTitle, fontWeight: "700" },
  copy: { color: colors.muted, fontSize: fontSize.body, lineHeight: 20 },
});
