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
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
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
import { useLanguage } from "@/lib/i18n";

const PHONE_KEY = "user_phone";
const NAME_KEY = "user_name";
const HISTORY_KEY = "search_history";
const COUNTRY_KEY = "selected_country";
const syncedKey = (phone: string) => `contacts_synced_${phone}`;

const defaultCountry = countries[0];

// Sort once at module load — longest dial codes first so "+212" matches before "+2"
const countriesByDialLength = [...countries].sort(
  (a, b) => b.dial.length - a.dial.length
);

function guessCountryFromPhone(phone: string): Country | null {
  const digits = phone.replace(/\D/g, "");
  for (const c of countriesByDialLength) {
    const dialDigits = c.dial.replace("+", "");
    if (digits.startsWith(dialDigits)) return c;
  }
  return null;
}

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== "light";
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { coins, freeSearchesRemaining, spendSearch, loaded: coinsLoaded, refreshCoins } = useCoins();
  const { t, fonts } = useLanguage();

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
  const otpInputRef = useRef<TextInput>(null);
  const [onboardingStep, setOnboardingStep] = useState<"register" | "verify" | "setPassword" | "login">("login");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [pendingPhone, setPendingPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loginPhone, setLoginPhone] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [phone, name, historyStr, countryCode] = await Promise.all([
      AsyncStorage.getItem(PHONE_KEY),
      AsyncStorage.getItem(NAME_KEY),
      AsyncStorage.getItem(HISTORY_KEY),
      AsyncStorage.getItem(COUNTRY_KEY),
    ]);
    const syncedVal = phone ? await AsyncStorage.getItem(syncedKey(phone)) : null;
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

    // Derive country from the stored phone number (most accurate source).
    // Fall back to saved COUNTRY_KEY, then the default.
    if (phone) {
      const derived = guessCountryFromPhone(phone);
      if (derived) {
        setSelectedCountry(derived);
        setSearchCountry(derived);
      } else if (countryCode) {
        const found = countries.find((c) => c.code === countryCode);
        if (found) { setSelectedCountry(found); setSearchCountry(found); }
      }
    } else if (countryCode) {
      const found = countries.find((c) => c.code === countryCode);
      if (found) { setSelectedCountry(found); setSearchCountry(found); }
    }

    setLoading(false);
  }

  function validateName(name: string): string | null {
    const trimmed = name.trim();
    if (trimmed.length < 2) return t.nameMin;
    if (trimmed.length > 100) return t.nameTooLong;
    if (!/^[a-zA-Z\s\-'.\u00C0-\u024F\u0600-\u06FF\u0400-\u04FF]+$/.test(trimmed)) return t.nameInvalid;
    if (trimmed.split(/\s+/).length < 2) return t.nameFullRequired;
    return null;
  }

  function validatePhone(digits: string): string | null {
    if (digits.length < 7) return t.phoneTooShort;
    if (digits.length > 15) return t.phoneTooLong;
    return null;
  }

  async function sendOtpCode() {
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

    setSendingOtp(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Keyboard.dismiss();
    const fullNumber = selectedCountry.dial.replace("+", "") + digits;

    try {
      const base = getApiUrl();
      const url = new URL("/api/auth/send-otp", base);
      const res = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fullNumber }),
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        Alert.alert("Error", data?.error || "Failed to send verification code");
        return;
      }

      setPendingPhone(fullNumber);
      setOtpCode("");
      setOtpError(null);
      setOnboardingStep("verify");
      setTimeout(() => otpInputRef.current?.focus(), 300);
    } catch (e) {
      Alert.alert("Error", "Could not connect to the server. Please try again.");
    } finally {
      setSendingOtp(false);
    }
  }

  async function verifyOtpAndFinish() {
    if (otpCode.length !== 6) {
      setOtpError(t.enterComplete);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setVerifyingOtp(true);
    setOtpError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Keyboard.dismiss();

    try {
      const base = getApiUrl();
      const verifyUrl = new URL("/api/auth/verify-otp", base);
      const verifyRes = await fetch(verifyUrl.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: pendingPhone, code: otpCode }),
        credentials: "include",
      });

      if (!verifyRes.ok) {
        const data = await verifyRes.json().catch(() => ({}));
        setOtpError(data?.error || "Verification failed");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      setNewPassword("");
      setConfirmPassword("");
      setPasswordError(null);
      setConfirmPasswordError(null);
      setOnboardingStep("setPassword");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      Alert.alert("Error", "Could not connect to the server. Please try again.");
    } finally {
      setVerifyingOtp(false);
    }
  }

  async function createAccountWithPassword() {
    const pw = newPassword.trim();
    const cpw = confirmPassword.trim();
    let pError: string | null = null;
    let cpError: string | null = null;
    if (pw.length < 6) pError = t.passwordMin;
    if (!cpw) cpError = t.passwordConfirmRequired;
    else if (pw !== cpw) cpError = t.passwordMismatch;
    setPasswordError(pError);
    setConfirmPasswordError(cpError);
    if (pError || cpError) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); return; }

    setSavingPassword(true);
    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const base = getApiUrl();
      const url = new URL("/api/auth/register", base);
      const res = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: pendingPhone, fullName: onboardingName.trim(), countryCode: selectedCountry.code, password: pw }),
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 409) {
          Alert.alert(
            "Account Already Exists",
            "An account with this number already has a password set. Please log in instead.",
            [
              { text: "Log In", onPress: () => {
                setLoginPhone(onboardingPhone);
                setOnboardingStep("login");
              }},
              { text: "Cancel", style: "cancel" },
            ]
          );
        } else {
          Alert.alert("Error", data?.error || "Failed to create account");
        }
        return;
      }
      const finalName = data?.profile?.fullName || onboardingName.trim();
      await AsyncStorage.setItem(PHONE_KEY, pendingPhone);
      await AsyncStorage.setItem(NAME_KEY, finalName);
      await AsyncStorage.setItem(COUNTRY_KEY, selectedCountry.code);
      setUserPhone(pendingPhone);
      setUserName(finalName);
      await refreshCoins(pendingPhone);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch { Alert.alert("Error", "Could not connect to the server. Please try again."); }
    finally { setSavingPassword(false); }
  }

  async function performLogin() {
    const digits = loginPhone.replace(/\D/g, "");
    if (digits.length < 7 || !loginPassword) {
      setLoginError(!loginPassword ? t.passwordRequired : t.phoneRequired);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setLoggingIn(true);
    setLoginError(null);
    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const fullNumber = selectedCountry.dial.replace("+", "") + digits;
    try {
      const base = getApiUrl();
      const url = new URL("/api/auth/login", base);
      const res = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fullNumber, password: loginPassword }),
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setLoginError(data?.error || "Login failed. Please check your credentials."); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); return; }
      const profile = data?.profile;
      await AsyncStorage.setItem(PHONE_KEY, fullNumber);
      await AsyncStorage.setItem(NAME_KEY, profile?.fullName || "");
      await AsyncStorage.setItem(COUNTRY_KEY, profile?.countryCode || selectedCountry.code);
      setUserPhone(fullNumber);
      setUserName(profile?.fullName || "");
      await refreshCoins(fullNumber);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch { Alert.alert("Error", "Could not connect to the server. Please try again."); }
    finally { setLoggingIn(false); }
  }

  async function resendOtpCode() {
    setSendingOtp(true);
    try {
      const base = getApiUrl();
      const url = new URL("/api/auth/send-otp", base);
      const res = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: pendingPhone }),
        credentials: "include",
      });
      if (res.ok) {
        setOtpCode("");
        setOtpError(null);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Code Sent", "A new verification code has been sent to your phone.");
      } else {
        Alert.alert("Error", "Failed to resend code. Please try again.");
      }
    } catch {
      Alert.alert("Error", "Could not connect to the server.");
    } finally {
      setSendingOtp(false);
    }
  }

  async function syncContacts() {
    if (syncing) return;
    setSyncing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== "granted") {
      setSyncing(false);
      Alert.alert(t.permissionRequired, t.permissionMsg, [{ text: "OK" }]);
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
      Alert.alert(t.syncFailed, t.syncNoContacts);
      return;
    }

    try {
      await apiRequest("POST", "/api/contacts/upload", {
        uploaderPhone: userPhone,
        contacts: items,
      });
      if (userPhone) await AsyncStorage.setItem(syncedKey(userPhone), "true");
      setSynced(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("✓", t.syncSuccess(items.length));
    } catch (e: any) {
      console.error("Sync error:", e?.message || e);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(t.syncFailed, `${e?.message || ""}`);
    } finally {
      setSyncing(false);
    }
  }

  async function performSearch(phone?: string, countryOverride?: Country) {
    if (!synced) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(t.syncRequired, t.syncRequiredMsg, [
        { text: t.cancel, style: "cancel" },
        { text: t.syncNow, onPress: syncContacts },
      ]);
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
      Alert.alert(t.noSearchesLeft, t.noSearchesMsg(FREE_DAILY_SEARCHES, SEARCH_COST), [
        { text: t.cancel, style: "cancel" },
        { text: t.buyCoins, onPress: () => router.push("/store") },
      ]);
      return;
    }

    const result = await spendSearch();
    if (!result.allowed) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(t.notEnoughCoins, t.notEnoughCoinsMsg(SEARCH_COST, coins), [
        { text: t.cancel, style: "cancel" },
        { text: t.buyCoins, onPress: () => router.push("/store") },
      ]);
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
    ]);
    setUserPhone(null);
    setUserName(null);
    setSynced(false);
    setOnboardingPhone("");
    setOnboardingName("");
    setOnboardingStep("register");
    setOtpCode("");
    setOtpError(null);
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError(null);
    setConfirmPasswordError(null);
    setLoginPhone("");
    setLoginPassword("");
    setLoginError(null);
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
    if (onboardingStep === "verify") {
      return (
        <KeyboardAwareScrollViewCompat
          style={{ flex: 1, backgroundColor: theme.background }}
          contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + webTop, paddingBottom: insets.bottom + webBottom }}
          bottomOffset={24}
        >
          <Animated.View style={styles.onboardingContent} entering={FadeInDown.duration(500).springify()}>
            <View style={[styles.iconRing, { borderColor: "#C49A2A" + "40", backgroundColor: "#C49A2A" + "15" }]}>
              <Ionicons name="shield-checkmark-outline" size={48} color="#C49A2A" />
            </View>

            <Text style={[styles.onboardingTitle, { color: theme.text, fontFamily: fonts.bold }]}>
              {t.verifyTitle}
            </Text>
            <Text style={[styles.onboardingSubtitle, { color: theme.textSecondary, fontFamily: fonts.regular }]}>
              {t.verifySubtitle}{"\n"}
              <Text style={{ color: theme.tint, fontFamily: fonts.semiBold }}>
                +{pendingPhone}
              </Text>
            </Text>

            <Pressable onPress={() => { otpInputRef.current?.focus(); }} style={{ width: "100%" }}>
              <View style={styles.otpRow}>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <View
                    key={i}
                    style={[
                      styles.otpBox,
                      {
                        backgroundColor: theme.card,
                        borderColor: otpError
                          ? theme.destructive
                          : otpCode.length === i
                          ? theme.tint
                          : otpCode.length > i
                          ? theme.tint + "60"
                          : theme.border,
                      },
                    ]}
                  >
                    <Text style={[styles.otpDigit, { color: theme.text, fontFamily: fonts.bold }]}>
                      {otpCode[i] ?? ""}
                    </Text>
                  </View>
                ))}
              </View>
            </Pressable>

            <TextInput
              ref={otpInputRef}
              style={styles.hiddenInput}
              value={otpCode}
              onChangeText={(t) => {
                const digits = t.replace(/\D/g, "").slice(0, 6);
                setOtpCode(digits);
                if (otpError) setOtpError(null);
              }}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
              caretHidden
            />

            {otpError && (
              <Text style={[styles.fieldError, { color: theme.destructive, fontFamily: fonts.regular, textAlign: "center" }]}>
                {otpError}
              </Text>
            )}

            <Pressable
              style={({ pressed }) => [
                styles.continueBtn,
                { backgroundColor: theme.tint, opacity: (pressed || verifyingOtp) ? 0.85 : 1 },
              ]}
              onPress={verifyOtpAndFinish}
              disabled={verifyingOtp || otpCode.length !== 6}
            >
              {verifyingOtp ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <>
                  <Text style={[styles.continueBtnText, { fontFamily: fonts.semiBold }]}>{t.verify}</Text>
                  <Ionicons name="checkmark" size={18} color="#000" />
                </>
              )}
            </Pressable>

            <View style={styles.resendRow}>
              <Text style={[styles.privacyNote, { color: theme.textMuted, fontFamily: fonts.regular }]}>
                {t.didntReceive}
              </Text>
              <Pressable onPress={resendOtpCode} disabled={sendingOtp}>
                <Text style={[styles.resendLink, { color: theme.tint, fontFamily: fonts.semiBold, opacity: sendingOtp ? 0.5 : 1 }]}>
                  {sendingOtp ? t.resending : t.resend}
                </Text>
              </Pressable>
            </View>

            <Pressable onPress={() => { setOnboardingStep("register"); setOtpCode(""); setOtpError(null); }}>
              <Text style={[styles.privacyNote, { color: theme.textMuted, fontFamily: fonts.regular }]}>
                {t.changePhone}
              </Text>
            </Pressable>
          </Animated.View>
        </KeyboardAwareScrollViewCompat>
      );
    }

    if (onboardingStep === "setPassword") {
      return (
        <KeyboardAwareScrollViewCompat
          style={{ flex: 1, backgroundColor: theme.background }}
          contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + webTop, paddingBottom: insets.bottom + webBottom }}
          bottomOffset={24}
        >
          <Animated.View style={styles.onboardingContent} entering={FadeInDown.duration(500).springify()}>
            <View style={[styles.iconRing, { borderColor: theme.tint + "30", backgroundColor: theme.tint + "12" }]}>
              <Ionicons name="lock-closed-outline" size={48} color={theme.tint} />
            </View>

            <Text style={[styles.onboardingTitle, { color: theme.text, fontFamily: fonts.bold }]}>
              {t.setPasswordTitle}
            </Text>
            <Text style={[styles.onboardingSubtitle, { color: theme.textSecondary, fontFamily: fonts.regular }]}>
              {t.setPasswordSubtitle}
            </Text>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary, fontFamily: fonts.semiBold }]}>{t.newPassword}</Text>
              <View style={[styles.inputRow, { backgroundColor: theme.card, borderColor: passwordError ? theme.destructive : theme.border, borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, height: 52 }]}>
                <Ionicons name="lock-closed-outline" size={18} color={passwordError ? theme.destructive : theme.textMuted} style={{ marginRight: 8 }} />
                <TextInput
                  style={[styles.phoneInput, { color: theme.text, fontFamily: fonts.medium }]}
                  placeholder={t.passwordPlaceholder}
                  placeholderTextColor={theme.textMuted}
                  secureTextEntry={!showNewPassword}
                  value={newPassword}
                  onChangeText={(v) => { setNewPassword(v); if (passwordError) setPasswordError(null); }}
                  returnKeyType="next"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Pressable onPress={() => setShowNewPassword(!showNewPassword)} hitSlop={8}>
                  <Ionicons name={showNewPassword ? "eye-off-outline" : "eye-outline"} size={18} color={theme.textMuted} />
                </Pressable>
              </View>
              {passwordError && <Text style={[styles.fieldError, { color: theme.destructive, fontFamily: fonts.regular }]}>{passwordError}</Text>}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary, fontFamily: fonts.semiBold }]}>{t.confirmPassword}</Text>
              <View style={[styles.inputRow, { backgroundColor: theme.card, borderColor: confirmPasswordError ? theme.destructive : theme.border, borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, height: 52 }]}>
                <Ionicons name="lock-closed-outline" size={18} color={confirmPasswordError ? theme.destructive : theme.textMuted} style={{ marginRight: 8 }} />
                <TextInput
                  style={[styles.phoneInput, { color: theme.text, fontFamily: fonts.medium }]}
                  placeholder={t.confirmPasswordPlaceholder}
                  placeholderTextColor={theme.textMuted}
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={(v) => { setConfirmPassword(v); if (confirmPasswordError) setConfirmPasswordError(null); }}
                  returnKeyType="done"
                  onSubmitEditing={createAccountWithPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)} hitSlop={8}>
                  <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={18} color={theme.textMuted} />
                </Pressable>
              </View>
              {confirmPasswordError && <Text style={[styles.fieldError, { color: theme.destructive, fontFamily: fonts.regular }]}>{confirmPasswordError}</Text>}
            </View>

            <Pressable
              style={({ pressed }) => [styles.continueBtn, { backgroundColor: theme.tint, opacity: (pressed || savingPassword) ? 0.85 : 1 }]}
              onPress={createAccountWithPassword}
              disabled={savingPassword}
            >
              {savingPassword ? <ActivityIndicator size="small" color="#000" /> : (
                <><Text style={[styles.continueBtnText, { fontFamily: fonts.semiBold }]}>{t.createAccount}</Text><Ionicons name="checkmark" size={18} color="#000" /></>
              )}
            </Pressable>

            <Pressable onPress={() => { setOnboardingStep("verify"); setNewPassword(""); setConfirmPassword(""); }}>
              <Text style={[styles.privacyNote, { color: theme.textMuted, fontFamily: fonts.regular }]}>
                {t.backToVerification}
              </Text>
            </Pressable>
          </Animated.View>
        </KeyboardAwareScrollViewCompat>
      );
    }

    if (onboardingStep === "login") {
      return (
        <KeyboardAwareScrollViewCompat
          style={{ flex: 1, backgroundColor: theme.background }}
          contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + webTop, paddingBottom: insets.bottom + webBottom }}
          bottomOffset={24}
        >
          <Animated.View style={styles.onboardingContent} entering={FadeInDown.duration(500).springify()}>
            <View style={[styles.iconRing, { borderColor: theme.tint + "30", backgroundColor: theme.tint + "12" }]}>
              <Ionicons name="person-circle-outline" size={48} color={theme.tint} />
            </View>

            <Text style={[styles.onboardingTitle, { color: theme.text, fontFamily: fonts.bold }]}>
              {t.loginTitle}
            </Text>
            <Text style={[styles.onboardingSubtitle, { color: theme.textSecondary, fontFamily: fonts.regular }]}>
              {t.loginWith}
            </Text>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary, fontFamily: fonts.semiBold }]}>{t.phoneNumber}</Text>
              <View style={styles.inputRow}>
                <CountryPicker selected={selectedCountry} onSelect={setSelectedCountry} />
                <View style={[styles.inputCard, { backgroundColor: theme.card, borderColor: theme.border, flex: 1 }]}>
                  <TextInput
                    style={[styles.phoneInput, { color: theme.text, fontFamily: fonts.medium }]}
                    placeholder={t.phonePlaceholder}
                    placeholderTextColor={theme.textMuted}
                    keyboardType="phone-pad"
                    value={loginPhone}
                    onChangeText={(v) => { setLoginPhone(v.replace(/\D/g, "")); if (loginError) setLoginError(null); }}
                    returnKeyType="next"
                    maxLength={15}
                  />
                </View>
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary, fontFamily: fonts.semiBold }]}>{t.password}</Text>
              <View style={[styles.inputRow, { backgroundColor: theme.card, borderColor: loginError ? theme.destructive : theme.border, borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, height: 52 }]}>
                <Ionicons name="lock-closed-outline" size={18} color={loginError ? theme.destructive : theme.textMuted} style={{ marginRight: 8 }} />
                <TextInput
                  style={[styles.phoneInput, { color: theme.text, fontFamily: fonts.medium }]}
                  placeholder={t.password}
                  placeholderTextColor={theme.textMuted}
                  secureTextEntry={!showLoginPassword}
                  value={loginPassword}
                  onChangeText={(v) => { setLoginPassword(v); if (loginError) setLoginError(null); }}
                  returnKeyType="done"
                  onSubmitEditing={performLogin}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Pressable onPress={() => setShowLoginPassword(!showLoginPassword)} hitSlop={8}>
                  <Ionicons name={showLoginPassword ? "eye-off-outline" : "eye-outline"} size={18} color={theme.textMuted} />
                </Pressable>
              </View>
              {loginError && <Text style={[styles.fieldError, { color: theme.destructive, fontFamily: fonts.regular }]}>{loginError}</Text>}
            </View>

            <Pressable
              style={({ pressed }) => [styles.continueBtn, { backgroundColor: theme.tint, opacity: (pressed || loggingIn) ? 0.85 : 1 }]}
              onPress={performLogin}
              disabled={loggingIn}
            >
              {loggingIn ? <ActivityIndicator size="small" color="#000" /> : (
                <><Text style={[styles.continueBtnText, { fontFamily: fonts.semiBold }]}>{t.login}</Text><Ionicons name="arrow-forward" size={18} color="#000" /></>
              )}
            </Pressable>

            <View style={styles.resendRow}>
              <Text style={[styles.privacyNote, { color: theme.textMuted, fontFamily: fonts.regular }]}>{t.noAccount}</Text>
              <Pressable onPress={() => { setOnboardingStep("register"); setLoginPhone(""); setLoginPassword(""); setLoginError(null); }}>
                <Text style={[styles.resendLink, { color: theme.tint, fontFamily: fonts.semiBold }]}>{t.createOne}</Text>
              </Pressable>
            </View>
          </Animated.View>
        </KeyboardAwareScrollViewCompat>
      );
    }

    return (
      <KeyboardAwareScrollViewCompat
        style={{ flex: 1, backgroundColor: theme.background }}
        contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + webTop, paddingBottom: insets.bottom + webBottom }}
        bottomOffset={24}
      >
        <Animated.View style={styles.onboardingContent} entering={FadeInDown.duration(600).springify()}>
          <View style={[styles.iconRing, { borderColor: theme.tint + "30", backgroundColor: theme.tint + "12" }]}>
            <Ionicons name="search" size={48} color={theme.tint} />
          </View>

          <Text style={[styles.onboardingTitle, { color: theme.text, fontFamily: fonts.bold }]}>
            {t.appName}
          </Text>
          <Text style={[styles.onboardingSubtitle, { color: theme.textSecondary, fontFamily: fonts.regular }]}>
            {t.registerTagline}
          </Text>

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary, fontFamily: fonts.semiBold }]}>
              {t.fullName}
            </Text>
            <View style={[styles.inputRow, { backgroundColor: theme.card, borderColor: nameError ? theme.destructive : theme.border, borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, height: 52 }]}>
              <Ionicons name="person-outline" size={18} color={nameError ? theme.destructive : theme.textMuted} style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.phoneInput, { color: theme.text, fontFamily: fonts.medium }]}
                placeholder={t.fullNamePlaceholder}
                placeholderTextColor={theme.textMuted}
                autoCapitalize="words"
                autoCorrect={false}
                value={onboardingName}
                onChangeText={(v) => { setOnboardingName(v); if (nameError) setNameError(null); }}
                returnKeyType="next"
                maxLength={100}
              />
            </View>
            {nameError && (
              <Text style={[styles.fieldError, { color: theme.destructive, fontFamily: fonts.regular }]}>
                {nameError}
              </Text>
            )}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary, fontFamily: fonts.semiBold }]}>
              {t.phoneNumber}
            </Text>
            <View style={[styles.inputRow]}>
              <CountryPicker selected={selectedCountry} onSelect={setSelectedCountry} />
              <View style={[styles.inputCard, { backgroundColor: theme.card, borderColor: phoneError ? theme.destructive : theme.border, flex: 1 }]}>
                <TextInput
                  ref={inputRef}
                  style={[styles.phoneInput, { color: theme.text, fontFamily: fonts.medium }]}
                  placeholder={t.phonePlaceholder}
                  placeholderTextColor={theme.textMuted}
                  keyboardType="phone-pad"
                  value={onboardingPhone}
                  onChangeText={(v) => { setOnboardingPhone(v.replace(/\D/g, "")); if (phoneError) setPhoneError(null); }}
                  returnKeyType="done"
                  onSubmitEditing={sendOtpCode}
                  maxLength={15}
                />
              </View>
            </View>
            {phoneError && (
              <Text style={[styles.fieldError, { color: theme.destructive, fontFamily: fonts.regular }]}>
                {phoneError}
              </Text>
            )}
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.continueBtn,
              { backgroundColor: theme.tint, opacity: (pressed || sendingOtp) ? 0.85 : 1 },
            ]}
            onPress={sendOtpCode}
            disabled={sendingOtp}
          >
            {sendingOtp ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <>
                <Text style={[styles.continueBtnText, { fontFamily: fonts.semiBold }]}>{t.sendCode}</Text>
                <Ionicons name="arrow-forward" size={18} color="#000" />
              </>
            )}
          </Pressable>

          <Text style={[styles.privacyNote, { color: theme.textMuted, fontFamily: fonts.regular }]}>
            {t.privacyNote}
          </Text>

          <View style={styles.resendRow}>
            <Text style={[styles.privacyNote, { color: theme.textMuted, fontFamily: fonts.regular }]}>{t.alreadyHaveAccount}</Text>
            <Pressable onPress={() => { setOnboardingStep("login"); setLoginPhone(""); setLoginPassword(""); setLoginError(null); }}>
              <Text style={[styles.resendLink, { color: theme.tint, fontFamily: fonts.semiBold }]}>{t.login}</Text>
            </Pressable>
          </View>
        </Animated.View>
      </KeyboardAwareScrollViewCompat>
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
          <View style={styles.headerLeft}>
            <Text style={[styles.headerTitle, { color: theme.text, fontFamily: fonts.bold }]}>
              {t.appName}
            </Text>
            <Text style={[styles.headerSub, { color: theme.textSecondary, fontFamily: fonts.regular }]}>
              {t.appTagline}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              style={({ pressed }) => [styles.coinBadge, { backgroundColor: "#C49A2A" + "20", borderColor: "#C49A2A" + "40", opacity: pressed ? 0.7 : 1 }]}
              onPress={() => router.push("/store")}
            >
              <Ionicons name="diamond" size={14} color="#C49A2A" />
              <Text style={[styles.coinText, { color: "#C49A2A", fontFamily: fonts.bold }]}>
                {coins}
              </Text>
            </Pressable>
          </View>
        </Animated.View>

        <Animated.View style={styles.searchSection} entering={FadeInDown.delay(80).duration(400)}>
          <View style={styles.searchRow}>
            <CountryPicker selected={searchCountry} onSelect={setSearchCountry} />
            <View style={[styles.searchCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <TextInput
                style={[styles.searchInput, { color: theme.text, fontFamily: fonts.medium }]}
                placeholder={t.searchPlaceholder}
                placeholderTextColor={theme.textMuted}
                keyboardType="phone-pad"
                value={searchPhone}
                onChangeText={(v) => setSearchPhone(v.replace(/\D/g, ""))}
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
            <Ionicons name="search-outline" size={12} color={freeSearchesRemaining > 0 ? theme.tint : "#C49A2A"} />
            <Text style={[styles.searchQuotaText, { color: theme.textSecondary, fontFamily: fonts.regular }]}>
              {freeSearchesRemaining > 0
                ? t.freeSearches(freeSearchesRemaining)
                : t.useCoin}
            </Text>
          </View>
        </Animated.View>

        {!synced && (
          <Animated.View entering={FadeInDown.delay(160).duration(400)} style={{ paddingHorizontal: 20, marginBottom: 16 }}>
            <View style={[styles.syncGateCard, { backgroundColor: theme.card, borderColor: theme.tint + "40" }]}>
              <View style={[styles.syncGateIconWrap, { backgroundColor: theme.tint + "15" }]}>
                <Ionicons name="lock-closed" size={24} color={theme.tint} />
              </View>
              <Text style={[styles.syncGateTitle, { color: theme.text, fontFamily: fonts.semiBold }]}>
                {t.uploadContactsTitle}
              </Text>
              <Text style={[styles.syncGateBody, { color: theme.textSecondary, fontFamily: fonts.regular }]}>
                {t.uploadContactsBody}
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
                    <Text style={[styles.syncGateBtnText, { fontFamily: fonts.semiBold }]}>
                      {t.syncGateBtn}
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
              <Text style={[styles.sectionTitle, { color: theme.textSecondary, fontFamily: fonts.semiBold }]}>
                {t.recent}
              </Text>
              <Pressable onPress={clearHistory} hitSlop={12}>
                <Text style={[styles.clearText, { color: theme.tint, fontFamily: fonts.medium }]}>
                  {t.clear}
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
                      <Text style={[styles.historyNumber, { color: theme.text, fontFamily: fonts.medium }]}>
                        {c.dial} {item.phone.replace(c.dial.replace("+", ""), "")}
                      </Text>
                      <Text style={[styles.historyCountry, { color: theme.textSecondary, fontFamily: fonts.regular }]}>
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
            <Text style={[styles.emptyText, { color: theme.textMuted, fontFamily: fonts.medium }]}>
              {t.enterNumberHint}
            </Text>
          </Animated.View>
        )}
      </ScrollView>

      <Pressable
        style={[styles.resetBtn, { bottom: insets.bottom + 16 + webBottom }]}
        onPress={() => router.push("/profile")}
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
  otpRow: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    width: "100%",
    marginVertical: 8,
  },
  otpBox: {
    width: 46,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  otpDigit: {
    fontSize: 24,
  },
  hiddenInput: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
  },
  resendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  resendLink: {
    fontSize: 14,
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
  },
  headerSub: {
    fontSize: 14,
    marginTop: 2,
  },
  headerActions: {
    alignItems: "center",
    justifyContent: "flex-end",
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
