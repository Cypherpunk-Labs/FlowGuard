import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts', 'tests/**/*.{test,spec}.ts'],
    exclude: [
      'node_modules',
      'out',
      'dist',
      '**/*.d.ts',
      'src/ui/**',
      '**/node_modules/**'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 60,
        statements: 60
      },
      exclude: [
        'src/ui/**',
        '**/__tests__/**',
        '**/node_modules/**',
        '**/*.d.ts',
        'out/**',
        'dist/**',
        'tests/**'
      ],
      include: ['src/**/*.ts']
    },
    testTimeout: 10000,
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
});
