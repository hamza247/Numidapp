import React, { useState } from "react";
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
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useCoins } from "@/lib/coins";

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
  { id: "basic", coins: 15, price: 1.99, label: "Save 33%" },
  { id: "popular", coins: 40, price: 3.99, popular: true, label: "Most Popular" },
  { id: "pro", coins: 100, price: 7.99, label: "Save 47%" },
  { id: "mega", coins: 250, price: 14.99, bestValue: true, label: "Best Value" },
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
  const pricePerCoin = (pkg.price / pkg.coins).toFixed(2);
  const highlight = pkg.popular || pkg.bestValue;

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
      {pkg.label && (
        <View
          style={[
            styles.packageLabel,
            {
              backgroundColor: pkg.popular
                ? theme.tint
                : pkg.bestValue
                ? "#FFD700"
                : theme.tint + "25",
            },
          ]}
        >
          <Text
            style={[
              styles.packageLabelText,
              {
                color: pkg.popular || pkg.bestValue ? "#000" : theme.tint,
                fontFamily: "Inter_700Bold",
              },
            ]}
          >
            {pkg.label}
          </Text>
        </View>
      )}

      <View style={styles.packageTop}>
        <View style={styles.packageCoinsRow}>
          <Ionicons name="diamond" size={22} color="#FFD700" />
          <Text style={[styles.packageCoinsCount, { color: theme.text, fontFamily: "Inter_700Bold" }]}>
            {pkg.coins}
          </Text>
        </View>
        <Text style={[styles.packagePerCoin, { color: theme.textSecondary, fontFamily: "Inter_400Regular" }]}>
          ${pricePerCoin} per coin
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
                fontFamily: "Inter_700Bold",
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
  const { coins, addCoins } = useCoins();
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  const webTop = Platform.OS === "web" ? 67 : 0;
  const webBottom = Platform.OS === "web" ? 34 : 0;

  async function handlePurchase(pkg: CoinPackage) {
    setPurchasingId(pkg.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    await new Promise((r) => setTimeout(r, 1200));

    await addCoins(pkg.coins);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    Alert.alert(
      "Purchase Complete",
      `You received ${pkg.coins} coins! Your new balance is ${coins + pkg.coins} coins.`,
      [{ text: "OK" }]
    );
    setPurchasingId(null);
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

        <Text style={[styles.headerTitle, { color: theme.text, fontFamily: "Inter_700Bold" }]}>
          Coin Store
        </Text>

        <View style={[styles.coinBadge, { backgroundColor: "#FFD700" + "20", borderColor: "#FFD700" + "40" }]}>
          <Ionicons name="diamond" size={14} color="#FFD700" />
          <Text style={[styles.coinText, { color: "#FFD700", fontFamily: "Inter_700Bold" }]}>
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
            <View style={[styles.balanceIconWrap, { backgroundColor: "#FFD700" + "15" }]}>
              <Ionicons name="diamond" size={32} color="#FFD700" />
            </View>
            <View style={styles.balanceInfo}>
              <Text style={[styles.balanceCount, { color: "#FFD700", fontFamily: "Inter_700Bold" }]}>
                {coins}
              </Text>
              <Text style={[styles.balanceLabel, { color: theme.textSecondary, fontFamily: "Inter_400Regular" }]}>
                coins remaining
              </Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary, fontFamily: "Inter_600SemiBold" }]}>
            COIN PACKAGES
          </Text>
          <Text style={[styles.sectionSub, { color: theme.textMuted, fontFamily: "Inter_400Regular" }]}>
            Each coin reveals one uploader's full phone number
          </Text>
        </Animated.View>

        <View style={styles.packagesGrid}>
          {PACKAGES.map((pkg, idx) => (
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
            <View style={styles.infoRow}>
              <Ionicons name="shield-checkmark-outline" size={18} color={theme.tint} />
              <Text style={[styles.infoText, { color: theme.textSecondary, fontFamily: "Inter_400Regular" }]}>
                Secure payment processing
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="infinite-outline" size={18} color={theme.tint} />
              <Text style={[styles.infoText, { color: theme.textSecondary, fontFamily: "Inter_400Regular" }]}>
                Coins never expire
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="flash-outline" size={18} color={theme.tint} />
              <Text style={[styles.infoText, { color: theme.textSecondary, fontFamily: "Inter_400Regular" }]}>
                Instant delivery after purchase
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
