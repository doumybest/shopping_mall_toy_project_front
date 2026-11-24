import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: './tests/e2e', outputDir: '.test-results', workers: 1, timeout: 60000,
  use: { baseURL: 'http://localhost:5174', channel: process.env.E2E_BROWSER || 'msedge', headless: true, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  webServer: [
    { command: 'node tests/start-backend.mjs', url: 'http://localhost:18080/api/health', timeout: 90000, reuseExistingServer: false },
    { command: 'node node_modules/vite/bin/vite.js --port 5174', url: 'http://localhost:5174', env: { API_PROXY_TARGET: 'http://localhost:18080' }, reuseExistingServer: false },
  ],
})
