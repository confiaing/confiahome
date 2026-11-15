import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { buildSvgAssets, iconSvg, ogImagePng } from "./lib/brand-assets.ts";

// Regenera public/brand/ y public/favicon.ico. Ejecutar con `npm run brand:build`
// tras cambiar la paleta, la geometría del logo o las fuentes.

const PUBLIC = fileURLToPath(new URL("../public/", import.meta.url));
const BRAND = `${PUBLIC}brand/`;

function png(svg: string, size: number): Promise<Buffer> {
  return sharp(Buffer.from(svg), { density: (72 * size) / 64 })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/** Un .ico con una sola imagen PNG incrustada. */
function ico(image: Buffer, size: number): Buffer {
  const header = Buffer.alloc(22);
  header.writeUInt16LE(0, 0); // reservado
  header.writeUInt16LE(1, 2); // tipo: icono
  header.writeUInt16LE(1, 4); // número de imágenes
  header.writeUInt8(size, 6);
  header.writeUInt8(size, 7);
  header.writeUInt16LE(1, 10); // planos
  header.writeUInt16LE(32, 12); // bits por píxel
  header.writeUInt32LE(image.length, 14);
  header.writeUInt32LE(22, 18); // posición de la imagen
  return Buffer.concat([header, image]);
}

mkdirSync(BRAND, { recursive: true });

const svgs = buildSvgAssets();
for (const [name, content] of Object.entries(svgs)) writeFileSync(BRAND + name, content);

const favicon32 = await png(iconSvg({ rounded: true }), 32);
writeFileSync(`${BRAND}favicon-32.png`, favicon32);
// iOS recorta el icono con su propia máscara: se entrega sin esquinas redondeadas.
writeFileSync(`${BRAND}apple-touch-icon.png`, await png(iconSvg({ rounded: false }), 180));
writeFileSync(`${PUBLIC}favicon.ico`, ico(favicon32, 32));

// Imagen para compartir en redes, una por idioma (1200×630).
for (const locale of ["es", "en"] as const) {
  writeFileSync(`${BRAND}og-${locale}.png`, await ogImagePng(locale));
}

console.log(`Archivos de marca generados: ${Object.keys(svgs).length} SVG, 2 PNG, 2 imágenes para redes y favicon.ico`);
