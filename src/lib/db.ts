const DB_NAME = "hive-db";
const DB_VERSION = 2;

const STORES = {
  subjects: "subjects",
  semesters: "semesters",
  timer: "timer",
  settings: "settings",
  diary: "diary",
  finance: "finance",
  planner: "planner",
} as const;

let dbInstance: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      Object.values(STORES).forEach((name) => {
        if (!db.objectStoreNames.contains(name)) {
          if (name === "subjects" || name === "semesters") {
            db.createObjectStore(name, { keyPath: "id" });
          } else {
            db.createObjectStore(name);
          }
        }
      });
    };
    req.onsuccess = () => { dbInstance = req.result; resolve(dbInstance); };
    req.onerror = () => reject(req.error);
  });
}

async function getAll<T>(storeName: string): Promise<T[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const req = tx.objectStore(storeName).getAll();
    req.onsuccess = () => resolve(req.result as T[]);
    req.onerror = () => reject(req.error);
  });
}

async function putItem<T>(storeName: string, item: T, key?: IDBValidKey): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const req = key !== undefined
      ? tx.objectStore(storeName).put(item, key)
      : tx.objectStore(storeName).put(item);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function putAll<T>(storeName: string, items: T[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
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
    const req = tx.objectStore(storeName).delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function getValue<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const req = tx.objectStore(storeName).get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

export const db = {
  subjects: {
    getAll: () => getAll<any>(STORES.subjects),
    put: (item: any) => putItem(STORES.subjects, item),
    putAll: (items: any[]) => putAll(STORES.subjects, items),
    delete: (id: string) => deleteItem(STORES.subjects, id),
  },
  semesters: {
    getAll: () => getAll<any>(STORES.semesters),
    put: (item: any) => putItem(STORES.semesters, item),
    putAll: (items: any[]) => putAll(STORES.semesters, items),
    delete: (id: string) => deleteItem(STORES.semesters, id),
  },
  timer: {
    get: () => getValue<any>(STORES.timer, "state"),
    put: (state: any) => putItem(STORES.timer, state, "state"),
  },
  settings: {
    get: (key: string) => getValue<any>(STORES.settings, key),
    put: (key: string, value: any) => putItem(STORES.settings, value, key),
  },
  diary: {
    get: (date: string) => getValue<any>(STORES.diary, date),
    put: (date: string, entry: any) => putItem(STORES.diary, entry, date),
    getAll: () => getAll<any>(STORES.diary),
    delete: (date: string) => deleteItem(STORES.diary, date),
  },
  finance: {
    get: () => getValue<any>(STORES.finance, "data"),
    put: (data: any) => putItem(STORES.finance, data, "data"),
  },
  planner: {
    get: () => getValue<any>(STORES.planner, "tasks"),
    put: (tasks: any) => putItem(STORES.planner, tasks, "tasks"),
  },

  async exportAll(): Promise<string> {
    const [subjects, semesters, diary, finance, planner] = await Promise.all([
      getAll(STORES.subjects),
      getAll(STORES.semesters),
      getAll(STORES.diary),
      getValue(STORES.finance, "data"),
      getValue(STORES.planner, "tasks"),
    ]);
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      version: DB_VERSION,
      subjects,
      semesters,
      diary,
      finance,
      planner,
    }, null, 2);
  },

  async migrateFromLocalStorage(): Promise<boolean> {
    try {
      const migrated = await this.settings.get("migrated_v2");
      if (migrated) return false;

      const subjectsRaw = localStorage.getItem("hive.realm.v4");
      if (subjectsRaw) {
        try { const s = JSON.parse(subjectsRaw); if (Array.isArray(s)) await this.subjects.putAll(s); } catch {}
      }
      const groupsRaw = localStorage.getItem("hive.realm.groups");
      if (groupsRaw) {
        try { const g = JSON.parse(groupsRaw); if (Array.isArray(g)) await this.semesters.putAll(g); } catch {}
      }
      const timerRaw = localStorage.getItem("hive.realm.timer");
      if (timerRaw) {
        try { await this.timer.put(JSON.parse(timerRaw)); } catch {}
      }
      const diaryRaw = localStorage.getItem("hive.diary.v1");
      if (diaryRaw) {
        try {
          const entries = JSON.parse(diaryRaw);
          for (const [date, entry] of Object.entries(entries)) {
            await this.diary.put(date, entry);
          }
        } catch {}
      }
      const finRaw = localStorage.getItem("hive.fin.tx");
      if (finRaw) {
        try {
          const tx = JSON.parse(finRaw);
          const chai = JSON.parse(localStorage.getItem("hive.fin.chai") ?? "0");
          await this.finance.put({ tx, chai });
        } catch {}
      }
      const plannerRaw = localStorage.getItem("hive.planner.v2");
      if (plannerRaw) {
        try { await this.planner.put(JSON.parse(plannerRaw)); } catch {}
      }

      await this.settings.put("migrated_v2", true);
      return true;
    } catch (e) {
      console.warn("[HIVE DB] Migration failed:", e);
      return false;
    }
  },
};