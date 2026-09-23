import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Os testes rodam no fuso de quem usa o app, não em UTC. Sem isso, um teste
// de virada de dia passa numa máquina em UTC e esconde o bug de verdade:
// marcar um hábito às 22h em Porto Alegre cair no dia seguinte.
process.env.TZ = "America/Sao_Paulo";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}", "api/**/*.{test,spec}.ts"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
