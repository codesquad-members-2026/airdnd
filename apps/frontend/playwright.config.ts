import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  // e2e는 실제 백엔드(http://127.0.0.1:8080)가 떠 있어야 합니다.
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI,
    env: {
      VITE_API_BASE_URL: 'http://127.0.0.1:8080',
      VITE_OAUTH_BASE_URL: 'http://127.0.0.1:8080',
      VITE_ENABLE_MOCKS: 'true',
      // e2e에서는 실제 Google Maps 로딩을 막아 외부 의존성/플래키를 제거합니다.
      VITE_GOOGLE_MAPS_API_KEY: '',
    },
  },
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
