import { defineConfig } from 'vite';
import crossOriginIsolation from 'vite-plugin-cross-origin-isolation';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  plugins: [crossOriginIsolation()],
  server: {
    host: '0.0.0.0', 
    port: 8001,
    allowedHosts: ['labserver.sense-campus.gr'],
    https: {
      key: fs.readFileSync(path.resolve(__dirname, 'ssl/certs/privkey.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, 'ssl/certs/fullchain.pem'))
    },
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    }
  }
});
