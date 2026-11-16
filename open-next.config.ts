import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

// Todas las páginas son estáticas, generadas al construir. Con esta caché el Worker las
// sirve tal cual desde los archivos estáticos en vez de volver a renderizarlas en cada
// visita: menos CPU (el plan gratuito la limita) y sin los errores 500 intermitentes que
// daba el render simultáneo en producción (2026-11-16).
export default defineCloudflareConfig({ incrementalCache: staticAssetsIncrementalCache });
