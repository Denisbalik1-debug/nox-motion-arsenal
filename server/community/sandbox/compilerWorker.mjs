import { resolve } from 'node:path';
import { build } from 'vite';
import react from '@vitejs/plugin-react';

const root = resolve(process.argv[2]);

const result = await build({
  root,
  base: './',
  configFile: false,
  logLevel: 'silent',
  esbuild: { tsconfigRaw: '{}' },
  css: { postcss: { plugins: [] } },
  plugins: [react()],
  resolve: {
    alias: { '@': resolve(root, 'source/src') },
    dedupe: ['react', 'react-dom'],
  },
  server: {
    fs: { allow: [root] },
  },
  build: {
    outDir: resolve(root, 'dist'),
    emptyOutDir: true,
    sourcemap: false,
    cssCodeSplit: false,
    target: 'es2022',
    rollupOptions: {
      output: {
        entryFileNames: 'assets/preview.js',
        chunkFileNames: 'assets/chunk-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
});

const outputs = Array.isArray(result) ? result.flatMap((item) => item.output) : result.output;
process.stdout.write(JSON.stringify({
  files: outputs.map((item) => item.fileName),
  warnings: [],
}));
