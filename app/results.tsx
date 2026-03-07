import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  useColorScheme,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { getApiUrl } from "@/lib/query-client";
import { fetch } from "expo/fetch";
import { countries, type Country } from "@/lib/countries";
import { useCoins, REVEAL_COST } from "@/lib/coins";

interface SearchResult {
  storedName: string;
  label: string;
  uploaderPhone: string;
  uploaderId: string;
}

function getLabelStyle(label: string, theme: typeof Colors.dark) {
  const l = label.toLowerCase();
  if (l.includes("mobile") || l.includes("cell")) {
    return { bg: theme.labelMobile + "22", text: theme.labelMobile, icon: "phone-portrait-outline" as const, display: "Mobile" };
  }
  if (l.includes("home")) {
    return { bg: theme.labelHome + "22", text: theme.labelHome, icon: "home-outline" as const, display: "Home" };
  }
  if (l.includes("work") || l.includes("office")) {
    return { bg: theme.labelWork + "22", text: theme.labelWork, icon: "briefcase-outline" as const, display: "Work" };
  }
  if (l.includes("iphone")) {
    return { bg: theme.labelMobile + "22", text: theme.labelMobile, icon: "phone-portrait-outline" as const, display: "iPhone" };
  }
  if (l.includes("main")) {
    return { bg: theme.labelMobile + "22", text: theme.labelMobile, icon: "call-outline" as const, display: "Main" };
  }
  return { bg: theme.labelOther + "22", text: theme.labelOther, icon: "pricetag-outline" as const, display: label || "Other" };
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getAvatarColor(name: string, theme: typeof Colors.dark): string {
  const palette = [
    theme.labelMobile, theme.labelHome, theme.labelWork, theme.tint,
    "#FF6B6B", "#51CF66", "#FF922B", "#CC5DE8",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palette[Math.abs(hash) % palette.length];
}

function formatFullPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length <= 4) return digits;
  if (digits.length <= 7) return digits;
  if (digits.length <= 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  return `+${digits.slice(0, digits.length - 10)} (${digits.slice(-10, -7)}) ${digits.slice(-7, -4)}-${digits.slice(-4)}`;
}

function ResultCard({
  item,
  index: idx,
  theme,
  revealedPhone,
  onReveal,
  coins,
  revealing,
}: {
  item: SearchResult;
  index: number;
  theme: typeof Colors.dark;
  revealedPhone: string | null;
  onReveal: () => void;
  coins: number;
  revealing: boolean;
}) {
  const labelStyle = getLabelStyle(item.label, theme);
  const avatarColor = getAvatarColor(item.storedName, theme);
  const initials = getInitials(item.storedName);
  const isRevealed = revealedPhone !== null;

  return (
    <Animated.View entering={FadeInDown.delay(idx * 50).duration(350).springify()}>
      <View style={[styles.resultCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={[styles.avatar, { backgroundColor: avatarColor + "20", borderColor: avatarColor + "35" }]}>
          <Text style={[styles.avatarText, { color: avatarColor, fontFamily: "Inter_700Bold" }]}>
            {initials}
          </Text>
        </View>

        <View style={styles.resultInfo}>
          <Text
            style={[styles.resultName, { color: theme.text, fontFamily: "Inter_600SemiBold" }]}
            numberOfLines={1}
          >
            {item.storedName}
          </Text>

          <View style={styles.resultMetaRow}>
            <View style={[styles.labelBadgeSmall, { backgroundColor: labelStyle.bg }]}>
              <Ionicons name={labelStyle.icon} size={11} color={labelStyle.text} />
              <Text style={[styles.labelSmallText, { color: labelStyle.text, fontFamily: "Inter_500Medium" }]}>
                {labelStyle.display}
              </Text>
            </View>
          </View>

          <View style={styles.phoneRevealRow}>
            {isRevealed ? (
              <View style={styles.revealedRow}>
                <Ionicons name="call-outline" size={14} color={theme.tint} />
                <Text style={[styles.revealedPhone, { color: theme.tint, fontFamily: "Inter_600SemiBold" }]}>
                  {formatFullPhone(revealedPhone)}
                </Text>
              </View>
            ) : (
              <View style={styles.maskedRow}>
                <Ionicons name="lock-closed-outline" size={13} color={theme.textMuted} />
                <Text style={[styles.maskedPhone, { color: theme.textMuted, fontFamily: "Inter_400Regular" }]}>
                  {item.uploaderPhone}
                </Text>
                <Pressable
                  style={({ pressed }) => [
                    styles.revealBtn,
                    {
                      backgroundColor: coins >= REVEAL_COST ? Colors.accent + "20" : theme.surface,
                      borderColor: coins >= REVEAL_COST ? Colors.accent + "40" : theme.border,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                  onPress={onReveal}
                  disabled={revealing}
                >
                  {revealing ? (
                    <ActivityIndicator size="small" color={Colors.accent} />
                  ) : (
                    <>
                      <Ionicons
                        name="eye-outline"
                        size={14}
                        color={coins >= REVEAL_COST ? Colors.accent : theme.textMuted}
                      />
                      <Text
                        style={[
                          styles.revealBtnText,
                          {
                            color: coins >= REVEAL_COST ? Colors.accent : theme.textMuted,
                            fontFamily: "Inter_600SemiBold",
                          },
                        ]}
                      >
                        {REVEAL_COST}
                      </Text>
                      <Ionicons
                        name="diamond"
                        size={12}
                        color={coins >= REVEAL_COST ? "#FFD700" : theme.textMuted}
                      />
                    </>
                  )}
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

export default function ResultsScreen() {
  const { phone, countryCode, localNumber } = useLocalSearchParams<{
    phone: string;
    countryCode: string;
    localNumber: string;
  }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== "light";
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { coins, spendCoin, isRevealed, getRevealedPhone, cacheRevealedPhone, loaded } = useCoins();

  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revealingId, setRevealingId] = useState<string | null>(null);

  const webTop = Platform.OS === "web" ? 67 : 0;
  const webBottom = Platform.OS === "web" ? 34 : 0;

  const country: Country = countries.find((c) => c.code === countryCode) ?? countries[0];

  useEffect(() => {
    if (phone) loadResults(phone);
  }, [phone]);

  async function loadResults(phoneNumber: string) {
    setLoading(true);
    setError(null);
    try {
      const base = getApiUrl();
      const url = new URL("/api/contacts/search", base);
      url.searchParams.set("phone", phoneNumber);
      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = (await res.json()) as { results: SearchResult[]; count: number };
      setResults(data.results);
      if (data.results.length > 0) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (e) {
      setError("Failed to load results. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleReveal(uploaderId: string, revealKey: string) {
    if (isRevealed(revealKey)) return;
    if (!loaded) return;

    if (coins < REVEAL_COST) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Not Enough Coins",
        `You need ${REVEAL_COST} coin to reveal this number. You currently have ${coins} coins.`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Buy Coins", onPress: () => router.push("/store") },
        ]
      );
      return;
    }

    setRevealingId(revealKey);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const spent = await spendCoin(revealKey);
      if (!spent) {
        Alert.alert("Not Enough Coins", "You don't have enough coins.");
        return;
      }

      const base = getApiUrl();
      const url = new URL("/api/contacts/reveal", base);
      const res = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploaderPhone: uploaderId }),
        credentials: "include",
      });

      if (!res.ok) throw new Error(`${res.status}`);
      const data = (await res.json()) as { uploaderPhone: string };
      await cacheRevealedPhone(revealKey, data.uploaderPhone);
    } catch (e) {
      Alert.alert("Error", "Failed to reveal number. Your coin has been refunded.");
    } finally {
      setRevealingId(null);
    }
  }

  const labelCounts: Record<string, number> = {};
  for (const r of results) {
    const style = getLabelStyle(r.label, theme);
    labelCounts[style.display] = (labelCounts[style.display] ?? 0) + 1;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Animated.View
        style={[styles.header, { paddingTop: insets.top + 12 + webTop }]}
        entering={FadeIn.duration(300)}
      >
        <Pressable
          style={({ pressed }) => [
            styles.backBtn,
            { backgroundColor: theme.card, borderColor: theme.border, opacity: pressed ? 0.7 : 1 },
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
        >
          <Ionicons name="arrow-back" size={20} color={theme.text} />
        </Pressable>

        <View style={styles.headerCenter}>
          <View style={styles.headerPhoneRow}>
            <Text style={styles.headerFlag}>{country.flag}</Text>
            <Text style={[styles.headerNumber, { color: theme.text, fontFamily: "Inter_700Bold" }]}>
              {country.dial} {localNumber ?? phone}
            </Text>
          </View>
          <Text style={[styles.headerCountry, { color: theme.textSecondary, fontFamily: "Inter_400Regular" }]}>
            {country.name}
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.coinBadge, { backgroundColor: "#FFD700" + "20", borderColor: "#FFD700" + "40", opacity: pressed ? 0.7 : 1 }]}
          onPress={() => router.push("/store")}
        >
          <Ionicons name="diamond" size={14} color="#FFD700" />
          <Text style={[styles.coinText, { color: "#FFD700", fontFamily: "Inter_700Bold" }]}>
            {coins}
          </Text>
        </Pressable>
      </Animated.View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.tint} />
          <Text style={[styles.loadingText, { color: theme.textSecondary, fontFamily: "Inter_400Regular" }]}>
            Searching contacts...
          </Text>
        </View>
      )}

      {error && !loading && (
        <Animated.View style={styles.errorContainer} entering={FadeInDown.duration(400)}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.destructive} />
          <Text style={[styles.errorText, { color: theme.textSecondary, fontFamily: "Inter_400Regular" }]}>
            {error}
          </Text>
          <Pressable
            style={[styles.retryBtn, { backgroundColor: theme.tint }]}
            onPress={() => phone && loadResults(phone)}
          >
            <Text style={[styles.retryText, { fontFamily: "Inter_600SemiBold" }]}>Try Again</Text>
          </Pressable>
        </Animated.View>
      )}

      {!loading && !error && results.length === 0 && (
        <Animated.View style={styles.emptyContainer} entering={FadeInDown.delay(100).duration(400)}>
          <View style={[styles.emptyIconRing, { borderColor: theme.border, backgroundColor: theme.card }]}>
            <Ionicons name="person-outline" size={40} color={theme.textMuted} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.text, fontFamily: "Inter_600SemiBold" }]}>
            Not Saved Yet
          </Text>
          <Text style={[styles.emptyBody, { color: theme.textSecondary, fontFamily: "Inter_400Regular" }]}>
            Nobody in our network has this number saved in their contacts yet. Ask more friends to sync their contacts.
          </Text>
        </Animated.View>
      )}

      {!loading && !error && results.length > 0 && (
        <FlatList
          data={results}
          keyExtractor={(item, idx) => `${item.uploaderId}-${item.storedName}-${idx}`}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: insets.bottom + 32 + webBottom,
            gap: 10,
          }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => {
            const revealKey = `${phone}__${item.uploaderId}`;
            return (
              <ResultCard
                item={item}
                index={index}
                theme={theme}
                revealedPhone={getRevealedPhone(revealKey)}
                onReveal={() => handleReveal(item.uploaderId, revealKey)}
                coins={coins}
                revealing={revealingId === revealKey}
              />
            );
          }}
          ListHeaderComponent={
            <Animated.View entering={FadeInDown.delay(0).duration(350)}>
              <View style={[styles.statsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={[styles.statsMain, { borderBottomColor: theme.border }]}>
                  <View style={[styles.statsIconWrap, { backgroundColor: theme.tint + "20" }]}>
                    <Ionicons name="people" size={24} color={theme.tint} />
                  </View>
                  <View style={styles.statsTextWrap}>
                    <Text style={[styles.statsCount, { color: theme.tint, fontFamily: "Inter_700Bold" }]}>
                      {results.length}
                    </Text>
                    <Text style={[styles.statsLabel, { color: theme.textSecondary, fontFamily: "Inter_400Regular" }]}>
                      {results.length === 1 ? "person saved this number" : "people saved this number"}
                    </Text>
                  </View>
                </View>

                <View style={styles.statsBreakdown}>
                  {Object.entries(labelCounts).map(([label, count]) => {
                    const ls = getLabelStyle(label.toLowerCase(), theme);
                    return (
                      <View key={label} style={styles.breakdownItem}>
                        <View style={[styles.breakdownDot, { backgroundColor: ls.text }]} />
                        <Text style={[styles.breakdownText, { color: theme.textSecondary, fontFamily: "Inter_500Medium" }]}>
                          {count} as {label}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              <Text style={[styles.detailsHeader, { color: theme.textSecondary, fontFamily: "Inter_600SemiBold" }]}>
                CONTACTS DETAILS
              </Text>
            </Animated.View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 10,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  headerCenter: {
    flex: 1,
    paddingTop: 2,
    gap: 4,
  },
  headerPhoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerFlag: {
    fontSize: 22,
  },
  headerNumber: {
    fontSize: 20,
    letterSpacing: 0.3,
  },
  headerCountry: {
    fontSize: 13,
    marginLeft: 30,
  },
  coinBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 4,
  },
  coinText: {
    fontSize: 15,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 16,
  },
  errorText: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  retryText: {
    fontSize: 16,
    color: "#000",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 16,
  },
  emptyIconRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 22,
    textAlign: "center",
  },
  emptyBody: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  statsCard: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
  },
  statsMain: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 14,
    borderBottomWidth: 1,
  },
  statsIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  statsTextWrap: {
    flex: 1,
    gap: 2,
  },
  statsCount: {
    fontSize: 28,
  },
  statsLabel: {
    fontSize: 14,
  },
  statsBreakdown: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 14,
    gap: 16,
  },
  breakdownItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  breakdownDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  breakdownText: {
    fontSize: 13,
  },
  detailsHeader: {
    fontSize: 12,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  resultCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 16,
  },
  resultInfo: {
    flex: 1,
    gap: 6,
  },
  resultName: {
    fontSize: 16,
  },
  resultMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  labelBadgeSmall: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  labelSmallText: {
    fontSize: 11,
  },
  phoneRevealRow: {
    marginTop: 2,
  },
  revealedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  revealedPhone: {
    fontSize: 15,
    letterSpacing: 0.3,
  },
  maskedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  maskedPhone: {
    fontSize: 13,
    letterSpacing: 0.5,
    flex: 1,
  },
  revealBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  revealBtnText: {
    fontSize: 12,
  },
});
