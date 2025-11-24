/**
 * Generates an HTML report from Cucumber JSON results using multiple-cucumber-html-reporter.
 * Supports per-browser report directories and includes run metadata.
 */

const reporter = require('multiple-cucumber-html-reporter');

const browserName = process.env.BROWSER_NAME || 'chromium';

reporter.generate({
  jsonDir: 'reports',
  reportPath: `reports/html-report-${browserName}`,
  metadata: {
    browser: {
      name: browserName,
      version: 'latest', // Optionally fetch actual browser version if needed
    },
    device: 'Local test machine',
    platform: {
      name: process.platform,
      version: process.version,
    },
  },
  customData: {
    title: 'Run info',
    data: [
        { label: 'Project', value: 'Stackiv' },
      { label: 'Release', value: '1.0.0' },
      { label: 'Browser', value: browserName },
      { label: 'Execution Start Time', value: new Date().toLocaleString() },
    ],
  },
});