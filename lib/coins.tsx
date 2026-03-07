import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const COINS_KEY = "user_coins";
const REVEALED_KEY = "revealed_numbers";
const INITIAL_COINS = 5;
const REVEAL_COST = 1;

interface CoinsContextValue {
  coins: number;
  spendCoin: (uploaderId: string) => Promise<boolean>;
  isRevealed: (uploaderId: string) => boolean;
  getRevealedPhone: (uploaderId: string) => string | null;
  cacheRevealedPhone: (uploaderId: string, phone: string) => Promise<void>;
  addCoins: (amount: number) => Promise<void>;
  loaded: boolean;
}

const CoinsContext = createContext<CoinsContextValue | null>(null);

export function CoinsProvider({ children }: { children: ReactNode }) {
  const [coins, setCoins] = useState(INITIAL_COINS);
  const [revealedMap, setRevealedMap] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadState();
  }, []);

  async function loadState() {
    const [storedCoins, storedRevealed] = await Promise.all([
      AsyncStorage.getItem(COINS_KEY),
      AsyncStorage.getItem(REVEALED_KEY),
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

  return (
    <CoinsContext.Provider value={{ coins, spendCoin, isRevealed, getRevealedPhone, cacheRevealedPhone, addCoins, loaded }}>
      {children}
    </CoinsContext.Provider>
  );
}

export function useCoins() {
  const ctx = useContext(CoinsContext);
  if (!ctx) throw new Error("useCoins must be used within CoinsProvider");
  return ctx;
}

export { REVEAL_COST };
