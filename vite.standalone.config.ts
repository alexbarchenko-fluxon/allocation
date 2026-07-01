import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import path from 'path';

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  build: {
    outDir: 'standalone',
    assetsInlineLimit: 100000000, // inline all assets (avatars) as base64
    rollupOptions: { input: path.resolve(__dirname, 'standalone.html') },
    chunkSizeWarningLimit: 100000,
  },
});
