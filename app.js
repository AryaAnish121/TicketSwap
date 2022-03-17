require('dotenv').config();
const puppeteer = require('puppeteer');

var buyingTickets = false;

const main = async () => {
  // check for login url/link

  const LOGIN_URL = process.env.LOGIN_URL;

  if (!LOGIN_URL) {
    return console.log('No LOGIN_URL was provided');
  }

  // create a browser

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized'],
  });
  const page = await browser.newPage();
  await page.setViewport({
    width: 1600,
    height: 900,
  });

  // set interception

  await page.setRequestInterception(true);
  page.on('request', (request) => {
    if (request.resourceType() === 'image') request.abort();
    else request.continue();
  });

  // login

  await page.goto(LOGIN_URL);

  // check if link is valid (waitfor 30s)

  try {
    await page.waitForNavigation();
  } catch (error) {
    console.log('Link was invalid');
    return browser.close();
  }
  await page.waitForTimeout(1000);
  console.log('logged in');

  // go to the event

  await page.goto(process.env.EVENT);

  // buy tickets
  const buyTickets = async (interval) => {
    // if already buying tickets cancel the current and next functions

    if (buyingTickets) {
      if (interval) {
        return clearInterval(interval);
      }
    }

    console.log('trying...');

    // reloaod and check if there are any tickets available

    try {
      await page.reload();
    } catch (error) {
      console.log('another problem');
    }

    // get the link for the first ticket

    const url = await page.evaluate(() => {
      const tickets = document.querySelectorAll('.e6fq7ah6');
      if (tickets.length !== 0) {
        const url = document.querySelector('.e6fq7ah6 > a').href;
        return url;
      }
    });

    // if there are is ticket available buy it

    if (url) {
      buyingTickets = true;

      // cancel upcomming intervals

      if (interval) {
        clearInterval(interval);
      }

      await page.goto(url);
      try {
        await page.waitForTimeout(100);
        await page.evaluate(() => {
          const increaseButton = document.querySelector(
            'button[data-testid=increase-qty]'
          );
          if (increaseButton) {
            increaseButton.click();
            return;
          }
        });
        await page.waitForTimeout(100);
        await page.waitForSelector('.e1nefpxg2 > .e1dvqv261');
        await page.click('.e1nefpxg2 > .e1dvqv261');
        await page.waitForTimeout(4000);
        await browser.close();
        console.log('Done');
      } catch (error) {
        console.log('problem');
      }
    }
  };

  // try to buy tickets once and then try every 3 sec

  buyTickets();
  const interval = setInterval(() => {
    buyTickets(interval);
  }, 1500);
};

main();
