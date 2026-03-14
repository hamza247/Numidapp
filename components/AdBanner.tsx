import React, { useState, useEffect } from "react";
import {
  View,
  Image,
  Pressable,
  Linking,
  StyleSheet,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { getSearchCount, shouldShowAd } from "@/lib/ads";

export default function AdBanner() {
  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["/api/app-settings"],
  });

  const [searchCount, setSearchCount] = useState(getSearchCount());

  useEffect(() => {
    const interval = setInterval(() => {
      const current = getSearchCount();
      if (current !== searchCount) setSearchCount(current);
    }, 500);
    return () => clearInterval(interval);
  }, [searchCount]);

  if (!settings) return null;
  if (settings.ads_enabled !== "1") return null;

  const provider = settings.ad_provider || "custom";
  if (provider !== "custom" && provider !== "admob") return null;

  const frequency = settings.ad_frequency || "every_search";
  if (!shouldShowAd(frequency, searchCount)) return null;

  const customUrl = settings.custom_banner_url;
  const customLink = settings.custom_banner_link;

  if (!customUrl) return null;

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
