import React, { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApiUrl } from "@/lib/query-client";
import { fetch } from "expo/fetch";

const PHONE_KEY = "user_phone";
const REVEALED_KEY = "revealed_numbers";
const SEARCH_TRACKING_KEY = "daily_search_tracking";

interface AppConfig {
  freeDailySearches: number;
  searchCost: number;
  revealCost: number;
  initialCoins: number;
  removePhoneCost: number;
  referralRewardCoins: number;
}

const DEFAULT_CONFIG: AppConfig = {
  freeDailySearches: 5,
  searchCost: 1,
  revealCost: 1,
  initialCoins: 5,
  removePhoneCost: 3,
  referralRewardCoins: 7,
};

interface CoinsContextValue {
  coins: number;
  spendCoin: (uploaderId: string) => Promise<boolean>;
  isRevealed: (uploaderId: string) => boolean;
  getRevealedPhone: (uploaderId: string) => string | null;
  cacheRevealedPhone: (uploaderId: string, phone: string) => Promise<void>;
  addCoins: (amount: number) => Promise<void>;
  freeSearchesRemaining: number;
  spendSearch: () => Promise<{ allowed: boolean; usedFree: boolean }>;
  loaded: boolean;
  refreshCoins: (phone?: string | null) => Promise<void>;
  appConfig: AppConfig;
}

const CoinsContext = createContext<CoinsContextValue | null>(null);

async function fetchCoinsFromServer(phone: string): Promise<number | null> {
  try {
    const base = getApiUrl();
    const url = new URL(`/api/coins?phone=${encodeURIComponent(phone)}`, base);
    const res = await fetch(url.toString());
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.coins === "number" ? data.coins : null;
  } catch {
    return null;
  }
}

async function updateCoinsOnServer(phone: string, delta: number): Promise<number | null> {
  try {
    const base = getApiUrl();
    const url = new URL("/api/coins/update", base);
    const res = await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, delta }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.coins === "number" ? data.coins : null;
  } catch {
    return null;
  }
}

async function fetchAppConfig(): Promise<AppConfig> {
  try {
    const base = getApiUrl();
    const url = new URL("/api/app-config", base);
    const res = await fetch(url.toString());
    if (!res.ok) return DEFAULT_CONFIG;
    const data = await res.json();
    return {
      freeDailySearches: typeof data.freeDailySearches === "number" ? data.freeDailySearches : DEFAULT_CONFIG.freeDailySearches,
      searchCost: typeof data.searchCost === "number" ? data.searchCost : DEFAULT_CONFIG.searchCost,
      revealCost: typeof data.revealCost === "number" ? data.revealCost : DEFAULT_CONFIG.revealCost,
      initialCoins: typeof data.initialCoins === "number" ? data.initialCoins : DEFAULT_CONFIG.initialCoins,
      removePhoneCost: typeof data.removePhoneCost === "number" ? data.removePhoneCost : DEFAULT_CONFIG.removePhoneCost,
      referralRewardCoins: typeof data.referralRewardCoins === "number" ? data.referralRewardCoins : DEFAULT_CONFIG.referralRewardCoins,
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function CoinsProvider({ children }: { children: ReactNode }) {
  const [coins, setCoins] = useState(DEFAULT_CONFIG.initialCoins);
  const [userPhone, setUserPhone] = useState<string | null>(null);
  const [revealedMap, setRevealedMap] = useState<Record<string, string>>({});
  const [dailySearches, setDailySearches] = useState(0);
  const [searchDate, setSearchDate] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [appConfig, setAppConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const phoneRef = useRef<string | null>(null);
  const configRef = useRef<AppConfig>(DEFAULT_CONFIG);

  function getTodayKey(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  useEffect(() => {
    initLoad();
  }, []);

  async function initLoad() {
    const [phone, storedRevealed, storedSearch, config] = await Promise.all([
      AsyncStorage.getItem(PHONE_KEY),
      AsyncStorage.getItem(REVEALED_KEY),
      AsyncStorage.getItem(SEARCH_TRACKING_KEY),
      fetchAppConfig(),
    ]);

    configRef.current = config;
    setAppConfig(config);

    phoneRef.current = phone;
    setUserPhone(phone);

    if (phone) {
      const serverCoins = await fetchCoinsFromServer(phone);
      setCoins(serverCoins !== null ? serverCoins : config.initialCoins);
    } else {
      setCoins(config.initialCoins);
    }

    if (storedRevealed) {
      try {
        const obj = JSON.parse(storedRevealed);
        if (obj && typeof obj === "object") setRevealedMap(obj);
      } catch {}
    }

    const today = getTodayKey();
    if (storedSearch) {
      try {
        const parsed = JSON.parse(storedSearch);
        if (parsed.date === today) {
          setDailySearches(parsed.count);
          setSearchDate(today);
        } else {
          setDailySearches(0);
          setSearchDate(today);
          await AsyncStorage.setItem(SEARCH_TRACKING_KEY, JSON.stringify({ date: today, count: 0 }));
        }
      } catch {
        setDailySearches(0);
        setSearchDate(today);
      }
    } else {
      setDailySearches(0);
      setSearchDate(today);
    }

    setLoaded(true);
  }

  const refreshCoins = useCallback(async (phone?: string | null) => {
    const resolvedPhone = phone !== undefined ? phone : await AsyncStorage.getItem(PHONE_KEY);
    phoneRef.current = resolvedPhone;
    setUserPhone(resolvedPhone);

    const config = await fetchAppConfig();
    configRef.current = config;
    setAppConfig(config);

    if (resolvedPhone) {
      const serverCoins = await fetchCoinsFromServer(resolvedPhone);
      if (serverCoins !== null) setCoins(serverCoins);
    } else {
      setCoins(config.initialCoins);
    }
  }, []);

  const addCoins = useCallback(async (amount: number): Promise<void> => {
    const phone = phoneRef.current;
    if (phone) {
      const newCoins = await updateCoinsOnServer(phone, amount);
      if (newCoins !== null) {
        setCoins(newCoins);
        return;
      }
    }
    setCoins((prev) => Math.max(0, prev + amount));
  }, []);

  const spendCoin = useCallback(async (uploaderId: string): Promise<boolean> => {
    const revealCost = configRef.current.revealCost;
    const phone = phoneRef.current;
    if (phone) {
      const currentCoins = await fetchCoinsFromServer(phone);
      if (currentCoins === null || currentCoins < revealCost) return false;
      const newCoins = await updateCoinsOnServer(phone, -revealCost);
      if (newCoins !== null) {
        setCoins(newCoins);
        return true;
      }
      return false;
    }
    let success = false;
    setCoins((prev) => {
      if (prev < revealCost) { success = false; return prev; }
      success = true;
      return prev - revealCost;
    });
    return success;
  }, []);

  const isRevealed = useCallback((uploaderId: string): boolean => {
    return uploaderId in revealedMap;
  }, [revealedMap]);

  const getRevealedPhone = useCallback((uploaderId: string): string | null => {
    return revealedMap[uploaderId] ?? null;
  }, [revealedMap]);

  const cacheRevealedPhone = useCallback(async (uploaderId: string, phone: string): Promise<void> => {
    setRevealedMap((prev) => {
      const next = { ...prev, [uploaderId]: phone };
      AsyncStorage.setItem(REVEALED_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const freeSearchesRemaining = Math.max(0, appConfig.freeDailySearches - dailySearches);

  const spendSearch = useCallback(async (): Promise<{ allowed: boolean; usedFree: boolean }> => {
    const { freeDailySearches, searchCost } = configRef.current;
    const today = getTodayKey();
    const currentCount = searchDate === today ? dailySearches : 0;

    if (currentCount < freeDailySearches) {
      const newCount = currentCount + 1;
      setDailySearches(newCount);
      setSearchDate(today);
      await AsyncStorage.setItem(SEARCH_TRACKING_KEY, JSON.stringify({ date: today, count: newCount }));
      return { allowed: true, usedFree: true };
    }

    const phone = phoneRef.current;
    if (phone) {
      const currentCoins = await fetchCoinsFromServer(phone);
      if (currentCoins === null || currentCoins < searchCost) return { allowed: false, usedFree: false };
      const newCoins = await updateCoinsOnServer(phone, -searchCost);
      if (newCoins !== null) {
        setCoins(newCoins);
        const newCount = currentCount + 1;
        setDailySearches(newCount);
        setSearchDate(today);
        await AsyncStorage.setItem(SEARCH_TRACKING_KEY, JSON.stringify({ date: today, count: newCount }));
        return { allowed: true, usedFree: false };
      }
      return { allowed: false, usedFree: false };
    }

    let success = false;
    setCoins((prev) => {
      if (prev < searchCost) { success = false; return prev; }
      success = true;
      return prev - searchCost;
    });
    if (success) {
      const newCount = currentCount + 1;
      setDailySearches(newCount);
      setSearchDate(today);
      await AsyncStorage.setItem(SEARCH_TRACKING_KEY, JSON.stringify({ date: today, count: newCount }));
    }
    return { allowed: success, usedFree: false };
  }, [dailySearches, searchDate]);

  return (
    <CoinsContext.Provider value={{ coins, spendCoin, isRevealed, getRevealedPhone, cacheRevealedPhone, addCoins, freeSearchesRemaining, spendSearch, loaded, refreshCoins, appConfig }}>
      {children}
    </CoinsContext.Provider>
  );
}

export function useCoins() {
  const ctx = useContext(CoinsContext);
  if (!ctx) throw new Error("useCoins must be used within CoinsProvider");
  return ctx;
}
