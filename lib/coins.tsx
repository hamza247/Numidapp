import React, { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApiUrl } from "@/lib/query-client";
import { fetch } from "expo/fetch";

const PHONE_KEY = "user_phone";
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
  refreshCoins: (phone?: string | null) => Promise<void>;
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

export function CoinsProvider({ children }: { children: ReactNode }) {
  const [coins, setCoins] = useState(INITIAL_COINS);
  const [userPhone, setUserPhone] = useState<string | null>(null);
  const [revealedMap, setRevealedMap] = useState<Record<string, string>>({});
  const [dailySearches, setDailySearches] = useState(0);
  const [searchDate, setSearchDate] = useState("");
  const [loaded, setLoaded] = useState(false);
  const phoneRef = useRef<string | null>(null);

  function getTodayKey(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  useEffect(() => {
    initLoad();
  }, []);

  async function initLoad() {
    const [phone, storedRevealed, storedSearch] = await Promise.all([
      AsyncStorage.getItem(PHONE_KEY),
      AsyncStorage.getItem(REVEALED_KEY),
      AsyncStorage.getItem(SEARCH_TRACKING_KEY),
    ]);

    phoneRef.current = phone;
    setUserPhone(phone);

    if (phone) {
      const serverCoins = await fetchCoinsFromServer(phone);
      setCoins(serverCoins !== null ? serverCoins : INITIAL_COINS);
    } else {
      setCoins(INITIAL_COINS);
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
    if (resolvedPhone) {
      const serverCoins = await fetchCoinsFromServer(resolvedPhone);
      if (serverCoins !== null) setCoins(serverCoins);
    } else {
      setCoins(INITIAL_COINS);
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
    const phone = phoneRef.current;
    if (phone) {
      const currentCoins = await fetchCoinsFromServer(phone);
      if (currentCoins === null || currentCoins < REVEAL_COST) return false;
      const newCoins = await updateCoinsOnServer(phone, -REVEAL_COST);
      if (newCoins !== null) {
        setCoins(newCoins);
        return true;
      }
      return false;
    }
    let success = false;
    setCoins((prev) => {
      if (prev < REVEAL_COST) { success = false; return prev; }
      success = true;
      return prev - REVEAL_COST;
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

  const freeSearchesRemaining = Math.max(0, FREE_DAILY_SEARCHES - dailySearches);

  const spendSearch = useCallback(async (): Promise<{ allowed: boolean; usedFree: boolean }> => {
    const today = getTodayKey();
    const currentCount = searchDate === today ? dailySearches : 0;

    if (currentCount < FREE_DAILY_SEARCHES) {
      const newCount = currentCount + 1;
      setDailySearches(newCount);
      setSearchDate(today);
      await AsyncStorage.setItem(SEARCH_TRACKING_KEY, JSON.stringify({ date: today, count: newCount }));
      return { allowed: true, usedFree: true };
    }

    const phone = phoneRef.current;
    if (phone) {
      const currentCoins = await fetchCoinsFromServer(phone);
      if (currentCoins === null || currentCoins < SEARCH_COST) return { allowed: false, usedFree: false };
      const newCoins = await updateCoinsOnServer(phone, -SEARCH_COST);
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
      if (prev < SEARCH_COST) { success = false; return prev; }
      success = true;
      return prev - SEARCH_COST;
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
    <CoinsContext.Provider value={{ coins, spendCoin, isRevealed, getRevealedPhone, cacheRevealedPhone, addCoins, freeSearchesRemaining, spendSearch, loaded, refreshCoins }}>
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
