const browser = await puppeteer.launch();
const page = await browser.newPage();
const lpUrl = 'https://www.chengzijianzhan.com/tetris/page/6825606425697779724/?ad_id=1666450529499155&_toutiao_params=%7B%22cid%22%3A1666451997303832%2C%22device_id%22%3A70549905408%2C%22log_extra%22%3A%22%7B%5C%22ad_price%5C%22%3A%5C%22Xrj7lwADc3teuPuXAANze2O_1jRTbdSiZwIUJg%5C%22%2C%5C%22convert_id%5C%22%3A1666107244685316%2C%5C%22orit%5C%22%3A900000000%2C%5C%22req_id%5C%22%3A%5C%22d386396e-9455-11ea-b746-00163e0015dcu6141%5C%22%2C%5C%22rit%5C%22%3A901085015%7D%22%2C%22orit%22%3A900000000%2C%22req_id%22%3A%22d386396e-9455-11ea-b746-00163e0015dcu6141%22%2C%22rit%22%3A901085015%2C%22sign%22%3A%22D41D8CD98F00B204E9800998ECF8427E%22%2C%22uid%22%3A70549905408%2C%22ut%22%3A12%7D'
const childlLpUrl = 'https://www.chengzijianzhan.com/tetris/page/6759501851160215559/?tag=pc_iframe&clickid=EI6Y0fTp3PoCGKy4oOKA9Z0HIKjuhPL1ATAMOOHaAUIiMjAyMDA1MDMxNjIwMTUwMTAwMDgwNzMwNDYyNENCNDg4Q0jBuAI&ad_id=1665649507519523&cid=1665651107449870&req_id=2020050316201501000807304624CB488C'
const lpUrlGdt = 'https://xj.gdt.qq.com/xjviewer/nemo/1652765/1110274642/29092/20201368893836?productType=38&qz_gdt=avbkcxqijqnepntkje6a&click_ext=eyJqdW1wX3l5Yl9yZWFkIjoxLCJwcm9kdWN0X3R5cGUiOjM4LCJzaG9ydF9wb3NfaWQiOjgzMzc4N30%3D&autodownload=0&gdt_ad_id=234225418&aidx=282202803&gdt_product_id=1110274642&gdt_subordinate_product_id=38539;29092&gdt_media_id=20201368893836&packageName=com.duoyu.mobile.lycb_gdt'
const lpUrlNew = 'https://www.chengzijianzhan.com/tetris/page/6747590347716558856/'
const lpUrlNoApk = 'https://www.chengzijianzhan.com/tetris/page/6829499598286258183/'
// await page.goto(lpUrl);
// await page.goto(childlLpUrl);
await page.goto(lpUrlGdt);

// 从http 请求中寻找 .apk 结尾的 url
let apkDownloadUrl = ''
const request_handler = interceptedRequest => {
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

await page.setRequestInterception(true);
page.on('request', request_handler);

// 触发 DOM 的点击事件
const triggerDomClick = async () => {
  const triggerTagList = ['div', 'img', 'button', 'a']
  for (const tag of triggerTagList) {
    const tags = await page.$$(tag)
    for (const item of tags) {
      item.click()
    }
  }
}

// 触发 DOM 的点击事件
// const triggerDomClick = async () => {
//   if (hasChildFrame) {
//     await page.evaluate(async () => {
//       const triggerTagList = ['div', 'img', 'button', 'a'];
//       for (const tag of triggerTagList) {
//         const list = document.querySelectorAll(tag);
//         await Array.from(list).map(item => {
//           item.click()
//         })
//       }
//     })
//   } else {
//     const triggerTagList = ['div', 'img', 'button', 'a']
//     for (const tag of triggerTagList) {
//       const tags = await page.$$(tag)
//       for (const item of tags) {
//         item.click()
//       }
//     }
//   }
// }

await triggerDomClick()

// 处理 iframe 嵌套的页面，暂时只处理 两级 iframe
const frame = page.mainFrame();
if (!apkDownloadUrl && frame) {
  const childFrame = frame.childFrames()
  if (childFrame) {
    await page.goto(childFrame[0].url());
    await triggerDomClick()
  }
}
await page.screenshot({ path: 'screenshot.png' });
await browser.close();

// ✅ 1. 无页面嵌套 2. 页面嵌套无SDK下载链接 3. 错误页面
// ❌ 1. 嵌套页面并且有SDK下载链接


if (!apkDownloadUrl && hasChildFrame) {
  const childFrameUrl = childFrame[0].url();
  await page.goto(childFrameUrl, {
    timeout: program.timeout,
    waitUntil: ['domcontentloaded']
  });
  await triggerDomClick();
}