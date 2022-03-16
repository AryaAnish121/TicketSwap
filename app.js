require('dotenv').config();
const https = require('https');
const puppeteer = require('puppeteer');

const sendMessage = (message) => {
  return new Promise((resolve, reject) => {
    var options = {
      method: 'POST',
      hostname: 'discord.com',
      path: '/api/v9/channels/953673596851609630/messages',
      headers: {
        'Content-Type': 'application/json',
        authorization: process.env.AUTHORIZATION,
        Cookie: process.env.COOKIE,
      },
      maxRedirects: 20,
    };

    var req = https.request(options, function (res) {
      var chunks = [];

      res.on('data', function (chunk) {
        chunks.push(chunk);
      });

      res.on('end', function (chunk) {
        resolve();
      });

      res.on('error', function (error) {
        console.error(error);
      });
    });

    var postData = JSON.stringify({
      content: message,
      tts: false,
    });

    req.write(postData);

    req.end();
  });
};

const main = () => {
  return new Promise(async (resolve, reject) => {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized'],
    });
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(0);
    await page.setViewport({
      width: 1600,
      height: 900,
    });
    await page.goto(process.env.LOGIN_URL);
    await page.waitForNavigation();
    await page.waitForTimeout(1000);
    await page.goto(
      'https://www.ticketswap.com/event/wicked-the-musical/recurring-monthly-april-tickets/baf8e418-64cf-42ae-b31f-c73a2056e9ca/1986747'
    );
    const interval = setInterval(async () => {
      console.log('trying...');
      try {
        await page.reload();
      } catch (error) {}
      const url = await page.evaluate(() => {
        const tickets = document.querySelectorAll('.e6fq7ah6');
        if (tickets.length !== 0) {
          const url = document.querySelector('.e6fq7ah6 > a').href;
          return url;
        }
      });
      if (url) {
        clearInterval(interval);
        await page.goto(url);
        try {
          await page.waitForTimeout(2000);
          await page.evaluate(() => {
            const increaseButton = document.querySelector(
              'button[data-testid=increase-qty]'
            );
            if (increaseButton) {
              increaseButton.click();
              return;
            }
          });
          await page.waitForTimeout(1000);
          await page.waitForSelector('.e1nefpxg2 > .e1dvqv261');
          await page.click('.e1nefpxg2 > .e1dvqv261');
          await page.waitForTimeout(4000);
          await sendMessage('Bought tickets');
          await browser.close();
          console.log('Done');
        } catch (error) {
          console.log('problem');
        }
      }
    }, 3000);
  });
};

main();
