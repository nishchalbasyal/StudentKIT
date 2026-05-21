import type { ReactNode } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { colors, fontSize } from "../../constants/colors";

type Props = {
  label?: string;
  uri?: string | null;
  icon?: ReactNode;
  size?: number;
};

export function AvatarCircle({ label = "SK", uri, icon, size = 46 }: Props) {
  const initials = label
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (uri) {
    return <Image source={{ uri }} style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]} />;
  }

  return (
    <View style={[styles.avatar, styles.fallback, { width: size, height: size, borderRadius: size / 2 }]}>
      {icon ?? <Text style={styles.initials}>{initials}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  fallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.softGreen,
  },
  initials: {
    color: colors.primary,
    fontSize: fontSize.badge,
    fontWeight: "900",
  },
});
