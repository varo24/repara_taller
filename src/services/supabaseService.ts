// ============================================================
// ReparaPro Master - Supabase Service v4
// ============================================================

const BASE = import.meta.env.VITE_SUPABASE_URL || 'https://bglmkckpopcuxmafting.supabase.co/rest/v1';
const KEY  = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnbG1rY2twb3BjdXhtYWZ0aW5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2MDg0MzYsImV4cCI6MjA4NzE4NDQzNn0.g88wW7562dUhmzpNNPRxqxpMdykTv8A1YXBkSVNI4dA';

const H = {
  'Content-Type': 'application/json',
  'apikey': KEY,
  'Authorization': `Bearer ${KEY}`,
};

const call = async (path: string, opts: RequestInit = {}, timeoutMs = 5000): Promise<Response> => {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${BASE}/${path}`, {
      ...opts,
      headers: { ...H, ...(opts.headers as Record<string,string> || {}) },
      signal: ctrl.signal,
    });
    return res;
  } finally {
    clearTimeout(t);
  }
};

export const supabase = {
  async test(): Promise<boolean> {
    try {
      const res = await call('repairs?limit=1&select=id', {}, 4000);
      return res.status < 500;
    } catch { return false; }
  },

  async getAll(table: string): Promise<any[]> {
    try {
      const res = await call(`${table}?select=*&order=updated_at.desc`);
      if (!res.ok) return [];
      const rows: any[] = await res.json();
      
      const seen = new Set();
      const uniqueRows = [];
      for (const r of rows) {
        if (!seen.has(r.business_id)) {
          seen.add(r.business_id);
          uniqueRows.push(r);
        }
      }

      return uniqueRows.map(r => {
        const d = r.data && typeof r.data === 'object' ? r.data : {};
        return { ...d, _rowId: r.id };
      });
    } catch { return []; }
  },

  async save(table: string, record: any): Promise<boolean> {
    try {
      const { _rowId, ...clean } = record;
      
      // Intentar actualizar primero (PATCH)
      const patchRes = await call(`${table}?business_id=eq.${encodeURIComponent(clean.id)}`, {
        method: 'PATCH',
        headers: { 'Prefer': 'return=representation' },
        body: JSON.stringify({
          data: clean,
          updated_at: new Date().toISOString(),
        }),
      });

      let updatedRows = [];
      if (patchRes.ok) {
        updatedRows = await patchRes.json().catch(() => []);
      }

      // Si no se actualizó ninguna fila, hacer POST (Insert)
      if (updatedRows.length === 0) {
        const postRes = await call(table, {
          method: 'POST',
          headers: { 'Prefer': 'return=minimal' },
          body: JSON.stringify({
            business_id: clean.id,
            data: clean,
            updated_at: new Date().toISOString(),
          }),
        });
        if (!postRes.ok) {
          const txt = await postRes.text().catch(() => '');
          console.warn(`[Supabase] save POST ${table} ${postRes.status}:`, txt);
        }
        return postRes.ok;
      }

      return true;
    } catch (e) {
      console.warn('[Supabase] save error:', e);
      return false;
    }
  },

  async remove(table: string, businessId: string): Promise<boolean> {
    try {
      const res = await call(
        `${table}?business_id=eq.${encodeURIComponent(businessId)}`,
        { method: 'DELETE', headers: { 'Prefer': 'return=minimal' } }
      );
      return res.ok;
    } catch { return false; }
  },
};
