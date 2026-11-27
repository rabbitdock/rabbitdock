import { defineConfig } from 'vitest/config'

// Unit tests sit next to the code as *.test.ts. The default pattern also matches *.spec.ts, which
// would pick up the Playwright smoke tests in e2e/.
export default defineConfig({
    test: {
        include: ['src/**/*.test.ts'],
    },
})
