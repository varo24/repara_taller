/**
 * LocalDB — Motor de persistencia basado en IndexedDB
 */

const DB_NAME = 'ReparaPro_LocalDB';
const DB_VERSION = 5;

const STORES = ['repairs', 'budgets', 'settings'] as const;
export type StoreName = (typeof STORES)[number];

export class LocalDB {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        for (const name of STORES) {
          if (!db.objectStoreNames.contains(name)) {
            db.createObjectStore(name, { keyPath: 'id' });
          }
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Error abriendo IndexedDB'));
      };
    });
  }

  async getAll<T extends { id: string }>(storeName: StoreName): Promise<T[]> {
    return new Promise((resolve) => {
      if (!this.db) return resolve([]);
      try {
        const tx = this.db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result as T[]);
        request.onerror = () => resolve([]);
      } catch {
        resolve([]);
      }
    });
  }

  async put<T extends { id: string }>(storeName: StoreName, data: T): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('DB no inicializada'));
      try {
        const tx = this.db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        store.put(data);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(new Error(`Error escribiendo en ${storeName}`));
      } catch (e) {
        reject(e);
      }
    });
  }

  async delete(storeName: StoreName, id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('DB no inicializada'));
      try {
        const tx = this.db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        store.delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(new Error(`Error eliminando de ${storeName}`));
      } catch (e) {
        reject(e);
      }
    });
  }
}

export const localDB = new LocalDB();
