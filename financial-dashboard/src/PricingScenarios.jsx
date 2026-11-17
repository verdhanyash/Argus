import React from 'react';
import {useStore} from './store';
import {FX} from './dataLayer';
import {API_OFFERS,LOADED_COST_INR_PER_MINUTE,apiEconomics,subscriptionEconomics,proposalExport} from './pricingStrategy.mjs';
import {Panel,Plot,Keys} from './ChartKit';
import {ScenarioSelect} from './GpuPage';
import {MoneyDetail} from './RichTooltip';
export function PricingScenarios(){
 const{money,update,strategyApiTier='payg',strategyPlanUsage=100}=useStore();
 const offer=API_OFFERS.find(r=>r.id===strategyApiTier)||API_OFFERS[0];
 const usage=[25,50,75,100].includes(Number(strategyPlanUsage))?Number(strategyPlanUsage):100;
 const apiRows=[1000,5000,10000,50000].map(minutes=>({name:minutes.toLocaleString('en-US')+' min',...apiEconomics(minutes,offer.priceINR,FX)}));
 const plans=subscriptionEconomics(FX,usage);
 return <section className="pricing-scenarios"><div className="section-line"><h2>Proposed pricing &amp; contribution</h2></div>
 <div className="scenario-caption"><b>Separate duration-based scenario</b><span>1 GPU second / video second · 40% overhead assumption · ₹4.025 / video minute</span></div>
 <div className="visual-grid">
 <Panel title="API revenue & processing contribution" id="scale-api-contribution" rows={proposalExport(apiRows).map(r=>({...r,api_tier:offer.name,selling_price_inr_per_minute:offer.priceINR}))} control={<ScenarioSelect label="Proposed API tier" value={offer.id} onChange={v=>update('strategyApiTier',v)} options={API_OFFERS.map(r=>[r.id,r.name+' · ₹'+r.priceINR+'/min'])}/>} foot={<Keys items={['Revenue','Loaded processing cost','Processing contribution']}/>}><Plot height={260} data={apiRows} series={[{key:'revenue',name:'Revenue'},{key:'cost',name:'Loaded processing cost'},{key:'contribution',name:'Processing contribution'}]} format={money} detail={(r,key)=><MoneyDetail label={r.name+' · '+key} usd={r[key]} formula={key==='revenue'?r.minutes+' × ₹'+offer.priceINR+' / '+FX:key==='cost'?r.minutes+' × ₹'+LOADED_COST_INR_PER_MINUTE+' / '+FX:r.minutes+' × (₹'+offer.priceINR+' − ₹'+LOADED_COST_INR_PER_MINUTE+') / '+FX} status="User-proposed pricing / estimated processing economics" notes={r.margin.toFixed(1)+'% estimated processing margin. Before fixed infrastructure, tax, fees, salaries, support and acquisition. This is not the 8/18-second run-cost model or net profit.'}/>}/></Panel>
 <Panel title="Subscription cost & contribution" id="scale-plan-contribution" rows={proposalExport(plans)} control={<ScenarioSelect label="Included minutes used · assumption" value={usage} onChange={v=>update('strategyPlanUsage',Number(v))} options={[25,50,75,100].map(n=>[n,n+'% used'])}/>} foot={<Keys items={['Loaded processing cost','Processing contribution']}/>}><Plot stack height={260} data={plans} series={[{key:'cost',name:'Loaded processing cost'},{key:'contribution',name:'Processing contribution'}]} format={money} detail={(r,key)=><MoneyDetail label={r.name+' · '+key} usd={r[key]} formula={key==='cost'?r.usedMinutes+' assumed used minutes × ₹4.025 / '+FX:'(₹'+r.priceINR+' − '+r.usedMinutes+' × ₹4.025) / '+FX} status="Proposed monthly plan; assumed usage" notes={r.minutes.toLocaleString()+' included minutes; '+r.usagePercent+'% consumed. '+r.margin.toFixed(1)+'% processing margin. Unused minutes expire monthly; overages are separate and no overage tariff is supplied. Fixed/other operating costs excluded.'}/>}/></Panel>
 </div></section>;
}
