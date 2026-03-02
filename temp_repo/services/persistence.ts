// ============================================================
// ReparaPro Master - Persistence v4 (Local-First)
// 1. Guarda en IndexedDB INMEDIATAMENTE → UI responde al instante
// 2. Sincroniza con Supabase en BACKGROUND → no bloquea nunca
// 3. Polling cada 3s para detectar cambios de otros terminales
// ============================================================

import { localDB } from './localDB';
import { supabase } from './supabaseService';

type CB = (data: any[]) => void;
const subs: Record<string, CB[]> = {};
const timers: Record<string, ReturnType<typeof setInterval>> = {};
const prevHash: Record<string, string> = {};
let online = false;

const tableFor = (col: string) => col === 'settings' ? 'rp_settings' : col;
const hashOf = (arr: any[]) => arr.map(d => `${d.id}|${d.updatedAt||''}`).sort().join(',');
const broadcast = (col: string, data: any[]) => subs[col]?.forEach(cb => cb(data));

// Sync en background — nunca lanza excepciones al caller
const syncToCloud = async (col: string, record: any) => {
  try {
    const ok = await supabase.save(tableFor(col), record);
    if (!ok) console.warn(`[Sync] ${col} cloud save failed silently`);
  } catch (e) {
    console.warn(`[Sync] ${col} cloud error:`, e);
  }
};

const syncDeleteToCloud = async (col: string, id: string) => {
  try {
    await supabase.remove(tableFor(col), id);
  } catch (e) {
    console.warn(`[Sync] delete ${col} cloud error:`, e);
  }
};

export const storage = {
  init: async () => {
    // 1. Inicializar BD local primero — esto es inmediato
    await localDB.init();

    // 2. Probar Supabase en background sin bloquear
    supabase.test().then(ok => {
      online = ok;
      if (ok) {
        console.log('[Storage] Supabase conectado ✅');
        storage._startPolling();
        // Cargar datos remotos iniciales
        storage._pullRemote();
      } else {
        console.warn('[Storage] Supabase no disponible, modo local');
      }
    });
  },

  isOnline: () => online,

  _pullRemote: async () => {
    const cols = ['repairs', 'budgets', 'settings'];
    for (const col of cols) {
      try {
        const data = await supabase.getAll(tableFor(col));
        // Marcar hash ANTES de broadcast para que el debounce de localDB no sobreescriba
        const h = hashOf(data);
        prevHash[col] = h;
        // Merge con local
        for (const item of data) {
          const { _rowId, ...clean } = item;
          if (clean.id) await localDB.put(col, clean).catch(() => {});
        }
        broadcast(col, data);
      } catch (e) {
        console.warn(`[Storage] pullRemote ${col} error:`, e);
      }
    }
  },

  _startPolling: () => {
    const cols = ['repairs', 'budgets', 'settings'];
    for (const col of cols) {
      if (timers[col]) clearInterval(timers[col]);
      timers[col] = setInterval(async () => {
        if (!subs[col]?.length || !online) return;
        try {
          const data = await supabase.getAll(tableFor(col));
          const h = hashOf(data);
          if (h === prevHash[col]) return;
          prevHash[col] = h;
          // Actualizar cache local
          for (const item of data) {
            const { _rowId, ...clean } = item;
            if (clean.id) await localDB.put(col, clean).catch(() => {});
          }
          broadcast(col, data);
        } catch (e) {
          // Error de red — no hacer nada, intentar en el próximo tick
        }
      }, 3000);
    }
  },

  subscribe: (col: string, cb: CB): (() => void) => {
    if (!subs[col]) subs[col] = [];
    subs[col].push(cb);

    // Pequeño debounce: si Supabase responde rápido, evitar doble render
    let localTimer: ReturnType<typeof setTimeout>;
    localDB.getAll(col)
      .then(localData => {
        localTimer = setTimeout(() => {
          // Solo notificar con datos locales si Supabase no ha respondido aún
          if (prevHash[col] === undefined) {
            prevHash[col] = hashOf(localData);
            cb(localData);
          }
        }, 80);
      })
      .catch(() => { cb([]); });

    return () => {
      clearTimeout(localTimer);
      subs[col] = subs[col].filter(fn => fn !== cb);
    };
  },

  // GUARDAR — local inmediato + cloud background
  save: async (col: string, id: string, data: any): Promise<void> => {
    const updatedAt = new Date().toISOString();

    // Merge con existente
    const existing = await localDB.getAll(col)
      .then(all => all.find((x: any) => x.id === id))
      .catch(() => null);
    const full = { ...existing, ...data, id, updatedAt };

    // 1. Guardar local → respuesta inmediata en UI
    await localDB.put(col, full).catch(e => console.error('[Storage] local put error:', e));

    // 2. Notificar UI inmediatamente con datos locales
    const localData = await localDB.getAll(col).catch(() => [full]);
    prevHash[col] = hashOf(localData);
    broadcast(col, localData);

    // 3. Sync a cloud en background
    syncToCloud(col, full);
  },

  // ELIMINAR — local inmediato + cloud background
  remove: async (col: string, id: string): Promise<void> => {
    await localDB.delete(col, id).catch(() => {});
    const localData = await localDB.getAll(col).catch(() => []);
    prevHash[col] = hashOf(localData);
    broadcast(col, localData);
    syncDeleteToCloud(col, id);
  },

  exportData: async () => {
    const repairs = await localDB.getAll('repairs').catch(() => []);
    const budgets = await localDB.getAll('budgets').catch(() => []);
    const settings = await localDB.getAll('settings').catch(() => []);
    return JSON.stringify({ repairs, budgets, settings, exportDate: new Date().toISOString() }, null, 2);
  },
};
