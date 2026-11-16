import React from 'react';
import {VIDEO_SECONDS,iterationModel} from './burnModel.mjs';
import {RATE,FX,FX_DATE,exportCSV,gpuSource} from './dataLayer';
export function VideoAssumptions(){
 const rows=VIDEO_SECONDS.map(seconds=>({...iterationModel(seconds,1,0,RATE),name:seconds<60?seconds+' sec':seconds/60+' min'}));
 const csv=rows.map(r=>({video_seconds:r.seconds,assumed_gpu_seconds:r.gpuSeconds,gpu_cost_usd:r.usd,gpu_cost_inr:r.usd*FX,usd_per_gpu_hour:RATE,fx_inr_per_usd:FX,fx_rate_date:FX_DATE,value_status:'GPU-only assumption: 1 GPU second per video second, warm instance, zero setup; not measured',source_url:gpuSource}));
 return <section className="video-assumptions" aria-labelledby="video-assumptions-heading"><div className="section-line"><h2 id="video-assumptions-heading">Video duration · cost assumptions</h2><button onClick={()=>exportCSV('video-cost-assumptions',csv)}>Download CSV</button></div>
 <p className="table-caption">One user · one iteration · assumes 1 GPU second per video second at $1.8312/hour. GPU only; idle time and other services excluded.</p>
 <div className="tablewrap iteration-table"><table><thead><tr><th scope="col">Video length</th><th scope="col">Assumed GPU time</th><th scope="col">Cost · USD</th><th scope="col">Cost · INR</th></tr></thead><tbody>{rows.map(r=><tr key={r.seconds}><th scope="row">{r.name}</th><td>{r.gpuSeconds} sec</td><td>${r.usd.toFixed(6)}</td><td>₹{(r.usd*FX).toFixed(4)}</td></tr>)}</tbody></table></div>
 <small>Cost = assumed GPU seconds × $1.8312 ÷ 3,600. Above 2 minutes requires chunking; setup overhead is excluded. INR uses the bundled exchange rate.</small>
 </section>
}
