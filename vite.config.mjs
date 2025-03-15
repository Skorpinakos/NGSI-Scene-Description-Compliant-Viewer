import { defineConfig } from 'vite';
import crossOriginIsolation from 'vite-plugin-cross-origin-isolation';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  plugins: [crossOriginIsolation()],
  server: {
    host: '0.0.0.0', 
    port: 8001,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    }
  }
});
