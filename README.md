
# ReparaPro Master - Guía de Publicación en GitHub

Para que tu aplicación tenga una dirección de entrada pública y puedas acceder desde cualquier terminal:

## 1. Publicar en GitHub Pages
1. Sube tu código a un repositorio de GitHub.
2. Ve a la pestaña **Settings** (Ajustes) de tu repositorio en GitHub.
3. En el menú izquierdo, haz clic en **Pages**.
4. En "Build and deployment", selecciona como origen **GitHub Actions**.
5. GitHub detectará automáticamente que es un proyecto Vite y te sugerirá un flujo de trabajo. Acéptalo.
6. En unos minutos, tendrás una URL tipo: `https://tu-usuario.github.io/nombre-repo/`

## 2. Sincronización entre Terminales (Sin Nube)
Como esta versión utiliza **Sincronización Local (LAN Sync)** por seguridad y privacidad:
1. Abre la URL en tu PC principal.
2. Ve a **Ajustes** -> **Descargar Backup**. Guarda ese archivo `.json` en una carpeta compartida de tu red local (o en Dropbox/OneDrive/Google Drive si quieres acceso fuera del taller).
3. Abre la URL en el terminal 2 (Tablet/Móvil/Otro PC).
4. Ve a **Ajustes** -> **Seleccionar Archivo Maestro** y elige el mismo archivo que guardaste en el paso 2.
5. ¡Listo! Ambos terminales leerán y escribirán en el mismo archivo centralizado.

## 3. Ventajas
- **Gratis**: Sin costes de servidor.
- **Privado**: Los datos de tus clientes están en tu archivo, no en una base de datos pública.
- **Offline**: Si internet falla, la app sigue funcionando localmente.
