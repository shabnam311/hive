// src/db.ts
// Unified IndexedDB data layer for ALL app data.
// Replaces scattered localStorage usage in Diary, Finance, Planner, Den.
// All stores go through this single module.

const DB_NAME = "hive_db";
const DB_VERSION = 2;

// Store names — one per feature
export const STORES = {
  diary: "diary",
  finance: "finance",
  planner: "planner",
  den: "den",
  library: "library",
  realm: "realm",
  settings: "settings",
} as const;

type StoreName = (typeof STORES)[keyof typeof STORES];

let _db: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (_db) return Promise.resolve(_db);

  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      for (const store of Object.values(STORES)) {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store, { keyPath: "id" });
        }
      }
    };

    req.onsuccess = (e) => {
      _db = (e.target as IDBOpenDBRequest).result;
      resolve(_db);
    };

    req.onerror = () => reject(req.error);
  });
}

// Generic CRUD

export async function dbGet<T>(store: StoreName, id: string): Promise<T | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).get(id);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

export async function dbGetAll<T>(store: StoreName): Promise<T[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result as T[]);
    req.onerror = () => reject(req.error);
  });
}

export async function dbPut<T extends { id: string }>(
  store: StoreName,
  item: T
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function dbDelete(store: StoreName, id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Export all data as a JSON blob — for user backup
export async function exportAllData(): Promise<string> {
  const all: Record<string, unknown[]> = {};
  for (const store of Object.values(STORES)) {
    all[store] = await dbGetAll(store);
  }
  return JSON.stringify(all, null, 2);
}

// Import data from a JSON backup
export async function importAllData(json: string): Promise<void> {
  const all = JSON.parse(json) as Record<string, Array<{ id: string }>>;
  for (const [store, items] of Object.entries(all)) {
    if (!Object.values(STORES).includes(store as StoreName)) continue;
    for (const item of items) {
      await dbPut(store as StoreName, item);
    }
  }
}

// Settings helpers (key-value, stored in settings store)
export async function getSetting<T>(key: string): Promise<T | undefined> {
  const row = await dbGet<{ id: string; value: T }>("settings", key);
  return row?.value;
}

export async function setSetting<T>(key: string, value: T): Promise<void> {
  await dbPut("settings", { id: key, value });
}
