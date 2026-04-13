import React, { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import {
  View,
  Image,
  Pressable,
  Linking,
  Platform,
  StyleSheet,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { getSearchCount, subscribeSearchCount, shouldShowAd } from "@/lib/ads";

interface AdMobModule {
  BannerAd: React.ComponentType<{
    unitId: string;
    size: string;
    onAdLoaded?: () => void;
    onAdFailedToLoad?: (error: unknown) => void;
  }>;
  BannerAdSize: { ANCHORED_ADAPTIVE_BANNER: string; BANNER: string };
  TestIds: { BANNER: string };
}

let admobModule: AdMobModule | null = null;

if (Platform.OS !== "web") {
  try {
    const loaded = require("react-native-google-mobile-ads") as AdMobModule;
    if (loaded?.BannerAd && loaded?.BannerAdSize && loaded?.TestIds) {
      admobModule = loaded;
    }
  } catch {}
}

function useSearchCount(): number {
  return useSyncExternalStore(subscribeSearchCount, getSearchCount, getSearchCount);
}

export default function AdBanner() {
  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["/api/app-settings"],
  });

  const [retryKey, setRetryKey] = useState(0);
  const [admobFailed, setAdmobFailed] = useState(false);
  const searchCount = useSearchCount();

  const handleAdFailure = useCallback(() => {
    setAdmobFailed(true);
  }, []);

  useEffect(() => {
    if (!admobFailed) return;
    const timer = setTimeout(() => {
      setAdmobFailed(false);
      setRetryKey((k) => k + 1);
    }, 10000);
    return () => clearTimeout(timer);
  }, [admobFailed]);

  if (!settings) return null;
  if (settings.ads_enabled !== "1") return null;

  const frequency = settings.ad_frequency || "every_search";
  const provider = settings.ad_provider || "custom";
  const customUrl = settings.custom_banner_url;
  const customLink = settings.custom_banner_link;

  const wantsAdmob = provider === "admob";
  const canUseAdmob = wantsAdmob && admobModule !== null && !admobFailed && Platform.OS !== "web";

  const unitId = canUseAdmob
    ? Platform.OS === "ios"
      ? settings.admob_banner_ios || admobModule!.TestIds.BANNER
      : settings.admob_banner_android || admobModule!.TestIds.BANNER
    : null;

  const hasAdmobUnitId = canUseAdmob && !!unitId;
  const hasCustom = !!customUrl;

  const willRender = hasAdmobUnitId || hasCustom;
  if (!willRender) return null;

  if (!shouldShowAd(frequency, searchCount)) return null;

  if (hasAdmobUnitId && admobModule && unitId) {
    return (
      <View style={styles.container}>
        <admobModule.BannerAd
          key={retryKey}
          unitId={unitId}
          size={admobModule.BannerAdSize.ANCHORED_ADAPTIVE_BANNER || admobModule.BannerAdSize.BANNER || "BANNER"}
          onAdFailedToLoad={handleAdFailure}
        />
      </View>
    );
  }

  if (!hasCustom) return null;

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => {
          if (customLink) Linking.openURL(customLink).catch(() => {});
        }}
        style={({ pressed }) => ({ opacity: pressed && customLink ? 0.85 : 1 })}
      >
        <Image
          source={{ uri: customUrl }}
          style={styles.bannerImage}
          resizeMode="cover"
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingHorizontal: 20,
    paddingVertical: 8,
    alignItems: "center",
  },
  bannerImage: {
    width: "100%",
    height: 60,
    borderRadius: 10,
    overflow: "hidden",
  },
});
