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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInLeft,
  SlideInRight,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { getApiUrl } from "@/lib/query-client";
import { fetch } from "expo/fetch";

interface SearchResult {
  storedName: string;
  label: string;
}

function formatPhoneDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  return `+${digits.slice(0, digits.length - 10)} (${digits.slice(-10, -7)}) ${digits.slice(-7, -4)}-${digits.slice(-4)}`;
}

function getLabelStyle(label: string, theme: typeof Colors.dark) {
  const l = label.toLowerCase();
  if (l.includes("mobile") || l.includes("cell")) {
    return { bg: theme.labelMobile + "22", text: theme.labelMobile, icon: "phone-portrait-outline" as const };
  }
  if (l.includes("home")) {
    return { bg: theme.labelHome + "22", text: theme.labelHome, icon: "home-outline" as const };
  }
  if (l.includes("work") || l.includes("office")) {
    return { bg: theme.labelWork + "22", text: theme.labelWork, icon: "briefcase-outline" as const };
  }
  return { bg: theme.labelOther + "22", text: theme.labelOther, icon: "ellipsis-horizontal-outline" as const };
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getAvatarColor(name: string, theme: typeof Colors.dark): string {
  const colors = [
    theme.labelMobile,
    theme.labelHome,
    theme.labelWork,
    theme.tint,
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function ResultCard({ item, index: idx, theme }: { item: SearchResult; index: number; theme: typeof Colors.dark }) {
  const labelStyle = getLabelStyle(item.label, theme);
  const avatarColor = getAvatarColor(item.storedName, theme);
  const initials = getInitials(item.storedName);

  return (
    <Animated.View
      entering={FadeInDown.delay(idx * 60).duration(350).springify()}
    >
      <View style={[styles.resultCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={[styles.avatar, { backgroundColor: avatarColor + "28", borderColor: avatarColor + "40" }]}>
          <Text style={[styles.avatarText, { color: avatarColor, fontFamily: "Inter_600SemiBold" }]}>
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
          <Text style={[styles.resultSub, { color: theme.textSecondary, fontFamily: "Inter_400Regular" }]}>
            Saved this number
          </Text>
        </View>

        <View style={[styles.labelBadge, { backgroundColor: labelStyle.bg }]}>
          <Ionicons name={labelStyle.icon} size={12} color={labelStyle.text} />
          <Text style={[styles.labelText, { color: labelStyle.text, fontFamily: "Inter_500Medium" }]}>
            {item.label}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

export default function ResultsScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== "light";
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();

  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const webTop = Platform.OS === "web" ? 67 : 0;
  const webBottom = Platform.OS === "web" ? 34 : 0;

  useEffect(() => {
    if (phone) {
      loadResults(phone);
    }
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
      const data = await res.json() as { results: SearchResult[]; count: number };
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
          <Text style={[styles.headerNumber, { color: theme.text, fontFamily: "Inter_700Bold" }]}>
            {formatPhoneDisplay(phone ?? "")}
          </Text>
          {!loading && (
            <Animated.Text
              entering={FadeIn.duration(300)}
              style={[styles.headerCount, { color: theme.textSecondary, fontFamily: "Inter_400Regular" }]}
            >
              {results.length === 0
                ? "Not found in any contacts"
                : results.length === 1
                ? "Saved by 1 person"
                : `Saved by ${results.length} people`}
            </Animated.Text>
          )}
        </View>
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
            Nobody in our network has this number saved in their contacts. Ask more friends to sync their contacts.
          </Text>
        </Animated.View>
      )}

      {!loading && !error && results.length > 0 && (
        <FlatList
          data={results}
          keyExtractor={(item, idx) => `${item.storedName}-${idx}`}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: insets.bottom + 32 + webBottom,
            gap: 10,
          }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <ResultCard item={item} index={index} theme={theme} />
          )}
          ListHeaderComponent={
            results.length > 0 ? (
              <Animated.View
                entering={FadeInDown.delay(0).duration(350)}
                style={[styles.summaryCard, { backgroundColor: theme.tint + "15", borderColor: theme.tint + "35" }]}
              >
                <View style={[styles.summaryIconWrap, { backgroundColor: theme.tint + "25" }]}>
                  <Ionicons name="checkmark-circle" size={22} color={theme.tint} />
                </View>
                <Text style={[styles.summaryText, { color: theme.text, fontFamily: "Inter_500Medium" }]}>
                  Found in{" "}
                  <Text style={{ color: theme.tint, fontFamily: "Inter_700Bold" }}>
                    {results.length}
                  </Text>
                  {" "}contact{results.length !== 1 ? "s" : ""}
                </Text>
              </Animated.View>
            ) : null
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
    gap: 14,
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
  headerNumber: {
    fontSize: 24,
    letterSpacing: 0.3,
  },
  headerCount: {
    fontSize: 14,
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
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 12,
    marginBottom: 4,
  },
  summaryIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryText: {
    fontSize: 15,
  },
  resultCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  avatar: {
    width: 46,
    height: 46,
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
    gap: 3,
  },
  resultName: {
    fontSize: 16,
  },
  resultSub: {
    fontSize: 13,
  },
  labelBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  labelText: {
    fontSize: 12,
    textTransform: "capitalize",
  },
});
