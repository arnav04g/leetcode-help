// import puppeteer from 'puppeteer';

// (async () => {
//   // Launch the browser and open a new blank page
//   const browser = await puppeteer.launch();
//   const page = await browser.newPage();

//   // Navigate the page to a URL
//   await page.goto('https://developer.chrome.com/');

//   // Set screen size
//   await page.setViewport({ width: 1080, height: 1024 });

//   // Type into search box
//   await page.type('.devsite-search-field', 'automate beyond recorder');

//   // Wait for search results and click on the first result
//   await page.waitForSelector('.devsite-result-item');
//   await page.click('.devsite-result-item a');

//   // Wait for the title to load and get its text
//   await page.waitForSelector('h1');
//   const fullTitle = await page.$eval('h1', el => el.textContent);

//   // Print the full title
//   console.log('The title of this blog post is "%s".', fullTitle);

//   // Close the browser
//   await browser.close();
// })();

const puppeteer = require('puppeteer');
(async() =>{
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://www.google.com');
    await page.screenshot({path: 'example.png'});
    await browser.close();
})();
