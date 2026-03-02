
import React from 'react';
import { Package, Clock, Activity, CheckCircle, TrendingUp, AlertCircle } from 'lucide-react';
import { RepairItem, RepairStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface StatsViewProps {
  repairs: RepairItem[];
}

const StatsView: React.FC<StatsViewProps> = ({ repairs }) => {
  const activeRepairs = repairs.filter(r => r.status !== RepairStatus.DELIVERED && r.status !== RepairStatus.CANCELLED);
  const totalHours = repairs.reduce((acc, r) => acc + (r.estimatedHours || 0), 0);
  const totalPartsValue = repairs.reduce((acc, r) => acc + (r.estimatedParts || 0), 0);
  const readyCount = repairs.filter(r => r.status === RepairStatus.READY).length;
  const efficiency = repairs.length > 0 ? Math.round((readyCount / repairs.length) * 100) : 0;

  const stats = [
    { label: 'Valor Repuestos', value: `${totalPartsValue}€`, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Tiempo Técnico', value: `${totalHours}h`, icon: Clock, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Activos', value: activeRepairs.length, icon: Activity, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Entregas OK', value: `${efficiency}%`, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  const chartData = [
    { name: 'Repuestos Est.', val: totalPartsValue, color: '#2563eb' },
    { name: 'Horas Taller', val: totalHours, color: '#4f46e5' },
    { name: 'Equipos Listos', val: readyCount, color: '#059669' },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
      <div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Análisis y Estadísticas</h1>
        <p className="text-slate-500 font-medium">Métricas de rendimiento técnico del taller</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
            <div className="flex items-center space-x-4">
              <div className={`${stat.bg} ${stat.color} p-4 rounded-2xl group-hover:scale-110 transition-transform`}>
                <stat.icon size={24} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                <p className="text-2xl font-black text-slate-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 tracking-tight">
            <TrendingUp size={24} className="text-blue-500" />
            Flujo de Trabajo del Banco
          </h3>
        </div>
        <div className="h-[400px] w-full">
          {repairs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-300">
              <AlertCircle size={48} className="mb-2 opacity-20" />
              <p className="text-sm font-medium">Sin datos para graficar</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}} 
                  contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)', padding: '15px'}} 
                />
                <Bar dataKey="val" radius={[15, 15, 15, 15]} barSize={80}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatsView;
