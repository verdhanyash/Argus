import React,{useState} from 'react';
import {useStore} from './store';
import {tables,IDLE,RATE,auditSource} from './dataLayer';
import {Ring,Metric,Link,Plot,Panel,Keys} from './ChartKit';
import {Filter} from './Benchmark';
import {PracticalVideoCosts} from './PracticalVideoCosts';
import {MoneyDetail,Missing} from './RichTooltip';
const labels={'Amazon SageMaker':'SageMaker','Amazon Simple Storage Service':'S3','AmazonCloudWatch':'CloudWatch'};
const meanings={'Cost Explorer':'Cost Explorer charge shown in supplied console snapshot',RDS:'Relational Database Service charge shown in supplied console snapshot',SageMaker:'Endpoint, training compute and Studio usage',S3:'Stored data, requests and transfer',CloudWatch:'Metrics, ingestion and retained logs','Studio disk':'Retained 5 GB notebook disk',Other:'Other nonzero project service charges'};
const storage=[{name:'Studio disk',value:.672},{name:'S3',value:.3758210696745664},{name:'CloudWatch',value:.0002567203491926}];
export function useAws(view,day){
 const ledger=view==='Single day'?tables.aws_daily.filter(r=>r.date===day):tables.aws_daily;
 const amounts=new Map();
 for(const r of ledger){const name=labels[r.service]||'Other';amounts.set(name,(amounts.get(name)||0)+Number(r.usd))}
 let parts=(view==='After cleanup'?storage:[...amounts].map(([name,value])=>({name,value}))).filter(r=>r.value>0).sort((a,b)=>b.value-a.value);
 const latest=['Latest console','Oct + latest Nov'].includes(view);
 const snapshot=tables.aws_burn_snapshots.filter(r=>r.snapshot==='console');
 const serviceRows=snapshot.filter(r=>['SageMaker','S3','Cost Explorer','CloudWatch','RDS','Others'].includes(r.metric));
 let displayedTotal;
 if(latest){
  const latestAmounts=new Map(serviceRows.map(r=>[r.metric,Number(r.value_usd)]));
  if(view==='Oct + latest Nov'){
   for(const r of tables.aws_ledger.filter(r=>r.month==='2026-10'&&r.record_type==='Usage')){
    const key=labels[r.service]||'Others';latestAmounts.set(key,(latestAmounts.get(key)||0)+Number(r.unblended_cost_usd));
   }
  }
  parts=[...latestAmounts].filter(([,value])=>value>0).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value);
  displayedTotal=116.78+(view==='Oct + latest Nov'?24.9173186161:0);
 }
 const total=parts.reduce((s,r)=>s+r.value,0);
 return{parts,total,displayedTotal:displayedTotal??total,latest,period:latest?(view==='Oct + latest Nov'?'October audit + latest November rounded snapshot':'1–15 Nov 2026 context · user console snapshot'):view==='After cleanup'?'Retained monthly list-price estimate; 730-hour equivalent':view==='Single day'?day+' UTC':'1 Jan–15 Nov 2026 query; returned usage 7 Oct–14 Nov',source:latest?'./aws-console-snapshot-2026-11-15.png':auditSource+(view==='After cleanup'?'aws-cost-reductions-2026-11-15.md':'aws-cost-analysis-2026-11-15.md')};
}
export function AwsComparison({full=false,compact=false}){
 const {money,both}=useStore(),[view,setView]=useState('Latest console'),days=[...new Set(tables.aws_daily.map(r=>r.date))].sort().reverse(),[day,setDay]=useState(days[0]);
 const {parts,total,displayedTotal,latest,period,source}=useAws(view,day);
 const gross=tables.aws_ledger.filter(r=>r.record_type==='Usage').reduce((s,r)=>s+Number(r.unblended_cost_usd),0);
 const credits=tables.aws_ledger.filter(r=>r.record_type==='Credit').reduce((s,r)=>s+Number(r.unblended_cost_usd),0);
 const tax=tables.aws_ledger.filter(r=>r.record_type==='Tax').reduce((s,r)=>s+Number(r.unblended_cost_usd),0);
 return <><div className="api-tools"><Filter name="View" options={['Latest console','Oct + latest Nov','Historical gross','Single day','After cleanup'].map(n=>[n,n])} selected={[view]} change={a=>setView(a[0])}/>{view==='Single day'&&<select aria-label="UTC billing day" value={day} onChange={e=>setDay(e.target.value)}>{days.map(d=><option key={d}>{d}</option>)}</select>}{!compact&&<span className="status">Removal verified · 15 Nov audit</span>}</div>
 <Ring parts={parts} total={total} center={money(displayedTotal)} renderDetail={r=><MoneyDetail label={r.name} usd={r.value} formula={(100*r.value/total).toPrecision(4)+'% of '+view} status={latest?'User supplied rounded console categories':view==='After cleanup'?'estimated retained storage / month':'Cost Explorer usage; estimated flags apply'} notes={period+' · '+(meanings[r.name]||'Sum of the services in this view')+'. '+(latest?'Displayed console total and sum of rounded categories differ; shares use the category sum.':view==='After cleanup'?'List-price estimate, before allowances, credits and tax.':'Gross before credits; project-wide, including team experiments.')}/>}/>
 {full&&<><div className="metrics-row"><Metric label="Gross usage" usd={gross} status="reported ledger"/><Metric label="Credits applied" usd={credits} status="reported ledger"/><Metric label="Net ledger" usd={gross+credits+tax} formula={gross+' + ('+credits+') + '+tax} notes="Sub-cent precision residue; approximately zero. This is a snapshot, not a finalized invoice."/></div>
 <div className="metrics-row"><Metric label="Before · same monthly baseline" usd={1337.8305231025238} status="list-price estimate"/><Metric label="After · retained monthly baseline" usd={IDLE} status="list-price estimate"/><Metric label="Avoided monthly carrying cost" usd={1337.8305231025238-IDLE} formula={'1337.8305231025238 − '+IDLE} notes="99.9217% reduction in identified constant inventory; same 730-hour basis."/></div>
 <ol className="timeline">{[
 ['15 Nov 2026 · 09:48:10 IST','Endpoint deletion requested. Subsequent verification returned zero endpoints. AWS metering determines the final charge cutoff.'],
 ['Verified during cleanup','Two abandoned multipart uploads aborted. Completed data and model archives retained.'],
 ['Verified during cleanup','S3 abort-incomplete-upload lifecycle enabled after seven days.'],
 ['Verified during cleanup','Endpoint/sample-app logs retained 30 days. Training/Studio logs retained 90 days.'],
 ['Verified during cleanup','Studio default idle timeout set to 60 minutes, allowed range 60–120 minutes.']].map(([date,text])=><li key={text}><b>{date}</b><p>{text}</p></li>)}</ol></>}
 {latest&&!compact&&<small>Rounded categories · {money(total)} · displayed total · {money(displayedTotal)} · gap {money(displayedTotal-total,{digits:4})}</small>}
 {compact?null:<><small>{period} · <Link href={source}/></small><p className="cost-note">{view==='After cleanup'?'List-price estimate before allowances, credits and tax. Requests, transfer and telemetry can add charges.':latest?'User-supplied AWS console snapshot. Rounded categories may differ from the displayed total; billing data can refresh.':'Earlier Cost Explorer gross usage before credits. Estimated flags and billing refresh apply.'}</p></>}</>
}


export function AwsPage(){
 const {money}=useStore();
 const source='./aws-console-snapshot-2026-11-15.png';
 const monthly=[{name:'Jun',cost:0},{name:'Jul',cost:0},{name:'Aug',cost:0},{name:'Sep',cost:0},{name:'Oct',cost:24.92},{name:'Nov MTD',cost:116.78}];
 const outlook=[{name:'MTD · 15 days',cost:116.78},{name:'Linear run rate',cost:116.78/15*30},{name:'AWS forecast',cost:258.31}];
 return <><div className="section-line"><small data-release="aws-runs-v2">AWS · Run-cost view v2</small></div>
 <div className="visual-metrics aws-metrics">
 <Metric label="November MTD" usd={116.78} status="Supplied console · 15-day period"/>
 <Metric label="Overall · October + November" usd={141.70} formula="24.92 + 116.78" status="Calculated gross usage"/>
 <Metric label="Average daily burn" usd={116.78/15} formula="116.78 / 15" status="Historical average · uneven usage"/>
 <Metric label="Credits remaining" usd={58.29} status="Supplied console balance"/>
 </div><div className="visual-grid aws-charts">
 <Panel title="Service spending mix" id="aws-service-mix" rows={tables.aws_burn_snapshots}><AwsComparison compact/></Panel>
 <Panel title="Six-month spending" id="aws-six-months" rows={monthly}><Plot height={250} data={monthly} series={[{key:'cost',name:'Gross usage'}]} format={money} detail={r=><MoneyDetail label={r.name+' 2026'} usd={r.cost} status={r.name==='Nov MTD'?'Incomplete month · console snapshot':'User-supplied monthly summary'} notes="November covers 15 elapsed days. Zeros for June–September were explicitly supplied."/>}/></Panel>
 <Panel title="Month-end outlook" id="burn-month-end" rows={outlook} foot={<small>Run rate is a scenario; AWS forecast uses a separate method.</small>}><Plot height={250} data={outlook} series={[{key:'cost',name:'Gross usage / outlook'}]} format={money} detail={r=><MoneyDetail label={r.name} usd={r.cost} formula={r.name==='Linear run rate'?'116.78 / 15 × 30':undefined} status={r.name==='Linear run rate'?'Calculated scenario':r.name==='AWS forecast'?'AWS forecast from screenshot':'Supplied console total'}/>}/></Panel>
 </div><PracticalVideoCosts/>
 </>
}
