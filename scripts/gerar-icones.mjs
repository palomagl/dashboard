// Gera os ícones do PWA e as telas de abertura do iOS a partir de public/logo.svg.
//
// Rode com: npm run icones
//
// As telas de abertura existem porque o iOS ignora a splash do manifest: sem
// elas, o que aparece entre tocar no ícone e o React carregar é uma tela branca.

import sharp from "sharp";
import { readFile, mkdir } from "node:fs/promises";

const LOGO = await readFile("public/logo.svg");

const FUNDO_ESCURO = "#0a0a14"; // igual ao background_color do manifest
const FUNDO_CLARO = "#f5f6f8"; // igual ao --background do tema claro

/** A marca sozinha, com fundo transparente, no tamanho pedido. */
async function marca(lado) {
  return sharp(LOGO, { density: 512 })
    .resize(lado, lado, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
}

/** Ícone do app: a marca sobre uma placa branca cheia. O sistema arredonda. */
async function icone(lado, saida) {
  const simbolo = await marca(Math.round(lado * 0.78));
  await sharp({
    create: { width: lado, height: lado, channels: 4, background: "#FFFFFF" },
  })
    .composite([{ input: simbolo, gravity: "center" }])
    .png()
    .toFile(saida);
}

/** Tela de abertura do iOS: a marca centralizada sobre o fundo do app. */
async function abertura(largura, altura, fundo, saida) {
  const simbolo = await marca(Math.round(Math.min(largura, altura) * 0.26));
  await sharp({
    create: { width: largura, height: altura, channels: 4, background: fundo },
  })
    .composite([{ input: simbolo, gravity: "center" }])
    .png()
    .toFile(saida);
}

// iPhones em retrato: largura e altura em CSS px, e a densidade de pixels.
// O arquivo gerado tem largura*dpr por altura*dpr.
export const APARELHOS = [
  { w: 375, h: 667, dpr: 2 }, // SE 2/3, 8
  { w: 414, h: 736, dpr: 3 }, // 8 Plus
  { w: 375, h: 812, dpr: 3 }, // X, XS, 11 Pro
  { w: 414, h: 896, dpr: 2 }, // XR, 11
  { w: 414, h: 896, dpr: 3 }, // XS Max, 11 Pro Max
  { w: 390, h: 844, dpr: 3 }, // 12, 13, 14
  { w: 428, h: 926, dpr: 3 }, // 12/13 Pro Max, 14 Plus
  { w: 393, h: 852, dpr: 3 }, // 14 Pro, 15, 16
  { w: 430, h: 932, dpr: 3 }, // 14 Pro Max, 15 Pro Max
  { w: 402, h: 874, dpr: 3 }, // 16 Pro
  { w: 440, h: 956, dpr: 3 }, // 16 Pro Max
];

await mkdir("public/splash", { recursive: true });

await icone(192, "public/pwa-192x192.png");
await icone(512, "public/pwa-512x512.png");
await icone(180, "public/apple-touch-icon.png");
console.log("ícones do app: ok");

for (const { w, h, dpr } of APARELHOS) {
  for (const [tema, fundo] of [
    ["dark", FUNDO_ESCURO],
    ["light", FUNDO_CLARO],
  ]) {
    await abertura(w * dpr, h * dpr, fundo, `public/splash/${w}x${h}@${dpr}x-${tema}.png`);
  }
}
console.log(`telas de abertura: ${APARELHOS.length * 2} arquivos`);
