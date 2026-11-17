import React,{useState} from 'react';
import {useStore} from './store';
import {tables,FX} from './dataLayer';
import {subscriptionEconomics,apiOfferRows,proposalExport,TRIAL_POLICY} from './pricingStrategy.mjs';
import {CANVAS_CARDS} from './config';
import {Panel,Plot,Ring,Keys,Link} from './ChartKit';
import {Filter} from './Benchmark';
import {EPlot} from './EPlot';
import {MoneyDetail,TipTarget,Missing} from './RichTooltip';
import {ApiComparison} from './ApiComparison';
import {AwsComparison} from './AwsCosts';
export const marketSource='https://www.thebusinessresearchcompany.com/report/sentiment-analytics-systems-global-market-report';
export const marketRows=[{name:'2025',usd:4.27e9,reported:4.27,status:'publisher historical estimate'},{name:'2026',usd:5.61e9,reported:5.61,forecast:5.61,status:'publisher current-year estimate'},{name:'2030',usd:14.28e9,forecast:14.28,status:'publisher forecast endpoint'}];
export function useFinancials(){
 const {selected,year}=useStore(),all=tables.annual_benchmarks;
 return all.filter(r=>selected.includes(r.company)&&(year==='Latest FY'||r.period.startsWith('2025'))).filter((r,i,a)=>a.findIndex(v=>v.company===r.company)===i);
}
export function FinancialChart({kind}){
 const fy=useFinancials(),{currency,FX,money}=useStore(),[focus,setFocus]=useState('');
 const format=v=>money(v*1e6);
 const detail=(r,key)=><MoneyDetail label={r.company+' · '+key} usd={Number(r[key])*1e6} formula={key==='prior'?'Prior-year revenue in same filing':undefined} status="reported annual consolidated" source={r.source_url} notes={'Fiscal year ended '+r.period+' · source currency USD millions. '+(r.previous?'YoY revenue growth '+((r.revenue/r.previous-1)*100).toFixed(1)+'%.':'')}/>;
 if(kind==='composition'){
  const r=fy.find(r=>r.company===focus)||fy[0];const parts=r.mix.split('|').map(s=>{const [name,value]=s.split(':');return{name,value:Number(value)}});return <><div className="api-tools"><Filter name="Company" options={fy.map(v=>[v.company,v.company])} selected={[r.company]} change={a=>setFocus(a[0])}/><small>FY ended {r.period} · <Link href={r.source_url}/></small></div><Ring parts={parts} total={Number(r.revenue)} center={format(Number(r.revenue))} renderDetail={p=><MoneyDetail label={r.company+' · '+p.name} usd={p.value*1e6} formula={(100*p.value/r.revenue).toFixed(2)+'% of reported total'} source={r.source_url} status="reported revenue; calculated share" notes={'Year ended '+r.period+'. Original category labels retained.'}/>}/></>
 }
 if(kind==='margin'){
 const data=fy.map(r=>({...r,name:r.company,gross:100*(1-r.cost/r.revenue)})).sort((a,b)=>b.gross-a.gross);
 return <Plot horizontal labels data={data} series={[{key:'gross',name:'Gross margin'}]} format={v=>v.toFixed(1)+'%'} detail={r=><><b>{r.company} · {r.gross.toFixed(2)}%</b><p>Calculation · ({r.revenue} − {r.cost}) / {r.revenue} × 100</p><MoneyDetail label="Annual revenue" usd={Number(r.revenue)*1e6} status="reported; gross margin calculated" source={r.source_url} notes={'Year ended '+r.period}/></>}/>
 }
 if(kind==='expenses'){
 const exp=fy.filter(r=>r.ga&&r.sales).map(r=>({...r,name:r.company,cost:Number(r.cost),rd:Number(r.rd),sales:Number(r.sales),ga:Number(r.ga)}));
 if(!exp.length)return <Missing label="No comparable expense split" why="Choose another company or fiscal year. Separate sales and G&A values are unavailable for this selection."/>;
 return <><Plot data={exp} series={['cost','rd','sales','ga'].map((key,i)=>({key,name:['Cost of revenue','R&D','Sales & marketing','G&A'][i]}))} format={format} detail={detail}/><Keys items={['Cost of revenue','R&D','Sales','G&A']}/></>
 }
 const data=fy.map(r=>({...r,name:r.company,current:Number(r.revenue),prior:r.previous?Number(r.previous):null}));
 return <><Plot data={data} series={[{key:'prior',name:'Prior FY'},{key:'current',name:'Selected FY'}]} format={format} detail={(r,key)=>detail({...r,current:r.revenue},key)}/><Keys items={['Prior FY','Selected FY']}/></>
}
export function MarketChart(){
 const {money}=useStore(),fmt=v=>money(v*1e9);
 return <><Plot data={marketRows} series={[{key:'reported',name:'Publisher estimate'},{key:'forecast',name:'Forecast',line:true,dashed:true}]} format={fmt} detail={r=><MoneyDetail label={'Global sentiment analytics systems · '+r.name} usd={r.usd} status={r.status} source={marketSource} notes="26.3% publisher forecast CAGR for 2026–2030; not realised growth. Values copied from publisher endpoints, with no interpolated years."/>}/>
 <div className="marketvalues">{marketRows.map(r=><TipTarget key={r.name} content={<MoneyDetail label={'Market · '+r.name} usd={r.usd} status={r.status} source={marketSource}/>}>{r.name} · {fmt(r.usd/1e9)}</TipTarget>)}</div><small>26.3% publisher forecast CAGR · 2026–2030</small></>
}
const countryNames={US:'United States of America',UK:'United Kingdom'};
export function GeographicChart(){
 const {currency,FX,money}=useStore(),[mode,setMode]=useState('Size'),[geo,setGeo]=useState('Global');
 const rows=tables.market_size_cagr.filter(r=>r.value&&r.metric===(mode==='Size'?'market_size':'published_outlook_cagr')),region=rows.find(r=>r.geography===geo)||rows[0];
 const fmt=r=>mode==='Size'?money(Number(r.value_usd)):r.value+'%';
 const data=rows.filter(r=>['US','UK','India','China'].includes(r.geography)).map(r=>({name:countryNames[r.geography]||r.geography,value:Number(r.value),source:r}));
 return <><div className="geoctrl">{['Size','CAGR'].map(n=><button key={n} aria-pressed={mode===n} onClick={()=>setMode(n)}>{n}</button>)}<select aria-label="Geography" value={region.geography} onChange={e=>setGeo(e.target.value)}>{rows.map(r=><option key={r.geography}>{r.geography}</option>)}</select><TipTarget content={mode==='Size'?<MoneyDetail label={region.geography+' speech analytics'} usd={Number(region.value_usd)} status={region.data_class} source={region.source_url} notes={'Year '+region.year}/>:<><b>{region.geography} · {region.value}%</b><p>{region.cagr_start_year}–{region.cagr_end_year} publisher CAGR</p><Link href={region.source_url}/></>}>{fmt(region)}</TipTarget></div>
 <EPlot height="100%" detail={p=>{const r=data[p.dataIndex]?.source;return r?(mode==='Size'?<MoneyDetail label={r.geography+' speech analytics'} usd={Number(r.value_usd)} status={r.data_class} source={r.source_url} notes={r.year}/>:<><b>{r.geography} · {r.value}%</b><p>{r.cagr_start_year}–{r.cagr_end_year} forecast CAGR</p><Link href={r.source_url}/></>):<b>Country estimate not disclosed</b>}} option={{tooltip:{show:false},visualMap:{show:false,min:0,max:Math.max(...data.map(r=>r.value)),inRange:{color:['#f4d2ac','#de703b']}},series:[{type:'map',map:'World',roam:true,center:geo==='India'?[80,23]:undefined,zoom:geo==='India'?3:1,itemStyle:{areaColor:'#d7dcd3',borderColor:'#f5f5ef'},emphasis:{label:{show:false}},data}]}}/>
 <small>Speech analytics · {mode==='Size'?region.year:region.cagr_start_year+'–'+region.cagr_end_year} · <Link href={region.source_url}/></small></>
}
export function PlanChart(){
 const {money}=useStore(),[metric,setMetric]=useState('minutes');
 const plans=subscriptionEconomics(FX);
 const isMoney=['price','contribution'].includes(metric);
 const fmt=v=>metric==='margin'?v.toFixed(1)+'%':isMoney?money(v):v.toLocaleString();
 return <><div className="api-tools"><select aria-label="Subscription plan metric" value={metric} onChange={e=>setMetric(e.target.value)}><option value="minutes">Included video minutes</option><option value="price">Monthly subscription price</option><option value="contribution">Full-usage contribution</option><option value="margin">Full-usage processing margin</option></select></div>
 <Plot data={plans} series={[{key:metric,name:metric==='minutes'?'Included video minutes':metric==='price'?'Proposed monthly price':metric==='margin'?'Estimated processing margin':'Estimated processing contribution'}]} format={fmt} detail={r=><><b>{r.name} · {r.minutes.toLocaleString()} minutes / month</b><MoneyDetail label="Proposed monthly subscription" usd={r.price} status="User pricing proposal; not realised sales" notes={'Native price ₹'+r.priceINR.toLocaleString('en-IN')+'/month; effective ₹'+r.effectiveRateINR.toFixed(4)+'/included minute. Full-usage processing cost '+money(r.cost)+'; contribution '+money(r.contribution)+'; '+r.margin.toFixed(1)+'% margin. Assumed cost ₹4.025/min; fixed/other costs excluded. Minutes expire monthly; overages billed separately, tariff not supplied. Trial is separate: '+TRIAL_POLICY.standardMinutes+' minutes standard, '+TRIAL_POLICY.qualifiedMinutes+' for qualified leads, '+TRIAL_POLICY.enterpriseMinutes+' after enterprise evaluation.'}/></>}/>
 <small>Proposed monthly plans · {plans.map(r=>money(r.price)).join(' / ')}</small></>;
}
const chartComponents={market:MarketChart,revenue:()=> <FinancialChart kind="revenue"/>,composition:()=> <FinancialChart kind="composition"/>,aws:AwsComparison,margin:()=> <FinancialChart kind="margin"/>,expenses:()=> <FinancialChart kind="expenses"/>,api:()=> <ApiComparison compact/>,plans:PlanChart,geography:GeographicChart};
export default function Opportunity(){
 const financials=useFinancials();const {inputs}=useStore();
 return <div className="nine">{CANVAS_CARDS.map(card=>{const Chart=chartComponents[card.id];const rows=card.id==='market'?marketRows:['revenue','composition','margin','expenses'].includes(card.id)?financials:card.id==='aws'?tables.aws_daily:card.id==='api'?[...tables.competitor_pricing,...proposalExport(apiOfferRows(FX)).map(r=>({...r,company:'Argus',unit:'per video minute'}))]:card.id==='geography'?tables.market_size_cagr:proposalExport(subscriptionEconomics(FX));return <Panel zoomable key={card.id} id={card.id} title={card.title} details={card.details} rows={rows}><Chart/></Panel>})}</div>
}
