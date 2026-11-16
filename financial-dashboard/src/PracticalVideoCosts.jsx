import React,{useState} from 'react';
import {useStore} from './store';
import {tables,RATE,IDLE,gpuSource,gpuEvidence} from './dataLayer';
import {smallVideoCost} from './videoCostModel.mjs';
import {ScenarioSelect} from './GpuPage';
import {Panel,Metric,Plot,Keys,Link} from './ChartKit';
import {MoneyDetail} from './RichTooltip';
export function PracticalVideoCosts(){
 const {money}=useStore();
 const [uptime,setUptime]=useState(3600);
 const rateFor=usage=>Number(tables.aws_unit_rates.find(r=>r.service_code==='AmazonS3'&&r.usage_type===usage&&r.begin_range==='0').usd_per_unit);
 const put=rateFor('APS2-Requests-Tier1'),get=rateFor('APS2-Requests-Tier2'),storage=rateFor('APS2-TimedStorage-ByteHrs');
 const evidence='./two-run-cost-basis.txt';
 const rows=[{name:'Run 1 · 8 sec',seconds:8,sizeMB:.89},{name:'Run 2 · 18 sec',seconds:18,sizeMB:.92}].map(r=>({...r,...smallVideoCost(r.sizeMB,r.seconds,RATE,put,get,storage)}));
 const gpu=rows.reduce((s,r)=>s+r.gpu,0),s3=rows.reduce((s,r)=>s+r.s3,0),total=gpu+s3;
 const comparisons=[{name:'26 sec · runtime only',cost:total},{name:'Selected endpoint uptime',cost:uptime*RATE/3600+s3}];
 const exportRows=rows.map(r=>({...r,currency:'USD',year:2026,value_status:'calculated allocation from user-reported analysis time; GPU time unverified',source_url:evidence,usd_per_gpu_hour:RATE}));
 return <section className="practical-costs"><div className="section-line"><h2>Two video runs · estimated allocation</h2></div>
 <div className="visual-metrics">
 <Metric label="Both runs · compute + S3" usd={total} digits={6} formula="(8 + 18) × 1.8312 / 3600 + estimated S3" status="Conditional runtime allocation" source={evidence}/>
 <Metric label="Average per run" usd={total/2} digits={6} formula={total+' / 2'} status="Two-run mean · not an AWS bill" source={evidence}/>
 <Metric label="S3 · both uploads" usd={s3} digits={8} formula="Two PUTs + two GETs + first-month storage" status="0.89 + 0.92 MB · size assumptions" source={evidence}/>
 </div><div className="visual-grid">
 <Panel title="Cost per video run" id="two-run-cost" rows={exportRows} foot={<><Keys items={['GPU allocation','S3 requests + storage']}/><Link href={evidence}/></>}><Plot height={250} stack data={rows} series={[{key:'gpu',name:'GPU allocation'},{key:'s3',name:'S3 requests + storage'}]} format={v=>money(v,{digits:5})} detail={(r,key)=><MoneyDetail label={r.name+' · '+key} usd={r[key]} formula={key==='gpu'?r.seconds+' × '+RATE+' / 3600':'One PUT + one GET + '+r.sizeMB+' decimal MB stored one month'} status="Calculated estimate · supplied analysis time" source={evidence} notes="8/18 seconds are user-reported analysis times, not verified billable GPU uptime. File-size pairing is an assumption; swapping the sizes leaves the combined total unchanged."/>}/></Panel>
 <Panel title="Runtime vs endpoint uptime · both runs" id="endpoint-uptime" rows={comparisons.map(r=>({...r,uptime_seconds:uptime,currency:'USD',value_status:'scenario',source_url:evidence}))} control={<ScenarioSelect label="Endpoint uptime · scenario" value={uptime} onChange={v=>setUptime(Number(v))} options={[[60,'1 minute'],[300,'5 minutes'],[900,'15 minutes'],[3600,'1 hour']]}/>} foot={<small>Alternative allocations, never added together. Idle capacity also bills.</small>}><Plot height={250} data={comparisons} series={[{key:'cost',name:'GPU + estimated S3'}]} format={v=>money(v,{digits:4})} detail={r=><MoneyDetail label={r.name+' · two runs'} usd={r.cost} formula={(r.name.startsWith('26')?26:uptime)+' × '+RATE+' / 3600 + '+s3} status="Illustrative shared-uptime allocation" source={evidence} notes={'Even split per run: '+money(r.cost/2,{digits:6})+'. Excludes provisioning beyond selected uptime, other services, retries and tax.'}/>}/></Panel>
 </div><details className="method-details"><summary>Assumptions, source dates and exclusions</summary>
 <p>The supplied 8- and 18-second analysis times total 26 seconds. GPU-only allocation is {money(gpu,{digits:8})}, averaging {money(gpu/2,{digits:8})} per run. Analysis duration may differ from GPU instance uptime. This is not a measured invoice.</p>
 <p>Audited Sydney ml.g5.xlarge rate: $1.8312/hour. One shared running hour allocates $0.9156 GPU to each run, before S3. Runtime-only and shared-uptime views are alternatives. <Link href={gpuSource}/></p>
 <p>S3 assumes one PUT, one GET and one month of storage per decimal-MB file. Actual request counts and file sizes have not been independently checked. <Link href={evidence}/></p>
 <p>Last local endpoint verification was 15 November: zero endpoints; retained resources estimated at {money(IDLE)}/month. Current endpoint state and live bill have not been checked. <Link href={gpuEvidence}/></p>
 <p>Vercel/Neon plans, overages, other AWS resources, failures, extra reads and tax are excluded. Their cost is unknown, not assumed zero. Older service views retain their own billing cutoffs. Latest rounded services sum to $116.77 versus the displayed $116.78 total.</p>
 </details></section>
}
