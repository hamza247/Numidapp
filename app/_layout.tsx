import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { useFonts as useLocalFonts } from "expo-font";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator } from "react-native";
import { SplashIntro } from "@/components/SplashIntro";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { queryClient } from "@/lib/query-client";
import { CoinsProvider } from "@/lib/coins";
import { LanguageProvider, useLanguage } from "@/lib/i18n";
import { useColorScheme } from "react-native";
import Colors from "@/constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

SplashScreen.preventAutoHideAsync();

if (Platform.OS !== "web") {
  try {
    const { default: MobileAds } = require("react-native-google-mobile-ads") as {
      default: () => { initialize(): Promise<unknown> };
    };
    MobileAds().initialize().catch(() => {});
  } catch {}
}

function MaintenanceScreen({ onRetry }: { onRetry: () => void }) {
  const insets = useSafeAreaInsets();
  const { t, fonts } = useLanguage();
  return (
    <View style={[styles.maintenanceContainer, {
      paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0),
      paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0),
    }]}>
      <View style={styles.maintenanceContent}>
        <View style={styles.maintenanceIconRing}>
          <Ionicons name="construct" size={48} color="#00C9D4" />
        </View>
        <Text style={[styles.maintenanceTitle, { fontFamily: fonts.bold }]}>{t.underMaintenance}</Text>
        <Text style={[styles.maintenanceSubtitle, { fontFamily: fonts.regular }]}>{t.maintenanceSub}</Text>
        <View style={styles.maintenanceDivider} />
        <View style={styles.maintenanceMeta}>
          <View style={styles.maintenanceMetaRow}>
            <Ionicons name="time-outline" size={16} color="#6B7280" />
            <Text style={[styles.maintenanceMetaText, { fontFamily: fonts.regular }]}>{t.scheduledMaintenance}</Text>
          </View>
          <View style={styles.maintenanceMetaRow}>
            <Ionicons name="shield-checkmark-outline" size={16} color="#6B7280" />
            <Text style={[styles.maintenanceMetaText, { fontFamily: fonts.regular }]}>{t.dataSafe}</Text>
          </View>
          <View style={styles.maintenanceMetaRow}>
            <Ionicons name="notifications-outline" size={16} color="#6B7280" />
            <Text style={[styles.maintenanceMetaText, { fontFamily: fonts.regular }]}>{t.notifyBack}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.maintenanceRetry} onPress={onRetry} activeOpacity={0.7}>
          <Ionicons name="refresh-outline" size={16} color="#00C9D4" />
          <Text style={[styles.maintenanceRetryText, { fontFamily: fonts.semiBold }]}>{t.checkAgain}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function AppGate({ children }: { children: React.ReactNode }) {
  const { data, isLoading, refetch } = useQuery<Record<string, string>>({
    queryKey: ["/api/app-settings"],
    refetchInterval: 30000,
    staleTime: 0,
    retry: 2,
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00C9D4" />
      </View>
    );
  }

  if (data?.maintenance_mode === "1") {
    return <MaintenanceScreen onRetry={() => refetch()} />;
  }

  return <>{children}</>;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== "light";
  const theme = isDark ? Colors.dark : Colors.light;
  const [showSplash, setShowSplash] = useState(true);

  return (
    <View style={{ flex: 1 }}>
      <AppGate>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.background } }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen
            name="results"
            options={{
              headerShown: false,
              presentation: "card",
            }}
          />
          <Stack.Screen
            name="store"
            options={{
              headerShown: false,
              presentation: "card",
            }}
          />
          <Stack.Screen
            name="profile"
            options={{
              headerShown: false,
              presentation: "card",
            }}
          />
          <Stack.Screen
            name="legal"
            options={{
              headerShown: false,
              presentation: "card",
            }}
          />
        </Stack>
      </AppGate>
      {showSplash && <SplashIntro onDone={() => setShowSplash(false)} />}
    </View>
  );
}

export default function RootLayout() {
  const [interLoaded, interError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const [arabicLoaded, arabicError] = useLocalFonts({
    JannaLTBold: require("../assets/fonts/JannaLTBold.ttf"),
  });

  const fontsLoaded = interLoaded && arabicLoaded;
  const fontError = interError || arabicError;

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <CoinsProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <KeyboardProvider>
                <RootLayoutNav />
              </KeyboardProvider>
            </GestureHandlerRootView>
          </CoinsProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: "#080C14",
    alignItems: "center",
    justifyContent: "center",
  },
  maintenanceContainer: {
    flex: 1,
    backgroundColor: "#080C14",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  maintenanceContent: {
    width: "100%",
    maxWidth: 380,
    alignItems: "center",
  },
  maintenanceIconRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#00C9D4" + "12",
    borderWidth: 1.5,
    borderColor: "#00C9D4" + "30",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  maintenanceTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 26,
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  maintenanceSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  maintenanceDivider: {
    width: 40,
    height: 2,
    backgroundColor: "#1F2937",
    borderRadius: 1,
    marginBottom: 28,
  },
  maintenanceMeta: {
    width: "100%",
    backgroundColor: "#0F1623",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    padding: 20,
    gap: 14,
    marginBottom: 32,
  },
  maintenanceMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  maintenanceMetaText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#6B7280",
  },
  maintenanceRetry: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#00C9D4" + "15",
    borderWidth: 1,
    borderColor: "#00C9D4" + "30",
  },
  maintenanceRetryText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#00C9D4",
  },
});
