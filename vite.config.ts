import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, type PluginOption, type UserConfig } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(async (): Promise<UserConfig> => {
  const { VitePWA } = await import('vite-plugin-pwa');
  const pwaPlugins: PluginOption[] = [
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'prompt',
      injectRegister: null,
      manifest: false,
      devOptions: {
        enabled: true,
        type: 'classic',
      },
      injectManifest: {
        rollupFormat: 'iife',
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        // Keep the initial precache compact and rock-solid so iOS Safari installs reliably.
        // Secondary lazy routes and media are cached automatically at runtime by src/sw.ts.
        globPatterns: [
          'index.html',
          'manifest.json',
          'icon.png',
          'interaction-guard.js',
          'guest-fan-avatar.svg',
          'assets/app-*.{js,css}',
          'assets/vendor-core-*.js',
          'assets/vendor-firebase-*.js',
          'assets/vendor-icons-*.js',
          'assets/vendor-motion-*.js',
          'assets/firebase-*.js',
          'assets/PWAInstallPrompt-*.js',
          'assets/MusicPlayer-*.js',
          'assets/News-*.js',
          'assets/NewsDetail-*.js',
          'assets/Matches-*.js',
          'assets/*Widget-*.js',
        ],
        globIgnores: [
          '**/storage/**',
          '**/games/**',
          '**/assets/aistudio/**',
          '**/ads/**',
          '**/*migration-report*.json',
          '**/cloudinary-backup-index.json',
          '**/OneSignalSDK*.js',
          '**/firebase-messaging-sw.js',
          '**/Admin*',
          '**/vendor-charts*',
          '**/vendor-hls*',
          '**/vendor-html2canvas*',
          '**/vendor-zip*',
        ],
      },
    }),
  ];
  return {
    plugins: [
      react(),
      tailwindcss(),
      ...pwaPlugins,
    ],
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      emptyOutDir: true,
      sourcemap: false,
      rollupOptions: {
        input: { app: path.resolve(__dirname, "index.html"), gameAccount: path.resolve(__dirname, "game-account.html") },
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('firebase')) {
                return 'vendor-firebase';
              }
              if (id.includes('framer-motion') || id.includes('motion')) {
                return 'vendor-motion';
              }
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }
              if (id.includes('hls.js')) {
                return 'vendor-hls';
              }
              if (id.includes('html2canvas')) {
                return 'vendor-html2canvas';
              }
              if (id.includes('recharts') || id.includes('d3')) {
                return 'vendor-charts';
              }
              if (id.includes('jszip')) {
                return 'vendor-zip';
              }
              return 'vendor-core';
            }
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
      dedupe: ['react', 'react-dom', 'react-router-dom'],
    },
    optimizeDeps: {
      entries: ['index.html'],
      holdUntilCrawlEnd: false,
      include: [
        'react',
        'react-dom',
        'react-dom/client',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'react-router-dom',
      ],
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      allowedHosts: true,
      hmr: false,
      ws: false,
    },
  };
});
