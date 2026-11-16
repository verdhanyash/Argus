import React from 'react';
import {useStore} from './store';
import {RATE,tables,FX,FX_DATE,gpuSource} from './dataLayer';
import {scaleRunCosts} from './scaleCostModel.mjs';
import {ScenarioSelect} from './GpuPage';
import {Panel,Metric,Plot,Keys,Ring} from './ChartKit';
import {MoneyDetail} from './RichTooltip';
const USER_OPTIONS=[1,2,10,100,1000,10000,100000,200000,250000,300000];
const BASES={average:{seconds:13,size:.905,label:'Two-run average · 13 seconds'},run8:{seconds:8,size:.89,label:'Run 1 · 8 seconds'},run18:{seconds:18,size:.92,label:'Run 2 · 18 seconds'}};
export function ScalePage(){
 const {money,update,scaleUsers=2,scaleRunBasis='average',scaleRunRepeat=1,scaleUptimeFloor=1}=useStore();
 const users=USER_OPTIONS.includes(Number(scaleUsers))?Number(scaleUsers):2;
 const repeat=[1,5,10,30].includes(Number(scaleRunRepeat))?Number(scaleRunRepeat):1;
 const floor=[0,1,30,240,720].includes(Number(scaleUptimeFloor))?Number(scaleUptimeFloor):1;
 const basis=BASES[scaleRunBasis]||BASES.average;
 const rateFor=usage=>Number(tables.aws_unit_rates.find(r=>r.service_code==='AmazonS3'&&r.usage_type===usage&&r.begin_range==='0').usd_per_unit);
 const args={iterations:repeat,gpuSeconds:basis.seconds,sizeMB:basis.size,uptimeHours:floor,rate:RATE,put:rateFor('APS2-Requests-Tier1'),get:rateFor('APS2-Requests-Tier2'),storage:rateFor('APS2-TimedStorage-ByteHrs')};
 const model=scaleRunCosts({...args,users});
 const volumeRows=USER_OPTIONS.map(n=>({name:n.toLocaleString('en-US'),...scaleRunCosts({...args,users:n})}));
 const baseRows=Object.values(BASES).sort((a,b)=>a.seconds-b.seconds).map(b=>({gpu_seconds_per_run:b.seconds,assumed_size_mb:b.size,name:b.seconds+' sec',...scaleRunCosts({...args,users,gpuSeconds:b.seconds,sizeMB:b.size})}));
 const parts=[{name:'Active GPU',value:model.activeGpu},{name:'Idle GPU allocation',value:model.idleGpu},{name:'S3 requests + storage',value:model.s3}].filter(r=>r.value>0);
 const evidence='./two-run-cost-basis.txt';
 const exportRows=rows=>rows.map(r=>({...r,assumed_analysis_seconds:args.gpuSeconds,assumed_size_mb:args.sizeMB,uptime_floor_hours:floor,usd_per_gpu_hour:RATE,currency:'USD',period:'30-day scenario with first-month upload storage',fx_inr_per_usd:FX,fx_rate_date:FX_DATE,value_status:'conditional allocation; reported analysis time is not verified GPU uptime',source_url:evidence,rate_source_url:gpuSource}));
 const details=(r,key)=><MoneyDetail label={r.name+' users · '+key} usd={r[key]} formula={key==='activeGpu'?r.runs+' runs × '+basis.seconds+' seconds / 3600 × '+RATE:key==='idleGpu'?'max(0, '+floor+' uptime-floor hours − '+r.activeHours+' active hours) × '+RATE:key==='s3'?r.runs+' uploads × one PUT, one GET and first-month storage':key==='runtimePerRun'?'Analysis-time GPU allocation + estimated S3 per run':'(Active GPU + idle allocation + S3) / '+r.runs+' runs'} status="Illustrative scale assumption" notes="Analysis times are user reported; GPU billing time is unverified. Uptime floor is pooled instance-hours, not guaranteed single-endpoint capacity. Vercel, Neon, retries, other AWS charges and tax are excluded."/>;
 return <><div className="scenario-toolbar">
 <ScenarioSelect label="Users running analysis" value={users} onChange={v=>update('scaleUsers',Number(v))} options={USER_OPTIONS.map(n=>[n,n.toLocaleString('en-US')])}/>
 <ScenarioSelect label="Runs per user / month" value={repeat} onChange={v=>update('scaleRunRepeat',Number(v))} options={[1,5,10,30].map(n=>[n,n])}/>
 <ScenarioSelect label="Analysis time basis" value={BASES[scaleRunBasis]?scaleRunBasis:'average'} onChange={v=>update('scaleRunBasis',v)} options={Object.entries(BASES).map(([id,b])=>[id,b.label])}/>
 <ScenarioSelect label="Endpoint uptime floor" value={floor} onChange={v=>update('scaleUptimeFloor',Number(v))} options={[[0,'Runtime only · lower bound'],[1,'1 shared hour / month'],[30,'1 hour/day × 30 days'],[240,'8 hours/day × 30 days'],[720,'24 hours/day × 30 days']]}/>
 </div><div className="scenario-caption"><b>Cost allocation scenario · not a bill or forecast</b><span>{model.runs.toLocaleString('en-US')} runs · {basis.seconds} sec/run · {basis.size} MB/upload assumed</span></div>
 <div className="visual-metrics scale-metrics">
 <Metric label="Monthly GPU + upload S3" usd={model.total} formula={'max('+model.activeHours+', '+floor+') GPU hours × '+RATE+' + '+model.s3+' S3'} status="Partial 30-day cost scenario"/>
 <Metric label="Allocated cost / run" usd={model.perRun} digits={6} formula={model.total+' / '+model.runs+' runs'} status="Includes selected idle allocation"/>
 <Metric label="Allocated cost / user" usd={model.perUser} digits={6} formula={model.total+' / '+users+' users'} status={repeat+' run(s) per user / month'}/>
 <Metric label="Runtime-only cost / run" usd={model.runtimePerRun} digits={6} formula={basis.seconds+' × '+RATE+' / 3600 + per-upload S3'} status="Alternative lower-bound allocation"/>
 </div><div className="visual-grid scale-charts">
 <Panel title="Monthly spending by user volume" id="scale-compare" rows={exportRows(volumeRows)} foot={<Keys items={['Active GPU','Idle GPU allocation','S3 requests + storage']}/>}><Plot stack height={270} data={volumeRows} series={[{key:'activeGpu',name:'Active GPU'},{key:'idleGpu',name:'Idle GPU allocation'},{key:'s3',name:'S3 requests + storage'}]} format={money} detail={details}/></Panel>
 <Panel title="Cost per run as volume grows" id="scale-per-run" rows={exportRows(volumeRows)} foot={<Keys items={['Runtime-only allocation','With selected uptime floor']}/>}><Plot lines height={270} data={volumeRows} series={[{key:'runtimePerRun',name:'Runtime-only allocation'},{key:'perRun',name:'With selected uptime floor'}]} format={v=>money(v,{digits:4})} detail={details}/></Panel>
 <Panel title="8, 13 and 18 seconds · same volume" id="scale-runtime-bases" rows={baseRows.map(r=>({...r,currency:'USD',value_status:'same selected volume and uptime floor; analysis-time assumptions',source_url:evidence}))} foot={<Keys items={['Active GPU','Idle GPU allocation','S3 requests + storage']}/>}><Plot stack height={250} data={baseRows} series={[{key:'activeGpu',name:'Active GPU'},{key:'idleGpu',name:'Idle GPU allocation'},{key:'s3',name:'S3 requests + storage'}]} format={money} detail={(r,key)=><MoneyDetail label={r.name+' basis · '+key} usd={r[key]} status="Alternative analysis-time assumptions" notes={model.runs+' runs with the same '+floor+' pooled uptime-floor hours. Total = max(active hours, uptime floor) × hourly rate + S3; idle GPU is not counted twice.'}/>}/></Panel>
 <Panel title="Selected allocation mix" id="scale-cost-mix" rows={exportRows([model])}><Ring parts={parts} total={model.total} center={money(model.total)} renderDetail={r=><MoneyDetail label={r.name} usd={r.value} status="Partial cost allocation scenario" notes={model.activeHours.toFixed(4)+' active GPU hours; '+model.billedHours.toFixed(4)+' allocated GPU hours. GPU uptime is pooled across instances; scheduling, concurrency and quota are not validated.'}/>}/></Panel>
 </div><p className="compact-limit">8/18 seconds are supplied analysis times, not measured GPU uptime. S3 assumes one PUT, one GET and one month of storage per new upload. Runtime and full-uptime costs are alternatives. Provisioning, retries, application services, other resources and tax are excluded.</p></>
}
