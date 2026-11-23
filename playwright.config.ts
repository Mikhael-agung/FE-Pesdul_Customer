import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './e2e',
    timeout: 30_000,
    use: {
        baseURL: 'http://localhost:5173',
        trace: 'on-first-retry',
        launchOptions: { executablePath: process.env.PW_CHROMIUM || undefined },
    },
    projects: [
        { name: 'mobile', use: { ...devices['Pixel 7'] } },
        { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    ],
    webServer: { command: 'npm run dev', url: 'http://localhost:5173', reuseExistingServer: true },
});
