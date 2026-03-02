import { localDB, StoreName } from './localDB';

type Callback = (data: Record<string, unknown>[]) => void;

const subscribers: Record<string, Callback[]> = {};
let fileHandle: FileSystemFileHandle | null = null;

/** Filtra propiedades undefined de un objeto para evitar sobrescrituras accidentales */
function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    if (obj[key] !== undefined) {
      result[key] = obj[key];
    }
  }
  return result as Partial<T>;
}

const verifyPermission = async (handle: FileSystemFileHandle) => {
  if ((await handle.queryPermission({ mode: 'readwrite' })) === 'granted') return true;
  if ((await handle.requestPermission({ mode: 'readwrite' })) === 'granted') return true;
  return false;
};

export const storage = {
  init: async () => {
    await localDB.init();
    console.log('ReparaPro Master — Motor local inicializado.');
  },

  linkNetworkFile: async (): Promise<boolean> => {
    try {
      const [handle] = await window.showOpenFilePicker({
        types: [
          {
            description: 'Archivo de Red ReparaPro (.json)',
            accept: { 'application/json': ['.json'] },
          },
        ],
        multiple: false,
      });
      fileHandle = handle;
      await storage.pullFromNetwork();
      return true;
    } catch (e) {
      console.error('Error vinculando archivo maestro:', e);
      return false;
    }
  },

  pushToNetwork: async (): Promise<void> => {
    if (!fileHandle) return;
    try {
      if (!(await verifyPermission(fileHandle))) return;
      const repairs = await localDB.getAll('repairs');
      const budgets = await localDB.getAll('budgets');
      const settings = await localDB.getAll('settings');

      const data = JSON.stringify(
        { repairs, budgets, settings, timestamp: Date.now(), lastSync: new Date().toISOString() },
        null,
        2
      );

      const writable = await (fileHandle as any).createWritable();
      await writable.write(data);
      await writable.close();
      console.log('💾 Sincronización LAN exitosa.');
    } catch (e) {
      console.error('Error escribiendo en red local:', e);
    }
  },

  pullFromNetwork: async (): Promise<void> => {
    if (!fileHandle) return;
    try {
      const file = await fileHandle.getFile();
      const text = await file.text();
      if (!text) return;

      const data = JSON.parse(text);
      if (data.repairs) {
        for (const r of data.repairs) await localDB.put('repairs', r);
        subscribers['repairs']?.forEach((cb) => cb(data.repairs));
      }
      if (data.budgets) {
        for (const b of data.budgets) await localDB.put('budgets', b);
        subscribers['budgets']?.forEach((cb) => cb(data.budgets));
      }
      if (data.settings?.[0]) {
        await localDB.put('settings', data.settings[0]);
        subscribers['settings']?.forEach((cb) => cb([data.settings[0]]));
      }
      console.log('📥 Datos importados desde Red Local.');
    } catch (e) {
      console.error('Error leyendo archivo de red:', e);
    }
  },

  subscribe: (colName: StoreName, callback: Callback): (() => void) => {
    if (!subscribers[colName]) subscribers[colName] = [];
    subscribers[colName].push(callback);
    localDB
      .getAll(colName)
      .then((data) => callback(data))
      .catch(() => callback([]));

    return () => {
      subscribers[colName] = subscribers[colName].filter((cb) => cb !== callback);
    };
  },

  save: async (colName: StoreName, id: string, data: Record<string, unknown>): Promise<void> => {
    const updatedAt = new Date().toISOString();
    const existing = await localDB.getAll(colName).then((all) => all.find((x: any) => x.id === id));
    const cleanData = stripUndefined(data);
    const fullData = { ...existing, ...cleanData, id, updatedAt };

    await localDB.put(colName, fullData);

    const newData = await localDB.getAll(colName);
    subscribers[colName]?.forEach((cb) => cb(newData));

    if (fileHandle) await storage.pushToNetwork();
  },

  remove: async (colName: StoreName, id: string): Promise<void> => {
    await localDB.delete(colName, id);
    const newData = await localDB.getAll(colName);
    subscribers[colName]?.forEach((cb) => cb(newData));
    if (fileHandle) await storage.pushToNetwork();
  },

  exportData: async (): Promise<string> => {
    const repairs = await localDB.getAll('repairs');
    const budgets = await localDB.getAll('budgets');
    const settings = await localDB.getAll('settings');
    return JSON.stringify(
      { repairs, budgets, settings, exportDate: new Date().toISOString() },
      null,
      2
    );
  },
};
