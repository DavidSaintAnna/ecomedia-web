import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  // strictPort: se a porta 5173 estiver ocupada o Vite avisa em vez de trocar para 5174,
  // porque a API só aceita requisições vindas de http://localhost:5173 (CORS).
  server: { port: 5173, strictPort: true },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    css: false,
  },
});
