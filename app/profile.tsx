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
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import Colors from "@/constants/colors";
import { useCoins } from "@/lib/coins";
import { getApiUrl } from "@/lib/query-client";
import { fetch } from "expo/fetch";

const PHONE_KEY = "user_phone";
const NAME_KEY = "user_name";
const COUNTRY_KEY = "user_country";
const AVATAR_KEY = "user_avatar";
const syncedKey = (phone: string) => `contacts_synced_${phone}`;
const removedKey = (phone: string) => `number_removed_${phone}`;
const REMOVE_PHONE_COST = 3;

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== "light";
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { coins, addCoins, refreshCoins } = useCoins();

  const [userName, setUserName] = useState<string | null>(null);
  const [userPhone, setUserPhone] = useState<string | null>(null);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [numberRemoved, setNumberRemoved] = useState(false);

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
          fetch(new URL(`/api/profile?phone=${encodeURIComponent(phone)}`, base).toString()),
          fetch(new URL(`/api/contacts/number/status?phone=${encodeURIComponent(phone)}`, base).toString()),
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
      } catch {
        const localAvatar = await AsyncStorage.getItem(AVATAR_KEY);
        if (localAvatar) setAvatarUri(localAvatar);
        const localRemoved = await AsyncStorage.getItem(removedKey(phone));
        setNumberRemoved(localRemoved === "true");
      }
    }
  }

  async function pickAvatar() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please allow access to your photo library to set a profile picture.");
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
          await fetch(new URL("/api/profile/avatar", apiBase).toString(), {
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
        "Not Enough Coins",
        `Removing your number from search results costs ${REMOVE_PHONE_COST} coins. You currently have ${coins} coin${coins !== 1 ? "s" : ""}.`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Get Coins", onPress: () => { router.back(); router.push("/store"); } },
        ]
      );
      return;
    }
    Alert.alert(
      "Remove From Search Results",
      `This will remove your phone number from everyone's search results. It costs ${REMOVE_PHONE_COST} coins. This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: `Remove (${REMOVE_PHONE_COST} coins)`,
          style: "destructive",
          onPress: async () => {
            setRemoving(true);
            try {
              const base = getApiUrl();
              const url = new URL(`/api/contacts/number?phone=${encodeURIComponent(userPhone)}`, base);
              const res = await fetch(url.toString(), { method: "DELETE" });
              if (res.ok) {
                await addCoins(-REMOVE_PHONE_COST);
                if (userPhone) await AsyncStorage.setItem(removedKey(userPhone), "true");
                setNumberRemoved(true);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert("Done", "Your phone number has been removed from all search results.");
              } else {
                Alert.alert("Error", "Failed to remove your phone number. Please try again.");
              }
            } catch {
              Alert.alert("Error", "Could not connect to the server.");
            } finally {
              setRemoving(false);
            }
          },
        },
      ]
    );
  }

  async function handleLogout() {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
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
      "Delete Account",
      "This will permanently delete your account and all your uploaded contacts. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Account",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              const base = getApiUrl();
              const url = new URL(`/api/profile?phone=${encodeURIComponent(userPhone)}`, base);
              const res = await fetch(url.toString(), { method: "DELETE" });
              if (res.ok) {
                const keysToRemove = [PHONE_KEY, NAME_KEY, COUNTRY_KEY, AVATAR_KEY];
                if (userPhone) keysToRemove.push(syncedKey(userPhone));
                await AsyncStorage.multiRemove(keysToRemove);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                router.replace("/");
              } else {
                Alert.alert("Error", "Failed to delete your account. Please try again.");
              }
            } catch {
              Alert.alert("Error", "Could not connect to the server.");
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  }

  const initials = userName
    ? userName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.headerBar, { paddingTop: insets.top + webTop, backgroundColor: theme.background, borderBottomColor: theme.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text, fontFamily: "Inter_600SemiBold" }]}>Profile</Text>
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
                <Text style={[styles.initials, { color: theme.tint, fontFamily: "Inter_700Bold" }]}>{initials}</Text>
              </View>
            )}
            <View style={[styles.cameraOverlay, { backgroundColor: theme.tint }]}>
              <Ionicons name="camera" size={14} color="#000" />
            </View>
          </Pressable>

          <Text style={[styles.name, { color: theme.text, fontFamily: "Inter_700Bold" }]}>
            {userName ?? "User"}
          </Text>
          <Text style={[styles.phone, { color: theme.textSecondary, fontFamily: "Inter_400Regular" }]}>
            +{userPhone}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.textMuted, fontFamily: "Inter_600SemiBold" }]}>ACCOUNT</Text>

          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Pressable
              style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
              onPress={pickAvatar}
            >
              <View style={[styles.rowIcon, { backgroundColor: theme.tint + "18" }]}>
                <Ionicons name="image-outline" size={20} color={theme.tint} />
              </View>
              <Text style={[styles.rowLabel, { color: theme.text, fontFamily: "Inter_500Medium" }]}>Edit Photo</Text>
              <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
            </Pressable>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            {numberRemoved ? (
              <View style={styles.row}>
                <View style={[styles.rowIcon, { backgroundColor: "#00C9D4" + "18" }]}>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#00C9D4" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowLabel, { color: "#00C9D4", fontFamily: "Inter_500Medium" }]}>
                    Number Removed
                  </Text>
                  <Text style={[styles.rowSub, { color: theme.textMuted, fontFamily: "Inter_400Regular" }]}>
                    Hidden from all search results
                  </Text>
                </View>
              </View>
            ) : (
              <Pressable
                style={({ pressed }) => [styles.row, { opacity: (pressed || removing) ? 0.7 : 1 }]}
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
                  <Text style={[styles.rowLabel, { color: theme.text, fontFamily: "Inter_500Medium" }]}>
                    Remove My Number
                  </Text>
                  <Text style={[styles.rowSub, { color: theme.textMuted, fontFamily: "Inter_400Regular" }]}>
                    Hide from search results
                  </Text>
                </View>
                <View style={styles.costBadge}>
                  <Ionicons name="diamond" size={11} color="#FFD700" />
                  <Text style={[styles.costText, { fontFamily: "Inter_700Bold" }]}>{REMOVE_PHONE_COST}</Text>
                </View>
              </Pressable>
            )}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(160).duration(400)} style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.textMuted, fontFamily: "Inter_600SemiBold" }]}>SESSION</Text>

          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Pressable
              style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
              onPress={handleLogout}
            >
              <View style={[styles.rowIcon, { backgroundColor: theme.tint + "18" }]}>
                <Ionicons name="log-out-outline" size={20} color={theme.tint} />
              </View>
              <Text style={[styles.rowLabel, { color: theme.text, fontFamily: "Inter_500Medium" }]}>Log Out</Text>
              <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
            </Pressable>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(240).duration(400)} style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.textMuted, fontFamily: "Inter_600SemiBold" }]}>LEGAL</Text>

          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Pressable
              style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
              onPress={() => router.push({ pathname: "/legal", params: { type: "privacy" } })}
            >
              <View style={[styles.rowIcon, { backgroundColor: theme.tint + "18" }]}>
                <Ionicons name="shield-outline" size={20} color={theme.tint} />
              </View>
              <Text style={[styles.rowLabel, { color: theme.text, fontFamily: "Inter_500Medium" }]}>Privacy Policy</Text>
              <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
            </Pressable>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <Pressable
              style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
              onPress={() => router.push({ pathname: "/legal", params: { type: "terms" } })}
            >
              <View style={[styles.rowIcon, { backgroundColor: theme.tint + "18" }]}>
                <Ionicons name="document-text-outline" size={20} color={theme.tint} />
              </View>
              <Text style={[styles.rowLabel, { color: theme.text, fontFamily: "Inter_500Medium" }]}>Terms & Conditions</Text>
              <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
            </Pressable>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <Pressable
              style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
              onPress={() => router.push({ pathname: "/legal", params: { type: "about" } })}
            >
              <View style={[styles.rowIcon, { backgroundColor: theme.tint + "18" }]}>
                <Ionicons name="information-circle-outline" size={20} color={theme.tint} />
              </View>
              <Text style={[styles.rowLabel, { color: theme.text, fontFamily: "Inter_500Medium" }]}>About</Text>
              <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
            </Pressable>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(320).duration(400)} style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.destructive + "AA", fontFamily: "Inter_600SemiBold" }]}>DANGER ZONE</Text>

          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Pressable
              style={({ pressed }) => [styles.row, { opacity: (pressed || deleting) ? 0.7 : 1 }]}
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
                <Text style={[styles.rowLabel, { color: theme.destructive, fontFamily: "Inter_500Medium" }]}>
                  Delete Account
                </Text>
                <Text style={[styles.rowSub, { color: theme.textMuted, fontFamily: "Inter_400Regular" }]}>
                  Permanently remove all data
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.destructive + "80"} />
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>
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
    backgroundColor: "#FFD700" + "20",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  costText: { fontSize: 12, color: "#FFD700" },
});
