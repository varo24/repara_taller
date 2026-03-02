
/**
 * LocalDB - Motor de persistencia basado en IndexedDB
 */

const DB_NAME = 'ReparaPro_LocalDB';
const DB_VERSION = 4; // Incrementado tras eliminar invoices

export class LocalDB {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('repairs')) {
          db.createObjectStore('repairs', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('budgets')) {
          db.createObjectStore('budgets', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'id' });
        }
        // Eliminado invoices de aquí
      };

      request.onsuccess = (event: any) => {
        this.db = event.target.result;
        resolve();
      };

      request.onerror = (event: any) => {
        reject("Error abriendo IndexedDB");
      };
    });
  }

  async getAll(storeName: string): Promise<any[]> {
    return new Promise((resolve) => {
      if (!this.db) return resolve([]);
      try {
        const transaction = this.db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve([]);
      } catch (e) {
        resolve([]);
      }
    });
  }

  async put(storeName: string, data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject("DB no inicializada");
      try {
        const transaction = this.db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        store.put(data);
        transaction.oncomplete = () => resolve();
        transaction.onerror = (e) => reject(e);
      } catch (e) {
        reject(e);
      }
    });
  }

  async delete(storeName: string, id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject("DB no inicializada");
      try {
        const transaction = this.db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        store.delete(id);
        transaction.oncomplete = () => resolve();
        transaction.onerror = (e) => reject(e);
      } catch (e) {
        reject(e);
      }
    });
  }
}

export const localDB = new LocalDB();
