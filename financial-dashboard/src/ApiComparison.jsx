import React,{useState} from 'react';
import {useStore} from './store';
import {tables,RATE,normalizePrice,gpuSource,gpuModel,numeric,FX,FX_DATE} from './dataLayer';
import {Plot,AssumptionField,Keys,Metric} from './ChartKit';
import {Filter} from './Benchmark';
import {MoneyDetail,Missing,TipTarget} from './RichTooltip';
import {apiOfferRows,LOADED_COST_INR_PER_MINUTE} from './pricingStrategy.mjs';
export function ApiDetail({row}){
 const {inputs,money,both}=useStore();
 const normalized=row.selfHosted?row.usd:normalizePrice(row,inputs);
 return <><b>{row.company} · {row.product}</b><p>{row.modality} · {row.capability} · {row.mode}</p><p>Vendor price · {row.native_price_usd===''?'Not disclosed':both(Number(row.native_price_usd))} {row.native_unit}</p><strong>{normalized==null?'Not disclosed':money(normalized,{digits:5})} · {row.unitLabel}</strong><p>{both(normalized)}</p><p>Basis · {row.normalization_basis}</p><p>Includes · {row.includes}</p><p>Not included · {row.excludes}</p><p>Status · {row.selfHosted?'Assumption':row.price_status}</p><p>FX · ₹{FX}/USD · {FX_DATE}</p><p>Checked · {row.retrieved_date}</p>{row.source_url&&<a href={row.source_url} target="_blank" rel="noreferrer">Official source ↗</a>}</>
}
export function ApiComparison({compact=false}){
 const {inputs,money}=useStore(),[tab,setTab]=useState('Argus'),[mode,setMode]=useState('All modes');
 const modality=tab.toLowerCase();
 let sourceRows=tables.competitor_pricing.filter(r=>r.modality===modality&&(mode==='All modes'||r.mode===mode));
 if(compact&&tab==='Audio')sourceRows=sourceRows.filter(r=>r.company!=='AssemblyAI'||r.product==='Universal-2');
 const unit=tab==='Audio'?'per audio hour':tab==='Video'?'per video hour':'per 1,000 words';
 const priced=sourceRows.map((r,i)=>({...r,name:r.company+' · '+r.product,usd:normalizePrice(r,inputs),unitLabel:unit,index:i}));
 priced.sort((a,b)=>(a.usd==null)-(b.usd==null));
 const maximum=Math.max(...priced.map(r=>r.usd??0),.000001)*1.28;
 return <><div className="tabs" role="tablist" aria-label={compact?'Canvas modality':'Pricing modality'}>{['Argus','Audio','Video','Text',...(!compact?['Full stack']:[])].map(n=><button key={n} role="tab" aria-selected={tab===n} onClick={()=>setTab(n)}>{n}</button>)}</div>
 {tab==='Argus'?<ArgusApiPricing compact={compact}/>:tab==='Full stack'?<FullStack/>:<><div className="api-tools"><small>{unit} · normalised</small><Filter name="Mode" selected={[mode]} options={['All modes','recorded/batch','streaming/real-time','standard','not stated'].map(n=>[n,n])} change={a=>setMode(a[0])}/></div><div className={'api-scroll '+(compact?'compact':'')}>
 {priced.map((r,i)=>r.usd==null?<div className="price-placeholder" key={i}><span>{r.company} · {r.product}</span><Missing label={r.selfHosted?'Enter measured throughput':'Not disclosed'} why={r.selfHosted?'Set video minutes per GPU hour in GPU costing. This applies to joint inference.':r.normalization_basis} source={r.source_url}/></div>:<div className="api-row" key={i}><Plot horizontal data={[{...r,name:compact?r.company:r.name}]} height={compact?30:62} domain={[0,maximum]} hideAxis series={[{key:'usd',name:r.product,color:r.selfHosted?'url(#assumption-hatch)':r.mode==='streaming/real-time'?'#292b28':r.mode==='standard'?'#86877d':'#df7039'}]} format={v=>money(v,{digits:tab==='Text'?5:2})} detail={()=> <ApiDetail row={r}/>} labels/><span className="price-status">{r.selfHosted?'Assumption':r.price_status}</span></div>)}
 {!priced.length&&<Missing label="No offers for this filter" why="Choose another mode."/>}</div>
 {tab==='Text'&&!compact&&<div className="formgrid"><AssumptionField name="charsPerWord" label="Characters per word" min={.1}/><AssumptionField name="tokensPerWord" label="Tokens per word" min={.1}/><AssumptionField name="outputTokensPer1kWords" label="Output tokens per 1,000 words"/><AssumptionField name="wordsPerRecord" label="Words per text record" min={1}/></div>}
 <small>{tab==='Text'?'Words normalisation uses editable assumptions; LLM output required.':'Recorded / streaming / standard · separate base and add-on prices.'}</small></>}
 </>
}
export function FullStack(){
 const {inputs,money}=useStore();
 const a=tables.competitor_pricing.find(r=>r.company==='AssemblyAI'&&r.product==='Universal-2');
 const emotion=tables.competitor_pricing.find(r=>r.product==='Sentiment analysis');
 const text=tables.competitor_pricing.find(r=>r.company==='AWS'&&r.modality==='text');
 const video=tables.competitor_pricing.find(r=>r.company==='Hume AI'&&r.modality==='video');
 const words=Number(inputs.wordsPerMinute)*60;
 const wordUnit=normalizePrice(text,inputs);
 const textCost=wordUnit==null?null:wordUnit*words/1000;
 const rows=[{name:'Speech-to-text',usd:Number(a.normalized_price_usd),row:a},{name:'Transcript sentiment add-on',usd:Number(emotion.normalized_price_usd),row:emotion},{name:'Video expression',usd:null,row:video},{name:'Text sentiment',usd:textCost,row:text}];
 const partial=rows.reduce((s,r)=>s+(r.usd??0),0),count=rows.filter(r=>r.usd!=null).length;
 const self=gpuModel(inputs).costMinute;
 return <><div className="banner">Assumption · transcript volume uses your speaking rate and characters per word.</div><div className="formgrid"><AssumptionField name="wordsPerMinute" label="Spoken words per minute" min={1}/><AssumptionField name="charsPerWord" label="Characters per word" min={.1}/></div><Plot horizontal height={250} data={rows.filter(r=>r.usd!=null).map(r=>({...r,name:r.name}))} series={[{key:'usd',name:'Component cost / video hour'}]} format={money} detail={r=><MoneyDetail label={r.name} usd={r.usd} formula={r.name==='Text sentiment'?words+' words / 1000 × '+wordUnit: 'Native per-hour rate'} status="calculated; transcript assumptions" source={r.row.source_url} notes="Each request's minimum and rounding may increase the bill."/>}/>
 {rows.filter(r=>r.usd==null).map(r=><Missing key={r.name} label={r.name+' · Not disclosed'} why={r.row.normalization_basis} source={r.row.source_url}/>)}
 <div className="metrics-row"><Metric label={'Partial total · '+count+' of '+rows.length+' components priced'} usd={partial} formula={rows.filter(r=>r.usd!=null).map(r=>r.usd).join(' + ')} status="calculated partial stack" source={a.source_url}/><Metric label="Argus self-hosted / video hour" usd={self==null?null:self*60} formula={RATE+' × 60 / '+inputs.throughput} status="Assumption" source={gpuSource}/></div>
 <div className="scenario-table"><b>Speaking-rate sensitivity · Assumption</b>{[.8,1,1.2].map(f=><div key={f}>{(inputs.wordsPerMinute*f).toFixed(0)} words/min · {money(partial-textCost+textCost*f)} partial total</div>)}</div>
 <p className="note">Cost only. This does not show accuracy, latency or workflow value. Better accuracy, lower cost and buyer preference are not yet demonstrated. Video face-detection APIs are listed separately because face detection does not establish emotion understanding.</p></>
}

function ArgusApiPricing({compact}){
 const {money}=useStore(),[unit,setUnit]=useState('minute');
 const rows=apiOfferRows(FX,unit==='hour'?60:1);
 return <><div className="api-tools"><small>Proposed multimodal API</small><select aria-label="Argus API billing unit" value={unit} onChange={e=>setUnit(e.target.value)}><option value="minute">Per video minute</option><option value="hour">Per video hour</option></select></div>
 <Plot horizontal labels height={compact?110:250} data={rows} series={[{key:'usd',name:'Proposed selling price'}]} format={v=>money(v,{digits:2})} detail={r=><MoneyDetail label={'Argus · '+r.name+' / video '+unit} usd={r.usd} formula={'₹'+r.priceINR+' / minute'+(unit==='hour'?' × 60':'')+' / '+FX+' INR per USD'} status="User-proposed selling price; not a published tariff" notes={'₹'+r.priceINR+'/min; estimated loaded processing cost ₹'+LOADED_COST_INR_PER_MINUTE+'/min; '+r.margin.toFixed(1)+'% processing margin. 40% overhead and real-time processing are assumptions. Before fixed/other operating costs. Enterprise discount is for committed volume. Audio-only and text-only Argus tariffs are not supplied; other tabs show vendor offers with different capabilities.'}/>}/>
 <small>PAYG ₹12 · Pro API ₹10 · volume ₹8 / min · proposed</small></>;
}
