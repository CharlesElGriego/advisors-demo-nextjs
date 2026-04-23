import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  use: {
    baseURL: 'http://127.0.0.1:3100',
    trace: 'on-first-retry'
  },
  webServer: {
    command: 'npm run dev -- --hostname 127.0.0.1 --port 3100',
    port: 3100,
    reuseExistingServer: false,
    env: {
      NEXT_PUBLIC_AVAILABILITY_POLLING_INTERVAL_MS: '150',
      NEXT_PUBLIC_ENABLE_API_FALLBACK: 'true'
    }
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome']
      }
    }
  ]
});
