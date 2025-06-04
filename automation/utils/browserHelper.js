const { chromium, firefox, webkit } = require('playwright'); // Import browsers

class BrowserHelper {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
  }

  async launchBrowser() {
    const browserName = process.env.BROWSER_NAME || 'chromium'; // Default to chromium if not specified
    const browserOptions = { headless: false };  // Set to `true` for headless mode

    console.log(`Launching ${browserName}...`);

    switch (browserName) {
      case 'firefox':
        this.browser = await firefox.launch(browserOptions);
        break;
      case 'webkit':
        this.browser = await webkit.launch(browserOptions);
        break;
      case 'chromium':
      default:
        this.browser = await chromium.launch(browserOptions);
        break;
    }

    console.log(`${browserName} launched successfully!`);

    this.context = await this.browser.newContext();
    this.page = await this.context.newPage();
  }

  async closeBrowser() {
    await this.browser.close();
  }

  async navigateTo(url) {
    await this.page.goto(url);
  }

  async getPage() {
    return this.page;
  }
}

module.exports = BrowserHelper;
