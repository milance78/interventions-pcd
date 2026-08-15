import type { Intervention } from "../redux/features/newInterventionSlice";

const HISTORY_CACHE_VERSION = 2;
const HISTORY_CACHE_PREFIX = "interventions-pcd:history-cache";
const DB_NAME = "interventions-pcd-cache";
const DB_VERSION = 1;
const STORE_NAME = "history";

type HistoryCache = {
  version: number;
  savedAt: string;
  interventions: Intervention[];
  dateKeys: string[];
};

const cacheKey = (userId: string) => `${HISTORY_CACHE_PREFIX}:${userId}`;

const openCacheDatabase = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const loadFromIndexedDb = async (userId: string): Promise<HistoryCache | null> => {
  const database = await openCacheDatabase();

  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readonly");
      const request = transaction.objectStore(STORE_NAME).get(userId);

      request.onsuccess = () => resolve((request.result as HistoryCache | undefined) ?? null);
      request.onerror = () => reject(request.error);
    });
  } finally {
    database.close();
  }
};

const saveToIndexedDb = async (userId: string, payload: HistoryCache): Promise<void> => {
  const database = await openCacheDatabase();

  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).put(payload, userId);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally {
    database.close();
  }
};

const parseLegacyLocalStorageCache = (userId: string): HistoryCache | null => {
  try {
    const raw = window.localStorage.getItem(cacheKey(userId));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<HistoryCache>;
    if (!Array.isArray(parsed.interventions)) return null;

    const dateKeys = Array.from(
      new Set(
        parsed.interventions
          .map((item) => item.dateKey)
          .filter((value): value is string => Boolean(value)),
      ),
    ).sort((a, b) => b.localeCompare(a));

    return {
      version: HISTORY_CACHE_VERSION,
      savedAt: parsed.savedAt ?? new Date(0).toISOString(),
      interventions: parsed.interventions,
      dateKeys,
    };
  } catch {
    return null;
  }
};

export const loadHistoryCache = async (userId: string): Promise<HistoryCache | null> => {
  try {
    const indexedCache = await loadFromIndexedDb(userId);
    if (
      indexedCache?.version === HISTORY_CACHE_VERSION &&
      Array.isArray(indexedCache.interventions) &&
      Array.isArray(indexedCache.dateKeys)
    ) {
      return indexedCache;
    }
  } catch {
    // Fall through to the old localStorage cache.
  }

  const legacyCache = parseLegacyLocalStorageCache(userId);
  if (legacyCache) {
    void saveToIndexedDb(userId, legacyCache).catch(() => undefined);
  }

  return legacyCache;
};

export const saveHistoryCache = async (
  userId: string,
  interventions: Intervention[],
  dateKeys: string[],
): Promise<void> => {
  const payload: HistoryCache = {
    version: HISTORY_CACHE_VERSION,
    savedAt: new Date().toISOString(),
    interventions,
    dateKeys,
  };

  try {
    await saveToIndexedDb(userId, payload);
    // Remove the potentially very large synchronous localStorage copy.
    window.localStorage.removeItem(cacheKey(userId));
  } catch {
    // Redux/Firebase remain the source of truth when browser storage is unavailable.
  }
};
