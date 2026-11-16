const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
(async()=>{
 const {smallVideoCost}=await import('../src/videoCostModel.mjs');
 const a=smallVideoCost(.89,8,1.8312,.0000055,.00000044,.025),b=smallVideoCost(.92,18,1.8312,.0000055,.00000044,.025);
 assert.ok(Math.abs(a.gpu+b.gpu-.0132253333333333)<1e-12);
 assert.ok(Math.abs((a.total+b.total)/2-.006639677839917341)<1e-12);
 const browser=await chromium.launch({channel:'msedge'});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.resolve('dist/index.html')).href+'#/aws-costs');
  await page.locator('#two-run-cost').waitFor();
  assert.equal(await page.locator('[data-chart]').count(),5);
  assert.equal(await page.locator('.video-assumptions tbody tr').count(),10);
  assert.match(await page.locator('.video-assumptions tbody tr').last().innerText(),/0.152600/);
  assert.equal(await page.locator('.workspacebrand').innerText(),'Argus');
  assert.match(await page.title(),/Argus/);
  assert.equal(await page.getByRole('link',{name:/Source|Quick guide/}).count(),0);
  assert.equal(await page.locator('.method-details').count(),0);
  assert.equal(await page.locator('input[type=number]').count(),0);
  await page.getByRole('button',{name:'USD',exact:true}).click();
  assert.match(await page.locator('[data-metric="Both runs · compute + S3"]').innerText(),/0.013279/);
  assert.match(await page.locator('[data-metric="Average per run"]').innerText(),/0.00664/);
  await page.mouse.move(0,0);
  await page.locator('#two-run-cost rect[role=button]').first().scrollIntoViewIfNeeded();
  await page.locator('#two-run-cost rect[role=button]').first().focus();
  await page.getByRole('tooltip').waitFor();
  assert.match(await page.getByRole('tooltip').innerText(),/not verified billable GPU uptime/);
  assert.equal(await page.getByRole('tooltip').getByRole('link').count(),0);
  await page.keyboard.press('Escape');
  await page.getByLabel('Endpoint uptime · scenario',{exact:true}).selectOption('60');
  await page.getByRole('button',{name:'INR',exact:true}).click();
  for(const width of [1440,1024,390]){await page.setViewportSize({width,height:1000});await page.waitForFunction(w=>document.documentElement.scrollWidth<=w,width,{timeout:3000});
   const fits=await page.locator('#aws-service-mix').evaluate(card=>{const c=card.getBoundingClientRect();return [...card.querySelectorAll('.ringlist .tip-target')].every(el=>{const r=el.getBoundingClientRect();return r.top>=c.top&&r.bottom<=c.bottom&&r.left>=c.left&&r.right<=c.right})});assert.ok(fits,'Service legend clipped at '+width);}
  await page.setViewportSize({width:1440,height:1000});
  await page.screenshot({path:'.artifacts/aws-simplified.png',fullPage:true});
  assert.deepEqual(errors,[]);
  console.log('PASS: corrected two-run arithmetic, five charts, uptime selector, tooltips, currencies and responsive layout.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});

