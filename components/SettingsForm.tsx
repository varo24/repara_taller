import React, { useState, useRef } from 'react';
import { 
  Save, Building2, Download, Globe, Copy, Link, Share2, FileJson, CheckCircle2, 
  Monitor, Camera, Mail, Phone, MapPin, FileText, Trash2, Image as ImageIcon,
  ShieldCheck
} from 'lucide-react';
import { AppSettings } from '../types';
import { storage } from '../services/persistence';

interface SettingsFormProps {
  settings: AppSettings;
  canInstall?: boolean;
  onInstall?: () => void;
  onSave: (settings: AppSettings) => void;
  onBack: () => void;
  version?: string;
}

const SettingsForm: React.FC<SettingsFormProps> = ({ settings, canInstall, onInstall, onSave, onBack, version }) => {
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [linkStatus, setLinkStatus] = useState<'idle' | 'linking' | 'linked'>('idle');
  const [copied, setCopied] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const currentUrl = window.location.href;

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLinkNetwork = async () => {
    setLinkStatus('linking');
    const ok = await storage.linkNetworkFile();
    setLinkStatus(ok ? 'linked' : 'idle');
    if (ok) alert("Sincronización LAN activada.");
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = async () => {
    const data = await storage.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reparapro_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in duration-500 pb-20 no-print">
      
      {/* IDENTIDAD VISUAL Y DATOS FISCALES */}
      <div className="bg-white p-8 md:p-12 rounded-[3rem] border border-slate-100 shadow-sm space-y-10">
        <div className="flex items-center justify-between border-b border-slate-50 pb-6">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg">
               <Building2 size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">Identidad del Taller</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Configuración de marca y facturación</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Subida de Logo */}
          <div className="lg:col-span-4 space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Logotipo del Taller</label>
            <div 
              onClick={() => logoInputRef.current?.click()}
              className="aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all group overflow-hidden relative"
            >
              {formData.logoUrl ? (
                <>
                  <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-contain p-8" />
                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setFormData({...formData, logoUrl: ''}); }}
                      className="p-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-5 bg-white rounded-2xl shadow-sm text-slate-300 group-hover:text-blue-500 transition-colors">
                    <ImageIcon size={32} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-blue-600">Subir Logo (PNG/JPG)</span>
                </>
              )}
            </div>
            <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
          </div>

          {/* Campos de Texto */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Building2 size={12} className="text-blue-500" /> Nombre Comercial
              </label>
              <input type="text" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-4 focus:ring-blue-500/10 outline-none" value={formData.appName} onChange={e => setFormData({...formData, appName: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <FileText size={12} className="text-blue-500" /> NIF / CIF / TAX ID
              </label>
              <input type="text" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-4 focus:ring-blue-500/10 outline-none" value={formData.taxId} onChange={e => setFormData({...formData, taxId: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Phone size={12} className="text-blue-500" /> Teléfono de Contacto
              </label>
              <input type="text" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-4 focus:ring-blue-500/10 outline-none" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Mail size={12} className="text-blue-500" /> Correo Electrónico
              </label>
              <input type="email" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-4 focus:ring-blue-500/10 outline-none" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <MapPin size={12} className="text-blue-500" /> Dirección Completa
              </label>
              <input type="text" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-4 focus:ring-blue-500/10 outline-none" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
            </div>
          </div>
        </div>

        {/* Notas Legales */}
        <div className="pt-8 border-t border-slate-50">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
              <ShieldCheck size={12} className="text-blue-500" /> Notas para Presupuestos (Pie de página en valoraciones técnicas)
            </label>
            <textarea 
              rows={4} 
              className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[2rem] font-medium text-xs text-slate-600 focus:ring-4 focus:ring-blue-500/10 outline-none resize-none leading-relaxed" 
              value={formData.letterhead} 
              onChange={e => setFormData({...formData, letterhead: e.target.value})}
              placeholder="Ej: Este presupuesto tiene validez de 15 días. Garantía de 3 meses en mano de obra..."
            />
          </div>
        </div>
      </div>

      {/* INSTALACIÓN ESCRITORIO */}
      {canInstall && (
        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-10 rounded-[3rem] text-white shadow-2xl space-y-6">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-2xl text-white">
              <Monitor size={24} />
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight">Convertir en App de Escritorio</h3>
          </div>
          <p className="text-xs text-white/70 font-bold uppercase leading-relaxed">
            Instala esta consola directamente en tu PC para acceder sin abrir el navegador y tener una experiencia de aplicación real.
          </p>
          <button 
            onClick={onInstall}
            className="w-full py-5 bg-white text-indigo-600 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:scale-[1.02] transition-all shadow-xl"
          >
            Instalar ReparaPro en este PC
          </button>
        </div>
      )}

      {/* SINCRONIZACION */}
      <div className="bg-slate-950 p-10 rounded-[3rem] text-white shadow-2xl space-y-10">
        <div className="flex items-center gap-4 border-b border-white/5 pb-6">
          <div className="bg-blue-500 p-3 rounded-2xl text-white">
            <Share2 size={24} />
          </div>
          <h3 className="text-xl font-black uppercase tracking-tight">Sincronización y Backup</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="space-y-4">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Acceso Multiterminal</p>
              <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
                <Copy size={18} className="text-slate-600 shrink-0" />
                <code className="flex-1 text-[11px] font-black text-blue-400 truncate">{currentUrl}</code>
                <button onClick={copyUrl} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-white text-slate-900'}`}>
                  {copied ? 'Copiado' : 'Copiar'}
                </button>
              </div>
           </div>

           <div className="space-y-4">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Archivo Maestro LAN</p>
              <div className="flex gap-4">
                <button onClick={handleLinkNetwork} className={`flex-1 py-4 rounded-xl flex items-center justify-center gap-3 text-[9px] font-black uppercase tracking-widest transition-all ${linkStatus === 'linked' ? 'bg-emerald-600 text-white' : 'bg-white/10 hover:bg-white/20 text-slate-300 border border-white/10'}`}>
                  {linkStatus === 'linked' ? <CheckCircle2 size={16} /> : <FileJson size={16} />}
                  {linkStatus === 'linked' ? 'Vinculado' : 'Vincular Red'}
                </button>
                <button onClick={handleExport} className="px-6 py-4 bg-white text-slate-900 rounded-xl font-black uppercase text-[9px] tracking-widest hover:bg-slate-100 transition-all flex items-center gap-3">
                  <Download size={16} /> Exportar
                </button>
              </div>
           </div>
        </div>
      </div>

      <div className="flex gap-4">
        <button onClick={onBack} className="px-10 py-6 bg-white border border-slate-200 text-slate-500 rounded-[2.5rem] font-black uppercase text-[12px] tracking-widest hover:bg-slate-50 transition-all">Cancelar</button>
        <button onClick={() => onSave(formData)} className="flex-1 py-6 bg-blue-600 text-white rounded-[2rem] font-black uppercase text-[12px] tracking-widest shadow-2xl shadow-blue-600/20 flex items-center justify-center gap-4 hover:bg-blue-700 transition-all">
          <Save size={20} /> Guardar Identidad del Taller
        </button>
      </div>
    </div>
  );
};

export default SettingsForm;