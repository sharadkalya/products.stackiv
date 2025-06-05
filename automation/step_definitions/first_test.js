/**
 * Step definitions for StayInn UI automation using Cucumber and Playwright/Puppeteer.
 * Handles browser setup/teardown and step logic for homepage navigation and title verification.
 */

const { Given, When, Then, Before, After } = require('@cucumber/cucumber');
const assert = require('assert');
const BrowserHelper = require('../utils/browserHelper');

let browserHelper;

/**
 * Before hook: Launches browser and attaches page to scenario context.
 */
Before(async function () {
  browserHelper = new BrowserHelper();
  await browserHelper.launchBrowser();
  this.page = await browserHelper.getPage();
});

/**
 * After hook: Closes the browser after each scenario.
 */
After(async function () {
  await browserHelper.closeBrowser();
});

/**
 * Step: Navigates to the homepage.
 */
Given('I am on the homepage', async function () {
  await this.page.goto('http://localhost:3001');
  console.log('Navigated to homepage');
});

/**
 * Step: Verifies the page title matches the expected value.
 */
Then('I should see title as {string}', async function (expectedTitle) {
  const actualTitle = await this.page.title();
  assert.strictEqual(
    actualTitle,
    expectedTitle,
    `Expected title to be "${expectedTitle}" but got "${actualTitle}"`
  );
  console.log(`Title verified: ${expectedTitle}`);
});