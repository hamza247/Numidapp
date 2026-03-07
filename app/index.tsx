import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Platform,
  useColorScheme,
  ActivityIndicator,
  Alert,
  Keyboard,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Contacts from "expo-contacts";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Ionicons, Feather } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { apiRequest, getApiUrl } from "@/lib/query-client";

const PHONE_KEY = "user_phone";
const HISTORY_KEY = "search_history";
const SYNCED_KEY = "contacts_synced";

function formatPhoneDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  return `+${digits.slice(0, digits.length - 10)} (${digits.slice(-10, -7)}) ${digits.slice(-7, -4)}-${digits.slice(-4)}`;
}

function getLabelColor(label: string, theme: typeof Colors.dark): string {
  const l = label.toLowerCase();
  if (l.includes("mobile") || l.includes("cell")) return theme.labelMobile;
  if (l.includes("home")) return theme.labelHome;
  if (l.includes("work")) return theme.labelWork;
  return theme.labelOther;
}

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== "light";
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();

  const [userPhone, setUserPhone] = useState<string | null>(null);
  const [onboardingPhone, setOnboardingPhone] = useState("");
  const [searchPhone, setSearchPhone] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [synced, setSynced] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);
  const inputRef = useRef<TextInput>(null);

  const searchScale = useSharedValue(1);
  const searchAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: searchScale.value }],
  }));

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [phone, historyStr, syncedVal] = await Promise.all([
      AsyncStorage.getItem(PHONE_KEY),
      AsyncStorage.getItem(HISTORY_KEY),
      AsyncStorage.getItem(SYNCED_KEY),
    ]);
    setUserPhone(phone);
    if (historyStr) setHistory(JSON.parse(historyStr));
    setSynced(syncedVal === "true");
    setLoading(false);
  }

  async function saveUserPhone() {
    const digits = onboardingPhone.replace(/\D/g, "");
    if (digits.length < 7) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await AsyncStorage.setItem(PHONE_KEY, digits);
    setUserPhone(digits);
  }

  async function syncContacts() {
    if (syncing) return;
    setSyncing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== "granted") {
      setSyncing(false);
      Alert.alert(
        "Permission Required",
        "We need access to your contacts to help others discover who saved their number.",
        [{ text: "OK" }]
      );
      return;
    }

    const { data } = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
    });

    const items: Array<{ storedNumber: string; storedName: string; label: string }> = [];
    for (const contact of data) {
      const name = (contact.name || contact.firstName || contact.lastName || "").trim();
      if (!name || !contact.phoneNumbers) continue;
      for (const ph of contact.phoneNumbers) {
        const raw = ph.number?.replace(/\D/g, "") ?? "";
        if (raw.length < 5) continue;
        let label = (ph.label ?? "mobile").replace(/[_$!<>]/g, "").trim() || "mobile";
        if (label.length > 50) label = label.slice(0, 50);
        items.push({
          storedNumber: raw,
          storedName: name.slice(0, 200),
          label,
        });
      }
    }

    if (items.length === 0) {
      setSyncing(false);
      Alert.alert("No Contacts", "No phone contacts found.");
      return;
    }

    try {
      await apiRequest("POST", "/api/contacts/upload", {
        uploaderPhone: userPhone,
        contacts: items,
      });
      await AsyncStorage.setItem(SYNCED_KEY, "true");
      setSynced(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Synced!", `${items.length} contacts uploaded. Others can now find who saved their numbers.`);
    } catch (e: any) {
      console.error("Sync error:", e?.message || e);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Sync Failed", `Error: ${e?.message || "Please check your connection and try again."}`);
    } finally {
      setSyncing(false);
    }
  }

  async function performSearch(phone?: string) {
    const target = (phone ?? searchPhone).replace(/\D/g, "");
    if (target.length < 5) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Keyboard.dismiss();

    const newHistory = [target, ...history.filter((h) => h !== target)].slice(0, 10);
    setHistory(newHistory);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));

    router.push({ pathname: "/results", params: { phone: target } });
  }

  async function clearHistory() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setHistory([]);
    await AsyncStorage.removeItem(HISTORY_KEY);
  }

  async function resetAccount() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await Promise.all([
      AsyncStorage.removeItem(PHONE_KEY),
      AsyncStorage.removeItem(SYNCED_KEY),
    ]);
    setUserPhone(null);
    setSynced(false);
    setOnboardingPhone("");
  }

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.tint} size="large" />
      </View>
    );
  }

  const webTop = Platform.OS === "web" ? 67 : 0;
  const webBottom = Platform.OS === "web" ? 34 : 0;

  if (!userPhone) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top + webTop, paddingBottom: insets.bottom + webBottom }]}>
        <Animated.View style={styles.onboardingContent} entering={FadeInDown.duration(600).springify()}>
          <View style={[styles.iconRing, { borderColor: theme.tint + "30", backgroundColor: theme.tint + "12" }]}>
            <Ionicons name="search" size={48} color={theme.tint} />
          </View>

          <Text style={[styles.onboardingTitle, { color: theme.text, fontFamily: "Inter_700Bold" }]}>
            Who Saved Me?
          </Text>
          <Text style={[styles.onboardingSubtitle, { color: theme.textSecondary, fontFamily: "Inter_400Regular" }]}>
            Discover who has your number saved in their contacts, and what name they gave you.
          </Text>

          <View style={[styles.inputCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Ionicons name="call-outline" size={20} color={theme.textMuted} style={styles.inputIcon} />
            <TextInput
              ref={inputRef}
              style={[styles.phoneInput, { color: theme.text, fontFamily: "Inter_500Medium" }]}
              placeholder="Your phone number"
              placeholderTextColor={theme.textMuted}
              keyboardType="phone-pad"
              value={formatPhoneDisplay(onboardingPhone)}
              onChangeText={(t) => setOnboardingPhone(t.replace(/\D/g, ""))}
              returnKeyType="done"
              onSubmitEditing={saveUserPhone}
              maxLength={20}
            />
          </View>

          <Text style={[styles.inputHint, { color: theme.textMuted, fontFamily: "Inter_400Regular" }]}>
            This identifies you when others search
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.continueBtn,
              { backgroundColor: theme.tint, opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={saveUserPhone}
          >
            <Text style={[styles.continueBtnText, { fontFamily: "Inter_600SemiBold" }]}>Continue</Text>
            <Ionicons name="arrow-forward" size={18} color="#000" />
          </Pressable>

          <Text style={[styles.privacyNote, { color: theme.textMuted, fontFamily: "Inter_400Regular" }]}>
            Your number is never shown to other users
          </Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 + webBottom }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[styles.header, { paddingTop: insets.top + 16 + webTop }]}
          entering={FadeInDown.duration(400)}
        >
          <View>
            <Text style={[styles.headerTitle, { color: theme.text, fontFamily: "Inter_700Bold" }]}>
              Who Saved Me
            </Text>
            <Text style={[styles.headerSub, { color: theme.textSecondary, fontFamily: "Inter_400Regular" }]}>
              Discover who has your contact
            </Text>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.syncBtn,
              {
                backgroundColor: synced ? theme.tint + "20" : theme.card,
                borderColor: synced ? theme.tint + "40" : theme.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
            onPress={syncContacts}
          >
            {syncing ? (
              <ActivityIndicator size="small" color={theme.tint} />
            ) : (
              <Ionicons
                name={synced ? "cloud-done" : "cloud-upload-outline"}
                size={20}
                color={synced ? theme.tint : theme.textSecondary}
              />
            )}
          </Pressable>
        </Animated.View>

        <Animated.View style={styles.searchSection} entering={FadeInDown.delay(80).duration(400)}>
          <View style={[styles.searchCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Ionicons name="search" size={20} color={theme.textMuted} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: theme.text, fontFamily: "Inter_500Medium" }]}
              placeholder="Enter a phone number"
              placeholderTextColor={theme.textMuted}
              keyboardType="phone-pad"
              value={formatPhoneDisplay(searchPhone)}
              onChangeText={(t) => setSearchPhone(t.replace(/\D/g, ""))}
              returnKeyType="search"
              onSubmitEditing={() => performSearch()}
              maxLength={20}
            />
            {searchPhone.length > 0 && (
              <Pressable
                onPress={() => setSearchPhone("")}
                hitSlop={10}
                style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
              >
                <Ionicons name="close-circle" size={20} color={theme.textMuted} />
              </Pressable>
            )}
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.searchButton,
              { backgroundColor: theme.tint, opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={() => performSearch()}
          >
            <Ionicons name="search" size={22} color="#000" />
          </Pressable>
        </Animated.View>

        {!synced && (
          <Animated.View entering={FadeInDown.delay(160).duration(400)}>
            <Pressable
              style={[styles.syncBanner, { backgroundColor: theme.tint + "15", borderColor: theme.tint + "35" }]}
              onPress={syncContacts}
            >
              <View style={[styles.syncBannerIcon, { backgroundColor: theme.tint + "25" }]}>
                <Ionicons name="people-outline" size={18} color={theme.tint} />
              </View>
              <View style={styles.syncBannerText}>
                <Text style={[styles.syncBannerTitle, { color: theme.text, fontFamily: "Inter_600SemiBold" }]}>
                  Sync your contacts
                </Text>
                <Text style={[styles.syncBannerSub, { color: theme.textSecondary, fontFamily: "Inter_400Regular" }]}>
                  Help others find who saved their number
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
            </Pressable>
          </Animated.View>
        )}

        {history.length > 0 && (
          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.textSecondary, fontFamily: "Inter_600SemiBold" }]}>
                Recent
              </Text>
              <Pressable onPress={clearHistory} hitSlop={12}>
                <Text style={[styles.clearText, { color: theme.tint, fontFamily: "Inter_500Medium" }]}>
                  Clear
                </Text>
              </Pressable>
            </View>

            {history.map((item, idx) => (
              <Animated.View
                key={item}
                entering={FadeInDown.delay(240 + idx * 40).duration(350)}
              >
                <Pressable
                  style={({ pressed }) => [
                    styles.historyItem,
                    { backgroundColor: theme.card, borderColor: theme.border, opacity: pressed ? 0.7 : 1 },
                  ]}
                  onPress={() => performSearch(item)}
                >
                  <View style={[styles.historyIconWrap, { backgroundColor: theme.surface }]}>
                    <Ionicons name="time-outline" size={16} color={theme.textMuted} />
                  </View>
                  <Text style={[styles.historyNumber, { color: theme.text, fontFamily: "Inter_500Medium" }]}>
                    {formatPhoneDisplay(item)}
                  </Text>
                  <Ionicons name="arrow-forward-outline" size={16} color={theme.textMuted} />
                </Pressable>
              </Animated.View>
            ))}
          </Animated.View>
        )}

        {history.length === 0 && synced && (
          <Animated.View
            style={[styles.emptyState, { paddingTop: 48 }]}
            entering={FadeInDown.delay(200).duration(400)}
          >
            <Ionicons name="search-outline" size={48} color={theme.textMuted} />
            <Text style={[styles.emptyText, { color: theme.textMuted, fontFamily: "Inter_500Medium" }]}>
              Enter any phone number to see{"\n"}who has it saved
            </Text>
          </Animated.View>
        )}
      </ScrollView>

      <Pressable
        style={[styles.resetBtn, { bottom: insets.bottom + 16 + webBottom }]}
        onPress={resetAccount}
        hitSlop={12}
      >
        <Feather name="settings" size={16} color={theme.textMuted} />
        <Text style={[styles.resetText, { color: theme.textMuted, fontFamily: "Inter_400Regular" }]}>
          {formatPhoneDisplay(userPhone)}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    flex: 1,
  },
  onboardingContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 16,
  },
  iconRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  onboardingTitle: {
    fontSize: 32,
    textAlign: "center",
  },
  onboardingSubtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 8,
  },
  inputCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 56,
    width: "100%",
    marginTop: 8,
  },
  inputIcon: {
    marginRight: 12,
  },
  phoneInput: {
    flex: 1,
    fontSize: 18,
    letterSpacing: 0.5,
  },
  inputHint: {
    fontSize: 12,
    marginTop: -4,
  },
  continueBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 56,
    borderRadius: 14,
    width: "100%",
    marginTop: 8,
  },
  continueBtnText: {
    fontSize: 17,
    color: "#000",
  },
  privacyNote: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
  },
  headerSub: {
    fontSize: 14,
    marginTop: 2,
  },
  syncBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  searchSection: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 16,
  },
  searchCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 54,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    letterSpacing: 0.3,
  },
  searchButton: {
    width: 54,
    height: 54,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  syncBanner: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 12,
    marginBottom: 8,
  },
  syncBannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  syncBannerText: {
    flex: 1,
    gap: 2,
  },
  syncBannerTitle: {
    fontSize: 14,
  },
  syncBannerSub: {
    fontSize: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  clearText: {
    fontSize: 14,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 8,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  historyIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  historyNumber: {
    flex: 1,
    fontSize: 16,
    letterSpacing: 0.3,
  },
  emptyState: {
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  resetBtn: {
    position: "absolute",
    left: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  resetText: {
    fontSize: 13,
  },
});
