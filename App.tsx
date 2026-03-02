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
import { ViewType, RepairItem, Budget, AppSettings, AppNotification } from './types';
import { Loader2 } from 'lucide-react';

const APP_VERSION = '7.0.0 PRO';

const DEFAULT_SETTINGS: AppSettings = {
  appName: 'ReparaPro Master',
  address: 'Calle Técnica 123, Local 5',
  phone: '900 000 000',
  taxId: 'B-12345678',
  technicians: ['Técnico Senior', 'Ayudante'],
  hourlyRate: 45,
  taxRate: 21,
  letterhead: 'Garantía de 3 meses en mano de obra. Validez del presupuesto: 15 días.'
};

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [repairs, setRepairs] = useState<RepairItem[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  
  const [editingRepair, setEditingRepair] = useState<RepairItem | null>(null);
  const [activeBudgetRepair, setActiveBudgetRepair] = useState<RepairItem | null>(null);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  const notify = useCallback((type: AppNotification['type'], message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 3000);
  }, []);

  useEffect(() => {
    const initApp = async () => {
      try {
        await storage.init();
        storage.subscribe('repairs', setRepairs);
        storage.subscribe('budgets', setBudgets);
        storage.subscribe('settings', (data) => {
          if (data && data.length > 0) setSettings(data[0]);
        });
        setLoading(false);
      } catch (err) {
        console.error("Init Error:", err);
        setLoading(false);
      }
    };
    initApp();
  }, []);

  const navigateTo = (view: ViewType) => {
    setCurrentView(view);
    if (view !== 'new-repair') setEditingRepair(null);
    setEditingBudget(null);
    setActiveBudgetRepair(null);
  };

  const handleSaveRepair = async (data: any, rma?: number) => {
    const id = data.id || `RMA-${Date.now()}`;
    let rmaNum = rma;
    if (!rmaNum) {
      const maxRma = repairs.reduce((max, r) => Math.max(max, r.rmaNumber || 0), 0);
      rmaNum = maxRma + 1;
    }
    await storage.save('repairs', id, { ...data, id, rmaNumber: rmaNum });
    notify('success', `RMA-${rmaNum.toString().padStart(5, '0')} guardado correctamente.`);
    navigateTo('repairs');
  };

  const handleSaveBudget = async (budget: Budget) => {
    await storage.save('budgets', budget.id, budget);
    notify('success', `Presupuesto para RMA-${budget.rmaNumber} guardado.`);
    navigateTo('budgets');
  };

  if (loading) return (
    <div className="h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
      <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
      <p className="text-[10px] font-black uppercase tracking-[0.4em]">Cargando Banco de Trabajo...</p>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 no-print">
      <Sidebar 
        currentView={currentView} 
        setView={navigateTo}
        onNewRepair={() => navigateTo('new-repair')}
        appName={settings.appName} 
        version={APP_VERSION}
      />
      
      <main className="flex-1 p-8 md:p-12 ml-64 min-h-screen">
        <div className="fixed top-6 right-6 z-[110] space-y-3 pointer-events-none">
          {notifications.map(n => (
            <div key={n.id} className="px-6 py-4 rounded-2xl bg-slate-900 text-white shadow-2xl border border-white/10 animate-in slide-in-from-right flex items-center gap-4 pointer-events-auto">
               <div className={`w-2 h-2 rounded-full ${n.type === 'success' ? 'bg-emerald-400' : 'bg-blue-400'}`} />
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
                onEditRepair={(r) => { setEditingRepair(r); navigateTo('new-repair'); }} 
              />
            )}
            {currentView === 'repairs' && (
              <RepairList 
                repairs={repairs} 
                budgets={budgets} 
                selectedIds={[]} 
                onToggleSelect={() => {}} 
                onSelectAll={() => {}} 
                onStatusChange={(id, status) => storage.save('repairs', id, { status })} 
                onDelete={id => { if(confirm('¿Eliminar esta reparación definitivamente?')) storage.remove('repairs', id); }} 
                onEdit={r => { setEditingRepair(r); navigateTo('new-repair'); }} 
                onCreateBudget={r => setActiveBudgetRepair(r)} 
                onEditBudget={b => {
                  const r = repairs.find(rep => rep.id === b.repairId);
                  if (r) {
                    setEditingBudget(b);
                    setActiveBudgetRepair(r);
                  }
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
                  const r = repairs.find(rep => rep.id === b.repairId);
                  if (r) {
                    setEditingBudget(b);
                    setActiveBudgetRepair(r);
                  }
                }}
                onPrintBudget={() => window.print()} 
                onDeleteBudget={id => { if(confirm('¿Eliminar presupuesto?')) storage.remove('budgets', id); }} 
              />
            )}
            {currentView === 'customers' && <CustomerList repairs={repairs} onSelectCustomer={(phone) => {
               // En una versión más pro, filtraríamos la lista de reparaciones por este teléfono
               navigateTo('repairs');
            }} />}
            {currentView === 'stats' && <StatsView repairs={repairs} />}
            {currentView === 'settings' && (
              <SettingsForm 
                settings={settings} 
                onSave={s => { storage.save('settings', 'global', s); notify('success', 'Configuración actualizada.'); }} 
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