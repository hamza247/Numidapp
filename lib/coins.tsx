import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const COINS_KEY = "user_coins";
const REVEALED_KEY = "revealed_numbers";
const SEARCH_TRACKING_KEY = "daily_search_tracking";
const INITIAL_COINS = 5;
const REVEAL_COST = 1;
const SEARCH_COST = 1;
const FREE_DAILY_SEARCHES = 5;

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
}

const CoinsContext = createContext<CoinsContextValue | null>(null);

export function CoinsProvider({ children }: { children: ReactNode }) {
  const [coins, setCoins] = useState(INITIAL_COINS);
  const [revealedMap, setRevealedMap] = useState<Record<string, string>>({});
  const [dailySearches, setDailySearches] = useState(0);
  const [searchDate, setSearchDate] = useState("");
  const [loaded, setLoaded] = useState(false);

  function getTodayKey(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  useEffect(() => {
    loadState();
  }, []);

  async function loadState() {
    const [storedCoins, storedRevealed, storedSearch] = await Promise.all([
      AsyncStorage.getItem(COINS_KEY),
      AsyncStorage.getItem(REVEALED_KEY),
      AsyncStorage.getItem(SEARCH_TRACKING_KEY),
    ]);
    if (storedCoins !== null) {
      const parsed = parseInt(storedCoins, 10);
      if (!isNaN(parsed) && parsed >= 0) {
        setCoins(parsed);
      }
    } else {
      await AsyncStorage.setItem(COINS_KEY, String(INITIAL_COINS));
    }
    if (storedRevealed) {
      try {
        const obj = JSON.parse(storedRevealed);
        if (obj && typeof obj === "object") {
          setRevealedMap(obj);
        }
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

  const spendCoin = useCallback(async (uploaderId: string): Promise<boolean> => {
    let success = false;
    setCoins((prev) => {
      if (prev < REVEAL_COST) {
        success = false;
        return prev;
      }
      success = true;
      return prev - REVEAL_COST;
    });
    await new Promise((r) => setTimeout(r, 0));
    if (success) {
      const newCoins = await AsyncStorage.getItem(COINS_KEY);
      const current = newCoins ? parseInt(newCoins, 10) : INITIAL_COINS;
      const updated = Math.max(0, current - REVEAL_COST);
      await AsyncStorage.setItem(COINS_KEY, String(updated));
    }
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

  const addCoins = useCallback(async (amount: number): Promise<void> => {
    setCoins((prev) => {
      const next = prev + amount;
      AsyncStorage.setItem(COINS_KEY, String(next));
      return next;
    });
  }, []);

  const freeSearchesRemaining = Math.max(0, FREE_DAILY_SEARCHES - dailySearches);

  const spendSearch = useCallback(async (): Promise<{ allowed: boolean; usedFree: boolean }> => {
    const today = getTodayKey();
    let currentCount = searchDate === today ? dailySearches : 0;

    if (currentCount < FREE_DAILY_SEARCHES) {
      const newCount = currentCount + 1;
      setDailySearches(newCount);
      setSearchDate(today);
      await AsyncStorage.setItem(SEARCH_TRACKING_KEY, JSON.stringify({ date: today, count: newCount }));
      return { allowed: true, usedFree: true };
    }

    let success = false;
    setCoins((prev) => {
      if (prev < SEARCH_COST) {
        success = false;
        return prev;
      }
      success = true;
      return prev - SEARCH_COST;
    });
    await new Promise((r) => setTimeout(r, 0));
    if (success) {
      const storedCoins = await AsyncStorage.getItem(COINS_KEY);
      const current = storedCoins ? parseInt(storedCoins, 10) : INITIAL_COINS;
      const updated = Math.max(0, current - SEARCH_COST);
      await AsyncStorage.setItem(COINS_KEY, String(updated));
      const newCount = currentCount + 1;
      setDailySearches(newCount);
      setSearchDate(today);
      await AsyncStorage.setItem(SEARCH_TRACKING_KEY, JSON.stringify({ date: today, count: newCount }));
    }
    return { allowed: success, usedFree: false };
  }, [dailySearches, searchDate]);

  return (
    <CoinsContext.Provider value={{ coins, spendCoin, isRevealed, getRevealedPhone, cacheRevealedPhone, addCoins, freeSearchesRemaining, spendSearch, loaded }}>
      {children}
    </CoinsContext.Provider>
  );
}

export function useCoins() {
  const ctx = useContext(CoinsContext);
  if (!ctx) throw new Error("useCoins must be used within CoinsProvider");
  return ctx;
}

export { REVEAL_COST, SEARCH_COST, FREE_DAILY_SEARCHES };
