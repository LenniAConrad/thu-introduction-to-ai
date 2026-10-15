import {logisticCalculation} from './machine-learning-math.js';
export const squaredDistance=(a,b)=>a.reduce((s,x,j)=>s+(x-b[j])**2,0);
export function randomGenerator(seed){let value=seed>>>0;return()=>{value=(Math.imul(value,1664525)+1013904223)>>>0;return(value+.5)/4294967296;};}
export const localMinimaPoints=[0,1,4,5,9,10].map(x=>[x,2]);
export const compactPoints=Array.from({length:18},(_,i)=>{const center=[[2,2],[8,2],[5,8]][Math.floor(i/6)],offset=[[-.8,-.3],[-.4,.6],[0,-.5],[.3,.8],[.7,-.2],[.5,.3]][i%6];return center.map((x,j)=>x+offset[j]);});
export const curvedPoints=Array.from({length:48},(_,i)=>{const t=i%24*Math.PI/23;return i<24?[4+3*Math.cos(t),5+3*Math.sin(t)]:[7-3*Math.cos(t),5-3*Math.sin(t)];}).concat([[.5,9],[10.5,1],[2,2],[9,9]]);
export const sharedBorderPoints=[0,.2,.4,1.4,2.4,2.6,2.8,5].map(x=>[x,0]);
export const clusterDatasets={'Two stable solutions':localMinimaPoints,'Three compact groups':compactPoints,'Curved groups':curvedPoints,'Identical points':Array.from({length:4},()=>[3,3])};
export const closestCenters=(points,centers)=>points.map(p=>centers.reduce((best,c,j)=>squaredDistance(p,c)<squaredDistance(p,centers[best])-1e-12?j:best,0));
export const clusteringLoss=(points,centers,labels)=>points.reduce((s,p,i)=>s+squaredDistance(p,centers[labels[i]]),0);
export function centroidMeans(points,centers,labels){
 return centers.map((old,j)=>{const group=points.filter((p,i)=>labels[i]===j);return group.length?old.map((_,d)=>group.reduce((s,p)=>s+p[d],0)/group.length):[...old];});
}
export function initialCenters(points,k,method,seed){
 if(method==='Higher objective'&&points===localMinimaPoints&&k===2)return [[0,2],[4,2]];
 if(method==='Lower objective'&&points===localMinimaPoints&&k===2)return [[5,2],[10,2]];
 if(method==='Duplicate centers')return Array.from({length:k},()=>[...points[0]]);
 const rng=randomGenerator(seed),indices=Array.from({length:points.length},(_,i)=>i);
 for(let i=indices.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[indices[i],indices[j]]=[indices[j],indices[i]];}
 return indices.slice(0,k).map(i=>[...points[i]]);
}
export function kmeansState(points,centers){return {points,centers:centers.map(p=>[...p]),labels:null,phase:'Assignment',iterations:0,history:[],stable:false};}
export function kmeansStep(s){
 if(s.stable)return;
 if(s.phase==='Assignment'){
  const labels=closestCenters(s.points,s.centers);
  s.labels=labels;s.phase='Mean update';s.history.push({phase:'Assignment',iteration:s.iterations,loss:clusteringLoss(s.points,s.centers,labels)});
 }else{
  const next=centroidMeans(s.points,s.centers,s.labels);s.stable=next.every((c,i)=>squaredDistance(c,s.centers[i])<1e-20)&&closestCenters(s.points,next).every((c,i)=>c===s.labels[i]);
  s.centers=next;s.iterations++;s.phase='Assignment';s.history.push({phase:'Mean update',iteration:s.iterations,loss:clusteringLoss(s.points,s.centers,s.labels)});
 }
}
export function runKmeans(points,centers,max=100){const s=kmeansState(points,centers);for(let i=0;i<max*2&&!s.stable;i++)kmeansStep(s);return s;}

export function densityAnalysis(points,eps,minPts){
 const neighbors=points.map(p=>points.flatMap((q,i)=>squaredDistance(p,q)<=eps*eps+1e-12?[i]:[])),core=neighbors.map(ns=>ns.length>=minPts),component=points.map(()=>-1);let count=0;
 for(let i=0;i<points.length;i++)if(core[i]&&component[i]===-1){const queue=[i];component[i]=count;for(let q=0;q<queue.length;q++)for(const j of neighbors[queue[q]])if(core[j]&&component[j]===-1){component[j]=count;queue.push(j);}count++;}
 const candidates=points.map((_,i)=>[...new Set(neighbors[i].filter(j=>core[j]).map(j=>component[j]))].sort((a,b)=>a-b));
 return {neighbors,core,component,count,candidates,types:points.map((_,i)=>core[i]?'Core':candidates[i].length?'Border':'Noise')};
}
export function densityState(points,eps,minPts,reverse=false){return {points,eps,minPts,reverse,analysis:densityAnalysis(points,eps,minPts),labels:points.map(()=>null),visited:points.map(()=>false),queue:[],queued:[],current:null,cluster:null,steps:0,done:false,message:'No observations processed.'};}
export function densityStep(s){
 if(s.done)return;const {analysis:a}=s,order=Array.from({length:s.points.length},(_,i)=>s.reverse?s.points.length-1-i:i);
 const addNeighbors=i=>{for(const j of (s.reverse?[...a.neighbors[i]].reverse():a.neighbors[i]))if(!s.queued.includes(j)){s.queue.push(j);s.queued.push(j);}};
 if(s.queue.length){
  const i=s.queue.shift();s.current=i;
  if(!s.visited[i]){s.visited[i]=true;if(a.core[i])addNeighbors(i);}
  if(s.labels[i]===null||s.labels[i]===-1)s.labels[i]=s.cluster;
  s.message=`Process point ${i+1}: ${a.types[i]}. ${a.core[i]?'Expand its neighborhood.':'Do not expand through this point.'}`;
 }else{
  const i=order.find(i=>!s.visited[i]);if(i===undefined){s.done=true;s.message='All observations processed; density expansion complete.';return;}
  s.current=i;s.visited[i]=true;
  if(a.core[i]){s.cluster=a.component[i];s.labels[i]=s.cluster;s.queued=[i];addNeighbors(i);s.message=`Start core component ${s.cluster+1} at point ${i+1}.`;}
  else{s.labels[i]=-1;s.message=`Point ${i+1} is non-core; mark provisionally unassigned. A later core expansion can still attach a border point.`;}
 }
 s.steps++;
 if(s.visited.every(Boolean)&&!s.queue.length){s.done=true;s.message+=' All observations processed.';}
}
export function completeDensity(points,eps,minPts,reverse=false){const s=densityState(points,eps,minPts,reverse);for(let i=0;i<2000&&!s.done;i++)densityStep(s);return s;}

export function hypercubeExperiment(dimension,count,seed,side=.8){
 const rng=randomGenerator(seed),points=Array.from({length:count},()=>Array.from({length:64},rng)),margin=(1-side)/2;
 const rows=points.map((p,index)=>({index,point:p.slice(0,dimension),projection:[p[0],dimension>1?p[1]:.5],central:p.slice(0,dimension).every(v=>v>=margin&&v<=1-margin),distance:Math.sqrt(p.slice(0,dimension).reduce((s,v)=>s+(v-.5)**2,0))}));
 const near=Math.min(...rows.map(r=>r.distance)),far=Math.max(...rows.map(r=>r.distance)),inside=rows.filter(r=>r.central).length;
 return {rows,inside,fraction:inside/count,volume:side**dimension,near,far,relative:(far-near)/far,meanSquared:rows.reduce((s,r)=>s+r.distance**2,0)/count,expectedSquared:dimension/12};
}
export const pcaDatasets={'Correlated':[[1,1],[2,2.5],[3,2],[4,4.5],[5,4],[6,6]],'Exact diagonal':[[-1,-1],[0,0],[1,1]],'Equal variance':[[-1,-1],[-1,1],[1,-1],[1,1]],'Curved groups':curvedPoints.slice(0,48),'Outlier':[[1,1],[2,2.5],[3,2],[4,4.5],[5,4],[6,6],[10,0]]};
export function pcaCalculation(points,angle){
 const n=points.length,mean=[0,1].map(d=>points.reduce((s,p)=>s+p[d],0)/n),centered=points.map(p=>p.map((v,d)=>v-mean[d])),axis=[Math.cos(angle*Math.PI/180),Math.sin(angle*Math.PI/180)];
 const xx=centered.reduce((s,p)=>s+p[0]**2,0)/n,yy=centered.reduce((s,p)=>s+p[1]**2,0)/n,xy=centered.reduce((s,p)=>s+p[0]*p[1],0)/n;
 const scores=centered.map(p=>p[0]*axis[0]+p[1]*axis[1]),reconstructed=scores.map(v=>axis.map((a,d)=>mean[d]+v*a));
 const variance=scores.reduce((s,v)=>s+v*v,0)/n,total=xx+yy,discarded=points.reduce((s,p,i)=>s+squaredDistance(p,reconstructed[i]),0)/n;
 const delta=Math.hypot(xx-yy,2*xy),eigenvalues=[(total+delta)/2,(total-delta)/2],optimalAngle=(Math.atan2(2*xy,xx-yy)*90/Math.PI+180)%180;
 return {mean,centered,axis,scores,reconstructed,covariance:[[xx,xy],[xy,yy]],variance,total,discarded,eigenvalues,optimalAngle,fraction:total?variance/total:0};
}

export const embeddingData=[[-2.2,-1.9,.1],[-1.9,-2.1,.2],[-2.05,-1.6,-.15],[-1.6,-1.8,.05],[2,-2.2,1.1],[2.25,-1.8,.85],[1.65,-2,1.2],[2.1,-1.55,.9],[-.2,2.1,-1.1],[.15,1.7,-.9],[.35,2.25,-1.2],[-.35,1.65,-.8]];
function gaussianRow(distances,beta){
 const min=Math.min(...distances),raw=distances.map(d=>Math.exp(-(d-min)*beta)),sum=raw.reduce((s,v)=>s+v,0),probabilities=raw.map(v=>v/sum),entropy=-probabilities.reduce((s,p)=>s+(p?p*Math.log(p):0),0);
 return {probabilities,entropy};
}
export function embeddingAffinities(points,perplexity){
 const n=points.length;if(perplexity<=1||perplexity>=n)throw Error('Perplexity must lie strictly between 1 and n.');
 const distances=points.map(p=>points.map(q=>squaredDistance(p,q))),conditional=[],sigmas=[],achieved=[];
 for(let i=0;i<n;i++){
  const ds=distances[i].filter((_,j)=>j!==i);let beta=1,lower=0,upper=Infinity,row;
  for(let t=0;t<80;t++){row=gaussianRow(ds,beta);const error=row.entropy-Math.log(perplexity);if(Math.abs(error)<1e-10)break;if(error>0){lower=beta;beta=Number.isFinite(upper)?(beta+upper)/2:beta*2;}else{upper=beta;beta=(beta+lower)/2;}}
  let k=0;conditional.push(Array.from({length:n},(_,j)=>j===i?0:row.probabilities[k++]));sigmas.push(Math.sqrt(1/(2*beta)));achieved.push(Math.exp(row.entropy));
 }
 const joint=conditional.map((row,i)=>row.map((v,j)=>(v+conditional[j][i])/(2*n)));
 return {distances,conditional,joint,sigmas,achieved};
}
export function embeddingObjective(joint,locations){
 const n=locations.length,weights=locations.map((p,i)=>locations.map((q,j)=>i===j?0:1/(1+squaredDistance(p,q)))),normalizer=weights.flat().reduce((s,v)=>s+v,0),q=weights.map(row=>row.map(v=>v/normalizer));
 const contributions=joint.map((row,i)=>row.map((p,j)=>p?p*Math.log(p/q[i][j]):0)),loss=contributions.flat().reduce((s,v)=>s+v,0);
 const gradient=locations.map((p,i)=>p.map((_,d)=>4*locations.reduce((s,z,j)=>s+(joint[i][j]-q[i][j])*weights[i][j]*(p[d]-z[d]),0)));
 return {weights,q,contributions,loss,gradient};
}
export function embeddingInitial(seed,n=embeddingData.length){const rng=randomGenerator(seed);return Array.from({length:n},()=>[.1*(rng()-.5),.1*(rng()-.5)]);}
export function embeddingStep(joint,locations,eta){
 const before=embeddingObjective(joint,locations);let rate=eta;
 for(let attempt=0;attempt<18;attempt++){
  let next=locations.map((p,i)=>p.map((v,d)=>v-rate*before.gradient[i][d]));const mean=[0,1].map(d=>next.reduce((s,p)=>s+p[d],0)/next.length);next=next.map(p=>p.map((v,d)=>v-mean[d]));
  const after=embeddingObjective(joint,next);if(Number.isFinite(after.loss)&&after.loss<=before.loss+1e-12)return {locations:next,before,after,rate,accepted:true};rate/=2;
 }
 return {locations,before,after:before,rate,accepted:false};
}
export const studentDensity=(x,df)=>({1:.31830988618379075,3:.36755259694786135,10:.389108383966031,30:.3956321848940978}[df])*(1+x*x/df)**(-(df+1)/2);

export const federatedClients=[[[0,1],[.2,1.45]],[[.3,1.55],[.4,1.82],[.5,1.98]],[[.6,2.25],[.7,2.35],[.8,2.63],[.9,2.76],[1,3.02]]];
export function linearBatch(points,weights){const [b,w]=weights,errors=points.map(([x,y])=>b+w*x-y);return {loss:errors.reduce((s,e)=>s+e*e,0)/points.length,gradient:[2*errors.reduce((s,e)=>s+e,0)/points.length,2*errors.reduce((s,e,i)=>s+e*points[i][0],0)/points.length]};}
export function federatedRound(weights,eta,steps,clients=federatedClients){
 const local=clients.map(points=>{let current=[...weights],first;for(let i=0;i<steps;i++){const batch=linearBatch(points,current);first??=batch.gradient;current=current.map((w,j)=>w-eta*batch.gradient[j]);}return {count:points.length,weights:current,firstGradient:first,loss:linearBatch(points,current).loss};});
 const n=local.reduce((s,c)=>s+c.count,0),next=weights.map((_,j)=>local.reduce((s,c)=>s+c.count/n*c.weights[j],0));return {weights:next,local,total:n};
}
export function glyphPixels(kind,position=2,intensity=1){return Array.from({length:36},(_,i)=>{const row=Math.floor(i/6),col=i%6;return kind==='Vertical'?(col===position&&row>=1&&row<=4?intensity:0):(row===position&&col>=1&&col<=4?intensity:0);});}
export const glyphTraining=['Vertical','Horizontal'].flatMap((kind,label)=>[2,3].flatMap(position=>[.6,1].map(intensity=>({pixels:glyphPixels(kind,position,intensity),label}))));
export function glyphBatch(weights){
 const rows=glyphTraining.map(p=>logisticCalculation(weights,p.pixels,p.label)),n=rows.length;
 return {loss:rows.reduce((s,r)=>s+r.loss,0)/n,gradient:weights.map((_,j)=>rows.reduce((s,r)=>s+r.gradient[j],0)/n),accuracy:rows.filter((r,i)=>r.label===glyphTraining[i].label).length/n};
}
export function glyphStep(weights,eta){const before=glyphBatch(weights),next=weights.map((w,j)=>w-eta*before.gradient[j]);return {weights:next,before,after:glyphBatch(next)};}
export function glyphExplanation(weights,pixels,kind,eps){
 const target=kind==='Vertical'?0:1,clean=logisticCalculation(weights,pixels,target),direction=target===0?1:-1,perturbed=pixels.map((v,i)=>Math.max(0,Math.min(1,v+direction*eps*Math.sign(weights[i+1])))),after=logisticCalculation(weights,perturbed,target);
 return {clean,after,perturbed,contributions:weights.slice(1).map((w,i)=>w*pixels[i]),actualBound:Math.max(...pixels.map((v,i)=>Math.abs(v-perturbed[i])))};
}
export const fairnessScores=[[[.9,1],[.8,1],[.7,1],[.6,1],[.5,0],[.4,0],[.3,0],[.1,0]],[[.9,1],[.6,1],[.4,1],[.2,1],[.8,0],[.5,0],[.3,0],[.1,0]]];
export function scoreCounts(points,threshold){let tp=0,fp=0,fn=0,tn=0;for(const [p,y] of points){if(p>=threshold){if(y)tp++;else fp++;}else if(y)fn++;else tn++;}return {tp,fp,fn,tn,accuracy:(tp+tn)/points.length,tpr:tp/(tp+fn),fpr:fp/(fp+tn),rate:(tp+fp)/points.length};}
