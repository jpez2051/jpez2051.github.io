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
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const address=`http://127.0.0.1:${server.address().port}/`;const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},timezoneId:'Pacific/Honolulu'}),page=await context.newPage();page.setDefaultTimeout(10000);
  await page.goto(address,{waitUntil:'networkidle'});await page.getByRole('heading',{name:'Getting started',exact:true}).waitFor();assert.match(await page.locator('.walkthrough-progress').innerText(),/Step 1 of 5/);assert.equal(await page.getByRole('button',{name:'Back',exact:true}).isDisabled(),true);
  await page.getByRole('button',{name:'Next',exact:true}).click();assert.match(await page.evaluate(()=>document.activeElement.textContent),/Add your kittens/);await page.getByRole('button',{name:'Back',exact:true}).click();assert.match(await page.locator('.walkthrough-progress').innerText(),/Step 1/);
  await page.getByRole('button',{name:'Skip walkthrough',exact:true}).click();await page.getByRole('heading',{name:'Getting started',exact:true}).waitFor({state:'hidden'});await page.reload({waitUntil:'networkidle'});assert.equal(await page.locator('.walkthrough').count(),0);assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('a4a-kitten-care-app')).settings.walkthroughStatus),'skipped');
  await page.getByRole('button',{name:'Settings & help',exact:true}).click();await page.getByRole('button',{name:'Replay walkthrough',exact:true}).click();assert.match(await page.locator('.walkthrough-progress').innerText(),/Step 1/);
  for(let i=0;i<4;i++){await page.getByRole('button',{name:'Next',exact:true}).click();assert.match(await page.locator('.walkthrough-progress').innerText(),new RegExp(`Step ${i+2}`))}
  assert.match(await page.locator('.walkthrough').innerText(),/Background phone alerts are not enabled/);await page.getByRole('button',{name:'Set up my kittens',exact:true}).click();await page.getByRole('heading',{name:'Add litter',exact:true}).waitFor();assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('a4a-kitten-care-app')).settings.walkthroughStatus),'completed');await page.getByRole('button',{name:'Close dialog'}).click();await page.reload({waitUntil:'networkidle'});assert.equal(await page.locator('.walkthrough').count(),0);await context.close();

  const existing=await browser.newContext({viewport:{width:390,height:844},timezoneId:'Pacific/Honolulu'});
  const fixture={version:9,kittens:[{id:'k1',name:'Existing kitten',inFosterCare:true,dob:'',medications:[]}],litters:[],events:[],settings:{onboardingComplete:true,textSize:'large'}};
  await existing.addInitScript(data=>{if(!localStorage.getItem('a4a-kitten-care-app'))localStorage.setItem('a4a-kitten-care-app',JSON.stringify(data))},fixture);const current=await existing.newPage();current.setDefaultTimeout(10000);await current.goto(address,{waitUntil:'networkidle'});await current.getByRole('heading',{name:'Getting started',exact:true}).waitFor();
  const artifacts=path.resolve(root,'../review-artifacts');fs.mkdirSync(artifacts,{recursive:true});
  for(let step=0;step<5;step++){
   for(const width of [320,390,1280]){await current.setViewportSize({width,height:844});assert.equal(await current.evaluate(()=>document.documentElement.scrollWidth>innerWidth||[...document.querySelectorAll('.dialog')].some(el=>el.scrollWidth>el.clientWidth)),false,`Tour overflow at step ${step+1}, width ${width}`)}
   if(step===0){await current.setViewportSize({width:390,height:844});await current.screenshot({path:path.join(artifacts,'walkthrough-phone.png')})}
   if(step<4)await current.getByRole('button',{name:'Next',exact:true}).click();
  }
  await current.evaluate(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(window.failWalkthroughSave&&key==='a4a-kitten-care-app')throw new DOMException('Testing storage unavailable','QuotaExceededError');return original.call(this,key,value)};window.failWalkthroughSave=true});
  await current.getByRole('button',{name:'Go to Care Now',exact:true}).click();await current.locator('.walkthrough [role="alert"]').waitFor();assert.equal(await current.locator('.walkthrough').count(),1);assert.equal(await current.evaluate(()=>JSON.parse(localStorage.getItem('a4a-kitten-care-app')).settings.walkthroughStatus),undefined);
  await current.evaluate(()=>window.failWalkthroughSave=false);await current.getByRole('button',{name:'Go to Care Now',exact:true}).click();await current.getByRole('heading',{name:'Getting started',exact:true}).waitFor({state:'hidden'});await current.getByRole('heading',{name:'Care Now',exact:true}).waitFor();assert.equal(await current.getByRole('dialog').count(),0);const saved=await current.evaluate(()=>JSON.parse(localStorage.getItem('a4a-kitten-care-app')));assert.equal(saved.kittens.length,1);assert.equal(saved.events.length,0);assert.equal(saved.settings.walkthroughStatus,'completed');
  await current.reload({waitUntil:'networkidle'});assert.equal(await current.locator('.walkthrough').count(),0);await current.getByRole('button',{name:'Settings & help',exact:true}).click();await current.getByRole('button',{name:'Replay walkthrough'}).click();await current.keyboard.press('Escape');await current.getByRole('heading',{name:'Getting started',exact:true}).waitFor({state:'hidden'});await current.reload({waitUntil:'networkidle'});assert.equal(await current.locator('.walkthrough').count(),0);await existing.close();
  console.log('PASS: first-use tour, existing-user introduction, Back/Next/Skip, focus, larger text at 320/390/1280, replay, remembered choices, setup/Today destinations, failed-save retention and retry');
 }finally{await browser.close();server.close()}
})().catch(error=>{console.error(error);server.close();process.exitCode=1});

