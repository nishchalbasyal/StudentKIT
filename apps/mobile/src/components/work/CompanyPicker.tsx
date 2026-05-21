import { useState } from "react";
import { Alert, FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, fontSize, radius, spacing } from "../../constants/colors";
import { useCompanies } from "../../hooks/useCompanies";
import type { RootStackParamList } from "../../navigation/types";
import type { Company } from "../../types/company.types";

type Props = {
  selectedId?: string | null;
  onSelect: (company: Company | null) => void;
  onCreateNew?: () => void;
};

export function CompanyPicker({ selectedId, onSelect, onCreateNew }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { companies, deleteCompany, isDeleting } = useCompanies();
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState("");

  const selected = companies.data?.find((c) => c.id === selectedId);
  const filtered = companies.data?.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())) ?? [];

  const handleSelect = (company: Company) => {
    onSelect(company);
    setVisible(false);
    setSearch("");
  };

  const handleCreate = () => {
    setVisible(false);
    if (onCreateNew) onCreateNew();
    else navigation.navigate("AddEditCompany");
  };

  const handleMenu = (company: Company) => {
    Alert.alert(company.name, "Choose an action", [
      { text: "Edit", onPress: () => { setVisible(false); navigation.navigate("AddEditCompany", { companyId: company.id }); } },
      { text: "Archive", style: "destructive", onPress: () => void deleteCompany(company.id).then((result: any) => Alert.alert("Company updated", result.message ?? "Company archived.")) },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <>
      <Pressable style={({ pressed }) => [styles.trigger, pressed && styles.pressed]} onPress={() => setVisible(true)}>
        <View style={styles.triggerContent}>
          <Ionicons name="briefcase-outline" size={24} color={colors.primary} />
          <View style={styles.triggerText}>
            <Text style={styles.label} numberOfLines={1}>{selected?.name ?? "Select a company"}</Text>
            <Text style={styles.sublabel} numberOfLines={1}>
              {selected ? `€${Number(selected.defaultHourlyWage ?? 0).toFixed(2)}/h · ${selected.defaultBreakMinutes ?? 0} min break` : "Tap to choose or create workplace"}
            </Text>
          </View>
        </View>
        <Ionicons name={visible ? "chevron-up" : "chevron-down"} size={20} color={colors.muted} />
      </Pressable>

      <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.header}>
              <Text style={styles.title}>Select Company</Text>
              <Pressable onPress={() => setVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>

            <TextInput placeholder="Search companies..." placeholderTextColor={colors.muted} style={styles.searchInput} value={search} onChangeText={setSearch} />

            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable style={({ pressed }) => [styles.item, selectedId === item.id && styles.itemSelected, pressed && styles.itemPressed]} onPress={() => handleSelect(item)}>
                  <View style={styles.itemContent}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemMeta}>€{Number(item.defaultHourlyWage ?? 0).toFixed(2)}/h · {item.defaultBreakMinutes ?? 0} min break</Text>
                  </View>
                  <Pressable disabled={isDeleting} onPress={() => handleMenu(item)} hitSlop={10}>
                    <Ionicons name={selectedId === item.id ? "checkmark" : "ellipsis-vertical"} size={20} color={colors.primary} />
                  </Pressable>
                </Pressable>
              )}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Ionicons name="briefcase-outline" size={42} color={colors.primary} />
                  <Text style={styles.emptyTitle}>No companies yet</Text>
                  <Text style={styles.emptyText}>Create your first workplace to auto-fill wage, break, and common shifts.</Text>
                  <Pressable style={[styles.button, styles.buttonPrimary, styles.emptyButton]} onPress={handleCreate}>
                    <Ionicons name="add-circle-outline" size={18} color="white" />
                    <Text style={[styles.buttonText, styles.buttonTextLight]}>Add New Company</Text>
                  </Pressable>
                </View>
              }
              contentContainerStyle={styles.listContent}
            />

            <View style={styles.footer}>
              {selected ? (
                <Pressable style={[styles.button, styles.buttonSecondary]} onPress={() => onSelect(null)}>
                  <Ionicons name="close-circle-outline" size={18} color={colors.text} />
                  <Text style={styles.buttonText}>Clear</Text>
                </Pressable>
              ) : null}
              <Pressable style={[styles.button, styles.buttonPrimary]} onPress={handleCreate}>
                <Ionicons name="add-circle-outline" size={18} color="white" />
                <Text style={[styles.buttonText, styles.buttonTextLight]}>Add New Company</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  pressed: { backgroundColor: colors.background },
  triggerContent: { flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.md },
  triggerText: { flex: 1 },
  label: { color: colors.text, fontSize: fontSize.body, fontWeight: "700" },
  sublabel: { color: colors.muted, fontSize: fontSize.caption, marginTop: 2 },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modal: { backgroundColor: colors.background, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, maxHeight: "82%", paddingBottom: spacing.xl },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: fontSize.title, fontWeight: "700", color: colors.text },
  searchInput: { marginHorizontal: spacing.lg, marginTop: spacing.md, paddingHorizontal: spacing.md, minHeight: 48, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, color: colors.text, fontSize: fontSize.body },
  listContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, flexGrow: 1 },
  item: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderRadius: radius.md, marginBottom: spacing.sm, backgroundColor: colors.surface },
  itemPressed: { opacity: 0.8 },
  itemSelected: { backgroundColor: colors.softGreen, borderWidth: 1, borderColor: colors.primary },
  itemContent: { flex: 1 },
  itemName: { color: colors.text, fontSize: fontSize.body, fontWeight: "700" },
  itemMeta: { color: colors.muted, fontSize: fontSize.caption, marginTop: 4 },
  empty: { alignItems: "center", justifyContent: "center", paddingVertical: spacing.xxl, gap: spacing.sm },
  emptyTitle: { color: colors.text, fontSize: fontSize.cardTitle, fontWeight: "800" },
  emptyText: { color: colors.muted, fontSize: fontSize.body, textAlign: "center", lineHeight: 20 },
  emptyButton: { marginTop: spacing.sm },
  footer: { flexDirection: "row", gap: spacing.md, paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  button: { flex: 1, minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.md, borderWidth: 1 },
  buttonPrimary: { backgroundColor: colors.primary, borderColor: colors.primary },
  buttonSecondary: { backgroundColor: colors.surface, borderColor: colors.border },
  buttonText: { fontSize: fontSize.body, fontWeight: "700", color: colors.text },
  buttonTextLight: { color: "white" },
});
