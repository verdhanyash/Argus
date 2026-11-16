import {smallVideoCost} from './videoCostModel.mjs';
export function scaleRunCosts({users,iterations,gpuSeconds,sizeMB,uptimeHours,rate,put,get,storage}){
 const perRun=smallVideoCost(sizeMB,gpuSeconds,rate,put,get,storage);
 const runs=users*iterations;
 const activeHours=runs*gpuSeconds/3600;
 const billedHours=Math.max(activeHours,uptimeHours);
 const activeGpu=activeHours*rate,idleGpu=(billedHours-activeHours)*rate,s3=runs*perRun.s3;
 const total=activeGpu+idleGpu+s3;
 return{users,iterations,runs,activeHours,billedHours,activeGpu,idleGpu,s3,total,perRun:total/runs,perUser:total/users,runtimePerRun:perRun.total};
}
