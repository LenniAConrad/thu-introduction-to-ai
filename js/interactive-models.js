// Directly manipulable plots for the remaining calculation labs: backprop, diffusion, metrics, RNN memory,
// discounting, bag of words, vision tasks, alignment stages, AI paradigms, Euclidean distance, importance sampling.
// `pointer(state,point)` receives viewBox coordinates from mountLab; sliders and buttons remain the keyboard path.
import {esc,fmt,table} from './render.js';
import {neuron,diffusionScalar,metrics,rnn,discounted,wordCounts,importanceVariance} from './math.js';

const colors=['#670875','#ce754d','#347ca3','#a98d27'];
const stat=(name,v)=>`<div class="lab-stat"><span>${esc(name)}</span><strong>${esc(v)}</strong></div>`;
const chart=(body,label,viewBox='0 0 440 340',interactive=true)=>`<svg class="explore-plot" ${interactive?'data-plot':''} viewBox="${viewBox}" role="img" aria-label="${esc(label)}">${body}</svg>`;
const line=(x1,y1,x2,y2,extra='')=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${extra}/>`;
const grid=(x1,y1,x2,y2)=>line(x1,y1,x2,y2,'class="plot-grid"');
const dot=(x,y,color,r=5,title='',extra='')=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" ${extra}>${title?`<title>${esc(title)}</title>`:''}</circle>`;
const text=(x,y,t,extra='')=>`<text x="${x}" y="${y}" ${extra}>${esc(t)}</text>`;
const range=(id,label,min,max,step=1)=>({id,label,min,max,step,type:'range'});
const select=(id,label,options)=>({id,label,options,type:'select'});
const button=(id,label,pressed=null)=>`<button type="button" class="button subtle small" data-lab-action="${id}" ${pressed===null?'':`aria-pressed="${pressed}"`}>${label}</button>`;
const hint=t=>`<p class="plot-hint">${t}</p>`;
const summary=t=>`<p class="plot-summary">${t}</p>`;
const goal=(met,text)=>`<span class="plot-goal ${met?'met':''}" data-goal="${met?'met':'open'}">${met?'✓ ':''}${esc(text)}</span>`;
const legend=items=>`<div class="plot-legend">${items.map(([mark,label])=>`<span>${mark} ${esc(label)}</span>`).join('')}</div>`;
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
const snap=(v,step)=>Number((Math.round(v/step)*step).toFixed(8));

// ---- One-neuron backpropagation: click the loss curve to set w ----
const BX=w=>40+(w+3)*60,ZX=z=>40+(z+6)*30,PY=p=>110-p*80;
function sigmoidView(r,y){
 const z=clamp(r.z,-6,6),curve=`<path d="${Array.from({length:97},(_,i)=>{const v=-6+i*.125;return `${i?'L':'M'}${ZX(v)},${PY(1/(1+Math.exp(-v)))}`}).join(' ')}" fill="none" stroke="#670875" stroke-width="2"/>`;
 return chart([-6,-3,0,3,6].map(v=>grid(ZX(v),30,ZX(v),110)+text(ZX(v)-4,126,v)).join('')+grid(40,PY(.5),400,PY(.5))+text(8,PY(1)+4,'1')+text(8,PY(.5)+4,'.5')+text(8,PY(0)+4,'0')+curve+line(40,PY(y),400,PY(y),`stroke="${colors[1]}" stroke-dasharray="4 4"`)+text(ZX(6)-52,PY(y)+(y?16:-6),`target y = ${y}`)+line(ZX(z),PY(r.p),ZX(z),PY(y),`stroke="${colors[1]}" stroke-width="3"`)+dot(ZX(z),PY(r.p),'#222',6,`z = ${fmt(r.z,4)}, p = ${fmt(r.p,4)}`)+text(ZX(z)+(z>3?-70:10),(PY(r.p)+PY(y))/2+4,`p − y = ${fmt(r.dz,3)}`)+text(200,138,'preactivation z'),`Sigmoid curve with the current z = ${fmt(r.z,3)} marked; the orange gap p − y = ${fmt(r.dz,3)} drives both gradients`,'0 0 440 140',false);
}
export const backpropDefinition={
 initial:()=>({x:2,y:1,w:-.5,b:0,eta:.1,previous:null,blocked:false}),
 controls:[range('x','Input x',-3,3,.1),select('y','Target y',['0','1']),range('w','Weight w',-3,3,.01),range('b','Bias b',-3,3,.01),range('eta','Learning rate η',.01,2,.01)],
 change(s){s.previous=null;s.blocked=false},
 pointer(s,p){s.w=clamp(snap((p.x-40)/60-3,.01),-3,3);s.previous=null;s.blocked=false},
 describe(s){const r=neuron(s.x,s.w,s.b,Number(s.y));return `w = ${fmt(s.w,3)}: p = ${fmt(r.p,4)}, loss ${fmt(r.loss,5)}, dL/dw = ${fmt(r.dw,5)}.`},
 render(s){
  const y=Number(s.y),r=neuron(s.x,s.w,s.b,y),samples=Array.from({length:121},(_,i)=>{const w=-3+i*.05;return [w,neuron(s.x,w,s.b,y).loss]}),top=Math.max(.5,...samples.map(v=>v[1]),r.loss,s.previous?s.previous.loss:0),BY=L=>290-L/top*240;
  const curve=`<path d="${samples.map(([w,L],i)=>`${i?'L':'M'}${BX(w)},${BY(L)}`).join(' ')}" fill="none" stroke="#670875" stroke-width="2"/>`;
  const slope=-r.dw*240/top/60,n=Math.hypot(1,slope)/40,tangent=line(BX(s.w)-1/n,BY(r.loss)-slope/n,BX(s.w)+1/n,BY(r.loss)+slope/n,'stroke="#347ca3" stroke-width="2"');
  const previous=s.previous?line(BX(s.previous.w),BY(s.previous.loss),BX(s.w),BY(r.loss),'stroke="#ce754d" stroke-width="1.5" stroke-dasharray="4 3"')+dot(BX(s.previous.w),BY(s.previous.loss),'#ce754d',5,`Before the update: w = ${fmt(s.previous.w,4)}, loss ${fmt(s.previous.loss,5)}`):'';
  return `<p>Single sigmoid neuron with binary cross-entropy. The bias shifts the preactivation even when x = 0.</p>`+
   hint('Click or drag along the loss curve to set the weight w. Input, bias and target sliders reshape the curve; the w slider does the same with a keyboard.')+
   chart([-3,-2,-1,0,1,2,3].map(v=>grid(BX(v),40,BX(v),290)+text(BX(v)-3,310,v)).join('')+[0,.25,.5,.75,1].map(f=>grid(40,BY(f*top),400,BY(f*top))+text(6,BY(f*top)+4,fmt(f*top,2))).join('')+text(200,330,'weight w')+text(44,28,`loss L for x = ${fmt(s.x,1)}, b = ${fmt(s.b,2)}, y = ${y}`)+curve+tangent+previous+dot(BX(s.w),BY(r.loss),'#222',7,`w = ${fmt(s.w,4)}, loss ${fmt(r.loss,5)}, slope ${fmt(r.dw,5)}`),`Binary cross-entropy as a function of w with the current weight marked; the blue segment shows the gradient dL/dw = ${fmt(r.dw,4)}`)+
   summary(`<strong>L = ${fmt(r.loss,5)}</strong> <span>p = ${fmt(r.p,5)} · ∂L/∂w = ${fmt(r.dw,5)} · ∂L/∂b = ${fmt(r.db,5)}</span> ${goal(!!s.previous&&r.loss<s.previous.loss,s.previous?(r.loss<s.previous.loss?`Loss fell by ${fmt(s.previous.loss-r.loss,5)} after the update`:'Loss did not fall: the step overshot, lower η'):'Goal: apply one update and check that the loss falls')}`)+
   sigmoidView(r,y)+
   `<p>${s.x===0?'With x = 0 the curve is flat: w cannot change the loss, so its gradient is zero, while the bias can still learn.':`The tangent slope is ∂L/∂w = (p − y)x. ${r.dw>0?'It is positive, so a step lowers w.':r.dw<0?'It is negative, so a step raises w.':'It is zero.'}`}</p>`+
   table(['Forward step','Value'],[['z = wx + b',fmt(r.z,5)],['p = sigmoid(z)',fmt(r.p,5)],['L = −y ln(p) − (1−y) ln(1−p)',fmt(r.loss,6)]])+table(['Backward step','Gradient'],[['∂L/∂z = p − y',fmt(r.dz,6)],['∂L/∂w = (p − y)x',fmt(r.dw,6)],['∂L/∂b = p − y',fmt(r.db,6)]])+
   `<p>The chain rule multiplies the loss derivative by each local derivative. With sigmoid + binary cross-entropy the combined derivative simplifies to p − y.</p>`+button('step','Update w and b once')+
   (s.previous?table(['Update','Result'],[['Previous loss',fmt(s.previous.loss,6)],['w ← w − η ∂L/∂w',`${fmt(s.previous.w,4)} → ${fmt(s.w,4)}`],['b ← b − η ∂L/∂b',`${fmt(s.previous.b,4)} → ${fmt(s.b,4)}`],['Change in loss',fmt(r.loss-s.previous.loss,6)]]):'')+
   `<p><strong>Try:</strong> predict the sign of each gradient before updating. Set x = 0: the weight gradient becomes zero, but the bias can still learn. Both parameters use gradients from the same forward pass. Updates are limited to the sliders’ range [−3, 3]; a boundary message means the requested update was not applied. After a step the orange dot marks where you were on the curve drawn for the <em>new</em> bias.</p>`+(s.blocked?'<p role="status">Update would leave [−3, 3]. Reduce the learning rate or reset the parameters.</p>':'');
 },
 action(s,a){if(a==='step'){const r=neuron(s.x,s.w,s.b,Number(s.y)),w=s.w-s.eta*r.dw,b=s.b-s.eta*r.db;s.blocked=Math.abs(w)>3||Math.abs(b)>3;if(!s.blocked){s.previous={w:s.w,b:s.b,loss:r.loss};s.w=w;s.b=b}}}
};

// ---- Diffusion arithmetic: drag x₀ or x̂₀ on the number line; click the ᾱ ruler ----
const NX=v=>220+v*45,AX=a=>40+a*360,AY=v=>250-v*90;
export const diffusionDefinition={
 initial:()=>({x0:2,noise:-1,alpha:.64,estimate:0}),
 controls:[range('x0','Clean value x₀',-3,3,.1),range('noise','Chosen noise ε',-3,3,.1),range('alpha','Cumulative signal-retention factor ᾱ',.01,1,.01),range('estimate','Predicted noise ε̂',-3,3,.05)],
 pointer(s,p){
  if(p.y>=140){s.alpha=clamp(snap((p.x-40)/360,.01),.01,1);return}
  if(p.y>120)return;
  const r=diffusionScalar(s.x0,s.noise,s.alpha,s.estimate),value=(p.x-220)/45;
  if(Math.abs(p.x-NX(s.x0))<=Math.abs(p.x-NX(r.recovered))||s.alpha>=1)s.x0=clamp(snap(value,.1),-3,3);
  else s.estimate=clamp(snap((r.xt-Math.sqrt(s.alpha)*value)/Math.sqrt(1-s.alpha),.05),-3,3);
 },
 describe(s){const r=diffusionScalar(s.x0,s.noise,s.alpha,s.estimate);return `x₀ ${fmt(s.x0,2)}, noisy xₜ ${fmt(r.xt,4)}, estimate x̂₀ ${fmt(r.recovered,4)}, ᾱ ${fmt(s.alpha,2)}. Noise error ${fmt(r.noiseLoss,4)}; clean-value error ${fmt(r.reconstructionLoss,4)}.`},
 render(s){
  const r=diffusionScalar(s.x0,s.noise,s.alpha,s.estimate),signalWeight=Math.sqrt(s.alpha),noiseWeight=Math.sqrt(1-s.alpha);
  const curve=key=>`<path d="${Array.from({length:100},(_,i)=>{const a=.01+i*.01;return `${i?'L':'M'}${AX(a)},${AY(key==='signal'?Math.sqrt(a):Math.sqrt(1-a))}`}).join(' ')}" fill="none" stroke="${key==='signal'?colors[0]:'#888'}" stroke-width="2"/>`;
  const plot=chart([-4,-3,-2,-1,0,1,2,3,4].map(v=>grid(NX(v),60,NX(v),100)+text(NX(v)-3,118,v)).join('')+line(40,90,400,90,'stroke="#bbb"')+
   line(NX(0),72,NX(r.signal),72,`stroke="${colors[0]}" stroke-width="5"`)+line(NX(r.signal),72,NX(r.xt),72,'stroke="#888" stroke-width="5"')+text(44,50,'purple: √ᾱ x₀ · grey: √(1 − ᾱ) ε · sum: xₜ')+
   `<g data-handle="x0">${dot(NX(s.x0),90,colors[0],8,`Clean value x₀ = ${fmt(s.x0,2)}. Drag to change.`)}</g><path d="M${NX(r.xt)} 80l8 10l-8 10l-8 -10z" fill="#222"><title>Noisy value xₜ = ${fmt(r.xt,4)}</title></path><g data-handle="estimate"><rect x="${NX(r.recovered)-7}" y="83" width="14" height="14" fill="${colors[1]}"><title>Estimated clean value x̂₀ = ${fmt(r.recovered,4)}. Drag to change the noise estimate.</title></rect></g>`+
   [0,.25,.5,.75,1].map(a=>grid(AX(a),160,AX(a),250)+text(AX(a)-6,272,a)).join('')+grid(40,AY(.5),400,AY(.5))+text(6,AY(1)+4,'1')+text(6,AY(.5)+4,'.5')+text(6,AY(0)+4,'0')+curve('signal')+curve('noise')+line(AX(s.alpha),150,AX(s.alpha),255,'stroke="#222" stroke-dasharray="3 4"')+dot(AX(s.alpha),AY(signalWeight),colors[0],5,`√ᾱ = ${fmt(signalWeight,4)}`)+dot(AX(s.alpha),AY(noiseWeight),'#888',5,`√(1 − ᾱ) = ${fmt(noiseWeight,4)}`)+text(150,292,'cumulative signal retention ᾱ')+text(AX(s.alpha)+6,158,`ᾱ = ${fmt(s.alpha,2)}`),
   `Number line with clean value ${fmt(s.x0,2)}, noisy value ${fmt(r.xt,3)} and estimate ${fmt(r.recovered,3)}; below, signal and noise weights against ᾱ`,'0 0 440 300');
  return `<p><strong>Noisy value xₜ = ${fmt(r.xt,5)}.</strong> Estimated clean value x̂₀ = ${fmt(r.recovered,5)}.</p>`+
   stat('Noise prediction squared error',fmt(r.noiseLoss,5))+stat('Clean-value squared error',fmt(r.reconstructionLoss,5))+
   `<p>${goal(r.noiseLoss<1e-9,r.noiseLoss<1e-9?'Goal reached: the noise estimate is exact, so x̂₀ = x₀':`Goal: make (ε̂ − ε)² zero; currently ${fmt(r.noiseLoss,4)}`)}</p>`+
   hint('Drag the purple dot to move x₀ or the orange square to move your estimate x̂₀ (this sets ε̂). Click the lower ruler to choose ᾱ. The sliders do the same.')+plot+
   `<p>Purple dot: x₀. Black diamond: xₜ. Orange square: x̂₀. Lower curves: √ᾱ (purple) and √(1 − ᾱ) (grey); the noise weight dominates once ᾱ falls below ½.</p>`+
   `<p>xₜ = √ᾱ x₀ + √(1 − ᾱ) ε. Here ᾱ is the cumulative product of per-step signal-retention factors, not one step's α. Smaller ᾱ means less signal and more noise in the conditional distribution.</p>`+
   table(['Forward calculation','Value'],[['Signal weight √ᾱ',fmt(signalWeight,5)],['Noise weight √(1 − ᾱ)',fmt(noiseWeight,5)],['Signal contribution √ᾱ x₀',fmt(r.signal,5)],['Noise contribution √(1 − ᾱ) ε',fmt(r.noiseTerm,5)],['Sum = xₜ',fmt(r.xt,5)]])+
   `<h3>Estimate the clean value</h3><p>x̂₀ = (xₜ − √(1 − ᾱ) ε̂) / √ᾱ.</p>`+
   table(['Reconstruction calculation','Value'],[['Subtract estimated noise',fmt(r.xt-noiseWeight*s.estimate,5)],['Divide by √ᾱ',fmt(r.recovered,5)],['Error x̂₀ − x₀',fmt(r.recovered-s.x0,5)]])+
   button('exact','Use exact noise (reference)')+
   `<p><strong>Try:</strong> first adjust ε̂ to minimize (ε̂ − ε)². Then hold a nonzero noise-estimation error fixed and reduce ᾱ: clean-value error grows. Its square equals ((1 − ᾱ) / ᾱ) × (ε̂ − ε)². At ᾱ = 1 there is no added noise, so x̂₀ = x₀ for any ε̂.</p>`+
   `<p>This is one scalar training-example calculation. ε is a chosen illustrative realization, not a newly sampled Gaussian; ε̂ is your manual estimate, not a network output. A model is trained across examples, noise and time steps. The reconstructed x̂₀ is <strong>not</strong> xₜ₋₁ or a complete reverse sampling step. Generation starts without knowing the clean answer or actual noise. ᾱ = 0 is excluded because this inversion would divide by zero.</p>`;
 },
 action(s,a){if(a==='exact')s.estimate=s.noise}
};

// ---- Classification metrics: drag the confusion-count bars ----
const counts=['tp','fp','fn','tn'],countNames={tp:'True positives',fp:'False positives',fn:'False negatives',tn:'True negatives'},MX=i=>60+i*70,MY=c=>250-c*2;
export const metricsDefinition={
 initial:()=>({tp:8,fp:2,fn:4,tn:86}),
 controls:counts.map(id=>range(id,countNames[id],0,100)),
 pointer(s,p){const i=counts.findIndex((_,i)=>Math.abs(p.x-MX(i))<=33);if(i<0||p.y<30||p.y>270)return;s[counts[i]]=clamp(Math.round((250-p.y)/2),0,100)},
 describe(s){const m=metrics(s.tp,s.fp,s.fn,s.tn),v=x=>x===null?'undefined':fmt(x*100,1)+'%';return `TP ${s.tp}, FP ${s.fp}, FN ${s.fn}, TN ${s.tn}. Precision ${v(m.precision)}, recall ${v(m.recall)}, accuracy ${v(m.accuracy)}.`},
 render(s){
  const m=metrics(s.tp,s.fp,s.fn,s.tn),bars=counts.map((id,i)=>`<g data-handle="${id}"><rect x="${MX(i)-25}" y="${MY(100)}" width="50" height="200" fill="transparent"/><rect x="${MX(i)-25}" y="${MY(s[id])}" width="50" height="${s[id]*2}" fill="${colors[i]}" fill-opacity=".85"/><title>${countNames[id]}: ${s[id]}. Drag to change.</title></g>`+text(MX(i)-10,MY(s[id])-8,s[id])+text(MX(i)-12,272,id.toUpperCase())).join('');
  const stack=(x,name,value,partColor,partLabel,row)=>value===null?`<rect x="${x}" y="50" width="38" height="200" fill="#ddd"/>${text(x-12,272+row*16,name)}${text(x-14,40,'undefined')}`:`<rect x="${x}" y="50" width="38" height="200" fill="${partColor}" fill-opacity=".35"/><rect x="${x}" y="${250-value*200}" width="38" height="${value*200}" fill="${colors[0]}" fill-opacity=".85" data-share="${name}"><title>${partLabel}: ${fmt(value*100,1)}%</title></rect>${text(x-12,272+row*16,name)}${text(x-6,40,fmt(value*100,1)+'%')}`;
  return hint('Drag a count bar up or down to change it. The sliders do the same. The two right-hand bars show TP as a share of predicted positives (precision) and of actual positives (recall).')+
   chart([0,25,50,75,100].map(v=>grid(40,MY(v),320,MY(v))+text(8,MY(v)+4,v)).join('')+bars+line(330,40,330,260,'stroke="#bbb"')+stack(336,'Pred +',m.precision,colors[1],'Precision: TP over TP + FP (orange = FP)',0)+stack(386,'Actual +',m.recall,colors[2],'Recall: TP over TP + FN (blue = FN)',1)+text(80,295,'confusion-matrix counts')+text(338,24,'TP share'),`Bars for TP ${s.tp}, FP ${s.fp}, FN ${s.fn}, TN ${s.tn}; precision ${m.precision===null?'undefined':fmt(m.precision*100,1)+'%'} and recall ${m.recall===null?'undefined':fmt(m.recall*100,1)+'%'} as stacked shares`,'0 0 440 300')+
   legend([['<i class="legend-dot"></i>','TP'],['<i class="legend-dot" style="background:#ce754d"></i>','FP'],['<i class="legend-dot" style="background:#347ca3"></i>','FN'],['<i class="legend-dot" style="background:#a98d27"></i>','TN']])+
   table(['','Actual +','Actual −'],[['Predicted +',s.tp,s.fp],['Predicted −',s.fn,s.tn]])+`<div class="metric-grid">${Object.entries(m).map(([k,v])=>stat(k,v===null?'Undefined':fmt(v*100,1)+'%')).join('')}</div>`+
   `<p>Precision = TP/(TP+FP); recall = TP/(TP+FN); F1 = 2TP/(2TP+FP+FN). Specificity = TN/(TN+FP); NPV = TN/(TN+FN). Choose which class counts as positive before interpreting these rates. Hold TP, FP, and FN fixed and increase TN: accuracy rises while recall stays fixed. These controls change counts, not a classifier threshold.</p>`;
 }
};

// ---- Scalar RNN memory: drag vertically to set the first input, along the ruler to set w ----
const RX=t=>40+(t-1)*50,RY=h=>150-h*100;
export const rnnDefinition={
 initial:()=>({w:.5,x:1}),
 controls:[range('w','Recurrent weight w',0,1.5,.05),range('x','First input',-2,2,.1)],
 pointer(s,p){if(p.y>=268)s.w=clamp(snap((p.x-40)/350*1.5,.05),0,1.5);else if(p.y>=40)s.x=clamp(snap((150-p.y)/50,.1),-2,2)},
 describe(s){const hs=rnn([s.x,0,0,0,0,0,0,0],s.w);return `First input ${fmt(s.x,1)}, weight ${fmt(s.w,2)}. Hidden state ${fmt(hs[0],3)} at t = 1 and ${fmt(hs[7],4)} at t = 8.`},
 render(s){
  const xs=[s.x,0,0,0,0,0,0,0],hs=rnn(xs,s.w);
  return `<p>h₀ = 0; hₜ = tanh(xₜ + w hₜ₋₁).</p>`+hint('Drag up or down in the plot to set the first input x; drag along the ruler at the bottom to set the recurrent weight w. The sliders do the same.')+
   chart([1,2,3,4,5,6,7,8].map(t=>grid(RX(t),50,RX(t),250)+text(RX(t)-3,264,t)).join('')+[-1,-.5,.5,1].map(h=>grid(40,RY(h),400,RY(h))+text(8,RY(h)+4,h)).join('')+line(40,RY(0),400,RY(0),'stroke="#bbb"')+text(8,RY(0)+4,'0')+hs.map((h,i)=>`<rect x="${RX(i+1)-14}" y="${Math.min(RY(h),RY(0))}" width="28" height="${Math.abs(RY(h)-RY(0))}" fill="${colors[0]}" fill-opacity=".8"><title>t = ${i+1}: h = ${fmt(h,5)}</title></rect>`).join('')+`<path d="${hs.map((h,i)=>`${i?'L':'M'}${RX(i+1)},${RY(h)}`).join(' ')}" fill="none" stroke="#222" stroke-width="1.5"/>`+
   `<rect x="20" y="268" width="400" height="32" fill="#f7f2f8"/>`+[0,.5,1,1.5].map(w=>line(40+w/1.5*350,270,40+w/1.5*350,276,'stroke="#888"')+text(40+w/1.5*350-6,292,`w=${w}`)).join('')+line(40+s.w/1.5*350,268,40+s.w/1.5*350,300,`stroke="${colors[1]}" stroke-width="3"`),`Hidden states over eight time steps for first input ${fmt(s.x,1)} and weight ${fmt(s.w,2)}`,'0 0 440 300')+
   summary(`<strong>h₈ = ${fmt(hs[7],5)}</strong> <span>${s.w>=1?'w ≥ 1: memory persists or saturates':s.w===0?'w = 0: the state forgets immediately':'w < 1: memory decays geometrically'}</span>`)+
   table(['Time','Input','Hidden state'],hs.map((h,i)=>[i+1,xs[i],fmt(h,5)]))+`<p>Only the first input is nonzero. Later states show memory persisting or decaying. This is a scalar recurrence, not a trained language model.</p>`;
 }
};

// ---- Discounted cost: drag the γ ruler ----
const CX=t=>70+t*70,CY=v=>250-v*45;
export const discountDefinition={
 initial:()=>({g:.7}),
 controls:[range('g','Discount factor γ',0,1,.05)],
 pointer(s,p){if(p.y>=268)s.g=clamp(snap((p.x-40)/360,.05),0,1)},
 describe:s=>`γ = ${fmt(s.g,2)}. Discounted total ${fmt(discounted([4,4,4,4,4],s.g),4)} of an undiscounted 20.`,
 render(s){
  const terms=[0,1,2,3,4].map(t=>4*s.g**t);
  return hint('Drag along the ruler at the bottom to set γ. The slider does the same.')+
   chart([0,1,2,3,4].map(v=>grid(40,CY(v),400,CY(v))+text(20,CY(v)+4,v)).join('')+terms.map((v,t)=>`<rect x="${CX(t)-25}" y="${CY(v)}" width="50" height="${250-CY(v)}" fill="${colors[0]}" fill-opacity="${.35+.65*(v/4)}"><title>t = ${t}: ${fmt(v,4)}</title></rect>`+text(CX(t)-12,CY(v)-6,fmt(v,2))+text(CX(t)-14,266,`t = ${t}`)).join('')+`<rect x="20" y="268" width="400" height="32" fill="#f7f2f8"/>`+[0,.5,1].map(g=>line(40+g*360,270,40+g*360,276,'stroke="#888"')+text(40+g*360-8,292,`γ=${g}`)).join('')+line(40+s.g*360,268,40+s.g*360,300,`stroke="${colors[1]}" stroke-width="3"`),`Bars for γ to the power t times cost 4, for t from 0 to 4`,'0 0 440 300')+
   table(['t','Cost','γᵗ × cost'],[0,1,2,3,4].map(i=>[i,4,fmt(terms[i],4)]))+stat('Discounted total',fmt(discounted([4,4,4,4,4],s.g),4))+`<p>The t = 0 cost is undiscounted, including at γ = 0.</p>`;
 }
};

// ---- Bag of words: reorder words with a click and watch the counts stay ----
const chips=(sentence,key)=>{const words=sentence.match(/[\p{L}\p{N}]+/gu)||[];return `<div class="plot-actions" aria-label="Sentence ${key.toUpperCase()} words">${words.map((w,i)=>button(`move-${key}-${i}`,esc(w))).join('')||'<span class="muted">no words</span>'}</div>`};
export const bowDefinition={
 initial:()=>({a:'Dog bites man',b:'Man bites dog'}),
 controls:[{id:'a',label:'Sentence A',type:'text'},{id:'b',label:'Sentence B',type:'text'}],
 describe(s){const a=wordCounts(s.a),b=wordCounts(s.b);return JSON.stringify(a)===JSON.stringify(b)?'Both sentences have identical word counts.':'The two count vectors differ.'},
 render(s){
  const a=wordCounts(s.a),b=wordCounts(s.b),words=[...new Set([...Object.keys(a),...Object.keys(b)])].sort(),shown=words.slice(0,8),max=Math.max(1,...words.map(w=>Math.max(a[w]||0,b[w]||0))),WX=i=>50+i*(340/Math.max(1,shown.length)),WY=c=>200-c/max*150;
  return hint('Click a word to move it to the end of its sentence. The counts do not change; the sentence does.')+
   `<p><strong>A:</strong></p>${chips(s.a,'a')}<p><strong>B:</strong></p>${chips(s.b,'b')}`+
   chart(shown.map((w,i)=>`<rect x="${WX(i)}" y="${WY(a[w]||0)}" width="18" height="${200-WY(a[w]||0)}" fill="${colors[0]}"><title>A: ${w} × ${a[w]||0}</title></rect><rect x="${WX(i)+20}" y="${WY(b[w]||0)}" width="18" height="${200-WY(b[w]||0)}" fill="${colors[1]}"><title>B: ${w} × ${b[w]||0}</title></rect>`+text(WX(i),222,w.length>9?w.slice(0,8)+'…':w)).join('')+line(40,200,400,200,'stroke="#bbb"')+text(8,WY(max)+4,max)+text(8,204,'0')+(words.length>8?text(300,30,`${words.length-8} more words not drawn`):''),`Word counts for sentence A in purple and B in orange`,'0 0 440 240',false)+
   table(['Word','A count','B count'],words.map(w=>[w,a[w]||0,b[w]||0]))+`<p class="insight">${JSON.stringify(a)===JSON.stringify(b)?'Same counts. Word order—and therefore meaning—can still differ.':'Different count vectors; word order is still discarded.'}</p><p>Lowercased Unicode word counts; punctuation removed. No subword tokenization.</p>`;
 },
 action(s,a){const m=a.match(/^move-([ab])-(\d+)$/);if(!m)return;const key=m[1],words=s[key].match(/[\p{L}\p{N}]+/gu)||[],i=Number(m[2]);if(i<words.length){words.push(...words.splice(i,1));s[key]=words.join(' ')}}
};

// ---- Computer-vision tasks: click a pixel to see what each task reports there ----
const cars=[[60,135,135,70],[250,135,135,70]];
const region=(x,y)=>{const car=cars.findIndex(([cx,cy,w,h])=>x>=cx&&x<=cx+w&&y>=cy&&y<=cy+h);return car>=0?{kind:'car',car}:y>=185?{kind:'road'}:{kind:'sky'}};
export const visionTasksDefinition={
 initial:()=>({task:'Classification',px:120,py:175}),
 controls:[select('task','Task',['Classification','Detection','Semantic segmentation','Instance segmentation'])],
 pointer(s,p){s.px=clamp(Math.round(p.x),0,440);s.py=clamp(Math.round(p.y),0,340)},
 describe(s){return `${s.task} at pixel (${s.px}, ${s.py}): ${report(s)}`},
 render(s){
  const seg=s.task.includes('segmentation');
  const scene=`<rect width="440" height="340" fill="#f2f5f7"/><rect y="185" width="440" height="155" fill="${seg?'#b8b4a0':'#ddd'}"/>`+cars.map(([x],i)=>`<path d="M${x} 200v-35h20l15-25h55l20 25h15v35z" fill="${s.task==='Instance segmentation'?(i?'#ce754d':'#670875'):seg?'#835a95':'#485e77'}"><title>Car ${i+1}</title></path>${s.task==='Detection'?`<rect x="${x-5}" y="135" width="135" height="70" fill="none" stroke="#ce754d" stroke-width="3"/><text x="${x}" y="128" fill="#ce754d">car</text>`:''}`).join('')+`<g>${line(s.px-10,s.py,s.px+10,s.py,'stroke="#222" stroke-width="2"')}${line(s.px,s.py-10,s.px,s.py+10,'stroke="#222" stroke-width="2"')}<circle cx="${s.px}" cy="${s.py}" r="7" fill="none" stroke="#fff" stroke-width="2"/></g>`;
  return hint('Click anywhere in the scene to ask what this task reports at that pixel.')+chart(scene,`${s.task} output for two cars; inspected pixel at (${s.px}, ${s.py})`)+
   summary(`<strong>At (${s.px}, ${s.py}):</strong> <span>${report(s)}</span>`)+
   `<p class="insight">${({'Classification':'Image label: car present. No count or locations.','Detection':'Two object boxes with class labels.','Semantic segmentation':'All car pixels share a class; road has a separate class.','Instance segmentation':'Each car has a separate mask and identity.'})[s.task]}</p>`;
 }
};
function report(s){const r=region(s.px,s.py);
 if(s.task==='Classification')return 'the whole image is labelled “car present”; a single pixel has no output of its own.';
 if(s.task==='Detection')return r.kind==='car'?`inside box ${r.car+1} (class car); boxes locate objects but do not label individual pixels.`:'outside every box, so detection reports nothing here.';
 if(s.task==='Semantic segmentation')return r.kind==='car'?'class “car”, shared by both cars.':r.kind==='road'?'class “road”.':'background class.';
 return r.kind==='car'?`car instance ${r.car+1}; the other car is a separate instance.`:'no instance mask covers this pixel.';
}

// ---- Alignment stages: pick a stage, see one training example ----
const stages=['Pretraining','Supervised fine-tuning','RLHF'];
const stageDetail={Pretraining:{row:['Raw text','Predict next token','Language patterns'],example:['Text: “The Yangtze is the longest river in …”','Target: the next token, “China”','Every position in the corpus is a training example.']},'Supervised fine-tuning':{row:['Instruction–response examples','Imitate demonstrated responses','Instruction following'],example:['Prompt: “Summarize this paragraph in one sentence.”','Target: a human-written summary','The model learns the response format and behaviour shown.']},RLHF:{row:['Preference-derived reward','Improve reward with a reference-policy constraint','Preference alignment'],example:['Prompt with two candidate responses','Label: which response a human preferred','A reward model scores responses; the policy is tuned toward higher reward without drifting far from the fine-tuned model.']}};
export const alignmentDefinition={
 initial:()=>({stage:'Pretraining'}),
 controls:[select('stage','Training stage',stages)],
 describe:s=>`${s.stage}: ${stageDetail[s.stage].row.join('; ')}.`,
 render(s){const d=stageDetail[s.stage];return hint('Click a stage in the pipeline to inspect what one training example looks like there. The menu does the same.')+
  `<div class="plot-actions" aria-label="Training pipeline">${stages.map((st,i)=>(i?'<span aria-hidden="true">→</span>':'')+button('stage-'+i,esc(st),st===s.stage)).join('')}</div>`+
  table(['Data','Objective','Intended contribution'],[d.row])+table(['One '+s.stage+' example',''],d.example.map((e,i)=>[['Input','Target','Note'][i],e]))+`<p>Course three-stage model. Preference reward is not a guarantee of factual accuracy.</p>`},
 action(s,a){const m=a.match(/^stage-(\d)$/);if(m&&stages[Number(m[1])])s.stage=stages[Number(m[1])]}
};

// ---- AI paradigms: choose an approach and follow where the decision comes from ----
const kinds=['Rules','Learned patterns','Interaction'];
const kindDetail={Rules:{text:'IF obstacle ahead THEN stop. Explicit conditions are inspectable but can need many exceptions.',flow:['Sensor reading','Hand-written condition','Stop / continue'],source:'a programmer'},'Learned patterns':{text:'Train a classifier from labeled obstacle/clear images. The result depends on representative examples.',flow:['Camera image','Learned classifier','Stop / continue'],source:'labeled examples'},Interaction:{text:'Train a policy in simulation with rewards for progress and penalties for collisions. Reward design and exploration matter.',flow:['State in simulation','Learned policy','Action, then reward'],source:'rewards from trial and error'}};
export const paradigmsDefinition={
 initial:()=>({kind:'Rules'}),
 controls:[select('kind','Approach',kinds)],
 describe:s=>`${s.kind}: the decision comes from ${kindDetail[s.kind].source}.`,
 render(s){const d=kindDetail[s.kind];return `<h3>Robot obstacle avoidance</h3>`+hint('Click an approach to see where its decision rule comes from. The menu does the same.')+
  `<div class="plot-actions" aria-label="Approaches">${kinds.map((k,i)=>button('kind-'+i,esc(k),k===s.kind)).join('')}</div>`+
  chart(d.flow.map((label,i)=>`<rect x="90" y="${12+i*62}" width="260" height="44" rx="6" fill="${i===1?colors[0]:'#f5edf7'}" stroke="${colors[0]}"/>`+text(220,40+i*62,label,`text-anchor="middle" ${i===1?'fill="#fff"':''}`)+(i<2?`<path d="M220 ${56+i*62}v8" stroke="#222" stroke-width="2"/><path d="M214 ${64+i*62}l6 8l6 -8z" fill="#222"/>`:'')).join('')+text(220,215,`The middle box comes from ${d.source}.`,'text-anchor="middle"'),`Decision flow for the ${s.kind} approach`,'0 0 440 230',false)+
  `<p>${d.text}</p><p>These approaches can be combined. This is a conceptual comparison, not a running robot simulation.</p>`},
 action(s,a){const m=a.match(/^kind-(\d)$/);if(m&&kinds[Number(m[1])])s.kind=kinds[Number(m[1])]}
};

// ---- Euclidean distance: drag the point; the right triangle shows the legs ----
const QX=x=>220+x*20,QY=y=>170-y*20;
export const pythonDefinition={
 initial:()=>({x:3,y:4,step:0}),
 controls:[range('x','x coordinate',-8,8),range('y','y coordinate',-8,8)],
 change(s){s.step=0},
 pointer(s,p){s.x=clamp(Math.round((p.x-220)/20),-8,8);s.y=clamp(Math.round((170-p.y)/20),-8,8)},
 describe:s=>`Point (${s.x}, ${s.y}); distance from the origin ${fmt(Math.hypot(s.x,s.y),4)}.`,
 render(s){
  const d=Math.hypot(s.x,s.y);
  return hint('Drag the point anywhere on the grid; coordinates snap to integers. The sliders do the same.')+
   chart([-8,-6,-4,-2,2,4,6,8].map(v=>grid(QX(v),10,QX(v),330)+grid(60,QY(v),380,QY(v))+text(QX(v)-4,QY(0)+16,v)+text(QX(0)+5,QY(v)+4,v)).join('')+line(QX(-8),QY(0),QX(8),QY(0),'stroke="#bbb"')+line(QX(0),QY(-8),QX(0),QY(8),'stroke="#bbb"')+
    `<path d="M${QX(0)} ${QY(0)}L${QX(s.x)} ${QY(0)}L${QX(s.x)} ${QY(s.y)}z" fill="${colors[0]}" fill-opacity=".12"/>`+line(QX(0),QY(0),QX(s.x),QY(0),`stroke="${colors[1]}" stroke-width="3"`)+line(QX(s.x),QY(0),QX(s.x),QY(s.y),`stroke="${colors[2]}" stroke-width="3"`)+line(QX(0),QY(0),QX(s.x),QY(s.y),`stroke="${colors[0]}" stroke-width="3"`)+
    text(QX(s.x/2)-14,QY(0)-8,`|x| = ${Math.abs(s.x)}`)+text(QX(s.x)+(s.x>=0?8:-56),QY(s.y/2)+4,`|y| = ${Math.abs(s.y)}`)+text(QX(s.x/2)+(s.x*s.y>=0?-70:12),QY(s.y/2)+(s.x*s.y>=0?-8:14),`d = ${fmt(d,3)}`)+`<g data-handle="point">${dot(QX(s.x),QY(s.y),'#222',8,`(${s.x}, ${s.y}). Drag to move.`)}</g>`,`Right triangle from the origin to (${s.x}, ${s.y}) with distance ${fmt(d,3)}`)+
   table(['Operation','Result'],[['Subtract coordinates',`[${s.x}, ${s.y}]`],['Square entries',`[${s.x*s.x}, ${s.y*s.y}]`],['Sum',s.x*s.x+s.y*s.y],['Square root',fmt(d,4)]].slice(0,s.step+1))+button('step',s.step===3?'Restart operations':'Next operation')+`<p>Distance from (0,0) to (x,y). The orange and blue legs are |x| and |y|; the purple hypotenuse is the distance. This explains the arithmetic; no Python executes.</p>`;
 },
 action(s,a){if(a==='step')s.step=(s.step+1)%4}
};

// ---- Importance sampling: click the variance-ratio curve to choose q ----
const IX=q=>40+(Math.log10(q)+3)/3*360;
export const importanceDefinition={
 initial:()=>({p:.01,q:.2,n:1000}),
 controls:[range('p','Natural rare-scenario probability p',.001,.1,.001),range('q','Test rare-scenario probability q',.001,.999,.001),range('n','Independent trials n',100,10000,100)],
 pointer(s,p){if(p.y<30||p.y>290)return;s.q=clamp(snap(10**((p.x-40)/360*3-3),.001),.001,.999)},
 describe(s){const r=importanceVariance(s.p,s.q,.5,.001,s.n);return `q = ${fmt(s.q,3)}: natural / weighted variance ${fmt(r.ratio,3)}; weighted standard error ${fmt(r.weightedSE*100,4)} percentage points.`},
 render(s){
  const r=importanceVariance(s.p,s.q,.5,.001,s.n),samples=Array.from({length:121},(_,i)=>{const q=clamp(10**(-3+i*.025),.001,.999);return [q,importanceVariance(s.p,q,.5,.001,s.n).ratio]}),top=Math.max(1.5,...samples.map(v=>v[1]),r.ratio),IY=v=>250-v/top*210;
  return `<p><strong>Natural event rate: ${fmt(r.natural*100,4)}%.</strong> Reweighted expected rate: ${fmt(r.weighted*100,4)}%. Raw test event rate: ${fmt(r.raw*100,4)}%.</p>`+
   hint('Click or drag along the curve to choose the test probability q (logarithmic axis). The q slider does the same.')+
   chart([.001,.01,.1,1].map(q=>grid(IX(q),30,IX(q),250)+text(IX(q)-10,268,q)).join('')+[0,.5,1].map(f=>grid(40,IY(f*top),400,IY(f*top))+text(6,IY(f*top)+4,fmt(f*top,1))).join('')+line(40,IY(1),400,IY(1),'stroke="#888" stroke-dasharray="4 4"')+text(346,IY(1)-6,'ratio = 1')+
    `<path d="${samples.map(([q,v],i)=>`${i?'L':'M'}${IX(q)},${IY(v)}`).join(' ')}" fill="none" stroke="${colors[0]}" stroke-width="2"/>`+line(IX(s.p),30,IX(s.p),250,'stroke="#888" stroke-dasharray="3 4"')+text(IX(s.p)+4,44,'q = p')+line(IX(r.optimalQ),30,IX(r.optimalQ),250,`stroke="${colors[1]}" stroke-dasharray="3 4"`)+text(IX(r.optimalQ)+4,60,'q*')+dot(IX(s.q),IY(r.ratio),'#222',7,`q = ${fmt(s.q,3)}: variance ratio ${fmt(r.ratio,4)}`)+text(120,292,'test rare-scenario probability q (log scale)')+text(44,22,'natural / weighted variance'),`Variance ratio against q on a log axis, with q = p, the optimum q* and the current q marked`,'0 0 440 300')+
   summary(`<strong>ratio ${fmt(r.ratio,4)}</strong> <span>${r.ratio>1?'weighted testing needs fewer trials':r.ratio<1?'weighted testing is worse than natural sampling':'no difference'} at q = ${fmt(s.q,3)}</span> ${goal(Math.abs(s.q-r.optimalQ)<=.005,Math.abs(s.q-r.optimalQ)<=.005?'Goal reached: q is at the minimum-variance choice':r.ratio<1?'Worse than natural sampling: too much or too little oversampling':'Goal: move q to the peak of the curve')}`)+
   table(['Scenario','Event probability within group','Weight p(x)/q(x)'],[['Rare',.5,fmt(r.rareWeight,5)],['Ordinary',.001,fmt(r.usualWeight,5)]])+
   `<p>Sample a scenario group under q, then an event Y ∈ {0,1} with the fixed group risk above. One trial contributes W Y; average over n independent trials. The conditional event risks stay unchanged when the group frequencies change.</p>`+
   table(['One-trial quantity','Natural sampling','Weighted test sampling'],[['Expected event contribution',fmt(r.natural,7),fmt(r.weighted,7)],['Variance',fmt(r.naturalVariance,7),fmt(r.weightedVariance,7)]])+
   table(['For n = '+s.n,'Value'],[['Natural-rate standard error',fmt(r.naturalSE*100,5)+' percentage points'],['Weighted-rate standard error',fmt(r.weightedSE*100,5)+' percentage points'],['Natural / weighted variance',fmt(r.ratio,4)]])+
   `<p>A variance ratio above 1 favors weighted testing at the same n under this model; below 1 means it is worse. Changing n scales both standard errors by 1/√n and does not change that ratio.</p>`+
   `<div class="plot-actions">${button('natural','Compare q = p')}${button('optimal','Use nearest minimum-variance q')}</div>`+
   `<details><summary>Derive the variance and reference q</summary><p>Let μ = p r₁ + (1 − p) r₀. Since Y² = Y:</p><p>E[(W Y)²] = p² r₁/q + (1 − p)² r₀/(1 − q).</p><p>Var(W Y) = E[(W Y)²] − μ². Standard error of the mean = √(Var(W Y)/n).</p><p>Within this two-group proposal family, the minimum occurs at q* = p√r₁ / (p√r₁ + (1 − p)√r₀) = ${fmt(r.optimalQ,6)}. The reference button rounds q* to the nearest 0.001 control value.</p></details>`+
   `<p><strong>Try:</strong> compare q = p, the reference, and q = 0.999. Extreme oversampling gives ordinary events very large weights and can increase variance. Both groups retain positive probability in these controls.</p><p>These are exact expectations and analytical standard errors under a known, independent two-group model. No samples or confidence intervals are generated. A real test may have unknown risks, correlated trials or a different event unit; this calculation does not establish a simulator's speedup or a vehicle's safety.</p>`;
 },
 action(s,a){if(a==='natural')s.q=s.p;if(a==='optimal')s.q=Math.round(importanceVariance(s.p,s.q,.5,.001,s.n).optimalQ*1000)/1000}
};
