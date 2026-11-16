import React,{useState,useEffect,lazy,Suspense} from 'react';
import {createRoot} from 'react-dom/client';
import {Activity,LayoutDashboard,Cpu,AudioLines,Wallet,Calculator,Users,Building2,Globe,Shield,Database,Menu,ChevronLeft} from 'lucide-react';
import {AppStore,useStore} from './store';
import {RichTooltipProvider} from './RichTooltip';
import {Filter} from './Benchmark';
import {HeaderKpis} from './HeaderKpis';
import {PAGES} from './config';
import {tables} from './dataLayer';
import Opportunity from './Opportunity';
import './style.css';
import './workspace.css';
import './light.css';
import {ZoomProvider} from './Zoom';
const DetailPages=lazy(()=>import('./DetailPages'));
const icons={overview:LayoutDashboard,'gpu-costing':Cpu,'aws-costs':Wallet,'scale-model':Users,competitors:Building2};
function getRoute(){const id=location.hash.replace(/^#\//,'')||'overview';return PAGES.some(([key])=>key===id)?id:'overview'}
function Dashboard(){
 const [route,setRoute]=useState(getRoute),[drawer,setDrawer]=useState(false),[collapsed,collapse]=useState(false);
 const {currency,year,selected,update}=useStore();
 useEffect(()=>{const listener=()=>{setRoute(getRoute());setDrawer(false);window.scrollTo(0,0)};window.addEventListener('hashchange',listener);return()=>window.removeEventListener('hashchange',listener)},[]);
 const title=PAGES.find(([id])=>id===route)?.[1]||'Overview';
 return <div className={'app-shell night light '+(collapsed?'is-collapsed ':'')+(drawer?'drawer-open':'')}>
 <aside className="app-sidebar"><div className="workspacebrand"><Activity size={23}/><span>Argus</span></div><nav aria-label="Dashboard pages">{PAGES.map(([id,label],i)=>{const Icon=icons[id];return <a key={id} href={'#/'+id} aria-label={label} aria-current={route===id?'page':undefined}><Icon size={18}/><span>{label}</span></a>})}</nav><button className="collapse" onClick={()=>collapse(v=>!v)} aria-label="Collapse sidebar"><ChevronLeft size={16}/><span>Collapse</span></button></aside>
 {drawer&&<button className="drawerback" aria-label="Close navigation" onClick={()=>setDrawer(false)}/>}
 <main className="workspace"><header className="workspace-header"><button className="hamburger" aria-label="Open navigation" aria-expanded={drawer} onClick={()=>setDrawer(v=>!v)}><Menu size={19}/></button><div><h1>Argus</h1><small>Competitive Benchmark · {title}</small></div><div className="sharedfilters"><Filter name="FY" options={['Latest FY','FY ending 2025'].map(n=>[n,n])} selected={[year]} change={a=>update('year',a[0])}/><Filter multi name="Companies" options={[...new Set(tables.annual_benchmarks.map(r=>r.company))].map(n=>[n,n])} selected={selected} change={a=>a.length&&update('selected',a)}/><div className="toggle">{['USD','INR'].map(c=><button key={c} aria-pressed={currency===c} onClick={()=>update('currency',c)}>{c}</button>)}</div></div></header>
 <section className={'workspace-content '+(route==='overview'?'home':'detailpage')}>{route==='overview'?<><HeaderKpis/><Opportunity/></>:<><div className="pageheading"><h2>{title}</h2><a href="#/overview">← Back to Overview</a></div><Suspense fallback={<p role="status">Loading page…</p>}><DetailPages route={route}/></Suspense></>}</section>
 </main><svg width="0" height="0" aria-hidden="true"><defs><pattern id="assumption-hatch" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#e6a275"/><path d="M0 6L6 0" stroke="#70452b" strokeWidth="2"/></pattern></defs></svg>
 </div>
}
createRoot(document.getElementById('root')).render(<AppStore><RichTooltipProvider><ZoomProvider><Dashboard/></ZoomProvider></RichTooltipProvider></AppStore>);
