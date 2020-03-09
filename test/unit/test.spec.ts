import { expect } from 'chai'
import { launch, Browser } from 'puppeteer';

// puppeteer options
const opts = {
    headless: true,
    slowMo: 100,
    timeout: 10000
};
let browser: Browser;

before(async function() {
    browser = await launch(opts);
});

after(function() {
    browser.close();
});

describe('hooks', function() {
    it('should work', async function () {
        console.log(await browser.version());

        expect(true).to.be.true;
    });
});