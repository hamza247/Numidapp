import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
  useColorScheme,
  ScrollView,
  Image,
  Platform,
  Modal,
  Share,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import Colors from "@/constants/colors";
import FlagImage from "@/components/FlagImage";
import { useCoins } from "@/lib/coins";
import { getApiUrl } from "@/lib/query-client";
import { fetch } from "expo/fetch";
import { useLanguage, type Language } from "@/lib/i18n";

const PHONE_KEY = "user_phone";
const NAME_KEY = "user_name";
const COUNTRY_KEY = "user_country";
const AVATAR_KEY = "user_avatar";
const syncedKey = (phone: string) => `contacts_synced_${phone}`;
const removedKey = (phone: string) => `number_removed_${phone}`;

interface LangOption {
  code: Language;
  label: string;
  native: string;
  countryCode: string;
}

const LANG_OPTIONS: LangOption[] = [
  { code: "en", label: "English", native: "English", countryCode: "US" },
  { code: "ar", label: "Arabic", native: "العربية", countryCode: "MA" },
  { code: "fr", label: "French", native: "Français", countryCode: "FR" },
];

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== "light";
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { coins, addCoins, refreshCoins, appConfig } = useCoins();
  const REMOVE_PHONE_COST = appConfig.removePhoneCost;
  const { t, language, setLanguage, fonts, isRTL } = useLanguage();

  const [userName, setUserName] = useState<string | null>(null);
  const [userPhone, setUserPhone] = useState<string | null>(null);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [numberRemoved, setNumberRemoved] = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [myReferralCode, setMyReferralCode] = useState<string | null>(null);
  const [referralCount, setReferralCount] = useState(0);
  const [sharingReferral, setSharingReferral] = useState(false);

  const webTop = Platform.OS === "web" ? 67 : 0;
  const webBottom = Platform.OS === "web" ? 34 : 0;

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const [name, phone] = await Promise.all([
      AsyncStorage.getItem(NAME_KEY),
      AsyncStorage.getItem(PHONE_KEY),
    ]);
    setUserName(name);
    setUserPhone(phone);
    if (phone) {
      try {
        const base = getApiUrl();
        const [profileRes, statusRes] = await Promise.all([
          fetch(`${base}api/profile?phone=${encodeURIComponent(phone)}`),
          fetch(`${base}api/contacts/number/status?phone=${encodeURIComponent(phone)}`),
        ]);
        if (profileRes.ok) {
          const { profile } = await profileRes.json();
          if (profile?.avatarBase64) {
            setAvatarUri(`data:image/jpeg;base64,${profile.avatarBase64}`);
          }
        }
        if (statusRes.ok) {
          const data = await statusRes.json();
          setNumberRemoved(!!data.removed);
        }
        try {
          const refRes = await fetch(`${base}api/referral/my-code?phone=${encodeURIComponent(phone)}`);
          if (refRes.ok) {
            const refData = await refRes.json();
            setMyReferralCode(refData.referralCode || null);
            setReferralCount(refData.referralCount || 0);
          }
        } catch {}
      } catch {
        const localAvatar = await AsyncStorage.getItem(AVATAR_KEY);
        if (localAvatar) setAvatarUri(localAvatar);
        const localRemoved = await AsyncStorage.getItem(removedKey(phone ?? ""));
        setNumberRemoved(localRemoved === "true");
      }
    }
  }

  async function pickAvatar() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(t.permissionRequired, t.permissionMsg);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const { uri, base64 } = result.assets[0];
      setAvatarUri(uri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (base64 && userPhone) {
        try {
          const apiBase = getApiUrl();
          await fetch(`${apiBase}api/profile/avatar`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone: userPhone, avatarBase64: base64 }),
          });
        } catch {}
      }
    }
  }

  async function handleRemovePhone() {
    if (!userPhone) return;
    if (coins < REMOVE_PHONE_COST) {
      Alert.alert(
        t.notEnoughCoins,
        t.notEnoughCoinsRemove(REMOVE_PHONE_COST, coins),
        [
          { text: t.cancel, style: "cancel" },
          { text: t.getCoins, onPress: () => { if (router.canGoBack()) router.back(); router.push("/store"); } },
        ]
      );
      return;
    }
    Alert.alert(
      t.removeFromSearch,
      t.removeConfirm(REMOVE_PHONE_COST),
      [
        { text: t.cancel, style: "cancel" },
        {
          text: t.removeCta(REMOVE_PHONE_COST),
          style: "destructive",
          onPress: async () => {
            setRemoving(true);
            try {
              const base = getApiUrl();
              const url = `${base}api/contacts/number?phone=${encodeURIComponent(userPhone)}`;
              const res = await fetch(url, { method: "DELETE" });
              if (res.ok) {
                await addCoins(-REMOVE_PHONE_COST);
                if (userPhone) await AsyncStorage.setItem(removedKey(userPhone), "true");
                setNumberRemoved(true);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert("✓", t.removeSuccess);
              } else {
                Alert.alert("Error", t.removeFailed);
              }
            } catch {
              Alert.alert("Error", t.removeFailed);
            } finally {
              setRemoving(false);
            }
          },
        },
      ]
    );
  }

  async function handleLogout() {
    Alert.alert(t.logOut, t.logOutConfirm, [
      { text: t.cancel, style: "cancel" },
      {
        text: t.logOut,
        style: "destructive",
        onPress: async () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          await AsyncStorage.multiRemove([PHONE_KEY, NAME_KEY, COUNTRY_KEY]);
          await refreshCoins(null);
          router.replace("/");
        },
      },
    ]);
  }

  async function handleDeleteAccount() {
    if (!userPhone) return;
    Alert.alert(
      t.deleteConfirmTitle,
      t.deleteConfirmMsg,
      [
        { text: t.cancel, style: "cancel" },
        {
          text: t.delete,
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              const base = getApiUrl();
              const url = `${base}api/profile?phone=${encodeURIComponent(userPhone)}`;
              const res = await fetch(url, { method: "DELETE" });
              if (res.ok) {
                const keysToRemove = [PHONE_KEY, NAME_KEY, COUNTRY_KEY, AVATAR_KEY];
                if (userPhone) keysToRemove.push(syncedKey(userPhone));
                await AsyncStorage.multiRemove(keysToRemove);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                router.replace("/");
              } else {
                Alert.alert("Error", t.deleteFailed);
              }
            } catch {
              Alert.alert("Error", t.deleteFailed);
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  }

  function handleSelectLanguage(lang: Language) {
    if (lang === language) {
      setShowLangPicker(false);
      return;
    }
    setShowLangPicker(false);
    setLanguage(lang);
  }

  async function handleShareReferral() {
    if (!myReferralCode) return;
    setSharingReferral(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const reward = appConfig.referralRewardCoins;
      const msg = t.referralShareText(myReferralCode, reward);
      if (Platform.OS === "web") {
        if (navigator.share) {
          await navigator.share({ text: msg });
        } else if (navigator.clipboard) {
          await navigator.clipboard.writeText(myReferralCode);
          Alert.alert(t.referralCopied, myReferralCode);
        }
      } else {
        await Share.share({ message: msg });
      }
    } catch {}
    setSharingReferral(false);
  }

  const initials = userName
    ? userName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  const currentLang = LANG_OPTIONS.find((l) => l.code === language);

  const rowDir = isRTL ? "row-reverse" : ("row" as const);
  const textAlign = isRTL ? ("right" as const) : ("left" as const);
  const labelMargin = isRTL ? { marginRight: 4, marginLeft: 0 } : { marginLeft: 4, marginRight: 0 };
  const dividerMargin = isRTL ? { marginRight: 64, marginLeft: 0 } : { marginLeft: 64, marginRight: 0 };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.headerBar, { paddingTop: insets.top + webTop, backgroundColor: theme.background, borderBottomColor: theme.border, flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace("/")} hitSlop={12} style={[styles.backBtn, { alignItems: isRTL ? "flex-end" : "flex-start" }]}>
          <Ionicons name={isRTL ? "chevron-forward" : "chevron-back"} size={24} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text, fontFamily: fonts.semiBold }]}>{t.profile}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 + webBottom }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(400)} style={styles.avatarSection}>
          <Pressable onPress={pickAvatar} style={styles.avatarContainer}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: theme.tint + "20" }]}>
                <Text style={[styles.initials, { color: theme.tint, fontFamily: fonts.bold }]}>{initials}</Text>
              </View>
            )}
            <View style={[styles.cameraOverlay, { backgroundColor: theme.tint }]}>
              <Ionicons name="camera" size={14} color="#000" />
            </View>
          </Pressable>

          <Text style={[styles.name, { color: theme.text, fontFamily: fonts.bold }]}>
            {userName ?? "User"}
          </Text>
          <Text style={[styles.phone, { color: theme.textSecondary, fontFamily: fonts.regular }]}>
            +{userPhone}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.textMuted, fontFamily: fonts.semiBold, textAlign, ...labelMargin }]}>{t.account}</Text>

          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Pressable
              style={({ pressed }) => [styles.row, { flexDirection: rowDir, opacity: pressed ? 0.7 : 1 }]}
              onPress={pickAvatar}
            >
              <View style={[styles.rowIcon, { backgroundColor: theme.tint + "18" }]}>
                <Ionicons name="image-outline" size={20} color={theme.tint} />
              </View>
              <Text style={[styles.rowLabel, { color: theme.text, fontFamily: fonts.medium, textAlign }]}>{t.tapToChange}</Text>
              <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={18} color={theme.textMuted} />
            </Pressable>

            <View style={[styles.divider, { backgroundColor: theme.border, ...dividerMargin }]} />

            {numberRemoved ? (
              <View style={[styles.row, { flexDirection: rowDir }]}>
                <View style={[styles.rowIcon, { backgroundColor: "#00C9D4" + "18" }]}>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#00C9D4" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowLabel, { color: "#00C9D4", fontFamily: fonts.medium, textAlign }]}>
                    {t.numberRemoved}
                  </Text>
                  <Text style={[styles.rowSub, { color: theme.textMuted, fontFamily: fonts.regular, textAlign }]}>
                    {t.numberRemovedSub}
                  </Text>
                </View>
              </View>
            ) : (
              <Pressable
                style={({ pressed }) => [styles.row, { flexDirection: rowDir, opacity: (pressed || removing) ? 0.7 : 1 }]}
                onPress={handleRemovePhone}
                disabled={removing}
              >
                <View style={[styles.rowIcon, { backgroundColor: "#FF9500" + "18" }]}>
                  {removing ? (
                    <ActivityIndicator size="small" color="#FF9500" />
                  ) : (
                    <Ionicons name="eye-off-outline" size={20} color="#FF9500" />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowLabel, { color: theme.text, fontFamily: fonts.medium, textAlign }]}>
                    {t.removeMyNumber}
                  </Text>
                  <Text style={[styles.rowSub, { color: theme.textMuted, fontFamily: fonts.regular, textAlign }]}>
                    {t.removeMyNumberSub}
                  </Text>
                </View>
                <View style={styles.costBadge}>
                  <Ionicons name="diamond" size={11} color="#C49A2A" />
                  <Text style={[styles.costText, { fontFamily: fonts.bold }]}>{REMOVE_PHONE_COST}</Text>
                </View>
              </Pressable>
            )}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(130).duration(400)} style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.textMuted, fontFamily: fonts.semiBold, textAlign, ...labelMargin }]}>{t.preferences}</Text>

          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Pressable
              style={({ pressed }) => [styles.row, { flexDirection: rowDir, opacity: pressed ? 0.7 : 1 }]}
              onPress={() => setShowLangPicker(true)}
            >
              <View style={[styles.rowIcon, { backgroundColor: theme.tint + "18" }]}>
                <Ionicons name="language-outline" size={20} color={theme.tint} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowLabel, { color: theme.text, fontFamily: fonts.medium, textAlign }]}>{t.language}</Text>
                <Text style={[styles.rowSub, { color: theme.textMuted, fontFamily: fonts.regular, textAlign }]}>
                  {currentLang?.native}
                </Text>
              </View>
              <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={18} color={theme.textMuted} />
            </Pressable>
          </View>
        </Animated.View>

        {myReferralCode && (
          <Animated.View entering={FadeInDown.delay(145).duration(400)} style={styles.section}>
            <Text style={[styles.sectionLabel, { color: theme.textMuted, fontFamily: fonts.semiBold, textAlign, ...labelMargin }]}>{t.referralSection}</Text>

            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={[styles.row, { flexDirection: rowDir }]}>
                <View style={[styles.rowIcon, { backgroundColor: "#C49A2A18" }]}>
                  <Ionicons name="gift-outline" size={20} color="#C49A2A" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowLabel, { color: theme.text, fontFamily: fonts.medium, textAlign }]}>{t.myReferralCode}</Text>
                  <Text style={[{ fontSize: 18, fontFamily: fonts.bold, color: "#C49A2A", textAlign, letterSpacing: 2, marginTop: 2 }]}>{myReferralCode}</Text>
                  {referralCount > 0 && (
                    <Text style={[styles.rowSub, { color: theme.textMuted, fontFamily: fonts.regular, textAlign, marginTop: 2 }]}>
                      {referralCount} friend{referralCount !== 1 ? "s" : ""} joined
                    </Text>
                  )}
                </View>
                <Pressable
                  onPress={handleShareReferral}
                  disabled={sharingReferral}
                  style={({ pressed }) => [{ opacity: pressed || sharingReferral ? 0.7 : 1, backgroundColor: theme.tint + "18", borderRadius: 10, padding: 10 }]}
                >
                  {sharingReferral
                    ? <ActivityIndicator size="small" color={theme.tint} />
                    : <Ionicons name="share-outline" size={20} color={theme.tint} />
                  }
                </Pressable>
              </View>
              <View style={[styles.divider, { backgroundColor: theme.border, ...dividerMargin }]} />
              <View style={[styles.row, { flexDirection: rowDir }]}>
                <View style={[styles.rowIcon, { backgroundColor: theme.tint + "18" }]}>
                  <Ionicons name="people-outline" size={20} color={theme.tint} />
                </View>
                <Text style={[styles.rowSub, { color: theme.textSecondary, fontFamily: fonts.regular, textAlign, flex: 1 }]}>
                  {t.referralShareMsg}
                </Text>
              </View>
            </View>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(160).duration(400)} style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.textMuted, fontFamily: fonts.semiBold, textAlign, ...labelMargin }]}>{t.session}</Text>

          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Pressable
              style={({ pressed }) => [styles.row, { flexDirection: rowDir, opacity: pressed ? 0.7 : 1 }]}
              onPress={handleLogout}
            >
              <View style={[styles.rowIcon, { backgroundColor: theme.tint + "18" }]}>
                <Ionicons name="log-out-outline" size={20} color={theme.tint} />
              </View>
              <Text style={[styles.rowLabel, { color: theme.text, fontFamily: fonts.medium, textAlign }]}>{t.logOut}</Text>
              <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={18} color={theme.textMuted} />
            </Pressable>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(195).duration(400)} style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.textMuted, fontFamily: fonts.semiBold, textAlign, ...labelMargin }]}>{t.contactUs}</Text>

          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Pressable
              style={({ pressed }) => [styles.row, { flexDirection: rowDir, opacity: pressed ? 0.7 : 1 }]}
              onPress={() => router.push("/contact")}
            >
              <View style={[styles.rowIcon, { backgroundColor: theme.tint + "18" }]}>
                <Ionicons name="mail-outline" size={20} color={theme.tint} />
              </View>
              <Text style={[styles.rowLabel, { color: theme.text, fontFamily: fonts.medium, textAlign }]}>{t.contactUs}</Text>
              <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={18} color={theme.textMuted} />
            </Pressable>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(220).duration(400)} style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.textMuted, fontFamily: fonts.semiBold, textAlign, ...labelMargin }]}>{t.legal}</Text>

          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Pressable
              style={({ pressed }) => [styles.row, { flexDirection: rowDir, opacity: pressed ? 0.7 : 1 }]}
              onPress={() => router.push({ pathname: "/legal", params: { type: "privacy" } })}
            >
              <View style={[styles.rowIcon, { backgroundColor: theme.tint + "18" }]}>
                <Ionicons name="shield-outline" size={20} color={theme.tint} />
              </View>
              <Text style={[styles.rowLabel, { color: theme.text, fontFamily: fonts.medium, textAlign }]}>{t.privacyPolicy}</Text>
              <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={18} color={theme.textMuted} />
            </Pressable>

            <View style={[styles.divider, { backgroundColor: theme.border, ...dividerMargin }]} />

            <Pressable
              style={({ pressed }) => [styles.row, { flexDirection: rowDir, opacity: pressed ? 0.7 : 1 }]}
              onPress={() => router.push({ pathname: "/legal", params: { type: "terms" } })}
            >
              <View style={[styles.rowIcon, { backgroundColor: theme.tint + "18" }]}>
                <Ionicons name="document-text-outline" size={20} color={theme.tint} />
              </View>
              <Text style={[styles.rowLabel, { color: theme.text, fontFamily: fonts.medium, textAlign }]}>{t.termsConditions}</Text>
              <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={18} color={theme.textMuted} />
            </Pressable>

            <View style={[styles.divider, { backgroundColor: theme.border, ...dividerMargin }]} />

            <Pressable
              style={({ pressed }) => [styles.row, { flexDirection: rowDir, opacity: pressed ? 0.7 : 1 }]}
              onPress={() => router.push({ pathname: "/legal", params: { type: "about" } })}
            >
              <View style={[styles.rowIcon, { backgroundColor: theme.tint + "18" }]}>
                <Ionicons name="information-circle-outline" size={20} color={theme.tint} />
              </View>
              <Text style={[styles.rowLabel, { color: theme.text, fontFamily: fonts.medium, textAlign }]}>{t.about}</Text>
              <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={18} color={theme.textMuted} />
            </Pressable>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.destructive + "AA", fontFamily: fonts.semiBold, textAlign, ...labelMargin }]}>{t.dangerZone}</Text>

          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Pressable
              style={({ pressed }) => [styles.row, { flexDirection: rowDir, opacity: (pressed || deleting) ? 0.7 : 1 }]}
              onPress={handleDeleteAccount}
              disabled={deleting}
            >
              <View style={[styles.rowIcon, { backgroundColor: theme.destructive + "18" }]}>
                {deleting ? (
                  <ActivityIndicator size="small" color={theme.destructive} />
                ) : (
                  <Ionicons name="trash-outline" size={20} color={theme.destructive} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowLabel, { color: theme.destructive, fontFamily: fonts.medium, textAlign }]}>
                  {t.deleteAccount}
                </Text>
                <Text style={[styles.rowSub, { color: theme.textMuted, fontFamily: fonts.regular, textAlign }]}>
                  {t.deleteAccountSub}
                </Text>
              </View>
              <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={18} color={theme.destructive + "80"} />
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>

      <Modal
        visible={showLangPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLangPicker(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowLangPicker(false)}>
          <Pressable style={[styles.langModal, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.langModalTitle, { color: theme.text, fontFamily: fonts.bold }]}>
              {t.selectLanguage}
            </Text>
            {LANG_OPTIONS.map((opt, idx) => (
              <React.Fragment key={opt.code}>
                {idx > 0 && <View style={[styles.langDivider, { backgroundColor: theme.border }]} />}
                <Pressable
                  style={({ pressed }) => [styles.langRow, { flexDirection: rowDir, opacity: pressed ? 0.7 : 1 }]}
                  onPress={() => handleSelectLanguage(opt.code)}
                >
                  <FlagImage code={opt.countryCode} size="lg" />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.langNative, { color: theme.text, fontFamily: fonts.semiBold, textAlign }]}>
                      {opt.native}
                    </Text>
                    <Text style={[styles.langEnglish, { color: theme.textMuted, fontFamily: fonts.regular, textAlign }]}>
                      {opt.label}
                    </Text>
                  </View>
                  {language === opt.code && (
                    <Ionicons name="checkmark-circle" size={22} color={theme.tint} />
                  )}
                </Pressable>
              </React.Fragment>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 40, alignItems: "flex-start" },
  headerTitle: { fontSize: 17 },
  avatarSection: {
    alignItems: "center",
    paddingVertical: 32,
  },
  avatarContainer: { position: "relative", marginBottom: 14 },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  initials: { fontSize: 36 },
  cameraOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#000",
  },
  name: { fontSize: 22, marginBottom: 4 },
  phone: { fontSize: 14 },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionLabel: { fontSize: 11, letterSpacing: 0.8, marginBottom: 10, marginLeft: 4 },
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: { fontSize: 15, flex: 1 },
  rowSub: { fontSize: 12, marginTop: 1 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 64 },
  costBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#C49A2A" + "20",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  costText: { fontSize: 12, color: "#C49A2A" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  langModal: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    padding: 8,
  },
  langModalTitle: {
    fontSize: 16,
    textAlign: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  langRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  langFlag: { fontSize: 26 },
  langNative: { fontSize: 16 },
  langEnglish: { fontSize: 12, marginTop: 1 },
  langDivider: { height: StyleSheet.hairlineWidth, marginHorizontal: 16 },
});
