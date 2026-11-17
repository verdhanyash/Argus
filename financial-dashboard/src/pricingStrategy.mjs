// Commercial proposal supplied by the user; these are not billed costs or live tariffs.
export const PRICING_SOURCE='./pricing-strategy.txt';
export const GPU_COST_INR_PER_MINUTE=2.875;
export const OVERHEAD_ASSUMPTION=.4;
export const LOADED_COST_INR_PER_MINUTE=Number((GPU_COST_INR_PER_MINUTE*(1+OVERHEAD_ASSUMPTION)).toFixed(6));
const percent=(contribution,revenue)=>Number((100*contribution/revenue).toFixed(6));
export const API_OFFERS=[
 {id:'payg',name:'PAYG',priceINR:12},
 {id:'professional',name:'Professional',priceINR:10},
 {id:'enterprise',name:'Enterprise volume',priceINR:8}
];
export const SUBSCRIPTION_PLANS=[
 {name:'Starter',priceINR:2999,minutes:300},
 {name:'Professional',priceINR:13499,minutes:1500},
 {name:'Business',priceINR:47999,minutes:6000}
];
export const TRIAL_POLICY={standardMinutes:10,qualifiedMinutes:30,enterpriseMinutes:100,budgetINR:2000};
export function apiEconomics(minutes,priceINR,fx){
 const revenueINR=minutes*priceINR,costINR=minutes*LOADED_COST_INR_PER_MINUTE;
 return{minutes,revenueINR,costINR,contributionINR:revenueINR-costINR,revenue:revenueINR/fx,cost:costINR/fx,contribution:(revenueINR-costINR)/fx,margin:percent(revenueINR-costINR,revenueINR)};
}
export function subscriptionEconomics(fx,usagePercent=100){
 return SUBSCRIPTION_PLANS.map(plan=>{
  const usedMinutes=plan.minutes*usagePercent/100,costINR=usedMinutes*LOADED_COST_INR_PER_MINUTE;
  return{...plan,usedMinutes,usagePercent,effectiveRateINR:plan.priceINR/plan.minutes,price:plan.priceINR/fx,cost:costINR/fx,contribution:(plan.priceINR-costINR)/fx,contributionINR:plan.priceINR-costINR,margin:percent(plan.priceINR-costINR,plan.priceINR)};
 });
}
export function apiOfferRows(fx,multiplier=1){
 return API_OFFERS.map(offer=>({...offer,usd:offer.priceINR*multiplier/fx,loadedCost:LOADED_COST_INR_PER_MINUTE*multiplier/fx,margin:percent(offer.priceINR-LOADED_COST_INR_PER_MINUTE,offer.priceINR)}));
}
export function proposalExport(rows){
 return rows.map(r=>({...r,currency:'USD',native_currency:'INR',year:2026,value_status:'user-proposed pricing; estimated processing contribution, not net profit',loaded_cost_inr_per_video_minute:LOADED_COST_INR_PER_MINUTE,overhead_assumption_percent:40,source_url:PRICING_SOURCE}));
}
