import React, { useState, useMemo } from 'react';
import { 
  Search, Trash2, Filter, Pencil, ChevronDown, User, Smartphone, FilePlus, FileEdit
} from 'lucide-react';
import { RepairItem, RepairStatus, Budget } from '../types';

interface RepairListProps {
  repairs: RepairItem[];
  budgets: Budget[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onSelectAll: (ids: string[]) => void;
  onStatusChange: (id: string, status: RepairStatus) => void;
  onEdit: (repair: RepairItem) => void;
  onCreateBudget: (repair: RepairItem) => void;
  onEditBudget: (budget: Budget) => void;
  onDelete: (id: string) => void;
  initialSearch?: string;
}

const RepairList: React.FC<RepairListProps> = ({ 
  repairs, budgets, onStatusChange, onEdit, onCreateBudget, onEditBudget, onDelete,
  initialSearch = ''
}) => {
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState<RepairStatus | 'Todos'>('Todos');
  
  const filteredRepairs = useMemo(() => {
    return repairs.filter(r => {
      const searchStr = `${r.rmaNumber} ${r.customerName} ${r.deviceType} ${r.brand} ${r.model}`.toLowerCase();
      const matchesSearch = searchStr.includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'Todos' || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
  }, [repairs, searchTerm, statusFilter]);

  const getStatusColor = (status: RepairStatus) => {
    switch(status) {
      case RepairStatus.READY: return 'bg-emerald-100 text-emerald-700';
      case RepairStatus.IN_PROGRESS: return 'bg-blue-100 text-blue-700';
      case RepairStatus.PENDING: return 'bg-amber-100 text-amber-700';
      case RepairStatus.DELIVERED: return 'bg-slate-100 text-slate-500';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in duration-500">
      <div className="p-10 border-b border-slate-50 flex flex-col xl:flex-row xl:items-center justify-between gap-8 no-print">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Banco de Trabajo</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-2">Control de reparaciones activas</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative">
            <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <select 
              className="pl-12 pr-10 py-4 bg-slate-50 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest appearance-none cursor-pointer outline-none transition-all"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as RepairStatus | 'Todos')}
            >
              <option value="Todos">Filtro de Estado</option>
              {Object.values(RepairStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="relative md:w-96">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por RMA, Cliente o Marca..." 
              className="pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl text-xs font-bold w-full outline-none placeholder:text-slate-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-400 text-[9px] uppercase font-black tracking-widest">
              <th className="px-10 py-6">RMA / Fecha</th>
              <th className="px-4 py-6">Cliente</th>
              <th className="px-4 py-6">Equipo</th>
              <th className="px-4 py-6">Estado Técnico</th>
              <th className="px-10 py-6 text-right">Gestión</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredRepairs.map((repair) => {
              const budget = budgets.find(b => b.repairId === repair.id);

              return (
                <tr key={repair.id} className="hover:bg-blue-50/20 transition-colors group">
                  <td className="px-10 py-8">
                    <p className="text-[12px] font-black text-slate-900 leading-none mb-2">
                       RMA-{repair.rmaNumber.toString().padStart(5, '0')}
                    </p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{new Date(repair.entryDate).toLocaleDateString()}</p>
                  </td>
                  <td className="px-4 py-8">
                    <div className="flex items-center gap-3">
                       <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-white transition-colors"><User size={16} /></div>
                       <div>
                         <p className="text-xs font-black text-slate-800 uppercase leading-none tracking-tight">{repair.customerName}</p>
                         <p className="text-[9px] text-slate-400 font-bold mt-1.5">{repair.customerPhone}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-4 py-8">
                    <div className="flex items-center gap-3">
                       <div className="w-9 h-9 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center group-hover:bg-white transition-colors"><Smartphone size={16} /></div>
                       <div>
                         <p className="text-xs font-black text-slate-900 uppercase leading-none tracking-tight">{repair.brand} {repair.model}</p>
                         <p className="text-[9px] text-slate-400 font-bold mt-1.5 uppercase">{repair.deviceType}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-4 py-8">
                    <div className="relative inline-block">
                      <select 
                        value={repair.status}
                        onChange={(e) => onStatusChange(repair.id, e.target.value as RepairStatus)}
                        className={`text-[9px] pl-4 pr-10 py-2.5 rounded-xl font-black uppercase border-none cursor-pointer outline-none appearance-none tracking-widest transition-all ${getStatusColor(repair.status)}`}
                      >
                        {Object.values(RepairStatus).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                    </div>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {budget ? (
                        <button onClick={() => onEditBudget(budget)} title="Editar Presupuesto" className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all"><FileEdit size={16} /></button>
                      ) : (
                        <button onClick={() => onCreateBudget(repair)} title="Crear Presupuesto" className="p-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all"><FilePlus size={16} /></button>
                      )}
                      
                      <button onClick={() => onEdit(repair)} title="Ficha Técnica" className="p-3 bg-white text-slate-400 rounded-xl hover:bg-slate-100 border border-slate-100 transition-all"><Pencil size={16} /></button>
                      <button onClick={() => onDelete(repair.id)} title="Eliminar" className="p-3 bg-white text-red-200 rounded-xl hover:bg-red-600 hover:text-white border border-slate-100 transition-all"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RepairList;