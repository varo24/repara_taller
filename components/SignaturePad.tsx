
import React, { useRef, useState, useEffect } from 'react';
import { Eraser, CheckCircle2, PenTool } from 'lucide-react';

interface SignaturePadProps {
  onSave: (signatureBase64: string) => void;
  initialValue?: string;
  height?: string;
}

const SignaturePad: React.FC<SignaturePadProps> = ({ onSave, initialValue, height = "h-64" }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(!!initialValue);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Alta resolución para digitalizadoras (GEES S640 tiene alta densidad)
    const ratio = Math.max(window.devicePixelRatio || 1, 2);
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    ctx.scale(ratio, ratio);
    
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#020617'; // Slate 950
    ctx.lineWidth = 3; // Base un poco más gruesa para mejor visibilidad

    if (initialValue) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, canvas.offsetWidth, canvas.offsetHeight);
      img.src = initialValue;
    }

    // Prevención de scroll mientras se firma
    const preventDefault = (e: Event) => e.preventDefault();
    canvas.addEventListener('touchstart', preventDefault, { passive: false });
    canvas.addEventListener('touchmove', preventDefault, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', preventDefault);
      canvas.removeEventListener('touchmove', preventDefault);
    };
  }, [initialValue]);

  // Usar PointerEvents para máxima compatibilidad con Wacom (presión/precisión)
  const handlePointerDown = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Capturar el puntero para que no se pierda si sale del área
    canvas.setPointerCapture(e.pointerId);

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pressure = e.pressure;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = pressure > 0 ? pressure * 4 : 2.5;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pressure = e.pressure;

    // Ajustar grosor dinámicamente según la presión (típico en tabletas como GEES)
    if (pressure > 0 && pressure !== 0.5) {
       ctx.lineWidth = pressure * 5;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
    
    // Suavizado para trazos rápidos
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.releasePointerCapture(e.pointerId);
      const base64 = canvas.toDataURL('image/png');
      onSave(base64);
      setHasSignature(true);
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      onSave('');
      setHasSignature(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center px-2">
        <div className="flex items-center gap-2">
          <PenTool size={14} className="text-blue-500" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Entrada Digitalizadora GEES S640 Activa
          </span>
        </div>
        <button 
          type="button" 
          onClick={clear} 
          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2 text-[10px] font-bold uppercase"
        >
          <Eraser size={14} /> Limpiar
        </button>
      </div>
      
      <div className={`relative ${height} bg-white border-2 border-slate-200 rounded-[1.5rem] overflow-hidden cursor-crosshair shadow-inner`}>
        <canvas
          ref={canvasRef}
          className="w-full h-full touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
        {!hasSignature && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-10">
            <PenTool size={48} className="mb-2" />
            <p className="text-xs font-black uppercase tracking-[0.3em]">Firme aquí con el lápiz digital</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SignaturePad;
