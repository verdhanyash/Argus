const assert=require('node:assert/strict');
const path=require('node:path');
const{pathToFileURL}=require('node:url');
const{chromium}=require('playwright');
(async()=>{
 const{iterationModel,burnModel}=await import('../src/burnModel.mjs');
 assert.ok(Math.abs(iterationModel(5,1,0,1.8312).usd-.002543333333333333)<1e-12);
 assert.ok(Math.abs(iterationModel(300,1,0,1.8312).usd-.1526)<1e-12);
 assert.equal(iterationModel(300,1,0,1.8312).chunks,3);
 assert.equal(iterationModel(300,1,15,1.8312).gpuSeconds,345);
 assert.equal(iterationModel(60,2,0,1.8312).usd,iterationModel(60,1,0,1.8312).usd/2);
 assert.equal(burnModel(116.77).monthly,233.54);
 console.log('PASS: retained iteration scenario and burn arithmetic');
})().catch(e=>{console.error(e);process.exit(1)});
