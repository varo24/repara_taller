
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Eraser, CheckCircle2, PenTool } from 'lucide-react';

interface SignaturePadProps {
  onSave: (signatureBase64: string) => void;
  initialValue?: string;
  height?: string;
}

/**
 * SignaturePad optimizado para tableta UGEE S640
 * Área activa: 6.3" x 4" (160mm x 101.6mm)
 * Ratio de aspecto: 6.3/4 = 1.575:1
 * Presión: 8192 niveles
 * Inclinación: ±60°
 * Resolución: 5080 LPI
 * Report Rate: 220 RPS
 */
const UGEE_S640 = {
  ACTIVE_WIDTH_INCHES: 6.3,
  ACTIVE_HEIGHT_INCHES: 4.0,
  ASPECT_RATIO: 6.3 / 4.0, // 1.575
  PRESSURE_LEVELS: 8192,
  MAX_TILT: 60,
  RESOLUTION_LPI: 5080,
  REPORT_RATE: 220,
};

const SignaturePad: React.FC<SignaturePadProps> = ({ onSave, initialValue, height = "h-80" }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(!!initialValue);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  // Ajuste dinámico del canvas manteniendo el ratio de aspecto de la Ugee S640
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Guardar contenido actual si existe
    let imageData: string | null = null;
    if (hasSignature) {
      imageData = canvas.toDataURL('image/png');
    }

    // Usar todo el ancho del contenedor
    const containerWidth = container.clientWidth;
    // Calcular altura según el ratio de aspecto de la Ugee S640 (más ancha que alta)
    const containerHeight = Math.max(
      container.clientHeight,
      Math.floor(containerWidth / UGEE_S640.ASPECT_RATIO)
    );

    // Alta resolución: usar ratio de píxeles del dispositivo
    // La Ugee S640 tiene 5080 LPI, necesitamos máxima resolución del canvas
    const ratio = Math.max(window.devicePixelRatio || 1, 2);
    canvas.width = containerWidth * ratio;
    canvas.height = containerHeight * ratio;
    canvas.style.width = `${containerWidth}px`;
    canvas.style.height = `${containerHeight}px`;
    ctx.scale(ratio, ratio);

    // Configuración de trazo optimizada para Ugee S640
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#020617'; // Slate 950 - máximo contraste
    ctx.lineWidth = 2.5;

    // Restaurar contenido previo
    if (imageData && hasSignature) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, containerWidth, containerHeight);
      };
      img.src = imageData;
    } else if (initialValue) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, containerWidth, containerHeight);
      };
      img.src = initialValue;
    }
  }, [initialValue, hasSignature]);

  useEffect(() => {
    setupCanvas();

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Prevenir scroll/zoom mientras se firma (importante para uso con stylus)
    const preventDefault = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };

    canvas.addEventListener('touchstart', preventDefault, { passive: false });
    canvas.addEventListener('touchmove', preventDefault, { passive: false });
    canvas.addEventListener('touchend', preventDefault, { passive: false });
    // Prevenir menú contextual al tocar con el stylus
    canvas.addEventListener('contextmenu', preventDefault);

    // Reajustar canvas al cambiar tamaño de ventana
    const handleResize = () => {
      setupCanvas();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      canvas.removeEventListener('touchstart', preventDefault);
      canvas.removeEventListener('touchmove', preventDefault);
      canvas.removeEventListener('touchend', preventDefault);
      canvas.removeEventListener('contextmenu', preventDefault);
      window.removeEventListener('resize', handleResize);
    };
  }, [setupCanvas]);

  /**
   * Calcula el grosor de línea según la presión del stylus Ugee S640.
   * La Ugee S640 tiene 8192 niveles de presión, lo que permite trazos
   * muy finos y muy gruesos con transiciones suaves.
   */
  const getPressureLineWidth = (pressure: number): number => {
    // Presión 0 o exactamente 0.5 suele indicar que no hay datos de presión reales
    if (pressure <= 0 || pressure === 0.5) {
      return 2.5; // Grosor por defecto sin presión
    }
    // Rango de grosor: 1px (muy suave) a 6px (máxima presión)
    // Curva ligeramente exponencial para mayor control en presiones bajas
    const minWidth = 1;
    const maxWidth = 6;
    const curve = Math.pow(pressure, 1.3); // Curva suave para más control
    return minWidth + curve * (maxWidth - minWidth);
  };

  /**
   * Interpolación de puntos para trazos suaves a alta velocidad.
   * La Ugee S640 reporta a 220 RPS, pero movimientos rápidos
   * pueden generar huecos entre puntos.
   */
  const interpolatePoints = (
    ctx: CanvasRenderingContext2D,
    from: { x: number; y: number },
    to: { x: number; y: number },
    lineWidth: number
  ) => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Si la distancia es grande, interpolar puntos intermedios
    if (distance > 3) {
      const steps = Math.ceil(distance / 2);
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = from.x + dx * t;
        const y = from.y + dy * t;
        ctx.lineTo(x, y);
      }
    } else {
      ctx.lineTo(to.x, to.y);
    }
  };

  const getCanvasCoords = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Capturar el puntero para no perder trazos al salir del borde
    canvas.setPointerCapture(e.pointerId);

    setIsDrawing(true);
    const { x, y } = getCanvasCoords(e);
    lastPoint.current = { x, y };

    const lineWidth = getPressureLineWidth(e.pressure);

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = lineWidth;

    // Dibujar un punto en la posición inicial (para toques sin movimiento)
    ctx.lineTo(x + 0.1, y + 0.1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const { x, y } = getCanvasCoords(e);
    const lineWidth = getPressureLineWidth(e.pressure);

    ctx.lineWidth = lineWidth;

    if (lastPoint.current) {
      ctx.beginPath();
      ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
      interpolatePoints(ctx, lastPoint.current, { x, y }, lineWidth);
      ctx.stroke();
    }

    lastPoint.current = { x, y };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    lastPoint.current = null;

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
      lastPoint.current = null;
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
            Entrada Digitalizadora UGEE S640 Activa
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

      {/* 
        Zona de firma ampliada para UGEE S640 (6.3" x 4")
        Se usa un ratio de aspecto proporcional a la superficie activa real.
        La altura mínima es h-80 (320px) para aprovechar toda la superficie.
        El ancho es 100% del contenedor disponible.
      */}
      <div
        ref={containerRef}
        className={`relative ${height} w-full bg-white border-2 border-slate-200 rounded-[1.5rem] overflow-hidden cursor-crosshair shadow-inner`}
        style={{
          // Ratio de aspecto de la Ugee S640: 6.3:4 = 1.575:1
          aspectRatio: `${UGEE_S640.ASPECT_RATIO}`,
          minHeight: '280px',
          maxHeight: '500px',
        }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full touch-none"
          style={{
            // touch-action none para que el stylus no active gestos del navegador
            touchAction: 'none',
            // Evitar selección de texto al usar stylus
            userSelect: 'none',
            WebkitUserSelect: 'none',
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />
        {!hasSignature && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-10">
            <PenTool size={56} className="mb-3" />
            <p className="text-sm font-black uppercase tracking-[0.3em]">Firme aquí con el lápiz digital</p>
            <p className="text-[10px] mt-1 tracking-widest">UGEE S640 — Superficie completa activa</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SignaturePad;
