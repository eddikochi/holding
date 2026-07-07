import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base relativa: o build em dist/ funciona aberto direto do disco (local-first)
export default defineConfig({
  plugins: [react()],
  base: './',
});
