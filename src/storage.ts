import type { Take } from './types';

export type StorageScope = 'real' | 'demo';

export const REAL_DB_NAME = 'rhythm-pedal-tidy';
export const DEMO_DB_NAME = 'demo:rhythm-pedal-tidy';
const STORE = 'takes';

function openDb(dbName: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export interface TakeStorage {
  clearAllTakes(): Promise<void>;
  deleteTake(id: string): Promise<void>;
  listTakes(): Promise<Take[]>;
  replaceAllTakes(takes: Take[]): Promise<void>;
  saveTake(take: Take): Promise<void>;
}

/**
 * Real and demo takes deliberately use different IndexedDB database names.
 * The demo never reads or writes a musician's real take shelf.
 */
export function createTakeStorage(scope: StorageScope): TakeStorage {
  const dbName = scope === 'demo' ? DEMO_DB_NAME : REAL_DB_NAME;

  return {
    async saveTake(take: Take): Promise<void> {
      const db = await openDb(dbName);
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(STORE, 'readwrite');
        transaction.objectStore(STORE).put(take);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
      db.close();
    },

    async listTakes(): Promise<Take[]> {
      const db = await openDb(dbName);
      const records = await new Promise<Take[]>((resolve, reject) => {
        const request = db.transaction(STORE).objectStore(STORE).getAll();
        request.onsuccess = () => resolve(request.result as Take[]);
        request.onerror = () => reject(request.error);
      });
      db.close();
      return records.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    async deleteTake(id: string): Promise<void> {
      const db = await openDb(dbName);
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(STORE, 'readwrite');
        transaction.objectStore(STORE).delete(id);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
      db.close();
    },

    async replaceAllTakes(takes: Take[]): Promise<void> {
      const db = await openDb(dbName);
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(STORE, 'readwrite');
        const store = transaction.objectStore(STORE);
        store.clear();
        for (const take of takes) store.put(take);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
      db.close();
    },

    async clearAllTakes(): Promise<void> {
      const db = await openDb(dbName);
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(STORE, 'readwrite');
        transaction.objectStore(STORE).clear();
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
      db.close();
    }
  };
}
