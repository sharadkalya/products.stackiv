module.exports = {
  testDir: './automation',  // Specify the test directory
  timeout: 30000,  // Set a timeout for each test
  retries: 1,  // Number of retries for failed tests
  use: {
    headless: false,  // Run in non-headless mode for debugging
    viewport: { width: 1280, height: 720 },  // Set a default viewport
    actionTimeout: 5000,  // Timeout for actions like click, type, etc.
    video: 'retain-on-failure',  // Capture video for failing tests
    screenshot: 'only-on-failure',  // Capture screenshots for failing tests
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },  // Set browser to chromium
    },
    {
      name: 'firefox',
      use: { browserName: 'firefox' },  // Set browser to firefox
    }
  ],
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'always' }],  // Specify the HTML reporter
  ],
};
