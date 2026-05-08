/**
 * Playwright 설정 — E2E 테스트.
 *
 * - dev-server.js 를 자동 기동 (port 3001)
 * - chromium 만 사용 (속도)
 * - 모든 AI 호출은 page.route() 로 mock — 외부 API 비용·flakiness 제거
 */
import { defineConfig, devices } from '@playwright/test';

const PORT = 3001;

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.mjs',
  timeout: 30_000,
  retries: 0,
  reporter: [['list', { printSteps: false }]],
  fullyParallel: false,   // 단일 dev-server 공유라 직렬 실행
  workers: 1,
  use: {
    baseURL: `http://localhost:${PORT}`,
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: `PORT=${PORT} node dev-server.js`,
    url: `http://localhost:${PORT}`,
    timeout: 10_000,
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
