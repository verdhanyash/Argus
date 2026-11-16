const assert=require('node:assert/strict');
const{chromium}=require('playwright');const{pathToFileURL}=require('node:url');const path=require('node:path');
(async()=>{
 const{scaleRunCosts}=await import('../src/scaleCostModel.mjs');
 const args={users:2,iterations:1,gpuSeconds:13,sizeMB:.905,uptimeHours:0,rate:1.8312,put:.0000055,get:.00000044,storage:.025};
 const runtime=scaleRunCosts(args),hour=scaleRunCosts({...args,uptimeHours:1});
 assert.ok(Math.abs(runtime.total-.013279355679834681)<1e-12);
 assert.ok(Math.abs(runtime.perRun-.006639677839917341)<1e-12);
 assert.ok(Math.abs(hour.total-(1.8312+runtime.s3))<1e-12);
 assert.ok(Math.abs(hour.perRun-.9156270111732507)<1e-12);
 const busy=scaleRunCosts({...args,users:300000,iterations:30,uptimeHours:720});
 assert.equal(busy.idleGpu,0);assert.equal(busy.billedHours,busy.activeHours);
 const b=await chromium.launch({channel:'msedge'});try{
 const p=await b.newPage({viewport:{width:1440,height:1000}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(pathToFileURL(path.resolve('dist/index.html')).href+'#/scale-model');
 await p.locator('#scale-cost-mix').waitFor();
 await p.getByRole('button',{name:'USD',exact:true}).click();
 await p.getByLabel('Users running analysis',{exact:true}).selectOption('2');
 await p.getByLabel('Runs per user / month',{exact:true}).selectOption('1');
 await p.getByLabel('Analysis time basis',{exact:true}).selectOption('average');
 await p.getByLabel('Endpoint uptime floor',{exact:true}).selectOption('0');
 assert.match(await p.locator('[data-metric="Allocated cost / run"]').innerText(),/0.00664/);
 await p.getByLabel('Endpoint uptime floor',{exact:true}).selectOption('1');
 assert.match(await p.locator('[data-metric="Allocated cost / run"]').innerText(),/0.915627/);
 assert.match(await p.locator('[data-metric="Runtime-only cost / run"]').innerText(),/0.00664/);
 assert.equal(await p.locator('[data-chart]').count(),4);
 assert.equal(await p.locator('input[type=number]').count(),0);
 await p.getByLabel('Analysis time basis',{exact:true}).selectOption('run18');
 assert.match(await p.locator('[data-metric="Runtime-only cost / run"]').innerText(),/0.009183/);
 for(const width of [1440,1024,390]){await p.setViewportSize({width,height:1000});await p.waitForFunction(w=>document.documentElement.scrollWidth<=w,width,{timeout:3000});assert.ok(await p.locator('#scale-cost-mix').evaluate(c=>{const r=c.getBoundingClientRect();return [...c.querySelectorAll('.ringlist .tip-target')].every(e=>e.getBoundingClientRect().bottom<=r.bottom)}))}
 await p.setViewportSize({width:1440,height:1000});await p.screenshot({path:'.artifacts/scale-updated.png',fullPage:true});assert.deepEqual(errors,[]);
 console.log('PASS: two-run scale arithmetic, idle allocation without double counting, high-volume floor, all filters, currency and responsive charts.');
 }finally{await b.close()}
})().catch(e=>{console.error(e);process.exit(1)});
