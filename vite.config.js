import { defineConfig } from 'vite';
import { resolve } from 'path';

// 只构建 Worker 的配置
export default defineConfig({
  build: {
    target: 'esnext',
    rollupOptions: {
      input: {
        'assets/worker': resolve(__dirname, 'src/katago/worker.ts')
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      }
    },
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    minify: 'esbuild'
  }
});
