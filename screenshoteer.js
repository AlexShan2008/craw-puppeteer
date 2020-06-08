#!/usr/bin/env node

const fs = require('fs');
const puppeteer = require('puppeteer');
const devices = require('puppeteer/DeviceDescriptors');
const program = require('commander');

program
  .option('--url, [url]', 'The url')
  .option('--emulate, [emulate]', 'emulate device')
  .option('--fullpage, [fullpage]', 'Full Page')
  .option('--pdf, [pdf]', 'Generate PDF')
  .option('--w, [w]', 'width')
  .option('--h, [h]', 'height')
  .option('--waitfor, [waitfor]', 'Wait time in milliseconds')
  .option('--waitforselector, [waitforselector]', 'Wait for the selector to appear in page')
  .option('--el, [el]', 'element css selector')
  .option('--auth, [auth]', 'Basic HTTP authentication')
  .option('--no, [no]', 'Exclude')
  .option('--click, [click]', 'Click')
  .option('--file, [file]', 'Output file')
  .option('--timeout, [timeout]', 'Time out')
  .parse(process.argv);

if (!program.url) {
  console.log('Please add --url parameter.\n' + 'Something like this: $ screenshoteer --url http://www.example.com');
  process.exit();
}

!program.fullpage ? (program.fullPage = true) : (program.fullPage = JSON.parse(program.fullpage));

!program.timeout ? (program.timeout = 60000) : Number(program.timeout);

// console.log(program.url);
// console.log(program.fullPage);

(async () => {
  try {
    await execute();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }

  async function execute() {
    const browser = await puppeteer.launch({
      // headless: false,
      // slowMo: 250,
      // headless: true,
      timeout: program.timeout,
      ignoreHTTPSErrors: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    if (program.no) {
      await page.setRequestInterception(true);
      page.on('request', request => {
        if (request.resourceType() === program.no) request.abort();
        else request.continue();
      });
    }

    const timestamp = new Date().getTime();
    if (program.w || program.h) {
      const newWidth = !program.w ? 600 : program.w;
      const newHeight = !program.h ? '0' : program.h;
      if (program.h && !program.fullpage) program.fullPage = false;
      await page.setViewport({
        width: Number(newWidth),
        height: Number(newHeight)
      });
    }
    if (program.emulate) await page.emulate(devices[program.emulate]);
    else program.emulate = '';

    if (program.auth) {
      const [username, password] = program.auth.split(';');
      await page.authenticate({ username, password });
    }
    await page.goto(program.url, {
      timeout: program.timeout,
      waitUntil: ['domcontentloaded', 'networkidle0', 'networkidle2']
    });
    const title = (await page.title()).replace(/[/\\?%*:|"<>]/g, '-');
    if (program.waitfor) await page.waitFor(Number(program.waitfor));
    if (program.waitforselector) await page.waitForSelector(program.waitforselector);
    if (program.click) await page.click(program.click);

    const defaultFile = `${title} ${program.emulate} ${timestamp}`;

    const file = program.file ? program.file : defaultFile;
    if (program.el) {
      const el = await page.$(program.el);
      await el.screenshot({ path: file });
    } else {
      await page.screenshot({ path: file + '.png', fullPage: program.fullPage });
      const html = await page.content();
      fs.writeFileSync(file + '.html', html);
    }

    await page.emulateMedia('screen');
    if (program.pdf) await page.pdf({ path: defaultFile + '.pdf' });
    console.log(title);
    console.log(page.url());


    // 从http 请求中寻找 .apk 结尾的 url
    let apkDownloadUrl = '';
    await page.setRequestInterception(true);
    const request_handler = async interceptedRequest => {
      if (apkDownloadUrl) {
        return
      }
      if (interceptedRequest.url().endsWith('.apk')) {
        apkDownloadUrl = interceptedRequest.url()
        console.log(apkDownloadUrl + '================apk================ url')
        interceptedRequest.abort();
      } else {
        interceptedRequest.continue();
      }
    }
    page.on('request', request_handler);

    //check if the page redirects
    let url_redirected = false;
    const response_handler = response => {
      const status = response.status()
      if ((status >= 300) && (status <= 399)) {
        url_redirected = true;
      }
    };
    page.on('response', response_handler);
    if (url_redirected) {
      await page.waitForNavigation({
        waitUntil: ['domcontentloaded', 'networkidle0', 'networkidle2']
      })
    };

    var response_event_occurred = false;
    const MAX_WAITING_TIME_ACCESS_URL = 1000;
    var response_handler2 = function (event) { response_event_occurred = true; };

    var responseWatcher = new Promise(function (resolve, reject) {
      setTimeout(function () {
        if (!response_event_occurred) {
          resolve(true);
        } else {
          setTimeout(function () { resolve(true); }, MAX_WAITING_TIME_ACCESS_URL);
        }
        page.removeListener('response', response_handler2);
      }, 500);
    });

    page.on('response', response_handler2);
    await Promise.race([
      responseWatcher,
      page.waitForNavigation()
    ]);

    // page.on('console', msg => console.log('PAGE LOG:', msg.text())); // for debug

    const frame = page.mainFrame();
    const childFrame = frame.childFrames();
    const hasChildFrame = childFrame && childFrame.length;

    // 触发 DOM 的点击事件
    const triggerDomClick = async () => {
      await page.evaluate(async () => {
        const triggerTagList = ['div', 'img', 'button', 'a'];
        for (const tag of triggerTagList) {
          const list = document.querySelectorAll(tag);
          await Array.from(list).map(item => {
            item.click()
          })
        }
      })
    }

    await triggerDomClick().catch(e => {
      console.error(e)
    })

    // 处理 iframe 嵌套的页面，暂时只处理 两级 iframe

    if (!apkDownloadUrl && hasChildFrame) {
      const childFrameUrl = childFrame[0].url();
      await page.goto(childFrameUrl, {
        timeout: program.timeout,
        waitUntil: ['networkidle2']
      });
      await triggerDomClick();
    }

    await page.on('requestfailed', async res => {
      await browser.close();
    })

    await page.removeAllListeners('request');
    await page.removeAllListeners('response');
    await browser.close();
  }
})().catch(e => { console.error(e) });
