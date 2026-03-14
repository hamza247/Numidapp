import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Image,
  Pressable,
  Linking,
  Platform,
  StyleSheet,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { getSearchCount, shouldShowAd } from "@/lib/ads";

let BannerAd: any = null;
let BannerAdSize: any = null;
let TestIds: any = null;
let admobLoaded = false;

if (Platform.OS !== "web") {
  try {
    const admob = require("react-native-google-mobile-ads");
    BannerAd = admob.BannerAd;
    BannerAdSize = admob.BannerAdSize;
    TestIds = admob.TestIds;
    admobLoaded = true;
  } catch {}
}

export default function AdBanner() {
  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["/api/app-settings"],
  });

  const [admobFailed, setAdmobFailed] = useState(false);
  const [searchCount, setSearchCount] = useState(getSearchCount());
  const adConsumedRef = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const current = getSearchCount();
      if (current !== searchCount) setSearchCount(current);
    }, 500);
    return () => clearInterval(interval);
  }, [searchCount]);

  if (!settings) return null;
  if (settings.ads_enabled !== "1") return null;

  const frequency = settings.ad_frequency || "every_search";
  const provider = settings.ad_provider || "custom";
  const customUrl = settings.custom_banner_url;
  const customLink = settings.custom_banner_link;

  const wantsAdmob = provider === "admob";
  const canUseAdmob = wantsAdmob && admobLoaded && !admobFailed && Platform.OS !== "web";

  const hasAdmobUnitId = canUseAdmob && (
    Platform.OS === "ios"
      ? !!(settings.admob_banner_ios || TestIds?.BANNER)
      : !!(settings.admob_banner_android || TestIds?.BANNER)
  );
  const hasCustom = !!customUrl;

  const willRender = hasAdmobUnitId || hasCustom;
  if (!willRender) return null;

  if (!shouldShowAd(frequency, searchCount)) return null;

  if (hasAdmobUnitId) {
    const unitId =
      Platform.OS === "ios"
        ? settings.admob_banner_ios || TestIds?.BANNER
        : settings.admob_banner_android || TestIds?.BANNER;

    return (
      <View style={styles.container}>
        <BannerAd
          unitId={unitId}
          size={BannerAdSize?.ANCHORED_ADAPTIVE_BANNER || "BANNER"}
          onAdFailedToLoad={() => setAdmobFailed(true)}
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
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  bannerImage: {
    width: "100%",
    height: 60,
    borderRadius: 10,
    overflow: "hidden",
  },
});
