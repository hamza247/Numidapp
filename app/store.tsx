import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  useColorScheme,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "@tanstack/react-query";
import Colors from "@/constants/colors";
import { useCoins } from "@/lib/coins";
import { useLanguage } from "@/lib/i18n";
import { getApiUrl } from "@/lib/query-client";
import { fetch } from "expo/fetch";

interface CoinPackage {
  id: string;
  coins: number;
  price: number;
  label?: string;
  popular?: boolean;
  bestValue?: boolean;
}

const PACKAGES: CoinPackage[] = [
  { id: "starter", coins: 5, price: 0.99 },
  { id: "basic", coins: 15, price: 1.99, label: "save33" },
  { id: "popular", coins: 40, price: 3.99, popular: true, label: "mostPopular" },
  { id: "pro", coins: 100, price: 7.99, label: "save47" },
  { id: "mega", coins: 250, price: 14.99, bestValue: true, label: "bestValue" },
];

function PackageCard({
  pkg,
  theme,
  onPurchase,
  purchasing,
}: {
  pkg: CoinPackage;
  theme: typeof Colors.dark;
  onPurchase: () => void;
  purchasing: boolean;
}) {
  const { t, fonts } = useLanguage();
  const pricePerCoin = (pkg.price / pkg.coins).toFixed(2);
  const highlight = pkg.popular || pkg.bestValue;
  const labelMap: Record<string, string> = {
    save33: t.save33,
    mostPopular: t.mostPopular,
    save47: t.save47,
    bestValue: t.bestValue,
  };
  const translatedLabel = pkg.label ? (labelMap[pkg.label] ?? pkg.label) : undefined;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.packageCard,
        {
          backgroundColor: theme.card,
          borderColor: highlight ? theme.tint + "60" : theme.border,
          borderWidth: highlight ? 2 : 1,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
      onPress={onPurchase}
      disabled={purchasing}
    >
      {translatedLabel && (
        <View
          style={[
            styles.packageLabel,
            {
              backgroundColor: pkg.popular
                ? theme.tint
                : pkg.bestValue
                ? "#C49A2A"
                : theme.tint + "25",
            },
          ]}
        >
          <Text
            style={[
              styles.packageLabelText,
              {
                color: pkg.popular || pkg.bestValue ? "#000" : theme.tint,
                fontFamily: fonts.bold,
              },
            ]}
          >
            {translatedLabel}
          </Text>
        </View>
      )}

      <View style={styles.packageTop}>
        <View style={styles.packageCoinsRow}>
          <Ionicons name="diamond" size={22} color="#C49A2A" />
          <Text style={[styles.packageCoinsCount, { color: theme.text, fontFamily: fonts.bold }]}>
            {pkg.coins}
          </Text>
        </View>
        <Text style={[styles.packagePerCoin, { color: theme.textSecondary, fontFamily: fonts.regular }]}>
          ${pricePerCoin} {t.perCoin}
        </Text>
      </View>

      <View
        style={[
          styles.packagePriceBtn,
          {
            backgroundColor: highlight ? theme.tint : theme.tint + "20",
          },
        ]}
      >
        {purchasing ? (
          <ActivityIndicator size="small" color={highlight ? "#000" : theme.tint} />
        ) : (
          <Text
            style={[
              styles.packagePriceText,
              {
                color: highlight ? "#000" : theme.tint,
                fontFamily: fonts.bold,
              },
            ]}
          >
            ${pkg.price.toFixed(2)}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

export default function StoreScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== "light";
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { coins, refreshCoins } = useCoins();
  const { t, fonts, isRTL, language } = useLanguage();
  const rowDir = isRTL ? "row-reverse" : "row" as const;
  const textAlign = isRTL ? "right" : "left" as const;
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  const { data: apiPackages } = useQuery<CoinPackage[]>({
    queryKey: ["/api/coin-packages"],
  });
  const packages = (apiPackages && apiPackages.length > 0) ? apiPackages : PACKAGES;

  const webTop = Platform.OS === "web" ? 67 : 0;
  const webBottom = Platform.OS === "web" ? 34 : 0;

  useFocusEffect(
    useCallback(() => {
      refreshCoins();
    }, [refreshCoins])
  );

  async function handlePurchase(pkg: CoinPackage) {
    const phone = await AsyncStorage.getItem("user_phone");
    if (!phone) {
      Alert.alert("Login Required", t.loginRequiredForPurchase);
      return;
    }

    setPurchasingId(pkg.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const base = getApiUrl();
      const url = `${base}api/stripe/create-checkout`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          coins: pkg.coins,
          priceInCents: Math.round(pkg.price * 100),
          packageId: pkg.id,
          lang: language,
        }),
        credentials: "include",
      });

      const data = await res.json().catch(() => ({})) as any;

      if (!res.ok) {
        const msg = data?.error || t.stripeUnavailable;
        Alert.alert("Payment Error", msg);
        return;
      }

      const checkoutUrl: string = data.url;
      if (!checkoutUrl) {
        Alert.alert("Error", t.stripeError);
        return;
      }

      if (Platform.OS === "web") {
        window.open(checkoutUrl, "_blank");
      } else {
        const coinsBeforePayment = coins;
        const result = await WebBrowser.openAuthSessionAsync(checkoutUrl, "numidapp-caller://");

        const redirectUrl = result.type === "success" ? (result as any).url as string | undefined : undefined;
        const sessionId = redirectUrl
          ? new URLSearchParams(redirectUrl.split("?")[1] ?? "").get("session_id")
          : null;

        if (sessionId && phone) {
          try {
            const base = getApiUrl();
            const claimRes = await fetch(`${base}api/payment/claim`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ session_id: sessionId, phone }),
              credentials: "include",
            });
            const claimData = await claimRes.json().catch(() => ({})) as any;
            console.log(`[Payment] claim result: coinsAdded=${claimData.coinsAdded}, balance=${claimData.newBalance}`);
          } catch (claimErr) {
            console.warn("[Payment] claim endpoint error:", claimErr);
          }
        }

        await refreshCoins();

        if (result.type === "success") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          router.canGoBack() ? router.back() : router.replace("/");
        } else if (coins > coinsBeforePayment) {
          router.canGoBack() ? router.back() : router.replace("/");
        }
      }
    } catch (err: any) {
      Alert.alert("Error", err?.message || t.stripeError);
    } finally {
      setPurchasingId(null);
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
            router.canGoBack() ? router.back() : router.replace("/");
          }}
        >
          <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={20} color={theme.text} />
        </Pressable>

        <Text style={[styles.headerTitle, { color: theme.text, fontFamily: fonts.bold }]}>
          {t.coinStore}
        </Text>

        <View style={[styles.coinBadge, { backgroundColor: "#C49A2A" + "20", borderColor: "#C49A2A" + "40" }]}>
          <Ionicons name="diamond" size={14} color="#C49A2A" />
          <Text style={[styles.coinText, { color: "#C49A2A", fontFamily: fonts.bold }]}>
            {coins}
          </Text>
        </View>
      </Animated.View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 32 + webBottom,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(50).duration(400)} style={styles.balanceSection}>
          <View style={[styles.balanceCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.balanceIconWrap, { backgroundColor: "#C49A2A" + "15" }]}>
              <Ionicons name="diamond" size={32} color="#C49A2A" />
            </View>
            <View style={styles.balanceInfo}>
              <Text style={[styles.balanceCount, { color: "#C49A2A", fontFamily: fonts.bold }]}>
                {coins}
              </Text>
              <Text style={[styles.balanceLabel, { color: theme.textSecondary, fontFamily: fonts.regular }]}>
                {t.coinsRemaining}
              </Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary, fontFamily: fonts.semiBold }]}>
            {t.coinPackages}
          </Text>
          <Text style={[styles.sectionSub, { color: theme.textMuted, fontFamily: fonts.regular }]}>
            {t.coinPackagesSub}
          </Text>
        </Animated.View>

        <View style={styles.packagesGrid}>
          {packages.map((pkg, idx) => (
            <Animated.View key={pkg.id} entering={FadeInDown.delay(150 + idx * 60).duration(400)}>
              <PackageCard
                pkg={pkg}
                theme={theme}
                onPurchase={() => handlePurchase(pkg)}
                purchasing={purchasingId === pkg.id}
              />
            </Animated.View>
          ))}
        </View>

        <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.infoSection}>
          <View style={[styles.infoCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.infoRow, { flexDirection: rowDir }]}>
              <Ionicons name="shield-checkmark-outline" size={18} color={theme.tint} />
              <Text style={[styles.infoText, { color: theme.textSecondary, fontFamily: fonts.regular, textAlign }]}>
                {t.securePayment}
              </Text>
            </View>
            <View style={[styles.infoRow, { flexDirection: rowDir }]}>
              <Ionicons name="infinite-outline" size={18} color={theme.tint} />
              <Text style={[styles.infoText, { color: theme.textSecondary, fontFamily: fonts.regular, textAlign }]}>
                {t.coinsNeverExpire}
              </Text>
            </View>
            <View style={[styles.infoRow, { flexDirection: rowDir }]}>
              <Ionicons name="flash-outline" size={18} color={theme.tint} />
              <Text style={[styles.infoText, { color: theme.textSecondary, fontFamily: fonts.regular, textAlign }]}>
                {t.instantDelivery}
              </Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 22,
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
  balanceSection: {
    marginBottom: 24,
  },
  balanceCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  balanceIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  balanceInfo: {
    flex: 1,
    gap: 2,
  },
  balanceCount: {
    fontSize: 36,
  },
  balanceLabel: {
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 12,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: 13,
    marginBottom: 16,
  },
  packagesGrid: {
    gap: 12,
    marginBottom: 24,
  },
  packageCard: {
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    overflow: "hidden",
  },
  packageLabel: {
    position: "absolute",
    top: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomLeftRadius: 10,
  },
  packageLabelText: {
    fontSize: 10,
    letterSpacing: 0.3,
  },
  packageTop: {
    flex: 1,
    gap: 2,
  },
  packageCoinsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  packageCoinsCount: {
    fontSize: 24,
  },
  packagePerCoin: {
    fontSize: 12,
    marginLeft: 30,
  },
  packagePriceBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 70,
    alignItems: "center",
  },
  packagePriceText: {
    fontSize: 16,
  },
  infoSection: {
    marginBottom: 16,
  },
  infoCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    gap: 14,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  infoText: {
    fontSize: 13,
    flex: 1,
  },
});
