# ReparaPro Master Console v8.0.0

Consola de gestión técnica **100% offline** para talleres de reparación de electrodomésticos. Todos los datos se almacenan localmente en el navegador mediante IndexedDB.

## Características

- Gestión completa de reparaciones con sistema RMA
- Presupuestos técnicos con firma digital (compatible con tabletas Wacom/GEES)
- Impresión de etiquetas térmicas (80mm) y resguardos A4
- Dashboard con estadísticas en tiempo real
- Sincronización LAN opcional mediante archivo JSON compartido
- Diagnóstico asistido por IA (Gemini, opcional)
- Instalable como PWA de escritorio

## Stack Tecnológico

- React 19 + TypeScript
- Vite 5 con Tailwind CSS v4
- IndexedDB (persistencia local)
- Recharts (gráficos)
- Lucide React (iconografía)

## Instalación

```bash
npm install
npm run dev
```

La app estará disponible en `http://localhost:3000`.

## Variables de Entorno (opcionales)

Copia `.env.example` a `.env` y configura si deseas IA:

```bash
cp .env.example .env
```

| Variable | Descripción |
|---|---|
| `VITE_GEMINI_API_KEY` | API Key de Google Gemini para diagnóstico IA |

## Build de Producción

```bash
npm run build
npm run preview
```

El directorio `dist/` puede desplegarse en cualquier hosting estático (Vercel, GitHub Pages, Netlify, etc.).

## Estructura del Proyecto

```
├── App.tsx                  # Componente raíz y navegación
├── constants.ts             # Versión y configuración por defecto
├── types.ts                 # Tipos TypeScript
├── index.tsx                # Entry point
├── components/
│   ├── Dashboard.tsx        # Panel principal con métricas
│   ├── RepairList.tsx       # Banco de trabajo (listado de RMAs)
│   ├── RepairForm.tsx       # Formulario de alta/edición
│   ├── BudgetCreator.tsx    # Creador de presupuestos
│   ├── BudgetList.tsx       # Archivo de presupuestos
│   ├── CustomerList.tsx     # Agenda de clientes
│   ├── SettingsForm.tsx     # Configuración del taller
│   ├── StatsView.tsx        # Estadísticas y gráficos
│   ├── Sidebar.tsx          # Navegación lateral
│   ├── SignaturePad.tsx     # Captura de firma digital
│   ├── LabelPrintView.tsx   # Etiqueta térmica 80mm
│   └── ReceptionTicket.tsx  # Resguardo de depósito A4
├── services/
│   ├── localDB.ts           # Motor IndexedDB
│   ├── persistence.ts       # Capa de abstracción de datos
│   └── geminiService.ts     # Integración con Gemini AI
└── utils/
    └── generateId.ts        # Generador de IDs universal
```

## Licencia

Proyecto privado — Todos los derechos reservados.
