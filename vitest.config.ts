import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        '__tests__/**',
        '*.config.{js,ts}',
        '.vercel/**',
        'coverage/**',
        'models/**',
        // DOM-wiring only; the pure formatting/geometry logic they call has been
        // extracted into gaugeFormatting.js/retroFormatting.js, which are covered.
        'public/cockpit.js',
        'public/retro.js',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
});
