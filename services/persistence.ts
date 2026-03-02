import { localDB } from "./localDB";

type Callback = (data: any[]) => void;
const subscribers: Record<string, Callback[]> = {};
let fileHandle: any = null;

// Intentar recuperar el permiso del archivo al recargar
const verifyPermission = async (handle: any) => {
  if (await handle.queryPermission({ mode: 'readwrite' }) === 'granted') return true;
  if (await handle.requestPermission({ mode: 'readwrite' }) === 'granted') return true;
  return false;
};

export const storage = {
  init: async () => {
    await localDB.init();
    console.log("Sistema de Gestión ReparaPro Master Inicializado.");
  },

  linkNetworkFile: async () => {
    try {
      // @ts-ignore
      const [handle] = await window.showOpenFilePicker({
        types: [{ description: 'Archivo de Red ReparaPro (.json)', accept: { 'application/json': ['.json'] } }],
        multiple: false
      });
      fileHandle = handle;
      await storage.pullFromNetwork();
      return true;
    } catch (e) {
      console.error("Error vinculando archivo maestro:", e);
      return false;
    }
  },

  pushToNetwork: async () => {
    if (!fileHandle) return;
    try {
      if (!(await verifyPermission(fileHandle))) return;
      const repairs = await localDB.getAll('repairs');
      const budgets = await localDB.getAll('budgets');
      const settings = await localDB.getAll('settings');
      
      const data = JSON.stringify({ 
        repairs, 
        budgets, 
        settings, 
        timestamp: Date.now(),
        lastSync: new Date().toISOString() 
      }, null, 2);
      
      const writable = await fileHandle.createWritable();
      await writable.write(data);
      await writable.close();
      console.log("💾 Sincronización LAN Exitosa.");
    } catch (e) {
      console.error("Error escribiendo en red local:", e);
    }
  },

  pullFromNetwork: async () => {
    if (!fileHandle) return;
    try {
      const file = await fileHandle.getFile();
      const text = await file.text();
      if (!text) return;
      
      const data = JSON.parse(text);
      if (data.repairs) {
        for (const r of data.repairs) await localDB.put('repairs', r);
        if (subscribers['repairs']) subscribers['repairs'].forEach(cb => cb(data.repairs));
      }
      if (data.budgets) {
        for (const b of data.budgets) await localDB.put('budgets', b);
        if (subscribers['budgets']) subscribers['budgets'].forEach(cb => cb(data.budgets));
      }
      if (data.settings && data.settings[0]) {
        await localDB.put('settings', data.settings[0]);
        if (subscribers['settings']) subscribers['settings'].forEach(cb => cb([data.settings[0]]));
      }
      console.log("📥 Datos importados desde Red Local.");
    } catch (e) {
      console.error("Error leyendo archivo de red:", e);
    }
  },

  subscribe: (colName: string, callback: Callback) => {
    if (!subscribers[colName]) subscribers[colName] = [];
    subscribers[colName].push(callback);
    localDB.getAll(colName).then(data => callback(data)).catch(() => callback([]));
    return () => {
      subscribers[colName] = subscribers[colName].filter(cb => cb !== callback);
    };
  },

  save: async (colName: string, id: string, data: any) => {
    const updatedAt = new Date().toISOString();
    const existing = await localDB.getAll(colName).then(all => all.find(x => x.id === id));
    const fullData = { ...existing, ...data, id, updatedAt };
    
    await localDB.put(colName, fullData);
    
    // Notificar UI de forma inmediata
    const newData = await localDB.getAll(colName);
    if (subscribers[colName]) subscribers[colName].forEach(cb => cb(newData));
    
    // Sincronizar archivo de red si existe
    if (fileHandle) storage.pushToNetwork();
  },

  remove: async (colName: string, id: string) => {
    await localDB.delete(colName, id);
    const newData = await localDB.getAll(colName);
    if (subscribers[colName]) subscribers[colName].forEach(cb => cb(newData));
    if (fileHandle) storage.pushToNetwork();
  },

  exportData: async () => {
    const repairs = await localDB.getAll('repairs');
    const budgets = await localDB.getAll('budgets');
    const settings = await localDB.getAll('settings');
    return JSON.stringify({ 
      repairs, 
      budgets, 
      settings, 
      exportDate: new Date().toISOString() 
    }, null, 2);
  }
};