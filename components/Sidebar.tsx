import React, { useState } from 'react';
import { 
  LayoutDashboard, Wrench, PlusCircle, FileText, 
  Settings, TrendingUp, Users, Cpu, RefreshCw
} from 'lucide-react';
import { ViewType } from '../types';
import { storage } from '../services/persistence';

interface SidebarProps {
  currentView: ViewType;
  setView: (view: ViewType) => void;
  onNewRepair: () => void;
  appName: string;
  version?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, onNewRepair, appName, version }) => {
  const [syncing, setSyncing] = useState(false);

  const handleManualSync = async () => {
    setSyncing(true);
    await storage.pullFromNetwork();
    setTimeout(() => setSyncing(false), 800);
  };

  const menuItems = [
    { id: 'dashboard', label: 'Monitor Central', icon: LayoutDashboard },
    { id: 'new-repair', label: 'Nueva Reparación', icon: PlusCircle },
    { id: 'repairs', label: 'Banco de Trabajo', icon: Wrench },
    { id: 'budgets', label: 'Presupuestos', icon: FileText },
    { id: 'customers', label: 'Agenda Clientes', icon: Users },
    { id: 'stats', label: 'Rendimiento', icon: TrendingUp },
  ];

  const handleMenuClick = (id: string) => {
    if (id === 'new-repair') {
      onNewRepair();
    } else {
      setView(id as ViewType);
    }
  };

  return (
    <aside className="w-64 bg-slate-950 text-white h-screen flex flex-col fixed left-0 top-0 z-40 no-print border-r border-slate-800/50 shadow-2xl">
      <div className="p-8 border-b border-slate-900">
        <div className="flex items-center space-x-4">
          <div className="bg-blue-600 p-2.5 rounded-2xl w-12 h-12 flex items-center justify-center shadow-lg shadow-blue-600/30">
            <Cpu size={24} className="text-white" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-black tracking-tighter truncate uppercase leading-none">{appName}</span>
            <span className="text-[7px] text-slate-500 font-black uppercase tracking-[0.2em] mt-2 leading-none">Terminal de Taller</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 mt-6 px-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleMenuClick(item.id)}
              className={`w-full flex items-center space-x-4 px-5 py-3.5 rounded-2xl transition-all duration-300 group ${
                isActive 
                ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20 translate-x-1' 
                : 'text-slate-500 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-white' : 'group-hover:text-blue-400 transition-colors'} />
              <span className="font-black uppercase text-[10px] tracking-[0.15em]">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-6 border-t border-slate-900 space-y-3">
        <button 
          onClick={handleManualSync}
          className="w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl bg-slate-900/50 border border-slate-800 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-all group"
        >
          <RefreshCw size={16} className={syncing ? 'animate-spin text-emerald-500' : 'group-hover:rotate-180 transition-transform duration-500'} />
          <span className="text-[9px] font-black uppercase tracking-widest">Sincronizar Red</span>
        </button>

        <button 
          onClick={() => setView('settings')} 
          className={`w-full flex items-center space-x-4 px-5 py-3.5 rounded-2xl transition-all ${
            currentView === 'settings' ? 'text-white bg-slate-800' : 'text-slate-500 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Settings size={18} />
          <span className="text-[10px] font-black uppercase tracking-[0.15em]">Ajustes</span>
        </button>

        {version && (
          <div className="pt-2 text-center">
            <span className="text-[8px] font-black text-slate-700 uppercase tracking-widest text-center block w-full">v {version}</span>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;