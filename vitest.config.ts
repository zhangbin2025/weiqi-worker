/**
 * Vitest 配置文件
 */

import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    // 测试环境
    environment: 'node',
    
    // 全局变量
    globals: true,
    
    // 测试文件模式
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    
    // 排除目录
    exclude: ['node_modules', 'dist'],
    
    // 覆盖率配置
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/tests/**',
      ],
    },
    
    // 超时时间
    testTimeout: 10000,
    hookTimeout: 10000,
  },
  
  // 路径解析
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@core': resolve(__dirname, 'src/core'),
      '@board': resolve(__dirname, 'src/board'),
      '@features': resolve(__dirname, 'src/features'),
      '@model': resolve(__dirname, 'src/model'),
      '@search': resolve(__dirname, 'src/search'),
      '@analysis': resolve(__dirname, 'src/analysis'),
      '@worker': resolve(__dirname, 'src/worker'),
      '@backend': resolve(__dirname, 'src/backend'),
      '@utils': resolve(__dirname, 'src/utils'),
    },
  },
});
