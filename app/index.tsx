import React, { useState, useEffect, useRef } from "react";
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
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons, Feather } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { apiRequest, getApiUrl } from "@/lib/query-client";
import { fetch } from "expo/fetch";
import CountryPicker from "@/components/CountryPicker";
import { countries, type Country } from "@/lib/countries";
import { useCoins, FREE_DAILY_SEARCHES, SEARCH_COST } from "@/lib/coins";

const PHONE_KEY = "user_phone";
const NAME_KEY = "user_name";
const HISTORY_KEY = "search_history";
const SYNCED_KEY = "contacts_synced";
const COUNTRY_KEY = "selected_country";

const defaultCountry = countries[0];

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== "light";
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { coins, freeSearchesRemaining, spendSearch, loaded: coinsLoaded } = useCoins();

  const [userPhone, setUserPhone] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [onboardingName, setOnboardingName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [onboardingPhone, setOnboardingPhone] = useState("");
  const [searchPhone, setSearchPhone] = useState("");
  const [history, setHistory] = useState<Array<{ phone: string; country: string }>>([]);
  const [synced, setSynced] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<Country>(defaultCountry);
  const [searchCountry, setSearchCountry] = useState<Country>(defaultCountry);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [phone, name, historyStr, syncedVal, countryCode] = await Promise.all([
      AsyncStorage.getItem(PHONE_KEY),
      AsyncStorage.getItem(NAME_KEY),
      AsyncStorage.getItem(HISTORY_KEY),
      AsyncStorage.getItem(SYNCED_KEY),
      AsyncStorage.getItem(COUNTRY_KEY),
    ]);
    setUserPhone(phone);
    setUserName(name);
    if (historyStr) {
      try {
        const parsed = JSON.parse(historyStr);
        if (Array.isArray(parsed)) {
          if (typeof parsed[0] === "string") {
            setHistory(parsed.map((p: string) => ({ phone: p, country: "US" })));
          } else {
            setHistory(parsed);
          }
        }
      } catch {}
    }
    setSynced(syncedVal === "true");
    if (countryCode) {
      const found = countries.find((c) => c.code === countryCode);
      if (found) {
        setSelectedCountry(found);
        setSearchCountry(found);
      }
    }
    setLoading(false);
  }

  const [savingProfile, setSavingProfile] = useState(false);

  function validateName(name: string): string | null {
    const trimmed = name.trim();
    if (trimmed.length < 2) return "Name must be at least 2 characters";
    if (trimmed.length > 100) return "Name is too long";
    if (!/^[a-zA-Z\s\-'.\u00C0-\u024F\u0600-\u06FF\u0400-\u04FF]+$/.test(trimmed)) return "Name contains invalid characters";
    if (trimmed.split(/\s+/).length < 2) return "Please enter your full name (first and last)";
    return null;
  }

  function validatePhone(digits: string): string | null {
    if (digits.length < 7) return "Phone number is too short";
    if (digits.length > 15) return "Phone number is too long";
    return null;
  }

  async function saveUserPhone() {
    const trimmedName = onboardingName.trim();
    const digits = onboardingPhone.replace(/\D/g, "");

    const nError = validateName(trimmedName);
    const pError = validatePhone(digits);
    setNameError(nError);
    setPhoneError(pError);

    if (nError || pError) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setSavingProfile(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Keyboard.dismiss();
    const fullNumber = selectedCountry.dial.replace("+", "") + digits;

    try {
      const base = getApiUrl();
      const url = new URL("/api/profile", base);
      const res = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: trimmedName,
          phone: fullNumber,
          countryCode: selectedCountry.code,
        }),
        credentials: "include",
      });

      if (res.status === 409) {
        await AsyncStorage.setItem(PHONE_KEY, fullNumber);
        await AsyncStorage.setItem(NAME_KEY, trimmedName);
        await AsyncStorage.setItem(COUNTRY_KEY, selectedCountry.code);
        setUserPhone(fullNumber);
        setUserName(trimmedName);
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const details = data?.details;
        if (details?.fullName) setNameError(details.fullName[0]);
        if (details?.phone) setPhoneError(details.phone[0]);
        if (!details) Alert.alert("Error", data?.error || "Failed to create profile");
        return;
      }

      await AsyncStorage.setItem(PHONE_KEY, fullNumber);
      await AsyncStorage.setItem(NAME_KEY, trimmedName);
      await AsyncStorage.setItem(COUNTRY_KEY, selectedCountry.code);
      setUserPhone(fullNumber);
      setUserName(trimmedName);
    } catch (e) {
      Alert.alert("Error", "Could not connect to the server. Please try again.");
    } finally {
      setSavingProfile(false);
    }
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
      Alert.alert("Synced!", `${items.length} contacts uploaded successfully.`);
    } catch (e: any) {
      console.error("Sync error:", e?.message || e);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Sync Failed", `Error: ${e?.message || "Please check your connection and try again."}`);
    } finally {
      setSyncing(false);
    }
  }

  async function performSearch(phone?: string, countryOverride?: Country) {
    if (!synced) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Sync Required",
        "You need to upload your contacts before you can search. This helps build the network for everyone.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Sync Now", onPress: syncContacts },
        ]
      );
      return;
    }
    const digits = (phone ?? searchPhone).replace(/\D/g, "");
    if (digits.length < 5) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (!coinsLoaded) return;

    if (freeSearchesRemaining <= 0 && coins < SEARCH_COST) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "No Searches Left",
        `You've used all ${FREE_DAILY_SEARCHES} free searches today and don't have enough coins. Each extra search costs ${SEARCH_COST} coin.`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Buy Coins", onPress: () => router.push("/store") },
        ]
      );
      return;
    }

    const result = await spendSearch();
    if (!result.allowed) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Not Enough Coins",
        `Each search costs ${SEARCH_COST} coin. You currently have ${coins} coins.`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Buy Coins", onPress: () => router.push("/store") },
        ]
      );
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Keyboard.dismiss();

    const c = countryOverride ?? searchCountry;
    const fullNumber = c.dial.replace("+", "") + digits;

    const entry = { phone: fullNumber, country: c.code };
    const newHistory = [entry, ...history.filter((h) => h.phone !== fullNumber)].slice(0, 10);
    setHistory(newHistory);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));

    router.push({
      pathname: "/results",
      params: { phone: fullNumber, countryCode: c.code, localNumber: digits },
    });
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
      AsyncStorage.removeItem(NAME_KEY),
      AsyncStorage.removeItem(SYNCED_KEY),
    ]);
    setUserPhone(null);
    setUserName(null);
    setSynced(false);
    setOnboardingPhone("");
    setOnboardingName("");
  }

  function getCountryForHistory(code: string): Country {
    return countries.find((c) => c.code === code) ?? defaultCountry;
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
            Create your profile to discover who has your number saved.
          </Text>

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary, fontFamily: "Inter_600SemiBold" }]}>
              Full Name
            </Text>
            <View style={[styles.inputRow, { backgroundColor: theme.card, borderColor: nameError ? theme.destructive : theme.border, borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, height: 52 }]}>
              <Ionicons name="person-outline" size={18} color={nameError ? theme.destructive : theme.textMuted} style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.phoneInput, { color: theme.text, fontFamily: "Inter_500Medium" }]}
                placeholder="First and last name"
                placeholderTextColor={theme.textMuted}
                autoCapitalize="words"
                autoCorrect={false}
                value={onboardingName}
                onChangeText={(t) => { setOnboardingName(t); if (nameError) setNameError(null); }}
                returnKeyType="next"
                maxLength={100}
              />
            </View>
            {nameError && (
              <Text style={[styles.fieldError, { color: theme.destructive, fontFamily: "Inter_400Regular" }]}>
                {nameError}
              </Text>
            )}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary, fontFamily: "Inter_600SemiBold" }]}>
              Phone Number
            </Text>
            <View style={[styles.inputRow]}>
              <CountryPicker selected={selectedCountry} onSelect={setSelectedCountry} />
              <View style={[styles.inputCard, { backgroundColor: theme.card, borderColor: phoneError ? theme.destructive : theme.border, flex: 1 }]}>
                <TextInput
                  ref={inputRef}
                  style={[styles.phoneInput, { color: theme.text, fontFamily: "Inter_500Medium" }]}
                  placeholder="Phone number"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="phone-pad"
                  value={onboardingPhone}
                  onChangeText={(t) => { setOnboardingPhone(t.replace(/\D/g, "")); if (phoneError) setPhoneError(null); }}
                  returnKeyType="done"
                  onSubmitEditing={saveUserPhone}
                  maxLength={15}
                />
              </View>
            </View>
            {phoneError && (
              <Text style={[styles.fieldError, { color: theme.destructive, fontFamily: "Inter_400Regular" }]}>
                {phoneError}
              </Text>
            )}
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.continueBtn,
              { backgroundColor: theme.tint, opacity: (pressed || savingProfile) ? 0.85 : 1 },
            ]}
            onPress={saveUserPhone}
            disabled={savingProfile}
          >
            {savingProfile ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <>
                <Text style={[styles.continueBtnText, { fontFamily: "Inter_600SemiBold" }]}>Create Profile</Text>
                <Ionicons name="arrow-forward" size={18} color="#000" />
              </>
            )}
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
          <View style={styles.headerActions}>
            <Pressable
              style={({ pressed }) => [styles.coinBadge, { backgroundColor: "#FFD700" + "20", borderColor: "#FFD700" + "40", opacity: pressed ? 0.7 : 1 }]}
              onPress={() => router.push("/store")}
            >
              <Ionicons name="diamond" size={14} color="#FFD700" />
              <Text style={[styles.coinText, { color: "#FFD700", fontFamily: "Inter_700Bold" }]}>
                {coins}
              </Text>
            </Pressable>
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
          </View>
        </Animated.View>

        <Animated.View style={styles.searchSection} entering={FadeInDown.delay(80).duration(400)}>
          <View style={styles.searchRow}>
            <CountryPicker selected={searchCountry} onSelect={setSearchCountry} />
            <View style={[styles.searchCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <TextInput
                style={[styles.searchInput, { color: theme.text, fontFamily: "Inter_500Medium" }]}
                placeholder="Phone number"
                placeholderTextColor={theme.textMuted}
                keyboardType="phone-pad"
                value={searchPhone}
                onChangeText={(t) => setSearchPhone(t.replace(/\D/g, ""))}
                returnKeyType="search"
                onSubmitEditing={() => performSearch()}
                maxLength={15}
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
          </View>
          <View style={styles.searchQuotaRow}>
            <Ionicons name="search-outline" size={12} color={freeSearchesRemaining > 0 ? theme.tint : "#FFD700"} />
            <Text style={[styles.searchQuotaText, { color: theme.textSecondary, fontFamily: "Inter_400Regular" }]}>
              {freeSearchesRemaining > 0
                ? `${freeSearchesRemaining} free search${freeSearchesRemaining === 1 ? "" : "es"} left today`
                : `${SEARCH_COST} coin per search`}
            </Text>
          </View>
        </Animated.View>

        {!synced && (
          <Animated.View entering={FadeInDown.delay(160).duration(400)} style={{ paddingHorizontal: 20, marginBottom: 16 }}>
            <View style={[styles.syncGateCard, { backgroundColor: theme.card, borderColor: theme.tint + "40" }]}>
              <View style={[styles.syncGateIconWrap, { backgroundColor: theme.tint + "15" }]}>
                <Ionicons name="lock-closed" size={24} color={theme.tint} />
              </View>
              <Text style={[styles.syncGateTitle, { color: theme.text, fontFamily: "Inter_600SemiBold" }]}>
                Upload contacts to unlock search
              </Text>
              <Text style={[styles.syncGateBody, { color: theme.textSecondary, fontFamily: "Inter_400Regular" }]}>
                Share your contact list to help build the network. You can then search any number to see who has it saved.
              </Text>
              <Pressable
                style={({ pressed }) => [
                  styles.syncGateBtn,
                  { backgroundColor: theme.tint, opacity: pressed ? 0.85 : 1 },
                ]}
                onPress={syncContacts}
              >
                {syncing ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <>
                    <Ionicons name="cloud-upload-outline" size={18} color="#000" />
                    <Text style={[styles.syncGateBtnText, { fontFamily: "Inter_600SemiBold" }]}>
                      Sync Contacts Now
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
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

            {history.map((item, idx) => {
              const c = getCountryForHistory(item.country);
              return (
                <Animated.View
                  key={item.phone}
                  entering={FadeInDown.delay(240 + idx * 40).duration(350)}
                >
                  <Pressable
                    style={({ pressed }) => [
                      styles.historyItem,
                      { backgroundColor: theme.card, borderColor: theme.border, opacity: pressed ? 0.7 : 1 },
                    ]}
                    onPress={() => {
                      const localDigits = item.phone.replace(c.dial.replace("+", ""), "");
                      performSearch(localDigits, c);
                    }}
                  >
                    <Text style={styles.historyFlag}>{c.flag}</Text>
                    <View style={styles.historyInfo}>
                      <Text style={[styles.historyNumber, { color: theme.text, fontFamily: "Inter_500Medium" }]}>
                        {c.dial} {item.phone.replace(c.dial.replace("+", ""), "")}
                      </Text>
                      <Text style={[styles.historyCountry, { color: theme.textSecondary, fontFamily: "Inter_400Regular" }]}>
                        {c.name}
                      </Text>
                    </View>
                    <Ionicons name="arrow-forward-outline" size={16} color={theme.textMuted} />
                  </Pressable>
                </Animated.View>
              );
            })}
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
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  inputCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
  },
  phoneInput: {
    flex: 1,
    fontSize: 18,
    letterSpacing: 0.5,
  },
  fieldGroup: {
    width: "100%",
    gap: 6,
    marginTop: 4,
  },
  fieldLabel: {
    fontSize: 13,
    letterSpacing: 0.2,
  },
  fieldError: {
    fontSize: 12,
    marginTop: -2,
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
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  coinBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  coinText: {
    fontSize: 15,
  },
  syncBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  searchQuotaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 4,
  },
  searchQuotaText: {
    fontSize: 12,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  searchCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    letterSpacing: 0.3,
  },
  searchButton: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  syncGateCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    gap: 12,
  },
  syncGateIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  syncGateTitle: {
    fontSize: 17,
    textAlign: "center",
  },
  syncGateBody: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  syncGateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 4,
    width: "100%" as any,
  },
  syncGateBtnText: {
    fontSize: 16,
    color: "#000",
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
  historyFlag: {
    fontSize: 24,
  },
  historyInfo: {
    flex: 1,
    gap: 2,
  },
  historyNumber: {
    fontSize: 16,
    letterSpacing: 0.3,
  },
  historyCountry: {
    fontSize: 12,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});
