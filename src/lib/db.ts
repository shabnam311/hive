// db.ts — IndexedDB persistence layer for HIVE
// Stores: subjects, semesters, timer, settings
// Auto-migrates from localStorage on first load

const DB_NAME = "hive-db";
const DB_VERSION = 1;

const STORES = {
  subjects: "subjects",
  semesters: "semesters",
  timer: "timer",
  settings: "settings",
} as const;

let dbInstance: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORES.subjects)) {
        db.createObjectStore(STORES.subjects, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORES.semesters)) {
        db.createObjectStore(STORES.semesters, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORES.timer)) {
        db.createObjectStore(STORES.timer);
      }
      if (!db.objectStoreNames.contains(STORES.settings)) {
        db.createObjectStore(STORES.settings);
      }
    };

    req.onsuccess = () => {
      dbInstance = req.result;
      resolve(dbInstance);
    };

    req.onerror = () => reject(req.error);
  });
}

// ─── Generic operations ───────────────────────────────────────────────────────

async function getAll<T>(storeName: string): Promise<T[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result as T[]);
    req.onerror = () => reject(req.error);
  });
}

async function putItem<T>(storeName: string, item: T, key?: IDBValidKey): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const req = key !== undefined ? store.put(item, key) : store.put(item);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function putAll<T>(storeName: string, items: T[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    // Clear existing and write all
    store.clear();
    items.forEach((item) => store.put(item));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function deleteItem(storeName: string, key: IDBValidKey): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const req = store.delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function getValue<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

// ─── Typed API ────────────────────────────────────────────────────────────────

export const db = {
  // Subjects
  subjects: {
    getAll: () => getAll<any>(STORES.subjects),
    put: (subject: any) => putItem(STORES.subjects, subject),
    putAll: (subjects: any[]) => putAll(STORES.subjects, subjects),
    delete: (id: string) => deleteItem(STORES.subjects, id),
  },

  // Semesters (groups)
  semesters: {
    getAll: () => getAll<any>(STORES.semesters),
    put: (semester: any) => putItem(STORES.semesters, semester),
    putAll: (semesters: any[]) => putAll(STORES.semesters, semesters),
    delete: (id: string) => deleteItem(STORES.semesters, id),
  },

  // Timer state (single record)
  timer: {
    get: () => getValue<any>(STORES.timer, "state"),
    put: (state: any) => putItem(STORES.timer, state, "state"),
  },

  // Settings
  settings: {
    get: (key: string) => getValue<any>(STORES.settings, key),
    put: (key: string, value: any) => putItem(STORES.settings, value, key),
  },

  // Migration from localStorage
  async migrateFromLocalStorage(): Promise<boolean> {
    try {
      const migrated = await this.settings.get("migrated_v1");
      if (migrated) return false;

      // Migrate subjects
      const subjectsRaw = localStorage.getItem("hive.realm.v4");
      if (subjectsRaw) {
        try {
          const subjects = JSON.parse(subjectsRaw);
          if (Array.isArray(subjects) && subjects.length > 0) {
            await this.subjects.putAll(subjects);
          }
        } catch {}
      }

      // Migrate groups → semesters
      const groupsRaw = localStorage.getItem("hive.realm.groups");
      if (groupsRaw) {
        try {
          const groups = JSON.parse(groupsRaw);
          if (Array.isArray(groups) && groups.length > 0) {
            await this.semesters.putAll(groups);
          }
        } catch {}
      }

      // Migrate timer
      const timerRaw = localStorage.getItem("hive.realm.timer");
      if (timerRaw) {
        try {
          const timer = JSON.parse(timerRaw);
          await this.timer.put(timer);
        } catch {}
      }

      await this.settings.put("migrated_v1", true);
      return true;
    } catch (e) {
      console.warn("[HIVE DB] Migration failed:", e);
      return false;
    }
  },
};
