export const softmax = (values) => {
  const max = Math.max(...values);
  if (max === -Infinity) return values.map(() => 0);
  const e = values.map(x => Math.exp(x-max));
  const sum=e.reduce((a,b)=>a+b,0);
  return e.map(x=>x/sum);
};
export const mse = (points,w,b) => points.reduce((s,[x,y])=>s+(w*x+b-y)**2,0)/points.length;
export function regressionGradient(points,w,b){
 const n=points.length;
 return {dw:2*points.reduce((sum,[x,y])=>sum+x*(w*x+b-y),0)/n,db:2*points.reduce((sum,[x,y])=>sum+w*x+b-y,0)/n};
}
export function assignments(points, centers) {
  return points.map(p=>centers.map(c=>p.reduce((s,v,i)=>s+(v-c[i])**2,0)).reduce((best,v,i,arr)=>v<arr[best]?i:best,0));
}
export function moveCenters(points, centers, labels) {
  return centers.map((c,i)=>{
    const members=points.filter((_,j)=>labels[j]===i);
    return members.length?c.map((_,d)=>members.reduce((s,p)=>s+p[d],0)/members.length):[...c];
  });
}
export function inertia(points,centers,labels=assignments(points,centers)) {
  return points.reduce((sum,p,i)=>sum+p.reduce((s,v,j)=>s+(v-centers[labels[i]][j])**2,0),0);
}
export function iou(a,b) {
  const overlap=Math.max(0,Math.min(a[0]+a[2],b[0]+b[2])-Math.max(a[0],b[0]))*Math.max(0,Math.min(a[1]+a[3],b[1]+b[3])-Math.max(a[1],b[1]));
  const union=a[2]*a[3]+b[2]*b[3]-overlap;
  return {overlap,union,value:union>0?overlap/union:0};
}
export function attend(q,keys,values,mask=false,index=0) {
  const scores=keys.map((k,j)=>mask&&j>index?-Infinity:k.reduce((s,x,i)=>s+x*q[i],0)/Math.sqrt(q.length));
  const weights=softmax(scores);
  const output=values[0].map((_,d)=>values.reduce((s,v,i)=>s+weights[i]*v[d],0));
  return {scores,weights,output};
}
export function convolve(patch,kernel) {return patch.reduce((sum,row,i)=>sum+row.reduce((s,x,j)=>s+x*kernel[i][j],0),0);}
export function metrics(tp,fp,fn,tn) {
 const divide=(a,b)=>b?a/b:null;
 return {precision:divide(tp,tp+fp),recall:divide(tp,tp+fn),f1:divide(2*tp,2*tp+fp+fn),accuracy:divide(tp+tn,tp+fp+fn+tn),specificity:divide(tn,tn+fp),npv:divide(tn,tn+fn)};
}
export function wordCounts(text){
 const words=text.toLowerCase().match(/[\p{L}\p{N}]+/gu)||[];
 return Object.fromEntries([...new Set(words)].sort().map(w=>[w,words.filter(x=>x===w).length]));
}
export function rnn(inputs,recurrent){let h=0;return inputs.map(x=>h=Math.tanh(x+recurrent*h));}
export const discounted=(costs,gamma)=>costs.reduce((s,c,i)=>s+c*gamma**i,0);
export const importance=(p,q,rareRisk,usualRisk)=>({rareWeight:p/q,usualWeight:(1-p)/(1-q),natural:p*rareRisk+(1-p)*usualRisk,raw:q*rareRisk+(1-q)*usualRisk,weighted:q*rareRisk*(p/q)+(1-q)*usualRisk*((1-p)/(1-q))});
export function fitLine(points){const n=points.length,mx=points.reduce((s,p)=>s+p[0],0)/n,my=points.reduce((s,p)=>s+p[1],0)/n;const denominator=points.reduce((s,p)=>s+(p[0]-mx)**2,0);const w=denominator?points.reduce((s,p)=>s+(p[0]-mx)*(p[1]-my),0)/denominator:0;return {w,b:my-w*mx};}
export function nearestNeighbors(points,query,k,scale=1){const neighbors=points.map((p,i)=>({index:i,label:p[2],distance:Math.hypot((p[0]-query[0])*scale,p[1]-query[1])})).sort((a,b)=>a.distance-b.distance||a.index-b.index).slice(0,k);const votes={};for(const n of neighbors)votes[n.label]=(votes[n.label]||0)+1;const label=Object.keys(votes).sort((a,b)=>votes[b]-votes[a]||neighbors.find(n=>n.label===a).distance-neighbors.find(n=>n.label===b).distance||a.localeCompare(b))[0];return {neighbors,votes,label};}
export function projectPCA(points,angle){const n=points.length,mean=[0,1].map(d=>points.reduce((s,p)=>s+p[d],0)/n),centered=points.map(p=>p.map((v,d)=>v-mean[d])),xx=centered.reduce((s,p)=>s+p[0]**2,0)/n,yy=centered.reduce((s,p)=>s+p[1]**2,0)/n,xy=centered.reduce((s,p)=>s+p[0]*p[1],0)/n;const rad=angle*Math.PI/180,axis=[Math.cos(rad),Math.sin(rad)],scores=centered.map(p=>p[0]*axis[0]+p[1]*axis[1]),variance=scores.reduce((s,x)=>s+x*x,0)/n;return {mean,centered,scores,axis,variance,total:xx+yy,fraction:xx+yy?variance/(xx+yy):0,optimalAngle:(Math.atan2(2*xy,xx-yy)*90/Math.PI+180)%180};}
export function neuron(x,w,b,y){const z=w*x+b,p=z>=0?1/(1+Math.exp(-z)):Math.exp(z)/(1+Math.exp(z));const loss=Math.max(z,0)-y*z+Math.log1p(Math.exp(-Math.abs(z)));return {z,p,loss,dz:p-y,dw:(p-y)*x,db:p-y};}
export function marginScores(points,w,b,C=1){
 const norm=Math.hypot(...w);
 const rows=points.map(([x,y,label])=>{const score=w[0]*x+w[1]*y+b,signed=label*score;return {score,signed,distance:norm?signed/norm:null,hinge:Math.max(0,1-signed)};});
 const hinge=rows.reduce((sum,row)=>sum+row.hinge,0),penalty=norm**2/2;
 return {norm,rows,hinge,penalty,objective:penalty+C*hinge,bandWidth:norm?2/norm:null,minMargin:norm?Math.min(...rows.map(r=>r.distance)):null};
}
export function sinusoidalPosition(position,width=4){
 if(!Number.isFinite(position)||!Number.isInteger(width)||width<2||width%2)throw Error('Use a finite position and a positive even width.');
 return Array.from({length:width},(_,j)=>{const angle=position/10000**(2*Math.floor(j/2)/width);return j%2?Math.cos(angle):Math.sin(angle)});
}
export function maskScores(target,predicted){
 if(!target.length||target.length!==predicted.length||[...target,...predicted].some(v=>v!==0&&v!==1))throw Error('Use equal, nonempty binary masks.');
 let tp=0,fp=0,fn=0,tn=0;
 target.forEach((v,i)=>{if(v){if(predicted[i])tp++;else fn++}else{if(predicted[i])fp++;else tn++}});
 const foreground=tp+fp+fn?tp/(tp+fp+fn):null,background=tn+fp+fn?tn/(tn+fp+fn):null,defined=[foreground,background].filter(v=>v!==null);
 return {tp,fp,fn,tn,foreground,background,mean:defined.reduce((a,b)=>a+b,0)/defined.length,accuracy:(tp+tn)/target.length};
}
export function diffusionScalar(x0,noise,alphaBar,predictedNoise){
 if(![x0,noise,alphaBar,predictedNoise].every(Number.isFinite)||alphaBar<=0||alphaBar>1)throw Error('Use finite values with 0 < cumulative alpha ≤ 1.');
 const signal=Math.sqrt(alphaBar)*x0,noiseTerm=Math.sqrt(1-alphaBar)*noise,xt=signal+noiseTerm;
 const recovered=(xt-Math.sqrt(1-alphaBar)*predictedNoise)/Math.sqrt(alphaBar);
 return {signal,noiseTerm,xt,recovered,noiseLoss:(predictedNoise-noise)**2,reconstructionLoss:(recovered-x0)**2};
}
// Connected components of core points; ambiguous borders go to the first expanded component.
export function dbscan1D(points,eps,minPts,reverse=false){
 if(points.some(x=>!Number.isFinite(x))||!Number.isFinite(eps)||eps<0||!Number.isInteger(minPts)||minPts<1)throw Error('Use finite points, nonnegative radius and positive integer MinPts.');
 const neighbors=points.map(x=>points.flatMap((v,i)=>Math.abs(v-x)<=eps+1e-12?[i]:[])),core=neighbors.map(n=>n.length>=minPts),labels=points.map(()=>-1);
 let count=0;
 for(let i=0;i<points.length;i++)if(core[i]&&labels[i]===-1){labels[i]=count;const queue=[i];for(let q=0;q<queue.length;q++)for(const j of neighbors[queue[q]])if(core[j]&&labels[j]===-1){labels[j]=count;queue.push(j)}count++}
 const candidates=points.map((_,i)=>[...new Set(neighbors[i].filter(j=>core[j]).map(j=>labels[j]))].sort((a,b)=>a-b));
 candidates.forEach((cs,i)=>{if(!core[i]&&cs.length)labels[i]=reverse?cs.at(-1):cs[0]});
 return {neighbors,core,labels,candidates,count,types:labels.map((label,i)=>core[i]?'Core':label>=0?'Border':'Noise')};
}
export function importanceVariance(p,q,rareRisk,usualRisk,n=1000){
 if(![p,q,rareRisk,usualRisk,n].every(Number.isFinite)||p<=0||p>=1||q<=0||q>=1||rareRisk<0||rareRisk>1||usualRisk<0||usualRisk>1||!Number.isInteger(n)||n<1)throw Error('Use probabilities with full two-group support and a positive integer sample size.');
 const r=importance(p,q,rareRisk,usualRisk),second=p*p*rareRisk/q+(1-p)**2*usualRisk/(1-q),naturalVariance=r.natural*(1-r.natural),weightedVariance=Math.max(0,second-r.natural**2);
 const a=p*Math.sqrt(rareRisk),b=(1-p)*Math.sqrt(usualRisk);
 return {...r,second,naturalVariance,weightedVariance,naturalSE:Math.sqrt(naturalVariance/n),weightedSE:Math.sqrt(weightedVariance/n),ratio:weightedVariance?naturalVariance/weightedVariance:null,optimalQ:a+b?a/(a+b):null};
}
