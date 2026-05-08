import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    environment: 'node',
    // Phase L-2 — .test.tsx 도 포함 (RN 컴포넌트 smoke 테스트). RN flow 파싱은
    // tests/setup/reactNativeMock.ts 의 vi.mock 으로 우회.
    include: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
    exclude: ['node_modules/**', 'dist/**', '.expo/**'],
    setupFiles: ['./tests/setup/reactNativeMock.ts'],
  },
});
