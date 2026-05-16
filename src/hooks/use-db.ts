// useDB.ts — React hook for IndexedDB-backed state
// Drop-in replacement for useLocalStorage with IndexedDB persistence

import { useCallback, useEffect, useRef, useState } from "react";
import { db } from "@/lib/db";

type Store = "subjects" | "semesters";

/**
 * Hook for array-based stores (subjects, semesters).
 * Loads from IndexedDB on mount, persists every mutation.
 * Falls back to localStorage during initial load.
 */
export function useDBList<T extends { id: string }>(
  store: Store,
  localStorageKey: string,
): [T[], React.Dispatch<React.SetStateAction<T[]>>, boolean] {
  // Initial state from localStorage for instant render
  const [items, setItemsRaw] = useState<T[]>(() => {
    try {
      const raw = localStorage.getItem(localStorageKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [loaded, setLoaded] = useState(false);
  const skipPersist = useRef(true);

  // Load from IndexedDB on mount
  useEffect(() => {
    (async () => {
      await db.migrateFromLocalStorage();
      const storeApi = store === "subjects" ? db.subjects : db.semesters;
      const data = await storeApi.getAll();
      if (data.length > 0) {
        setItemsRaw(data as T[]);
      }
      setLoaded(true);
      skipPersist.current = false;
    })();
  }, [store]);

  // Persist to IndexedDB on changes (skip initial load)
  useEffect(() => {
    if (skipPersist.current) return;
    const storeApi = store === "subjects" ? db.subjects : db.semesters;
    storeApi.putAll(items).catch(console.warn);
    // Also keep localStorage as fallback
    localStorage.setItem(localStorageKey, JSON.stringify(items));
  }, [items, store, localStorageKey]);

  const setItems: React.Dispatch<React.SetStateAction<T[]>> = useCallback((action) => {
    setItemsRaw((prev) => {
      const next = typeof action === "function" ? (action as (prev: T[]) => T[])(prev) : action;
      return next;
    });
  }, []);

  return [items, setItems, loaded];
}

/**
 * Hook for single-value stores (timer state).
 * Loads from IndexedDB, falls back to localStorage.
 */
export function useDBValue<T>(
  localStorageKey: string,
  defaultValue: T,
): [T, React.Dispatch<React.SetStateAction<T>>, boolean] {
  const [value, setValueRaw] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(localStorageKey);
      return raw ? JSON.parse(raw) : defaultValue;
    } catch {
      return defaultValue;
    }
  });
  const [loaded, setLoaded] = useState(false);
  const skipPersist = useRef(true);

  useEffect(() => {
    (async () => {
      await db.migrateFromLocalStorage();
      const data = await db.timer.get();
      if (data) setValueRaw(data as T);
      setLoaded(true);
      skipPersist.current = false;
    })();
  }, []);

  useEffect(() => {
    if (skipPersist.current) return;
    db.timer.put(value).catch(console.warn);
    localStorage.setItem(localStorageKey, JSON.stringify(value));
  }, [value, localStorageKey]);

  const setValue: React.Dispatch<React.SetStateAction<T>> = useCallback((action) => {
    setValueRaw((prev) => {
      const next = typeof action === "function" ? (action as (prev: T) => T)(prev) : action;
      return next;
    });
  }, []);

  return [value, setValue, loaded];
}
