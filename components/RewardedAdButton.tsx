import React, { useState, useEffect, useRef, useCallback } from "react";
import { Pressable, Text, View, StyleSheet, Platform, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { getApiUrl } from "@/lib/query-client";
import { fetch } from "expo/fetch";

interface RewardedAdButtonProps {
  phone: string | null;
  onCoinsEarned: (amount: number) => void;
  label: (n: number) => string;
  notAvailableLabel: string;
  loadingLabel: string;
  onEarnedLabel: (n: number) => string;
  fontFamily?: string;
}

interface AdMobRewardedModule {
  RewardedAd: {
    createForAdRequest: (unitId: string, options?: object) => RewardedAdInstance;
  };
  RewardedAdEventType: {
    LOADED: string;
    EARNED_REWARD: string;
    CLOSED: string;
    ERROR: string;
  };
  TestIds: { REWARDED: string };
}

interface RewardedAdInstance {
  load: () => void;
  show: () => Promise<void>;
  addAdEventListener: (event: string, callback: (...args: unknown[]) => void) => () => void;
}

let admobModule: AdMobRewardedModule | null = null;

if (Platform.OS !== "web") {
  try {
    const m = require("react-native-google-mobile-ads") as AdMobRewardedModule;
    if (m?.RewardedAd && m?.RewardedAdEventType && m?.TestIds) {
      admobModule = m;
    }
  } catch {}
}

type AdState = "idle" | "loading" | "ready" | "showing" | "unavailable";

export default function RewardedAdButton({
  phone,
  onCoinsEarned,
  label,
  notAvailableLabel,
  loadingLabel,
  onEarnedLabel,
  fontFamily,
}: RewardedAdButtonProps) {
  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["/api/app-settings"],
  });

  const [adState, setAdState] = useState<AdState>("idle");
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const adRef = useRef<RewardedAdInstance | null>(null);
  const unsubscribersRef = useRef<Array<() => void>>([]);

  const coinAmount = settings ? (parseInt(settings.rewarded_coin_amount || "3", 10) || 3) : 3;
  const adsEnabled = settings?.ads_enabled === "1";
  const provider = settings?.ad_provider || "admob";
  const unitId = Platform.OS === "ios"
    ? settings?.admob_rewarded_ios || ""
    : settings?.admob_rewarded_android || "";

  const cleanupListeners = useCallback(() => {
    unsubscribersRef.current.forEach((fn) => { try { fn(); } catch {} });
    unsubscribersRef.current = [];
  }, []);

  const loadAd = useCallback(() => {
    if (!admobModule || Platform.OS === "web") return;
    if (!adsEnabled || provider !== "admob") return;

    cleanupListeners();

    const resolvedUnitId = unitId || admobModule.TestIds.REWARDED;
    const ad = admobModule.RewardedAd.createForAdRequest(resolvedUnitId, {
      requestNonPersonalizedAdsOnly: false,
    });
    adRef.current = ad;
    setAdState("loading");

    const unsubLoaded = ad.addAdEventListener(
      admobModule.RewardedAdEventType.LOADED,
      () => setAdState("ready")
    );

    const unsubEarned = ad.addAdEventListener(
      admobModule.RewardedAdEventType.EARNED_REWARD,
      () => {
        grantCoins(coinAmount);
      }
    );

    const unsubClosed = ad.addAdEventListener(
      admobModule.RewardedAdEventType.CLOSED,
      () => {
        setAdState("idle");
        setTimeout(() => loadAd(), 500);
      }
    );

    const unsubError = ad.addAdEventListener(
      admobModule.RewardedAdEventType.ERROR,
      () => {
        setAdState("unavailable");
        setTimeout(() => {
          setAdState("idle");
          loadAd();
        }, 30000);
      }
    );

    unsubscribersRef.current = [unsubLoaded, unsubEarned, unsubClosed, unsubError];
    ad.load();
  }, [adsEnabled, provider, unitId, coinAmount, cleanupListeners]);

  useEffect(() => {
    if (!settings) return;
    if (!adsEnabled || provider !== "admob") return;
    if (Platform.OS === "web") return;
    if (!admobModule) return;
    loadAd();
    return () => cleanupListeners();
  }, [settings, adsEnabled, provider]);

  const grantCoins = async (amount: number) => {
    if (!phone) return;
    try {
      const base = getApiUrl();
      const res = await fetch(`${base}api/coins/rewarded-ad`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      if (res.ok) {
        const data = await res.json();
        const earned = typeof data.earned === "number" ? data.earned : amount;
        onCoinsEarned(earned);
        setToastMsg(onEarnedLabel(earned));
        setTimeout(() => setToastMsg(null), 3000);
      }
    } catch {}
  };

  const handlePress = async () => {
    if (adState !== "ready" || !adRef.current) return;
    setAdState("showing");
    try {
      await adRef.current.show();
    } catch {
      setAdState("idle");
      setTimeout(() => loadAd(), 500);
    }
  };

  if (Platform.OS === "web") return null;
  if (!admobModule) return null;
  if (!settings) return null;
  if (!adsEnabled || provider !== "admob") return null;
  if (!phone) return null;

  return (
    <View style={styles.wrapper}>
      {toastMsg && (
        <View style={styles.toast}>
          <Ionicons name="checkmark-circle" size={16} color="#00C9D4" />
          <Text style={[styles.toastText, fontFamily ? { fontFamily } : {}]}>{toastMsg}</Text>
        </View>
      )}
      <Pressable
        style={({ pressed }) => [
          styles.button,
          adState === "ready" && styles.buttonReady,
          (adState === "loading" || adState === "showing") && styles.buttonLoading,
          adState === "unavailable" && styles.buttonUnavailable,
          pressed && adState === "ready" && { opacity: 0.82 },
        ]}
        onPress={handlePress}
        disabled={adState !== "ready"}
      >
        {adState === "loading" || adState === "showing" ? (
          <ActivityIndicator size="small" color="#C49A2A" style={{ marginRight: 6 }} />
        ) : (
          <Ionicons
            name="play-circle"
            size={18}
            color={adState === "ready" ? "#C49A2A" : "#666"}
            style={{ marginRight: 6 }}
          />
        )}
        <Text style={[
          styles.buttonText,
          adState === "ready" && styles.buttonTextReady,
          fontFamily ? { fontFamily } : {},
        ]}>
          {adState === "loading" ? loadingLabel
            : adState === "unavailable" ? notAvailableLabel
            : adState === "showing" ? loadingLabel
            : label(coinAmount)}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    marginTop: 10,
    gap: 6,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(196,154,42,0.3)",
    backgroundColor: "rgba(196,154,42,0.06)",
  },
  buttonReady: {
    borderColor: "#C49A2A",
    backgroundColor: "rgba(196,154,42,0.12)",
  },
  buttonLoading: {
    borderColor: "rgba(196,154,42,0.2)",
    backgroundColor: "rgba(196,154,42,0.04)",
  },
  buttonUnavailable: {
    borderColor: "rgba(100,100,100,0.3)",
    backgroundColor: "transparent",
  },
  buttonText: {
    fontSize: 13,
    color: "#666",
  },
  buttonTextReady: {
    color: "#C49A2A",
    fontWeight: "600",
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,201,212,0.12)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,201,212,0.3)",
  },
  toastText: {
    fontSize: 13,
    color: "#00C9D4",
    fontWeight: "600",
  },
});
