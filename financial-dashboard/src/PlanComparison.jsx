import React from 'react';
import {SUBSCRIPTION_PLANS} from './pricingStrategy.mjs';
export function PlanComparison(){
 const rows=[
  ['Monthly price',...SUBSCRIPTION_PLANS.map(p=>'₹'+p.priceINR.toLocaleString('en-IN'))],
  ['Video minutes per month',...SUBSCRIPTION_PLANS.map(p=>p.minutes.toLocaleString('en-IN'))],
  ['Approx. rate per included minute',...SUBSCRIPTION_PLANS.map(p=>'~₹'+Math.round(p.priceINR/p.minutes))],
  ['Video, audio and text analysis','Included','Included','Included'],
  ['Timestamped sentiment','Included','Included','Included'],
  ['Timestamped emotion','Included','Included','Included'],
  ['Unused minutes roll over','No','No','No'],
  ['Additional minutes','Billed separately','Billed separately','Billed separately'],
  ['Currency','INR','INR','INR'],
  ['Availability','Planned','Planned','Planned']
 ];
 return <section className="plan-comparison" aria-labelledby="plan-comparison-title">
 <div className="plan-comparison-heading"><div><small>PROPOSED MONTHLY PLANS</small><h2 id="plan-comparison-title">Everything in each plan, side by side.</h2></div><p>Unused minutes expire at the end of each billing month. Extra minutes are billed separately.</p></div>
 <div className="plan-comparison-scroll" tabIndex={0} role="region" aria-label="Monthly plan comparison table"><table><thead><tr><th scope="col">Plan</th>{SUBSCRIPTION_PLANS.map(p=><th scope="col" key={p.name}>{p.name}</th>)}</tr></thead><tbody>{rows.map(([label,...values])=><tr key={label}><th scope="row">{label}</th>{values.map((value,i)=><td key={i}>{value}</td>)}</tr>)}</tbody></table></div>
 <small className="plan-comparison-note">Proposed offerings in INR; not live subscription billing. Overage rates have not been specified.</small>
 </section>;
}
