const { Given, When, Then, Before, After } = require('@cucumber/cucumber');
const assert = require('assert');
const BrowserHelper = require('../utils/browserHelper'); // Import the helper class

let browserHelper;

Before(async function () {
  browserHelper = new BrowserHelper();
  await browserHelper.launchBrowser(); // Launch the browser
  this.page = await browserHelper.getPage(); // Attach the page to `this` for access in steps
});

After(async function () {
  await browserHelper.closeBrowser(); // Close the browser after the test
});

Given('I am on the homepage', async function () {
  try {
    await this.page.goto('http://localhost:3001'); // Navigate to your URL
    // Log to console or use Playwright's built-in reporter for status info
    console.log('Successfully navigated to homepage');
  } catch (err) {
    console.error(`Failed to navigate to homepage: ${err.message}`);
  }
});

Then('I should see title as {string}', async function (expectedTitle) {
  try {
    const actualTitle = await this.page.title();
    // Check if the title matches the expected title
    assert.strictEqual(actualTitle, expectedTitle, `Expected title to be "${expectedTitle}" but got "${actualTitle}"`);
    // Log to console or use Playwright's built-in reporter for status info
    console.log(`Title is as expected: ${expectedTitle}`);
  } catch (err) {
    console.error(`Title mismatch. Expected: ${expectedTitle}, but got: ${err.message}`);
  }
});
