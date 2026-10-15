// Small, deterministic numerical models for the fourth lecture. No external runtime.
export const sigmoid=x=>x>=0?1/(1+Math.exp(-x)):Math.exp(x)/(1+Math.exp(x));
export function activation(x,kind){if(kind==='Sigmoid'){const y=sigmoid(x);return {y,d:y*(1-y)}}if(kind==='Tanh'){const y=Math.tanh(x);return {y,d:1-y*y}}return {y:Math.max(0,x),d:x>0?1:0};}
export const originalNetwork={x:[0,1],w:[-1,0,-1,-1,1,-1],target:1};
export const activeNetwork={x:[2,1],w:[1,-1,.5,1,3,-1],target:3};
export function sixWeightNetwork(x,w,target){
 const z=[w[0]*x[0]+w[1]*x[1],w[2]*x[0]+w[3]*x[1]],h=z.map(v=>Math.max(0,v)),o=w[4]*h[0]+w[5]*h[1],y=Math.max(0,o),loss=(y-target)**2,delta=2*(y-target)*(o>0?1:0),hidden=[delta*w[4]*(z[0]>0?1:0),delta*w[5]*(z[1]>0?1:0)],gradient=[hidden[0]*x[0],hidden[0]*x[1],hidden[1]*x[0],hidden[1]*x[1],delta*h[0],delta*h[1]];
 const inputGradient=[hidden[0]*w[0]+hidden[1]*w[2],hidden[0]*w[1]+hidden[1]*w[3]];
 return {z,h,o,y,loss,delta,hidden,gradient,inputGradient};
}
export function landscape(x,y,kind){if(kind==='Saddle')return {loss:x*x-y*y,gradient:[2*x,-2*y]};if(kind==='Two minima')return {loss:(x*x-1)**2+y*y,gradient:[4*x*(x*x-1),2*y]};return {loss:.5*(x*x+10*y*y),gradient:[x,10*y]};}
export function optimizerStep(weights,gradient,state,{kind='Gradient descent',eta=.1,beta=.8}={}){
 const velocity=weights.map((_,i)=>kind==='Momentum'?beta*(state.velocity?.[i]||0)+gradient[i]:gradient[i]);
 const square=weights.map((_,i)=>.9*(state.square?.[i]||0)+.1*gradient[i]**2);
 const rates=weights.map((_,i)=>kind==='RMSprop'?eta/(Math.sqrt(square[i])+1e-8):eta);
 return {weights:weights.map((w,i)=>w-rates[i]*velocity[i]),velocity,square,rates};
}
export function seededRandom(seed){let n=seed>>>0;return()=>{n=(1664525*n+1013904223)>>>0;return n/4294967296}}
export function mlpInitial(seed=7){const random=seededRandom(seed);return Array.from({length:17},(_,i)=>i===16?0:(random()-.5)*1.6)}
export function xorData(validation=false,flips=0){const values=validation?[-.8,-.4,.4,.8]:[-1,-.6,.6,1],data=values.flatMap(x=>values.map(y=>({x:[x,y],y:x*y<0?1:0})));if(!validation)for(const i of [0,5,10,15].slice(0,flips))data[i].y=1-data[i].y;return data;}
export function mlpForward(weights,x){const z=Array.from({length:4},(_,j)=>weights[3*j]*x[0]+weights[3*j+1]*x[1]+weights[3*j+2]),h=z.map(Math.tanh),logit=h.reduce((sum,v,j)=>sum+v*weights[12+j],weights[16]);return {z,h,logit,p:sigmoid(logit)}}
export function mlpBatch(weights,data){const gradient=Array(17).fill(0),rows=data.map(d=>{const f=mlpForward(weights,d.x),delta=f.p-d.y,hidden=f.h.map((v,j)=>delta*weights[12+j]*(1-v*v));for(let j=0;j<4;j++){gradient[3*j]+=hidden[j]*d.x[0];gradient[3*j+1]+=hidden[j]*d.x[1];gradient[3*j+2]+=hidden[j];gradient[12+j]+=delta*f.h[j]}gradient[16]+=delta;const loss=Math.max(f.logit,0)-f.logit*d.y+Math.log1p(Math.exp(-Math.abs(f.logit)));return {...d,...f,delta,hidden,loss}});return {loss:rows.reduce((s,r)=>s+r.loss,0)/data.length,accuracy:rows.filter(r=>(r.p>=.5?1:0)===r.y).length/data.length,gradient:gradient.map(g=>g/data.length),rows};}
export const mlpNames=Array.from({length:4},(_,j)=>[`h${j+1}·x₁`,`h${j+1}·x₂`,`h${j+1} bias`]).flat().concat(['output·h1','output·h2','output·h3','output·h4','output bias']);
export function shuffledOrder(seed,epoch,count=16){const order=Array.from({length:count},(_,i)=>i),random=seededRandom(seed+epoch*104729);for(let i=count-1;i>0;i--){const j=Math.floor(random()*(i+1));[order[i],order[j]]=[order[j],order[i]]}return order;}
export function trainingInitial(seed=7){return {weights:mlpInitial(seed),velocity:Array(17).fill(0),square:Array(17).fill(0),updates:0,epochs:0,cursor:0,order:shuffledOrder(seed,0),history:[],last:null,stopped:false}}
export function trainingPreview(s){const data=xorData(false,s.flips),ids=s.model.order.slice(s.model.cursor,s.model.cursor+s.batch);return {ids,batch:mlpBatch(s.model.weights,ids.map(i=>data[i])),full:mlpBatch(s.model.weights,data),validation:mlpBatch(s.model.weights,xorData(true))}}
export function trainingStep(s){const m=s.model;if(m.updates>=2000||m.stopped)return false;const r=trainingPreview(s);if(!m.history.length)m.history.push({update:m.updates,train:r.full.loss,validation:r.validation.loss});const next=optimizerStep(m.weights,r.batch.gradient,m,s),after=mlpBatch(next.weights,xorData(false,s.flips)),val=mlpBatch(next.weights,xorData(true));if(!Number.isFinite(after.loss)||Math.max(...next.weights.map(Math.abs))>1e4){m.stopped=true;return false}m.last={ids:r.ids,gradient:r.batch.gradient,old:[...m.weights],next:next.weights,before:r.batch.loss,after:mlpBatch(next.weights,r.ids.map(i=>xorData(false,s.flips)[i])).loss,rates:next.rates};Object.assign(m,{weights:next.weights,velocity:next.velocity,square:next.square});m.updates++;m.cursor+=r.ids.length;if(m.cursor>=16){m.epochs++;m.cursor=0;m.order=shuffledOrder(s.seed,m.epochs)}m.history.push({update:m.updates,train:after.loss,validation:val.loss});return true;}
export const poolRed=[[3,-1,-3,-1],[-3,1,0,-3],[-3,-3,0,1],[3,-2,-2,-1]];
export const poolBlue=[[-1,-1,-1,-1],[-1,-1,-2,1],[-1,-1,-2,1],[-1,0,-4,3]];
export function pooling(input,size=2,stride=2,kind='Max'){const out=[],windows=[];for(let y=0;y+size<=input.length;y+=stride){const row=[];for(let x=0;x+size<=input[0].length;x+=stride){const values=[];for(let j=0;j<size;j++)for(let i=0;i<size;i++)values.push({y:y+j,x:x+i,value:input[y+j][x+i]});const maximum=Math.max(...values.map(v=>v.value)),value=kind==='Max'?maximum:values.reduce((s,v)=>s+v.value,0)/values.length;row.push(value);windows.push({y,x,values,value,winner:values.find(v=>v.value===maximum)})}out.push(row)}return {out,windows};}
export const convolutionKernels={'Vertical edge':[[-1,0,1],[-1,0,1],[-1,0,1]],'Horizontal edge':[[-1,-1,-1],[0,0,0],[1,1,1]],'Mean':Array.from({length:3},()=>Array(3).fill(1/9)),'Identity':[[0,0,0],[0,1,0],[0,0,0]]};
export function imageFixture(kind='Vertical edge'){return Array.from({length:6},(_,y)=>Array.from({length:6},(_,x)=>kind==='Checkerboard'?(x+y)%2:kind==='Horizontal edge'?(y>=3?1:0):(x>=3?1:0)))}
export function convolution(input,kernel,bias=0,stride=1,pad=0){const n=Math.floor((input.length+2*pad-kernel.length)/stride)+1,out=[],windows=[];for(let y=0;y<n;y++){const row=[];for(let x=0;x<n;x++){const products=[];for(let j=0;j<kernel.length;j++)for(let i=0;i<kernel[0].length;i++){const iy=y*stride+j-pad,ix=x*stride+i-pad,pixel=input[iy]?.[ix]??0;products.push({iy,ix,pixel,weight:kernel[j][i],product:pixel*kernel[j][i]})}const value=products.reduce((s,p)=>s+p.product,bias);row.push(value);windows.push({y,x,products,value})}out.push(row)}return {out,windows};}
export function convShape(n,channels,k,filters,stride=1,pad=0){const size=Math.floor((n+2*pad-k)/stride)+1;return {size,channels:filters,params:(k*k*channels+1)*filters,activations:Math.max(0,size)**2*filters};}
export function sourceArchitecture(input=36,channels=1,first=4,second=8,classes=4){const a=convShape(input,channels,9,first),p1={size:Math.floor(a.size/2),channels:first,params:0},b=convShape(p1.size,first,5,second),p2={size:Math.floor(b.size/2),channels:second,params:0},c=convShape(p2.size,second,5,classes);return {layers:[a,p1,b,p2,c],valid:[a,p1,b,p2,c].every(v=>v.size>0),total:a.params+b.params+c.params};}
export function softmax(scores){const max=Math.max(...scores),values=scores.map(v=>v===-Infinity?0:Math.exp(v-max)),total=values.reduce((a,b)=>a+b,0);return values.map(v=>v/total)}
const mat=(w,v)=>[w[0]*v[0]+w[1]*v[1],w[2]*v[0]+w[3]*v[1]];
export const attentionTokens=['I','saw','a','saw'];
export function contextAttention({query=2,position=0,qscale=1,kscale=1,vswap=0,scorer='Dot product',mask='Full',radius=1,offset=0}={}){
 const base=[[1,0],[0,1],[1,1],[0,1]],a=base.map((v,i)=>[v[0]+position*(i+1)/4,v[1]-position*(i+1)/4]),wq=[qscale,.5,0,1],wk=[1,0,.5,kscale],wv=[1-vswap,vswap,vswap,1-vswap],q=a.map(v=>mat(wq,v)),k=a.map(v=>mat(wk,v)),v=a.map(t=>mat(wv,t)),i=query-1;
 const permitted=a.map((_,j)=>mask==='Causal'?j<=i:mask==='Local'?Math.abs(j-i)<=radius:true),raw=k.map(key=>scorer==='Additive'?Math.tanh(q[i][0]+key[0])-Math.tanh(q[i][1]+key[1]):q[i][0]*key[0]+q[i][1]*key[1]),scores=raw.map((x,j)=>permitted[j]?x+offset:-Infinity),weights=softmax(scores),contributions=v.map((value,j)=>value.map(x=>x*weights[j])),output=[0,1].map(d=>contributions.reduce((sum,row)=>sum+row[d],0));
 return {a,q,k,v,wq,wk,wv,raw,scores,weights,contributions,output,permitted};
}
