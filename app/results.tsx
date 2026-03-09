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
import { useCoins } from "@/lib/coins";
import { useLanguage } from "@/lib/i18n";

interface SearchResult {
  storedName: string;
  label: string;
  uploaderName: string;
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

function ResultCard({
  item,
  index: idx,
  theme,
  revealKey,
  coins,
  spendCoin,
  isRevealed,
  getRevealedPhone,
  cacheRevealedPhone,
}: {
  item: SearchResult;
  index: number;
  theme: typeof Colors.dark;
  revealKey: string;
  coins: number;
  spendCoin: (id: string) => Promise<boolean>;
  isRevealed: (id: string) => boolean;
  getRevealedPhone: (id: string) => string | null;
  cacheRevealedPhone: (id: string, value: string) => Promise<void>;
}) {
  const { t, fonts, isRTL } = useLanguage();
  const rowDir = isRTL ? "row-reverse" : "row" as const;
  const textAlign = isRTL ? "right" : "left" as const;
  const [revealing, setRevealing] = useState(false);
  const labelStyle = getLabelStyle(item.label, theme);
  const avatarColor = getAvatarColor(item.storedName, theme);
  const initials = getInitials(item.storedName);
  const revealed = isRevealed(revealKey);
  const revealedName = getRevealedPhone(revealKey);

  async function handleReveal() {
    if (coins < 1) {
      Alert.alert(t.notEnoughCoins, t.notEnoughCoinsReveal, [
        { text: "OK", style: "cancel" },
      ]);
      return;
    }
    setRevealing(true);
    const success = await spendCoin(revealKey);
    if (success) {
      await cacheRevealedPhone(revealKey, item.uploaderName);
    } else {
      Alert.alert(t.notEnoughCoins, t.notEnoughCoinsReveal, [
        { text: "OK", style: "cancel" },
      ]);
    }
    setRevealing(false);
  }

  return (
    <Animated.View entering={FadeInDown.delay(idx * 50).duration(350).springify()}>
      <View style={[styles.resultCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={[styles.avatar, { backgroundColor: avatarColor + "20", borderColor: avatarColor + "35" }]}>
          <Text style={[styles.avatarText, { color: avatarColor, fontFamily: fonts.bold }]}>
            {initials}
          </Text>
        </View>

        <View style={styles.resultInfo}>
          <Text
            style={[styles.resultName, { color: theme.text, fontFamily: fonts.semiBold }]}
            numberOfLines={1}
          >
            {item.storedName}
          </Text>

          <View style={styles.resultMetaRow}>
            <View style={[styles.labelBadgeSmall, { backgroundColor: labelStyle.bg }]}>
              <Ionicons name={labelStyle.icon} size={11} color={labelStyle.text} />
              <Text style={[styles.labelSmallText, { color: labelStyle.text, fontFamily: fonts.medium }]}>
                {labelStyle.display}
              </Text>
            </View>
          </View>

          <View style={[styles.uploaderRow, { flexDirection: rowDir }]}>
            <Ionicons name="person-outline" size={13} color={theme.textSecondary} />
            {revealed ? (
              <Text style={[styles.uploaderName, { color: theme.textSecondary, fontFamily: fonts.regular, textAlign }]}>
                {t.savedBy} {revealedName}
              </Text>
            ) : (
              <Pressable
                style={({ pressed }) => [styles.revealBtn, { flexDirection: rowDir, backgroundColor: "#C49A2A" + "18", borderColor: "#C49A2A" + "40", opacity: pressed ? 0.7 : 1 }]}
                onPress={handleReveal}
                disabled={revealing}
              >
                {revealing ? (
                  <ActivityIndicator size="small" color="#C49A2A" />
                ) : (
                  <>
                    <Ionicons name="eye-outline" size={12} color="#C49A2A" />
                    <Text style={[styles.revealBtnText, { color: "#C49A2A", fontFamily: fonts.semiBold }]}>
                      {t.revealName}
                    </Text>
                    <View style={[styles.revealCost, isRTL ? { paddingLeft: 0, paddingRight: 2, borderLeftWidth: 0, borderRightWidth: 1, borderRightColor: "#C49A2A40" } : {}]}>
                      <Ionicons name="diamond" size={9} color="#C49A2A" />
                      <Text style={[styles.revealCostText, { color: "#C49A2A", fontFamily: fonts.bold }]}>1</Text>
                    </View>
                  </>
                )}
              </Pressable>
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
  const { coins, spendCoin, isRevealed, getRevealedPhone, cacheRevealedPhone } = useCoins();
  const { t, fonts } = useLanguage();

  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      setError("failedToLoad");
    } finally {
      setLoading(false);
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
            <Text style={[styles.headerNumber, { color: theme.text, fontFamily: fonts.bold }]}>
              {country.dial} {localNumber ?? phone}
            </Text>
          </View>
          <Text style={[styles.headerCountry, { color: theme.textSecondary, fontFamily: fonts.regular }]}>
            {country.name}
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.coinBadge, { backgroundColor: "#C49A2A" + "20", borderColor: "#C49A2A" + "40", opacity: pressed ? 0.7 : 1 }]}
          onPress={() => router.push("/store")}
        >
          <Ionicons name="diamond" size={14} color="#C49A2A" />
          <Text style={[styles.coinText, { color: "#C49A2A", fontFamily: fonts.bold }]}>
            {coins}
          </Text>
        </Pressable>
      </Animated.View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.tint} />
          <Text style={[styles.loadingText, { color: theme.textSecondary, fontFamily: fonts.regular }]}>
            {t.searchingContacts}
          </Text>
        </View>
      )}

      {error && !loading && (
        <Animated.View style={styles.errorContainer} entering={FadeInDown.duration(400)}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.destructive} />
          <Text style={[styles.errorText, { color: theme.textSecondary, fontFamily: fonts.regular }]}>
            {t.failedToLoad}
          </Text>
          <Pressable
            style={[styles.retryBtn, { backgroundColor: theme.tint }]}
            onPress={() => phone && loadResults(phone)}
          >
            <Text style={[styles.retryText, { fontFamily: fonts.semiBold }]}>{t.tryAgain}</Text>
          </Pressable>
        </Animated.View>
      )}

      {!loading && !error && results.length === 0 && (
        <Animated.View style={styles.emptyContainer} entering={FadeInDown.delay(100).duration(400)}>
          <View style={[styles.emptyIconRing, { borderColor: theme.border, backgroundColor: theme.card }]}>
            <Ionicons name="person-outline" size={40} color={theme.textMuted} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.text, fontFamily: fonts.semiBold }]}>
            {t.notSavedYet}
          </Text>
          <Text style={[styles.emptyBody, { color: theme.textSecondary, fontFamily: fonts.regular }]}>
            {t.notSavedBody}
          </Text>
        </Animated.View>
      )}

      {!loading && !error && results.length > 0 && (
        <FlatList
          data={results}
          keyExtractor={(item, idx) => `${item.uploaderName}-${item.storedName}-${idx}`}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: insets.bottom + 32 + webBottom,
            gap: 10,
          }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <ResultCard
              item={item}
              index={index}
              theme={theme}
              revealKey={`${phone}-${index}`}
              coins={coins}
              spendCoin={spendCoin}
              isRevealed={isRevealed}
              getRevealedPhone={getRevealedPhone}
              cacheRevealedPhone={cacheRevealedPhone}
            />
          )}
          ListHeaderComponent={
            <Animated.View entering={FadeInDown.delay(0).duration(350)}>
              <View style={[styles.statsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={[styles.statsMain, { borderBottomColor: theme.border }]}>
                  <View style={[styles.statsIconWrap, { backgroundColor: theme.tint + "20" }]}>
                    <Ionicons name="people" size={24} color={theme.tint} />
                  </View>
                  <View style={styles.statsTextWrap}>
                    <Text style={[styles.statsCount, { color: theme.tint, fontFamily: fonts.bold }]}>
                      {results.length}
                    </Text>
                    <Text style={[styles.statsLabel, { color: theme.textSecondary, fontFamily: fonts.regular }]}>
                      {t.personSaved(results.length)}
                    </Text>
                  </View>
                </View>

                <View style={styles.statsBreakdown}>
                  {Object.entries(labelCounts).map(([label, count]) => {
                    const ls = getLabelStyle(label.toLowerCase(), theme);
                    return (
                      <View key={label} style={styles.breakdownItem}>
                        <View style={[styles.breakdownDot, { backgroundColor: ls.text }]} />
                        <Text style={[styles.breakdownText, { color: theme.textSecondary, fontFamily: fonts.medium }]}>
                          {t.savedAs(count, label)}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              <Text style={[styles.detailsHeader, { color: theme.textSecondary, fontFamily: fonts.semiBold }]}>
                {t.contactsDetails}
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
  uploaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 2,
  },
  uploaderName: {
    fontSize: 13,
  },
  revealBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 28,
    minHeight: 22,
    justifyContent: "center",
  },
  revealBtnText: {
    fontSize: 12,
  },
  revealCost: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingLeft: 2,
    borderLeftWidth: 1,
    borderLeftColor: "#C49A2A40",
  },
  revealCostText: {
    fontSize: 11,
  },
});
