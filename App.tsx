import React, { useState, useEffect, useCallback } from 'react';
import { storage } from './services/persistence';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import StatsView from './components/StatsView';
import RepairList from './components/RepairList';
import RepairForm from './components/RepairForm';
import BudgetCreator from './components/BudgetCreator';
import BudgetList from './components/BudgetList';
import SettingsForm from './components/SettingsForm';
import CustomerList from './components/CustomerList';
import LabelPrintView from './components/LabelPrintView';
import ReceptionTicket from './components/ReceptionTicket';
import { ViewType, RepairItem, Budget, AppSettings, AppNotification } from './types';
import { APP_VERSION, DEFAULT_SETTINGS } from './constants';
import { Loader2, AlertTriangle, X } from 'lucide-react';

/* ── Modal de confirmación ───────────────────────────────────── */
interface ConfirmModalProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ message, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
    <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full mx-4 p-10 space-y-8 animate-in zoom-in-95">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-red-50 rounded-2xl text-red-500 shrink-0">
          <AlertTriangle size={24} />
        </div>
        <div>
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Confirmar acción</h3>
          <p className="text-xs text-slate-500 font-bold mt-2 leading-relaxed">{message}</p>
        </div>
      </div>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all"
        >
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 py-4 bg-red-600 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest hover:bg-red-700 transition-all"
        >
          Eliminar
        </button>
      </div>
    </div>
  </div>
);

/* ── App principal ───────────────────────────────────────────── */
const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [repairs, setRepairs] = useState<RepairItem[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS as AppSettings);
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const [editingRepair, setEditingRepair] = useState<RepairItem | null>(null);
  const [activeBudgetRepair, setActiveBudgetRepair] = useState<RepairItem | null>(null);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [printRepair, setPrintRepair] = useState<RepairItem | null>(null);

  // Modal de confirmación
  const [confirmModal, setConfirmModal] = useState<{ message: string; onConfirm: () => void } | null>(null);

  const notify = useCallback((type: AppNotification['type'], message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setNotifications((prev) => prev.filter((n) => n.id !== id)), 3000);
  }, []);

  const askConfirm = (message: string, onConfirm: () => void) => {
    setConfirmModal({ message, onConfirm });
  };

  // ── Inicialización con cleanup de suscripciones ──
  useEffect(() => {
    const unsubs: (() => void)[] = [];

    const initApp = async () => {
      try {
        await storage.init();
        unsubs.push(storage.subscribe('repairs', (data) => setRepairs(data as RepairItem[])));
        unsubs.push(storage.subscribe('budgets', (data) => setBudgets(data as Budget[])));
        unsubs.push(
          storage.subscribe('settings', (data) => {
            if (data && data.length > 0) setSettings(data[0] as AppSettings);
          })
        );
      } catch (err) {
        console.error('Init Error:', err);
        notify('error', 'Error al inicializar la base de datos local.');
      } finally {
        setLoading(false);
      }
    };

    initApp();
    return () => unsubs.forEach((fn) => fn());
  }, [notify]);

  // ── Navegación ──
  const navigateTo = (view: ViewType) => {
    setCurrentView(view);
    if (view !== 'new-repair') setEditingRepair(null);
    setEditingBudget(null);
    setActiveBudgetRepair(null);
    setPrintRepair(null);
  };

  // ── CRUD con error handling ──
  const handleSaveRepair = async (data: Partial<RepairItem>, rma?: number) => {
    try {
      const id = data.id || `RMA-${Date.now()}`;
      let rmaNum = rma;
      if (!rmaNum) {
        const maxRma = repairs.reduce((max, r) => Math.max(max, r.rmaNumber || 0), 0);
        rmaNum = maxRma + 1;
      }
      await storage.save('repairs', id, { ...data, id, rmaNumber: rmaNum } as Record<string, unknown>);
      notify('success', `RMA-${rmaNum.toString().padStart(5, '0')} guardado correctamente.`);
      navigateTo('repairs');
    } catch {
      notify('error', 'Error al guardar la reparación.');
    }
  };

  const handleSaveBudget = async (budget: Budget) => {
    try {
      await storage.save('budgets', budget.id, budget as unknown as Record<string, unknown>);
      notify('success', `Presupuesto para RMA-${budget.rmaNumber} guardado.`);
      navigateTo('budgets');
    } catch {
      notify('error', 'Error al guardar el presupuesto.');
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await storage.save('repairs', id, { status } as Record<string, unknown>);
    } catch {
      notify('error', 'Error al actualizar el estado.');
    }
  };

  const handleDeleteRepair = (id: string) => {
    askConfirm('¿Eliminar esta reparación definitivamente? Esta acción no se puede deshacer.', async () => {
      try {
        await storage.remove('repairs', id);
        notify('info', 'Reparación eliminada.');
      } catch {
        notify('error', 'Error al eliminar la reparación.');
      }
      setConfirmModal(null);
    });
  };

  const handleDeleteBudget = (id: string) => {
    askConfirm('¿Eliminar este presupuesto? Esta acción no se puede deshacer.', async () => {
      try {
        await storage.remove('budgets', id);
        notify('info', 'Presupuesto eliminado.');
      } catch {
        notify('error', 'Error al eliminar el presupuesto.');
      }
      setConfirmModal(null);
    });
  };

  // ── Loading ──
  if (loading)
    return (
      <div className="h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em]">Cargando Banco de Trabajo...</p>
      </div>
    );

  // ── Vistas de impresión (pantalla completa) ──
  if (printRepair && currentView === 'print-label') {
    return (
      <div className="print-container">
        <div className="no-print p-4 bg-slate-900 flex items-center justify-between">
          <button onClick={() => navigateTo('repairs')} className="text-white text-xs font-black uppercase flex items-center gap-2">
            <X size={16} /> Cerrar Vista de Impresión
          </button>
          <button onClick={() => window.print()} className="px-6 py-2 bg-blue-600 text-white rounded-xl text-xs font-black uppercase">
            Imprimir Etiqueta
          </button>
        </div>
        <LabelPrintView repair={printRepair} settings={settings} />
      </div>
    );
  }

  if (printRepair && currentView === 'print-reception') {
    return (
      <div className="print-container">
        <div className="no-print p-4 bg-slate-900 flex items-center justify-between">
          <button onClick={() => navigateTo('repairs')} className="text-white text-xs font-black uppercase flex items-center gap-2">
            <X size={16} /> Cerrar Vista de Impresión
          </button>
          <button onClick={() => window.print()} className="px-6 py-2 bg-blue-600 text-white rounded-xl text-xs font-black uppercase">
            Imprimir Resguardo A4
          </button>
        </div>
        <ReceptionTicket repair={printRepair} settings={settings} />
      </div>
    );
  }

  // ── Layout principal ──
  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 no-print">
      {confirmModal && (
        <ConfirmModal
          message={confirmModal.message}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}

      <Sidebar
        currentView={currentView}
        setView={navigateTo}
        onNewRepair={() => navigateTo('new-repair')}
        appName={settings.appName}
        version={APP_VERSION}
      />

      <main className="flex-1 p-8 md:p-12 ml-64 min-h-screen">
        {/* Notificaciones */}
        <div className="fixed top-6 right-6 z-[110] space-y-3 pointer-events-none">
          {notifications.map((n) => (
            <div
              key={n.id}
              className="px-6 py-4 rounded-2xl bg-slate-900 text-white shadow-2xl border border-white/10 animate-in slide-in-from-right flex items-center gap-4 pointer-events-auto"
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  n.type === 'success' ? 'bg-emerald-400' : n.type === 'error' ? 'bg-red-400' : 'bg-blue-400'
                }`}
              />
              <p className="text-[10px] font-black uppercase tracking-widest">{n.message}</p>
            </div>
          ))}
        </div>

        {activeBudgetRepair ? (
          <BudgetCreator
            repair={activeBudgetRepair}
            settings={settings}
            initialBudget={editingBudget || undefined}
            onSave={handleSaveBudget}
            onClose={() => navigateTo('repairs')}
          />
        ) : (
          <>
            {currentView === 'dashboard' && (
              <Dashboard
                repairs={repairs}
                settings={settings}
                setView={navigateTo}
                onNewRepair={() => navigateTo('new-repair')}
                onEditRepair={(r) => {
                  setEditingRepair(r);
                  navigateTo('new-repair');
                }}
              />
            )}
            {currentView === 'repairs' && (
              <RepairList
                repairs={repairs}
                budgets={budgets}
                onStatusChange={handleStatusChange}
                onDelete={handleDeleteRepair}
                onEdit={(r) => {
                  setEditingRepair(r);
                  navigateTo('new-repair');
                }}
                onCreateBudget={(r) => setActiveBudgetRepair(r)}
                onEditBudget={(b) => {
                  const r = repairs.find((rep) => rep.id === b.repairId);
                  if (r) {
                    setEditingBudget(b);
                    setActiveBudgetRepair(r);
                  }
                }}
                onPrintLabel={(r) => {
                  setPrintRepair(r);
                  setCurrentView('print-label');
                }}
                onPrintReceipt={(r) => {
                  setPrintRepair(r);
                  setCurrentView('print-reception');
                }}
              />
            )}
            {currentView === 'new-repair' && (
              <RepairForm
                settings={settings}
                onSave={handleSaveRepair}
                onCancel={() => navigateTo('repairs')}
                initialData={editingRepair || undefined}
              />
            )}
            {currentView === 'budgets' && (
              <BudgetList
                budgets={budgets}
                repairs={repairs}
                onViewBudget={(b) => {
                  const r = repairs.find((rep) => rep.id === b.repairId);
                  if (r) {
                    setEditingBudget(b);
                    setActiveBudgetRepair(r);
                  }
                }}
                onPrintBudget={() => window.print()}
                onDeleteBudget={handleDeleteBudget}
              />
            )}
            {currentView === 'customers' && (
              <CustomerList
                repairs={repairs}
                onSelectCustomer={() => {
                  navigateTo('repairs');
                }}
              />
            )}
            {currentView === 'stats' && <StatsView repairs={repairs} />}
            {currentView === 'settings' && (
              <SettingsForm
                settings={settings}
                onSave={async (s) => {
                  try {
                    await storage.save('settings', 'global', s as unknown as Record<string, unknown>);
                    notify('success', 'Configuración actualizada.');
                  } catch {
                    notify('error', 'Error al guardar la configuración.');
                  }
                }}
                onBack={() => navigateTo('dashboard')}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default App;
