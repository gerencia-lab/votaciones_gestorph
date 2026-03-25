import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
// Fix: Import process explicitly from node:process to ensure standard Node.js types are used
import process from 'node:process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  // Fix: Using process.cwd() requires the process object to be correctly typed/imported
  const env = loadEnv(mode, process.cwd(), '');

  return {
    server: {
      port: 3010,
      host: '0.0.0.0',
      allowedHosts: true,
    },
    preview: {
      port: 8080,
      host: '0.0.0.0',
      allowedHosts: true,
    },
    plugins: [react()],
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: false
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});