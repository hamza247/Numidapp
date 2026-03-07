import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  FlatList,
  TextInput,
  useColorScheme,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { countries, type Country } from "@/lib/countries";

interface CountryPickerProps {
  selected: Country;
  onSelect: (country: Country) => void;
}

export default function CountryPicker({ selected, onSelect }: CountryPickerProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== "light";
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState("");

  const webTop = Platform.OS === "web" ? 67 : 0;

  const filtered = useMemo(() => {
    if (!search) return countries;
    const q = search.toLowerCase();
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dial.includes(q) ||
        c.code.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <>
      <Pressable
        style={({ pressed }) => [
          styles.trigger,
          { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.7 : 1 },
        ]}
        onPress={() => setVisible(true)}
      >
        <Text style={styles.flag}>{selected.flag}</Text>
        <Text style={[styles.dial, { color: theme.text, fontFamily: "Inter_500Medium" }]}>
          {selected.dial}
        </Text>
        <Ionicons name="chevron-down" size={14} color={theme.textMuted} />
      </Pressable>

      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={[styles.sheet, { backgroundColor: theme.background, paddingTop: insets.top + webTop }]}>
            <View style={[styles.sheetHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.sheetTitle, { color: theme.text, fontFamily: "Inter_700Bold" }]}>
                Select Country
              </Text>
              <Pressable
                onPress={() => { setVisible(false); setSearch(""); }}
                style={({ pressed }) => [styles.closeBtn, { backgroundColor: theme.card, opacity: pressed ? 0.7 : 1 }]}
              >
                <Ionicons name="close" size={20} color={theme.text} />
              </Pressable>
            </View>

            <View style={[styles.searchWrap, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Ionicons name="search" size={18} color={theme.textMuted} />
              <TextInput
                style={[styles.searchInput, { color: theme.text, fontFamily: "Inter_400Regular" }]}
                placeholder="Search countries..."
                placeholderTextColor={theme.textMuted}
                value={search}
                onChangeText={setSearch}
                autoCorrect={false}
              />
              {search.length > 0 && (
                <Pressable onPress={() => setSearch("")} hitSlop={8}>
                  <Ionicons name="close-circle" size={18} color={theme.textMuted} />
                </Pressable>
              )}
            </View>

            <FlatList
              data={filtered}
              keyExtractor={(item) => item.code}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
              renderItem={({ item }) => {
                const isSelected = item.code === selected.code;
                return (
                  <Pressable
                    style={({ pressed }) => [
                      styles.row,
                      {
                        backgroundColor: isSelected ? theme.tint + "15" : "transparent",
                        borderColor: isSelected ? theme.tint + "30" : "transparent",
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}
                    onPress={() => {
                      onSelect(item);
                      setVisible(false);
                      setSearch("");
                    }}
                  >
                    <Text style={styles.rowFlag}>{item.flag}</Text>
                    <View style={styles.rowInfo}>
                      <Text style={[styles.rowName, { color: theme.text, fontFamily: "Inter_500Medium" }]}>
                        {item.name}
                      </Text>
                      <Text style={[styles.rowDial, { color: theme.textSecondary, fontFamily: "Inter_400Regular" }]}>
                        {item.dial}
                      </Text>
                    </View>
                    {isSelected && <Ionicons name="checkmark-circle" size={22} color={theme.tint} />}
                  </Pressable>
                );
              }}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Text style={[styles.emptyText, { color: theme.textMuted, fontFamily: "Inter_400Regular" }]}>
                    No countries found
                  </Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 10,
    height: 52,
    marginRight: 8,
  },
  flag: {
    fontSize: 20,
  },
  dial: {
    fontSize: 15,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    height: "85%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  sheetTitle: {
    fontSize: 20,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginVertical: 12,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 14,
    marginHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  rowFlag: {
    fontSize: 28,
  },
  rowInfo: {
    flex: 1,
    gap: 2,
  },
  rowName: {
    fontSize: 16,
  },
  rowDial: {
    fontSize: 13,
  },
  empty: {
    alignItems: "center",
    paddingTop: 40,
  },
  emptyText: {
    fontSize: 15,
  },
});
