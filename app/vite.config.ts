import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// base relativa + tudo inline (viteSingleFile): o build vira UM único index.html
// autocontido, que abre por duplo-clique (file://), sem servidor.
// HashRouter (em main.tsx) garante a navegação funcionando via file://.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  base: './',
});
