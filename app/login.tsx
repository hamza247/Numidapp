import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
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
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { getApiUrl } from "@/lib/query-client";
import { fetch } from "expo/fetch";
import CountryPicker from "@/components/CountryPicker";
import { countries, type Country } from "@/lib/countries";
import { useCoins } from "@/lib/coins";

const PHONE_KEY = "user_phone";
const NAME_KEY = "user_name";
const COUNTRY_KEY = "selected_country";

const defaultCountry = countries[0];

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== "light";
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { refreshCoins } = useCoins();

  const webTop = Platform.OS === "web" ? 67 : 0;
  const webBottom = Platform.OS === "web" ? 34 : 0;

  const [step, setStep] = useState<"register" | "verify" | "setPassword" | "login">("login");
  const [selectedCountry, setSelectedCountry] = useState<Country>(defaultCountry);

  const [onboardingName, setOnboardingName] = useState("");
  const [onboardingPhone, setOnboardingPhone] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const [sendingOtp, setSendingOtp] = useState(false);
  const [pendingPhone, setPendingPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

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

  const inputRef = useRef<TextInput>(null);
  const otpInputRef = useRef<TextInput>(null);

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

  async function sendOtpCode() {
    const trimmedName = onboardingName.trim();
    const digits = onboardingPhone.replace(/\D/g, "");
    const nError = validateName(trimmedName);
    const pError = validatePhone(digits);
    setNameError(nError);
    setPhoneError(pError);
    if (nError || pError) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); return; }
    setSendingOtp(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Keyboard.dismiss();
    const fullNumber = selectedCountry.dial.replace("+", "") + digits;
    try {
      const url = new URL("/api/auth/send-otp", getApiUrl());
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
      setStep("verify");
      setTimeout(() => otpInputRef.current?.focus(), 300);
    } catch {
      Alert.alert("Error", "Could not connect to the server. Please try again.");
    } finally {
      setSendingOtp(false);
    }
  }

  async function resendOtpCode() {
    setSendingOtp(true);
    try {
      const url = new URL("/api/auth/send-otp", getApiUrl());
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
        Alert.alert("Code Sent", "A new verification code has been sent.");
      } else {
        Alert.alert("Error", "Failed to resend code.");
      }
    } catch {
      Alert.alert("Error", "Could not connect to the server.");
    } finally {
      setSendingOtp(false);
    }
  }

  async function verifyOtpAndFinish() {
    if (otpCode.length !== 6) {
      setOtpError("Please enter the complete 6-digit code");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setVerifyingOtp(true);
    setOtpError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Keyboard.dismiss();
    try {
      const url = new URL("/api/auth/verify-otp", getApiUrl());
      const res = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: pendingPhone, code: otpCode }),
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setOtpError(data?.error || "Verification failed");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
      setNewPassword("");
      setConfirmPassword("");
      setPasswordError(null);
      setConfirmPasswordError(null);
      setStep("setPassword");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert("Error", "Could not connect to the server.");
    } finally {
      setVerifyingOtp(false);
    }
  }

  async function createAccountWithPassword() {
    const pw = newPassword.trim();
    const cpw = confirmPassword.trim();
    let pError: string | null = null;
    let cpError: string | null = null;
    if (pw.length < 6) pError = "Password must be at least 6 characters";
    if (!cpw) cpError = "Please confirm your password";
    else if (pw !== cpw) cpError = "Passwords do not match";
    setPasswordError(pError);
    setConfirmPasswordError(cpError);
    if (pError || cpError) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); return; }
    setSavingPassword(true);
    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const url = new URL("/api/auth/register", getApiUrl());
      const res = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: pendingPhone, fullName: onboardingName.trim(), countryCode: selectedCountry.code, password: pw }),
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 409) {
          Alert.alert("Account Already Exists", "An account with this number already has a password. Please log in.", [
            { text: "Log In", onPress: () => { setLoginPhone(onboardingPhone); setStep("login"); } },
            { text: "Cancel", style: "cancel" },
          ]);
        } else {
          Alert.alert("Error", data?.error || "Failed to create account");
        }
        return;
      }
      const finalName = data?.profile?.fullName || onboardingName.trim();
      await AsyncStorage.setItem(PHONE_KEY, pendingPhone);
      await AsyncStorage.setItem(NAME_KEY, finalName);
      await AsyncStorage.setItem(COUNTRY_KEY, selectedCountry.code);
      await refreshCoins(pendingPhone);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/");
    } catch {
      Alert.alert("Error", "Could not connect to the server.");
    } finally {
      setSavingPassword(false);
    }
  }

  async function performLogin() {
    const digits = loginPhone.replace(/\D/g, "");
    if (digits.length < 7 || !loginPassword) {
      setLoginError(!loginPassword ? "Please enter your password" : "Please enter a valid phone number");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setLoggingIn(true);
    setLoginError(null);
    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const fullNumber = selectedCountry.dial.replace("+", "") + digits;
    try {
      const url = new URL("/api/auth/login", getApiUrl());
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
      await refreshCoins(fullNumber);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/");
    } catch {
      Alert.alert("Error", "Could not connect to the server.");
    } finally {
      setLoggingIn(false);
    }
  }

  const scrollProps = {
    style: { flex: 1, backgroundColor: theme.background },
    contentContainerStyle: { flexGrow: 1, paddingTop: insets.top + webTop, paddingBottom: insets.bottom + webBottom },
    bottomOffset: 24,
  };

  if (step === "verify") {
    return (
      <KeyboardAwareScrollViewCompat {...scrollProps}>
        <Animated.View style={styles.content} entering={FadeInDown.duration(500).springify()}>
          <View style={[styles.iconRing, { borderColor: "#FFD700" + "40", backgroundColor: "#FFD700" + "15" }]}>
            <Ionicons name="shield-checkmark-outline" size={48} color="#FFD700" />
          </View>
          <Text style={[styles.title, { color: theme.text, fontFamily: "Inter_700Bold" }]}>Verify Your Number</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary, fontFamily: "Inter_400Regular" }]}>
            We sent a 6-digit code to{"\n"}
            <Text style={{ color: theme.tint, fontFamily: "Inter_600SemiBold" }}>+{pendingPhone}</Text>
          </Text>

          <Pressable onPress={() => otpInputRef.current?.focus()} style={{ width: "100%" }}>
            <View style={styles.otpRow}>
              {[0,1,2,3,4,5].map((i) => (
                <View key={i} style={[styles.otpBox, {
                  backgroundColor: theme.card,
                  borderColor: otpError ? theme.destructive : otpCode.length === i ? theme.tint : otpCode.length > i ? theme.tint + "60" : theme.border,
                }]}>
                  <Text style={[styles.otpDigit, { color: theme.text, fontFamily: "Inter_700Bold" }]}>{otpCode[i] ?? ""}</Text>
                </View>
              ))}
            </View>
          </Pressable>

          <TextInput ref={otpInputRef} style={styles.hiddenInput} value={otpCode}
            onChangeText={(t) => { const d = t.replace(/\D/g, "").slice(0, 6); setOtpCode(d); if (otpError) setOtpError(null); }}
            keyboardType="number-pad" maxLength={6} autoFocus caretHidden />

          {otpError && <Text style={[styles.fieldError, { color: theme.destructive, fontFamily: "Inter_400Regular", textAlign: "center" }]}>{otpError}</Text>}

          <Pressable style={({ pressed }) => [styles.btn, { backgroundColor: theme.tint, opacity: (pressed || verifyingOtp) ? 0.85 : 1 }]}
            onPress={verifyOtpAndFinish} disabled={verifyingOtp || otpCode.length !== 6}>
            {verifyingOtp ? <ActivityIndicator size="small" color="#000" /> : (
              <><Text style={[styles.btnText, { fontFamily: "Inter_600SemiBold" }]}>Verify Code</Text><Ionicons name="checkmark" size={18} color="#000" /></>
            )}
          </Pressable>

          <View style={styles.linkRow}>
            <Text style={[styles.hint, { color: theme.textMuted, fontFamily: "Inter_400Regular" }]}>Didn't receive the code?</Text>
            <Pressable onPress={resendOtpCode} disabled={sendingOtp}>
              <Text style={[styles.link, { color: theme.tint, fontFamily: "Inter_600SemiBold", opacity: sendingOtp ? 0.5 : 1 }]}>{sendingOtp ? "Sending..." : "Resend"}</Text>
            </Pressable>
          </View>
          <Pressable onPress={() => { setStep("register"); setOtpCode(""); setOtpError(null); }}>
            <Text style={[styles.hint, { color: theme.textMuted, fontFamily: "Inter_400Regular" }]}>Change phone number</Text>
          </Pressable>
        </Animated.View>
      </KeyboardAwareScrollViewCompat>
    );
  }

  if (step === "setPassword") {
    return (
      <KeyboardAwareScrollViewCompat {...scrollProps}>
        <Animated.View style={styles.content} entering={FadeInDown.duration(500).springify()}>
          <View style={[styles.iconRing, { borderColor: theme.tint + "30", backgroundColor: theme.tint + "12" }]}>
            <Ionicons name="lock-closed-outline" size={48} color={theme.tint} />
          </View>
          <Text style={[styles.title, { color: theme.text, fontFamily: "Inter_700Bold" }]}>Create Password</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary, fontFamily: "Inter_400Regular" }]}>Set a password to secure your account</Text>

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary, fontFamily: "Inter_600SemiBold" }]}>Password</Text>
            <View style={[styles.inputRow, { backgroundColor: theme.card, borderColor: passwordError ? theme.destructive : theme.border, borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, height: 52 }]}>
              <Ionicons name="lock-closed-outline" size={18} color={passwordError ? theme.destructive : theme.textMuted} style={{ marginRight: 8 }} />
              <TextInput style={[styles.phoneInput, { color: theme.text, fontFamily: "Inter_500Medium" }]}
                placeholder="Minimum 6 characters" placeholderTextColor={theme.textMuted}
                secureTextEntry={!showNewPassword} value={newPassword}
                onChangeText={(t) => { setNewPassword(t); if (passwordError) setPasswordError(null); }}
                returnKeyType="next" autoCapitalize="none" autoCorrect={false} />
              <Pressable onPress={() => setShowNewPassword(!showNewPassword)} hitSlop={8}>
                <Ionicons name={showNewPassword ? "eye-off-outline" : "eye-outline"} size={18} color={theme.textMuted} />
              </Pressable>
            </View>
            {passwordError && <Text style={[styles.fieldError, { color: theme.destructive, fontFamily: "Inter_400Regular" }]}>{passwordError}</Text>}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary, fontFamily: "Inter_600SemiBold" }]}>Confirm Password</Text>
            <View style={[styles.inputRow, { backgroundColor: theme.card, borderColor: confirmPasswordError ? theme.destructive : theme.border, borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, height: 52 }]}>
              <Ionicons name="lock-closed-outline" size={18} color={confirmPasswordError ? theme.destructive : theme.textMuted} style={{ marginRight: 8 }} />
              <TextInput style={[styles.phoneInput, { color: theme.text, fontFamily: "Inter_500Medium" }]}
                placeholder="Re-enter your password" placeholderTextColor={theme.textMuted}
                secureTextEntry={!showConfirmPassword} value={confirmPassword}
                onChangeText={(t) => { setConfirmPassword(t); if (confirmPasswordError) setConfirmPasswordError(null); }}
                returnKeyType="done" onSubmitEditing={createAccountWithPassword} autoCapitalize="none" autoCorrect={false} />
              <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)} hitSlop={8}>
                <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={18} color={theme.textMuted} />
              </Pressable>
            </View>
            {confirmPasswordError && <Text style={[styles.fieldError, { color: theme.destructive, fontFamily: "Inter_400Regular" }]}>{confirmPasswordError}</Text>}
          </View>

          <Pressable style={({ pressed }) => [styles.btn, { backgroundColor: theme.tint, opacity: (pressed || savingPassword) ? 0.85 : 1 }]}
            onPress={createAccountWithPassword} disabled={savingPassword}>
            {savingPassword ? <ActivityIndicator size="small" color="#000" /> : (
              <><Text style={[styles.btnText, { fontFamily: "Inter_600SemiBold" }]}>Create Account</Text><Ionicons name="checkmark" size={18} color="#000" /></>
            )}
          </Pressable>

          <Pressable onPress={() => { setStep("verify"); setNewPassword(""); setConfirmPassword(""); }}>
            <Text style={[styles.hint, { color: theme.textMuted, fontFamily: "Inter_400Regular" }]}>Back to verification</Text>
          </Pressable>
        </Animated.View>
      </KeyboardAwareScrollViewCompat>
    );
  }

  if (step === "login") {
    return (
      <KeyboardAwareScrollViewCompat {...scrollProps}>
        <Animated.View style={styles.content} entering={FadeInDown.duration(500).springify()}>
          <View style={[styles.iconRing, { borderColor: theme.tint + "30", backgroundColor: theme.tint + "12" }]}>
            <Ionicons name="person-circle-outline" size={48} color={theme.tint} />
          </View>
          <Text style={[styles.title, { color: theme.text, fontFamily: "Inter_700Bold" }]}>Welcome Back</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary, fontFamily: "Inter_400Regular" }]}>Log in with your phone number and password</Text>

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary, fontFamily: "Inter_600SemiBold" }]}>Phone Number</Text>
            <View style={styles.inputRow}>
              <CountryPicker selected={selectedCountry} onSelect={setSelectedCountry} />
              <View style={[styles.inputCard, { backgroundColor: theme.card, borderColor: theme.border, flex: 1 }]}>
                <TextInput style={[styles.phoneInput, { color: theme.text, fontFamily: "Inter_500Medium" }]}
                  placeholder="Phone number" placeholderTextColor={theme.textMuted}
                  keyboardType="phone-pad" value={loginPhone}
                  onChangeText={(t) => { setLoginPhone(t.replace(/\D/g, "")); if (loginError) setLoginError(null); }}
                  returnKeyType="next" maxLength={15} />
              </View>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary, fontFamily: "Inter_600SemiBold" }]}>Password</Text>
            <View style={[styles.inputRow, { backgroundColor: theme.card, borderColor: loginError ? theme.destructive : theme.border, borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, height: 52 }]}>
              <Ionicons name="lock-closed-outline" size={18} color={loginError ? theme.destructive : theme.textMuted} style={{ marginRight: 8 }} />
              <TextInput style={[styles.phoneInput, { color: theme.text, fontFamily: "Inter_500Medium" }]}
                placeholder="Your password" placeholderTextColor={theme.textMuted}
                secureTextEntry={!showLoginPassword} value={loginPassword}
                onChangeText={(t) => { setLoginPassword(t); if (loginError) setLoginError(null); }}
                returnKeyType="done" onSubmitEditing={performLogin} autoCapitalize="none" autoCorrect={false} />
              <Pressable onPress={() => setShowLoginPassword(!showLoginPassword)} hitSlop={8}>
                <Ionicons name={showLoginPassword ? "eye-off-outline" : "eye-outline"} size={18} color={theme.textMuted} />
              </Pressable>
            </View>
            {loginError && <Text style={[styles.fieldError, { color: theme.destructive, fontFamily: "Inter_400Regular" }]}>{loginError}</Text>}
          </View>

          <Pressable style={({ pressed }) => [styles.btn, { backgroundColor: theme.tint, opacity: (pressed || loggingIn) ? 0.85 : 1 }]}
            onPress={performLogin} disabled={loggingIn}>
            {loggingIn ? <ActivityIndicator size="small" color="#000" /> : (
              <><Text style={[styles.btnText, { fontFamily: "Inter_600SemiBold" }]}>Log In</Text><Ionicons name="arrow-forward" size={18} color="#000" /></>
            )}
          </Pressable>

          <View style={styles.linkRow}>
            <Text style={[styles.hint, { color: theme.textMuted, fontFamily: "Inter_400Regular" }]}>Don't have an account?</Text>
            <Pressable onPress={() => { setStep("register"); setLoginPhone(""); setLoginPassword(""); setLoginError(null); }}>
              <Text style={[styles.link, { color: theme.tint, fontFamily: "Inter_600SemiBold" }]}>Create one</Text>
            </Pressable>
          </View>
        </Animated.View>
      </KeyboardAwareScrollViewCompat>
    );
  }

  return (
    <KeyboardAwareScrollViewCompat {...scrollProps}>
      <Animated.View style={styles.content} entering={FadeInDown.duration(600).springify()}>
        <View style={[styles.iconRing, { borderColor: theme.tint + "30", backgroundColor: theme.tint + "12" }]}>
          <Ionicons name="search" size={48} color={theme.tint} />
        </View>
        <Text style={[styles.title, { color: theme.text, fontFamily: "Inter_700Bold" }]}>Who Saved Me?</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary, fontFamily: "Inter_400Regular" }]}>
          Create your profile to discover who has your number saved.
        </Text>

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: theme.textSecondary, fontFamily: "Inter_600SemiBold" }]}>Full Name</Text>
          <View style={[styles.inputRow, { backgroundColor: theme.card, borderColor: nameError ? theme.destructive : theme.border, borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, height: 52 }]}>
            <Ionicons name="person-outline" size={18} color={nameError ? theme.destructive : theme.textMuted} style={{ marginRight: 8 }} />
            <TextInput style={[styles.phoneInput, { color: theme.text, fontFamily: "Inter_500Medium" }]}
              placeholder="First and last name" placeholderTextColor={theme.textMuted}
              autoCapitalize="words" autoCorrect={false} value={onboardingName}
              onChangeText={(t) => { setOnboardingName(t); if (nameError) setNameError(null); }}
              returnKeyType="next" maxLength={100} />
          </View>
          {nameError && <Text style={[styles.fieldError, { color: theme.destructive, fontFamily: "Inter_400Regular" }]}>{nameError}</Text>}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: theme.textSecondary, fontFamily: "Inter_600SemiBold" }]}>Phone Number</Text>
          <View style={styles.inputRow}>
            <CountryPicker selected={selectedCountry} onSelect={setSelectedCountry} />
            <View style={[styles.inputCard, { backgroundColor: theme.card, borderColor: phoneError ? theme.destructive : theme.border, flex: 1 }]}>
              <TextInput ref={inputRef} style={[styles.phoneInput, { color: theme.text, fontFamily: "Inter_500Medium" }]}
                placeholder="Phone number" placeholderTextColor={theme.textMuted}
                keyboardType="phone-pad" value={onboardingPhone}
                onChangeText={(t) => { setOnboardingPhone(t.replace(/\D/g, "")); if (phoneError) setPhoneError(null); }}
                returnKeyType="done" onSubmitEditing={sendOtpCode} maxLength={15} />
            </View>
          </View>
          {phoneError && <Text style={[styles.fieldError, { color: theme.destructive, fontFamily: "Inter_400Regular" }]}>{phoneError}</Text>}
        </View>

        <Pressable style={({ pressed }) => [styles.btn, { backgroundColor: theme.tint, opacity: (pressed || sendingOtp) ? 0.85 : 1 }]}
          onPress={sendOtpCode} disabled={sendingOtp}>
          {sendingOtp ? <ActivityIndicator size="small" color="#000" /> : (
            <><Text style={[styles.btnText, { fontFamily: "Inter_600SemiBold" }]}>Send Verification Code</Text><Ionicons name="arrow-forward" size={18} color="#000" /></>
          )}
        </Pressable>

        <Text style={[styles.hint, { color: theme.textMuted, fontFamily: "Inter_400Regular" }]}>Your number is never shown to other users</Text>

        <View style={styles.linkRow}>
          <Text style={[styles.hint, { color: theme.textMuted, fontFamily: "Inter_400Regular" }]}>Already have an account?</Text>
          <Pressable onPress={() => { setStep("login"); setLoginPhone(""); setLoginPassword(""); setLoginError(null); }}>
            <Text style={[styles.link, { color: theme.tint, fontFamily: "Inter_600SemiBold" }]}>Log in</Text>
          </Pressable>
        </View>
      </Animated.View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  content: {
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
  title: {
    fontSize: 32,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 8,
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
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 56,
    borderRadius: 14,
    width: "100%",
    marginTop: 8,
  },
  btnText: {
    fontSize: 17,
    color: "#000",
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  hint: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
  },
  link: {
    fontSize: 14,
  },
});
