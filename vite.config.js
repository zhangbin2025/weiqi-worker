import { defineConfig } from 'vite';
import { resolve } from 'path';

// 只构建 Worker 的配置。
// 引擎实现来自 src/upstream/engine/katago/worker.ts（上游 web-katrain + patches）。
// 产物路径固定为 dist/assets/worker.js，weiqi-bot 的 setWorkerUrl 依赖此路径。
export default defineConfig({
  build: {
    target: 'esnext',
    rollupOptions: {
      input: {
        'assets/worker': resolve(__dirname, 'src/upstream/engine/katago/worker.ts')
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
