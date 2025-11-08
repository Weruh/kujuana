import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const devAllowedHosts = env.VITE_DEV_ALLOWED_HOSTS?.split(',')
    .map((host) => host.trim())
    .filter(Boolean);

  return {
    base: './',
    plugins: [react()],
    build: {
      outDir: env.VITE_BUILD_OUT_DIR || 'dist',
      assetsDir: env.VITE_BUILD_ASSETS_DIR || 'assets',
      sourcemap: mode !== 'production',
    },
    server: {
      port: toNumber(env.VITE_DEV_PORT, 5173),
      host: env.VITE_DEV_HOST || '0.0.0.0',
      allowedHosts: devAllowedHosts?.length ? devAllowedHosts : ['localhost'],
      proxy: {
        '/api': {
          target: env.VITE_PROXY_TARGET || 'http://localhost:4000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    preview: {
      port: toNumber(env.VITE_PREVIEW_PORT, 4173),
      host: env.VITE_PREVIEW_HOST || '0.0.0.0',
    },
  };
});
