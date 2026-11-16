import React from 'react';
import {chartBounds} from './chartBounds.mjs';
import {BarChart,Bar,ComposedChart,Line,LineChart,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,LabelList} from 'recharts';
import {toPng} from 'html-to-image';
import {Card} from './card';
import {exportCSV} from './dataLayer';
import {EPlot,palette} from './EPlot';
import {useZoom} from './Zoom';
import {PAGES} from './config';
import {useStore} from './store';
import {useTip,TipTarget,MoneyDetail} from './RichTooltip';
export const shareLabel=p=>p>0&&p<.1?'<0.1%':p.toFixed(1)+'%';
export const Link=({href,children='Source ↗'})=><a href={href} target="_blank" rel="noreferrer">{children}</a>;
export function Panel({title,control,foot,children,id,details,rows=[],className='',zoomable=false}){
 const {inputs}=useStore();
 const {expanded,setExpanded}=useZoom();
 const tip=useTip();
 const isExpanded=expanded===id;
 const open=()=>{tip.close();setExpanded(id)};
 const detailsAvailable=PAGES.some(([page])=>page===details);
 const exportRows=rows.length?rows:Object.entries(inputs).map(([input,value])=>({input,value,value_status:'user assumption',notes:'Shared scenario inputs for this card; blank values remain missing.'}));
 const costCard=/(gpu|cost|expense|economics|pricing|price|capacity|break-even|demo|avoided|sensitivity)/i.test(title);
 const png=async event=>{const node=event.currentTarget.closest('[data-slot=card]');try{const href=await toPng(node,{pixelRatio:2,backgroundColor:'#fafaf6',filter:n=>!n.classList?.contains('exports')});const a=document.createElement('a');a.href=href;a.download=(id||title)+'.png';a.click()}catch{event.currentTarget.textContent='PNG unavailable'}};
 return <div className={zoomable?'chart-slot':''}><Card id={id} className={'ninecard '+className+(isExpanded?' card-expanded':'')} data-chart={id} data-zoomable={zoomable||undefined} tabIndex={zoomable?0:undefined} role={isExpanded?'dialog':undefined} aria-modal={isExpanded?true:undefined} aria-label={isExpanded?title:undefined} onClick={e=>{if(zoomable&&!isExpanded&&!e.target.closest('button,a,input,select,textarea,summary'))open()}} onKeyDown={e=>{if(zoomable&&e.target===e.currentTarget&&(e.key==='Enter'||e.key===' ')){e.preventDefault();open()}}}><div className="charthead"><h2>{title}</h2>{control}<div className="exports"><button aria-label={'Export '+title+' CSV'} onClick={()=>exportCSV(id||title,exportRows)}>CSV</button><button aria-label={'Export '+title+' PNG'} onClick={png}>PNG</button>{zoomable&&<button className={isExpanded?'close-chart':'expand-chart'} aria-label={(isExpanded?'Close ':'Expand ')+title} onClick={()=>isExpanded?setExpanded(null):open()}>{isExpanded?'Close ✕':'⤢'}</button>}</div></div><div className="grapharea">{children}</div><footer>{foot}{costCard&&<span className="cost-footer">List-price estimate, not a billed amount.</span>}{detailsAvailable&&<a className="details-link" href={'#/'+details} onClick={()=>setExpanded(null)}>Open details ↗</a>}{zoomable&&!isExpanded&&<span className="hover-expand">Click to expand ↗</span>}</footer></Card></div>

}
export function Keys({items}){return <span className="keys">{items.map((name,i)=><span key={name}><i style={{background:palette[i%palette.length]}}/>{name}</span>)}</span>}
export function Plot({data,series,horizontal=false,format=String,stack=false,labels=false,detail,height,lines=false,domain,hideAxis=false}){
 const tip=useTip(),{both}=useStore();
 const content=(r,key)=>detail?detail(r,key):<><b>{r.name}</b><p>{r.period}</p>{series.filter(s=>r[s.key]!=null).map(s=><div key={s.key}>{s.name} · {format(r[s.key])}{r.money?' · '+both(r[s.key]):''}</div>)}</>;
 const events=(r,key)=>({tabIndex:0,role:'button','aria-label':r.name+' '+(series.find(s=>s.key===key)?.name||key),'aria-describedby':'financial-tooltip',onMouseEnter:e=>tip.show(content(r,key),e.currentTarget),onMouseLeave:tip.hide,onFocus:e=>tip.show(content(r,key),e.currentTarget),onBlur:tip.hide,onClick:e=>tip.show(content(r,key),e.currentTarget)});
 const shape=key=>p=><rect x={p.x} y={p.y} width={Math.max(0,p.width||0)} height={Math.max(0,p.height||0)} fill={p.fill} rx={2} {...events(p.payload,key)}/>;
 const dot=key=>p=>p.value==null?null:<circle cx={p.cx} cy={p.cy} r={4} fill={p.stroke} {...events(p.payload,key)}/>;
 const numericDomain=chartBounds(data,series,stack,domain);
 const labelValues=data.flatMap(row=>series.map(item=>row[item.key]).filter(value=>value!=null&&value!==''&&Number.isFinite(Number(value))));
 const labelWidth=Math.min(110,Math.max(54,...labelValues.map(value=>String(format(Number(value))).length*6+14)));
 const valueAxisWidth=Math.min(100,Math.max(60,...numericDomain.map(value=>String(format(value)).length*6+12)));
 const Chart=lines?LineChart:series.some(s=>s.line)?ComposedChart:BarChart;
 return <div className="plotbox" style={height?{height,flex:'none'}:undefined}><ResponsiveContainer width="100%" height="100%" minHeight={0}><Chart data={data} layout={horizontal?'vertical':'horizontal'} margin={{top:16,right:labels?labelWidth:20,bottom:5,left:4}} barCategoryGap="20%">
 <CartesianGrid stroke="#d7dbd3" strokeDasharray="2 5" horizontal={!horizontal} vertical={horizontal}/>
 <XAxis hide={hideAxis} domain={horizontal?numericDomain:undefined} allowDataOverflow={false} padding={horizontal?undefined:{left:8,right:8}} type={horizontal?'number':'category'} dataKey={horizontal?undefined:'name'} tickFormatter={horizontal?format:undefined} tickLine={false} interval={horizontal?undefined:data.length>8?'preserveStartEnd':0} minTickGap={18}/>
 <YAxis domain={horizontal?undefined:numericDomain} allowDataOverflow={false} type={horizontal?'category':'number'} dataKey={horizontal?'name':undefined} tickFormatter={horizontal?undefined:format} width={horizontal?114:valueAxisWidth} tickLine={false} interval={horizontal?0:undefined}/>

 {series.map(({key,name,line,color,dashed},i)=>line||lines?<Line key={key} dataKey={key} name={name} stroke={color||palette[i%palette.length]} strokeDasharray={dashed?'5 3':undefined} strokeWidth={2} dot={dot(key)} activeDot={false} isAnimationActive={false}/>:<Bar key={key} dataKey={key} name={name} stackId={stack?'price':undefined} fill={color||palette[i%palette.length]} maxBarSize={30} isAnimationActive={false} shape={shape(key)}>{labels&&<LabelList dataKey={key} position={horizontal?'right':'top'} fill="#263b35" fontSize={10} formatter={v=>v==null?'':format(v)}/>}</Bar>)}
 </Chart></ResponsiveContainer></div>
}
export function Ring({parts,total,center,renderDetail}){
 const tip=useTip();
 const content=r=>renderDetail(r);
 return <div className="splitring"><div className="ringbox"><EPlot height="100%" detail={p=>content(parts[p.dataIndex])} option={{tooltip:{show:false},series:[{type:'pie',radius:['69%','88%'],label:{show:false},data:parts}]}}/><strong><TipTarget content={renderDetail({name:'Total',value:total})}>{center}</TipTarget><small>Total</small></strong></div><div className="ringlist">{parts.map((r,i)=><TipTarget key={r.name} content={content(r)}><i style={{background:palette[i%palette.length]}}/>{r.name}<b>{shareLabel(100*r.value/total)}</b></TipTarget>)}</div></div>
}
export function Metric({label,usd,formula,status='calculated',source,notes,display,digits=2}){
 const {money}=useStore();return <TipTarget className="metric" data-metric={label} content={<MoneyDetail {...{label,usd,formula,status,source,notes}}/>}><label>{label}</label><strong>{display|| (usd==null?'Enter measured throughput':money(usd,{digits}))}</strong><small>{status}</small></TipTarget>
}
export function AssumptionField({name,label,min=0,max,step='any',unit}){
 // Imported store here keeps every input on the shared, persisted model.
 const {inputs,changeInput}=useStore();
 return <label className="inputfield"><span>{label} <em>Assumption</em></span><div><input type="number" name={name} aria-label={label} min={min} max={max} step={step} value={inputs[name]} placeholder="Enter value" onChange={e=>{let v=e.target.value;if(v!==''&&Number(v)<min)v=String(min);if(v!==''&&max!=null&&Number(v)>max)v=String(max);changeInput(name,v)}}/>{unit&&<small>{unit}</small>}</div></label>
}
