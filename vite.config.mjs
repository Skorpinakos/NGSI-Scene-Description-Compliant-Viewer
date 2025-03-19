import { defineConfig, loadEnv } from 'vite';
import crossOriginIsolation from 'vite-plugin-cross-origin-isolation';
import fs from 'fs';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  // explicitly define useHttps from your environment variables
  const useHttps = env.VITE_USE_HTTPS === 'true';

  return {
    plugins: [crossOriginIsolation()],
    server: {
      host: '0.0.0.0',
      port: 8001,
      allowedHosts: ['localhost','labserver.sense-campus.gr'],
      https: useHttps
        ? {
            key: fs.readFileSync(path.resolve(__dirname, 'ssl/certs/privkey.pem')),
            cert: fs.readFileSync(path.resolve(__dirname, 'ssl/certs/fullchain.pem')),
          }
        : false,
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
      },
    },
  };
});
