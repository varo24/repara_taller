# ReparaPro Master v3.0 PRO

Consola de gestión técnica para talleres de reparación. App web progresiva (PWA) con almacenamiento local, sin servidores ni suscripciones.

## ✨ Novedades en v3.0

- 🔒 **PIN de seguridad** — Protege el acceso con un PIN de 4 dígitos. Sesión activa durante 8 horas.
- 📄 **Paginación** — La lista de reparaciones ahora muestra 10/25/50 por página.
- 🤖 **IA corregida** — Diagnóstico inteligente con Gemini 2.0 Flash (modelo correcto y funcional).
- 📱 **PWA mejorada** — Instalable en iOS, Android y Windows. Funciona offline.
- 🧹 **Código limpio** — Eliminados archivos PHP y Firebase residuales.

---

## 🚀 Instalación y arranque local

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
# Copia .env.local y pon tu API Key de Gemini (opcional)
cp .env.local .env.local

# 3. Arrancar en modo desarrollo
npm run dev

# 4. Abrir en http://localhost:3000
```

---

## 🤖 Activar Diagnóstico IA (Gemini)

1. Ve a https://aistudio.google.com/app/apikey
2. Crea una API Key gratuita
3. Edita `.env.local` y añade:
   ```
   VITE_GEMINI_API_KEY=tu_clave_aqui
   ```
4. Reinicia `npm run dev`

> ⚠️ **Nunca subas tu API Key a GitHub.** El archivo `.env.local` ya está en `.gitignore`.

---

## 📱 Instalar como App (PWA)

### En PC (Chrome/Edge):
1. Abre la app en el navegador
2. Ve a Ajustes → "Instalar ReparaPro en este PC"
3. O usa el icono de instalación en la barra de direcciones

### En Android:
1. Abre la app en Chrome
2. Menú → "Añadir a pantalla de inicio"

### En iOS (Safari):
1. Abre la app en Safari
2. Botón Compartir → "Añadir a pantalla de inicio"

---

## 🌐 Publicar en GitHub Pages

```bash
# 1. Construir para producción
npm run build

# 2. Subir el contenido de /dist a GitHub Pages
# O configurar GitHub Actions para build automático
```

---

## 🔄 Sincronización entre terminales (LAN Sync)

1. En el PC principal: **Ajustes → Exportar** → guarda el `.json` en carpeta compartida
2. En cada terminal: **Ajustes → Vincular Red** → selecciona ese archivo `.json`
3. Los cambios se sincronizan automáticamente al guardar

> **Nota:** La sincronización LAN usa File System Access API — disponible en Chrome/Edge desktop.
> En iOS usa la función de Exportar/Importar manualmente.

---

## 🗂️ Estructura del proyecto

```
reparapro-master/
├── components/          # Componentes React
│   ├── PinScreen.tsx    # 🆕 Pantalla de seguridad PIN
│   ├── RepairList.tsx   # ✅ Con paginación
│   ├── Dashboard.tsx
│   ├── BudgetCreator.tsx
│   └── ...
├── services/
│   ├── localDB.ts       # Motor IndexedDB
│   ├── persistence.ts   # Capa de acceso a datos
│   └── geminiService.ts # ✅ IA corregida (Gemini 2.0 Flash)
├── public/
│   ├── manifest.json    # 🆕 PWA manifest
│   ├── sw.js            # 🆕 Service Worker
│   └── icons/           # Iconos PWA
├── App.tsx              # ✅ Integra PIN + PWA install
├── types.ts
└── .env.local           # ✅ Variables VITE_ (no subir a Git)
```
