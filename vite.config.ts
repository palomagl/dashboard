import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    headers: {
      // O login do Google abre um popup, e o Firebase precisa enxergar quando
      // ele fecha. Sem esta política o navegador corta o vínculo entre a página
      // e o popup: a pessoa escolhe a conta e o app nunca fica sabendo.
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "robots.txt"],
      manifest: {
        name: "Minha Rotina - Dashboard Pessoal",
        short_name: "Minha Rotina",
        description: "Dashboard de organização pessoal com tarefas, hábitos, finanças e metas",
        theme_color: "#f5f6f8",
        background_color: "#f5f6f8",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        // As telas de abertura do iOS somam vários megabytes e quem as serve é
        // o Safari, antes do app existir. Guardá-las no cache do service worker
        // só engordaria o primeiro carregamento sem serventia nenhuma.
        globIgnores: ["**/splash/**"],
        // O service worker assume que toda navegação é uma rota do app e
        // devolve o index.html do cache. Só que /__/auth/ não é rota nossa:
        // é o handler do Google, servido por um proxy no vercel.json. Sem esta
        // exceção, o login por redirect volta do Google e cai no nosso 404 —
        // e redirect é justamente o caminho do app na tela inicial do iPhone.
        navigateFallbackDenylist: [/^\/__\/auth\//],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
