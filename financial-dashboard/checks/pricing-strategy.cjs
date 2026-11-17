const assert=require('node:assert/strict');
const path=require('node:path');const{pathToFileURL}=require('node:url');const{chromium}=require('playwright');
(async()=>{
 const{API_OFFERS,LOADED_COST_INR_PER_MINUTE,subscriptionEconomics,apiEconomics,apiOfferRows}=await import('../src/pricingStrategy.mjs');
 assert.ok(Math.abs(LOADED_COST_INR_PER_MINUTE-4.025)<1e-12);
 assert.deepEqual(API_OFFERS.map(r=>r.priceINR),[12,10,8]);
 const plans=subscriptionEconomics(94.1997);
 assert.deepEqual(plans.map(r=>r.minutes),[300,1500,6000]);
 for(const[r,value]of plans.map((r,i)=>[r,[1791.5,7461.5,23849][i]]))assert.ok(Math.abs(r.contributionINR-value)<1e-8);
 assert.ok(Math.abs(apiEconomics(1000,10,94.1997).contributionINR-5975)<1e-8);
 assert.ok(Math.abs(apiOfferRows(94.1997,60)[0].usd*94.1997-720)<1e-10);
 assert.ok(Math.abs(subscriptionEconomics(94.1997,50)[0].cost*94.1997-603.75)<1e-8);
 const b=await chromium.launch({channel:'msedge'});try{
 const p=await b.newPage({viewport:{width:1440,height:1000}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(pathToFileURL(path.resolve('dist/index.html')).href);
 await p.locator('#api').waitFor();
 assert.equal(await p.locator('.nine [data-chart]').count(),9);
 await p.getByRole('button',{name:'INR',exact:true}).click();
 assert.match(await p.locator('#api .recharts-label-list').textContent(),/12.00/);
 await p.getByLabel('Argus API billing unit').selectOption('hour');
 await p.waitForFunction(()=>document.querySelector('#api .recharts-label-list')?.textContent.includes('720'));
 await p.getByLabel('Subscription plan metric').selectOption('minutes');
 await p.mouse.move(0,0);await p.locator('#plans rect[role=button]').last().focus();await p.getByRole('tooltip').waitFor();
 assert.match(await p.getByRole('tooltip').innerText(),/6,000 minutes/);
 assert.match(await p.getByRole('tooltip').innerText(),/47,999/);await p.keyboard.press('Escape');
 await p.locator('#api').getByRole('tab',{name:'Audio',exact:true}).click();assert.ok(await p.locator('#api .api-row').count()>0);
 assert.equal(await p.locator('#api').getByText('Enter measured throughput',{exact:true}).count(),0);
 await p.locator('#api').getByRole('tab',{name:'Argus',exact:true}).click();
 await p.getByLabel('Subscription plan metric').selectOption('price');
 await p.getByLabel('Expand Subscription Plan Economics',{exact:true}).click();await p.getByRole('dialog').waitFor();await p.keyboard.press('Escape');
 await p.getByRole('link',{name:'Scale model',exact:true}).click();await p.locator('#scale-api-contribution').waitFor();assert.equal(await p.locator('[data-chart]').count(),6);
 await p.getByLabel('Proposed API tier').selectOption('professional');
 await p.mouse.move(0,0);await p.locator('#scale-api-contribution rect[role=button]').first().scrollIntoViewIfNeeded();await p.locator('#scale-api-contribution rect[role=button]').first().focus();await p.getByRole('tooltip').waitFor();
 assert.match(await p.getByRole('tooltip').innerText(),/59.8%/);await p.keyboard.press('Escape');
 await p.getByLabel('Included minutes used · assumption').selectOption('50');
 await p.getByRole('button',{name:'USD',exact:true}).click();
 for(const width of[1440,1024,390]){await p.setViewportSize({width,height:1000});await p.waitForFunction(w=>document.documentElement.scrollWidth<=w,width,{timeout:3000})}
 await p.setViewportSize({width:1440,height:1000});await p.screenshot({path:'.artifacts/pricing-scale.png',fullPage:true});
 await p.getByRole('link',{name:'Overview',exact:true}).click();await p.screenshot({path:'.artifacts/pricing-overview.png',fullPage:true});
 assert.deepEqual(errors,[]);console.log('PASS: supplied pricing arithmetic, new allowances, currencies, vendor separation, two added charts, filters and responsive layout.');
 }finally{await b.close()}
})().catch(e=>{console.error(e);process.exit(1)});
