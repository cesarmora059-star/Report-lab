# VetLabAssistant — versión GitHub Pages

Esta versión funciona sin Python ni servidor backend. Todo se ejecuta en el navegador.

## Publicar en GitHub Pages
1. Sube el contenido de esta carpeta a la raíz del repositorio.
2. GitHub → Settings → Pages.
3. Source: **Deploy from a branch**.
4. Branch: **main** y carpeta **/(root)**.
5. Guarda.

## Funciones
- Cámara/selección de fotografía desde iPhone.
- OCR local en el navegador con Tesseract.js.
- Detección de especie y valores del hemograma.
- Revisión manual de resultados y rangos.
- Reporte en pantalla.
- PDF generado en el navegador.
- Documento compatible con Microsoft Word (.doc) generado en el navegador.

## Importante
- El primer OCR requiere Internet para descargar Tesseract.js y sus datos de idioma desde CDN.
- El procesamiento OCR ocurre en el dispositivo; la fotografía no se envía a un servidor propio de esta aplicación.
- Los datos del reporte se guardan temporalmente en `sessionStorage` del navegador, no en una base de datos compartida.
- GitHub Pages es hosting estático; esta arquitectura evita Python/Flask por completo.
