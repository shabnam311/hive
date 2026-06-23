// use-db.ts — React hook for IndexedDB-backed state
import { useCallback, useEffect, useRef, useState } from "react";
import { dbGetAll, dbPut, getSetting, setSetting, STORES } from "@/lib/db";

type StoreName = (typeof STORES)[keyof typeof STORES];

export function useDBList<T extends { id: string }>(
  store: StoreName,
  localStorageKey: string,
): [T[], React.Dispatch<React.SetStateAction<T[]>>, boolean] {
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

  useEffect(() => {
    (async () => {
      const data = await dbGetAll<T>(store);
      if (data.length > 0) setItemsRaw(data as T[]);
      setLoaded(true);
      skipPersist.current = false;
    })();
  }, [store]);

  useEffect(() => {
    if (skipPersist.current) return;
    (async () => {
      try {
        const existingItems = await dbGetAll<T>(store);
        const currentIds = items.map(x => x.id);
        for (const ex of existingItems) {
          if (!currentIds.includes(ex.id)) {
            // Delete removed items
            const { dbDelete } = await import('@/lib/db');
            await dbDelete(store, ex.id);
          }
        }
        // Save/Update current items
        for (const item of items) {
          await dbPut(store, item);
        }
      } catch (err) {
        console.warn("Error syncing db", err);
      }
    })();
    localStorage.setItem(localStorageKey, JSON.stringify(items));
  }, [items, store, localStorageKey]);

  const setItems: React.Dispatch<React.SetStateAction<T[]>> = useCallback((action) => {
    setItemsRaw((prev) => {
      return typeof action === "function" ? (action as (prev: T[]) => T[])(prev) : action;
    });
  }, []);

  return [items, setItems, loaded];
}

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
      const data = await getSetting<T>(localStorageKey);
      if (data !== undefined) setValueRaw(data);
      setLoaded(true);
      skipPersist.current = false;
    })();
  }, [localStorageKey]);

  useEffect(() => {
    if (skipPersist.current) return;
    setSetting(localStorageKey, value).catch(console.warn);
    localStorage.setItem(localStorageKey, JSON.stringify(value));
  }, [value, localStorageKey]);

  const setValue: React.Dispatch<React.SetStateAction<T>> = useCallback((action) => {
    setValueRaw((prev) => {
      return typeof action === "function" ? (action as (prev: T) => T)(prev) : action;
    });
  }, []);

  return [value, setValue, loaded];
}