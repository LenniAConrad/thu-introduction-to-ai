// Finite teaching models. No fitted naturalistic driving data or original research stack.
export const scenarios=['Ordinary cruising','Wide-gap following','Comfortable merge','Close cut-in','Hard brake','Conflicting merge'];
export const natural=[.94,.035,.02,.004,.0009,.0001];
export const events=[0,0,0,1,1,1];
export const sum=a=>a.reduce((x,y)=>x+y,0);
export const normalize=a=>{const z=sum(a);if(!(z>0)||a.some(x=>!Number.isFinite(x)||x<0))throw Error('Invalid probability mass');return a.map(x=>x/z)};
export const sigmoid=x=>1/(1+Math.exp(-x));
export function generator(seed=7){let a=seed>>>0;return ()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296}}
export function draw(p,rng){const u=rng();let acc=0;for(let i=0;i<p.length;i++){acc+=p[i];if(u<acc)return i}return p.length-1}
export function proposal(mode='Useful oversampling'){
 if(mode==='Natural')return natural.slice();
 if(mode==='Extreme oversampling')return [.001,.001,.001,.996,.0005,.0005];
 if(mode==='Missing support')return [.1,.1,.1,.5,.2,0];
 return [.15,.1,.1,.5,.13,.02];
}
export function moments(p,q,f=events){
 const mean=sum(p.map((x,i)=>x*f[i])),covered=sum(p.map((x,i)=>q[i]>0?x*f[i]:0));
 const support=p.every((x,i)=>x*f[i]===0||q[i]>0);
 const second=sum(p.map((x,i)=>q[i]>0?x*x*f[i]*f[i]/q[i]:0));
 const variance=Math.max(0,second-covered*covered);
 return {mean,covered,support,second,variance,raw:sum(q.map((x,i)=>x*f[i])),weights:p.map((x,i)=>q[i]>0?x/q[i]:null)};
}
export function sampleBatch(q,n=200,seed=7){
 n=Math.min(5000,Math.max(1,Math.floor(n)));const rng=generator(seed),counts=q.map(()=>0),items=[];
 for(let j=0;j<n;j++){const i=draw(q,rng);counts[i]++;if(j<24)items.push({i,event:events[i],weight:natural[i]/q[i],contribution:events[i]*natural[i]/q[i]})}
 const r=moments(natural,q),estimate=sum(counts.map((x,i)=>x*events[i]*(q[i]?natural[i]/q[i]:0)))/n;
 const sq=sum(counts.map((x,i)=>x*(events[i]*(q[i]?natural[i]/q[i]:0))**2));
 return {...r,n,counts,items,estimate,observed:sum(counts.map((x,i)=>x*events[i])),empiricalSE:n>1?Math.sqrt(Math.max(0,(sq-n*estimate*estimate)/(n-1))/n):null,oracleSE:Math.sqrt(r.variance/n)};
}
export function rarity(p,n,beta=.2){return {expected:p*n,zero:Math.exp(n*Math.log1p(-p)),zeroUpper:-Math.expm1(Math.log(.05)/n),eventsNeeded:(1.96/beta)**2,testsNeeded:(1.96/beta)**2*(1-p)/p}}
export function dimension(k=8,bias=.8){const factor=.25/bias+.25/(1-bias),base=moments(natural,proposal());return {factor,second:base.second*factor**k,variance:base.second*factor**k-base.mean**2,sparseVariance:base.variance,mean:base.mean}}
// Absorbing gap chain: gap 0 is collision, gap 9 safe termination; .1 safe exit per nonterminal transition.
export const gapActions=['Open gap','Hold gap','Close gap'];
export const gapPolicy=[.15,.7,.15];
export function challengeTarget(q,g,a){const next=g+[1,0,-1][a];if(next<=0)return 1;if(next>=9)return 0;return .9*sum(q.slice((next-1)*3,next*3).map((x,j)=>x*gapPolicy[j]))}
export function challengeSweep(q,eta=.5){return q.map((v,j)=>v+eta*(challengeTarget(q,Math.floor(j/3)+1,j%3)-v))}
export function exactChallenge(){let q=Array(24).fill(0);for(let i=0;i<1500;i++)q=challengeSweep(q,1);return q}
export const maneuvers=['Coast','Brake','Accelerate','Merge'];
export function initialTraffic(gap=14,speed=20,delay=1){return {t:0,step:0,cars:[{id:'AV',x:0,v:20,lane:0},{id:'Lead',x:gap+4.5,v:16,lane:0},{id:'Merge',x:gap+2,v:speed,lane:1}],delay,crash:false,weight:1,adjusted:0,decisions:[],trace:[]}}
export function trafficNatural(car){return car.lane===0?[.83,.06,.11,0]:[.89,.02,.06,.03]}
function motion(car,a,dt=.5){const active=a<0?Math.min(dt,car.v/-a):dt;return {...car,x:car.x+car.v*active+.5*a*active**2,v:Math.max(0,car.v+a*dt)}}
function avAcceleration(cars,t,delay){const av=cars[0],lead=cars.slice(1).filter(c=>c.lane===av.lane&&c.x>av.x).sort((a,b)=>a.x-b.x)[0];return t>=delay&&lead&&lead.x-av.x-4.5<8+1.1*av.v?-6:av.v<20?1:0}
export function advanceTraffic(state,actions=[0,0],delay=state.delay){
 const cars=state.cars.map(c=>({...c}));actions.forEach((a,j)=>{if(a===3)cars[j+1].lane=0});
 const acceleration=[avAcceleration(cars,state.t,delay),...actions.map(a=>[0,-5,2,-1][a])];const next=cars.map((c,i)=>motion(c,acceleration[i]));
 // Sweep every piecewise-quadratic relative trajectory, including each stopping instant.
 let crash=state.crash,minGap=Infinity,crashVehicles=state.crash?[...(state.crashVehicles||[])]:[];
 for(let j=1;j<3;j++)if(cars[j].lane===cars[0].lane){const times=[0,.5,...[0,j].map(i=>acceleration[i]<0?cars[i].v/-acceleration[i]:.5).filter(t=>t>0&&t<.5)].sort((a,b)=>a-b);
  for(let b=0;b<times.length-1;b++){const l=times[b],r=times[b+1],pa=motion(cars[0],acceleration[0],l),pb=motion(cars[j],acceleration[j],l),d=pb.x-pa.x,rv=pb.v-pa.v,ra=(pb.v>0?acceleration[j]:0)-(pa.v>0?acceleration[0]:0),ts=[0,r-l];if(ra&&-rv/ra>0&&-rv/ra<r-l)ts.push(-rv/ra);const vals=ts.map(t=>d+rv*t+.5*ra*t*t),lo=Math.min(...vals),hi=Math.max(...vals),dist=lo<=0&&hi>=0?0:Math.min(...vals.map(Math.abs));minGap=Math.min(minGap,dist-4.5);if(dist<=4.5+1e-10){crash=true;if(!crashVehicles.includes(j))crashVehicles.push(j)}}
 }
 return {...state,cars:next,t:state.t+.5,step:state.step+1,crash,crashVehicles,minGap};
}
export function trafficCriticality(state,surrogateDelay=1,epsilon=.3,threshold=.001){
 const rows=state.cars.slice(1).map((c,j)=>{const p=trafficNatural(c),challenge=maneuvers.map((_,a)=>{let s={...state,crash:false};for(let k=0;k<6&&!s.crash;k++){const acts=[0,0];if(k===0)acts[j]=a;s=advanceTraffic(s,acts,surrogateDelay)}return s.crashVehicles?.includes(j+1)?1:0});const v=p.map((x,a)=>x*challenge[a]);return {id:c.id,p,challenge,v,c:sum(v)}});
 let principal=rows[0].c>=rows[1].c?0:1;if(rows[principal].c<=threshold)principal=-1;
 return {rows:rows.map((r,j)=>({...r,q:principal===j?r.p.map((v,a)=>epsilon*v+(1-epsilon)*r.v[a]/r.c):r.p.slice()})),principal};
}
export function trafficStep(state,{mode='Sparse adjustment',epsilon=.3,surrogateDelay=1,threshold=.001,seed=7}={}){
 if(state.crash||state.step>=16)return state;
 const r=trafficCriticality(state,surrogateDelay,epsilon,threshold),rng=generator(seed);for(let k=0;k<state.step*2;k++)rng();
 const decisions=r.rows.map((row,j)=>{const q=mode==='Natural'?row.p:row.q,a=draw(q,rng);return {...row,q,a,weight:row.p[a]/q[a],adjusted:mode!=='Natural'&&r.principal===j}});
 const next=advanceTraffic(state,decisions.map(d=>d.a));next.weight=state.weight*decisions[0].weight*decisions[1].weight;next.adjusted=state.adjusted+decisions.filter(d=>d.adjusted).length;next.decisions=decisions;
 next.trace=[...state.trace,{step:state.step,t:state.t,cars:state.cars.map(c=>({...c})),critical:r.principal>=0,principal:r.principal,decisions,weight:next.weight,crash:next.crash}];return next;
}
export function trafficEpisode(options={}){let s=initialTraffic(options.gap??14,options.speed??20,options.delay??1);while(!s.crash&&s.step<16)s=trafficStep(s,options);return s}
// Independent synthetic conflict groups. Rectification sends rejected conflicts into the no-event group.
export const conflictNames=['Rear-end','Sideswipe','Angle'];
export const conflictTarget=[.008,.003,.001];
export function calibration(w=[0,0,0],multiplier=1,missing=false){
 const generated=missing?[.12,.08,0]:[.12,.08,.04],target=conflictTarget.map(x=>x*multiplier),accept=w.map(sigmoid),corrected=generated.map((x,j)=>x*accept[j]),required=target.map((v,j)=>generated[j]>0?v/generated[j]:Infinity),feasible=required.every(x=>x<=1);
 const terms=w.map((v,j)=>Math.max(v,0)-v*required[j]+Math.log1p(Math.exp(-Math.abs(v))));
 return {generated,target,accept,corrected,required,feasible,noEvent:1-sum(corrected),loss:feasible?sum(terms)/3:null,gradient:feasible?accept.map((v,j)=>(v-required[j])/3):null,error:sum(corrected.map((x,j)=>Math.abs(x-target[j])))};
}
export function dense(rho=.05,positive=.7){const meanZ=2*positive-1,varZ=1-meanZ**2,mean=rho*meanZ;return {meanZ,varZ,mean,rawVariance:rho-mean**2,denseVariance:rho*rho*varZ,rawConditional:meanZ}}
