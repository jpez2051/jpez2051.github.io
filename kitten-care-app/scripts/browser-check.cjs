const { chromium } = require('playwright');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../../kitten-care');
const mime = { '.js':'application/javascript', '.css':'text/css', '.html':'text/html', '.svg':'image/svg+xml', '.webmanifest':'application/manifest+json' };
const server = http.createServer((request,response)=>{
  const pathname = decodeURIComponent(new URL(request.url,'http://localhost').pathname);
  const filename = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if(!filename.startsWith(root+path.sep)){response.writeHead(403);response.end();return}
  fs.readFile(filename,(error,data)=>{response.writeHead(error?404:200,{'Content-Type':mime[path.extname(filename)]||'application/octet-stream'});response.end(error?'Missing':data)});
});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const address=`http://127.0.0.1:${server.address().port}/`;
  const browser=await chromium.launch({headless:true,channel:'chrome'});
  try {
    const context=await browser.newContext({viewport:{width:390,height:844},timezoneId:'Pacific/Honolulu'});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(address,{waitUntil:'networkidle'});
    for(const width of [320,390,1280]){
      await page.setViewportSize({width,height:844});
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`Overflow at ${width}`);
    }
    await page.setViewportSize({width:390,height:844});
    await page.getByRole('button',{name:'Start guided setup'}).click();
    await page.getByLabel('Litter name *').fill('Browser safety test');
    await page.getByRole('button',{name:'Save & add kittens'}).click();
    await page.getByLabel('Name *',{exact:true}).fill('Mochi');
    await page.getByRole('button',{name:'Save & finish litter'}).click();
    await page.getByRole('button',{name:'Log a feeding',exact:true}).click();
    await page.getByRole('button',{name:'Review and save'}).click();
    assert.match(await page.getByRole('alert').innerText(),/positive amount/);
    await page.getByLabel('Amount eaten').fill('10');
    await page.getByRole('button',{name:'Review and save'}).click();
    await page.getByRole('button',{name:'Undo',exact:true}).waitFor();
    await page.getByRole('button',{name:'Undo',exact:true}).click();
    await page.waitForFunction(()=>JSON.parse(localStorage.getItem('a4a-kitten-care-app')).events.length===0);
    await page.getByRole('button',{name:/Mochi/}).click();
    await page.getByRole('button',{name:'Add medication'}).click();
    await page.getByLabel('Medication name *').fill('Test prescription');
    await page.getByLabel('Prescribed by or source *').fill('Rescue instructions');
    await page.getByLabel('Route *').selectOption('Oral');
    await page.getByLabel('Fixed amount *').fill('0.4');
    await page.getByLabel('Start date').fill('2026-10-19');
    await page.getByRole('button',{name:'Save medication plan'}).click();
    await page.getByRole('button',{name:'Log dose'}).click();
    await page.getByRole('button',{name:'Review and save'}).click();
    assert.match(await page.getByRole('alert').innerText(),/Confirm the kitten/);
    await page.getByLabel('Actual amount given *').fill('0.4');
    await page.getByRole('button',{name:'Review and save'}).click();
    assert.match(await page.getByRole('alert').innerText(),/Confirm the kitten/);
    await page.getByLabel('I confirmed the kitten').check();
    await page.getByRole('button',{name:'Review and save'}).click();
    await page.getByRole('button',{name:'Undo',exact:true}).waitFor();
    await page.getByRole('button',{name:'Settings & help',exact:true}).click();
    await page.getByRole('button',{name:'Close dialog'}).focus();
    await page.keyboard.press('Shift+Tab');
    assert.equal(await page.evaluate(()=>Boolean(document.activeElement.closest('[role="dialog"]'))),true);
    await page.getByRole('button',{name:'Close dialog'}).click();
    await page.evaluate(()=>navigator.serviceWorker.ready);
    await page.reload({waitUntil:'networkidle'});
    await context.setOffline(true);
    await page.reload({waitUntil:'networkidle'});
    await page.getByRole('heading',{name:'Care Now',exact:true}).waitFor();
    assert.deepEqual(errors,[]);
    console.log('PASS: phone/desktop layout, feeding validation, undo, medication confirmation, dialog focus, Hawaii timezone, offline reopening');
    await context.close();
  } finally {await browser.close();server.close()}
})().catch(error=>{console.error(error);server.close();process.exitCode=1});
