import {esc,fmt} from './render.js';
import {sixWeightNetwork} from './deep-learning-math.js';
import {pcaCalculation,pcaDatasets} from './unsupervised-math.js';
import {diffusionBatch,diffusionChain} from './sequence-generative-math.js';

const purple='#670875',teal='#187d86',orange='#bb592c';
const vec=a=>'['+a.map(v=>fmt(v,4)).join(', ')+']';
const button=(a,t)=>`<button type="button" class="button subtle small" data-lab-action="${a}">${t}</button>`;
const inspect=(key,label,selected=false)=>`<button type="button" data-story-inspect="${key}" aria-pressed="${selected}">${label}</button>`;
const svg=(body,label,w=500,h=290)=>`<svg class="model-story-plot" viewBox="0 0 ${w} ${h}" role="group" aria-label="${esc(label)}">${body}</svg>`;
const text=(x,y,value,anchor='middle')=>`<text x="${x}" y="${y}" text-anchor="${anchor}">${esc(value)}</text>`;
const line=(x1,y1,x2,y2,color=teal,extra='')=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" ${extra}/>`;
const panel=(title,body)=>`<div class="story-inspector"><strong>${title}</strong><p>${body}</p></div>`;
export const networkStages=['Inputs and weights','Hidden activations','Output activation','Squared loss','Output derivative','Hidden derivatives','Weight derivatives','Proposed update'];
export function networkResult(s){return sixWeightNetwork([s.x1,s.x2],Array.from({length:6},(_,i)=>s['w'+(i+1)]),s.target)}
function networkInspection(s){
 const r=networkResult(s),n=s.networkStep||0,key=s.inspectNetwork||['inputs','h1','output','loss','output-gradient','h1-gradient','w1','update'][n];
 if(/^w[1-6]$/.test(key)){
  const i=Number(key.slice(1))-1,source=i<4?[s.x1,s.x2][i%2]:r.h[i-4],delta=i<4?r.hidden[Math.floor(i/2)]:r.delta;
  return panel(`Weight w${i+1}`,`∂L/∂w${i+1} = incoming activation × downstream derivative = ${fmt(source,4)} × ${fmt(delta,4)} = <b>${fmt(r.gradient[i],6)}</b>.<br>Proposed weight: ${fmt(s[key],4)} − ${fmt(s.eta,4)} × ${fmt(r.gradient[i],4)} = ${fmt(s[key]-s.eta*r.gradient[i],6)}.`);
 }
 if(key==='inputs')return panel('Start with one example',`Input ${vec([s.x1,s.x2])}; assumed target ${fmt(s.target,4)}. This network has six weights and no biases.`);
 if(key==='loss')return panel('Squared error',`L = (ŷ − y)² = (${fmt(r.y,4)} − ${fmt(s.target,4)})² = <b>${fmt(r.loss,6)}</b>.`);
 if(key==='output-gradient')return panel('Start the backward pass',`∂L/∂zₒ = 2(ŷ − y) × ReLU′(zₒ) = ${fmt(2*(r.y-s.target),4)} × ${r.o>0?1:0} = <b>${fmt(r.delta,6)}</b>. The backward multiplier is chosen as 0 when zₒ = 0.`);
 if(key==='output')return panel('Output neuron',`zₒ = w₅h₁ + w₆h₂ = ${fmt(s.w5,4)} × ${fmt(r.h[0],4)} + ${fmt(s.w6,4)} × ${fmt(r.h[1],4)} = ${fmt(r.o,6)}.<br>ŷ = max(0, zₒ) = <b>${fmt(r.y,6)}</b>.`);
 if(/^h[12]/.test(key)){
  const j=Number(key[1])-1;
  return key.endsWith('gradient')?panel(`Hidden derivative δ${j+1}`,`δ${j+1} = δₒ × w${j+5} × ReLU′(z${j+1}) = ${fmt(r.delta,4)} × ${fmt(s['w'+(j+5)],4)} × ${r.z[j]>0?1:0} = <b>${fmt(r.hidden[j],6)}</b>.`):panel(`Hidden neuron h${j+1}`,`z${j+1} = ${fmt(s['w'+(2*j+1)],4)} × ${fmt(s.x1,4)} + ${fmt(s['w'+(2*j+2)],4)} × ${fmt(s.x2,4)} = ${fmt(r.z[j],6)}.<br>h${j+1} = max(0, z${j+1}) = <b>${fmt(r.h[j],6)}</b>.`);
 }
 return panel('All six weights update together',`wᵢ ← wᵢ − η ∂L/∂wᵢ. Every derivative comes from the current network. Scrubbing only previews; Apply update changes the weights.`);
}
export function networkView(s,interactive=true){
 const r=networkResult(s),n=s.networkStep||0,backward=n>=4;
 const nodes=[[60,75,'inputs','x₁',s.x1,0],[60,215,'inputs','x₂',s.x2,0],[250,75,'h1','h₁',r.h[0],1],[250,215,'h2','h₂',r.h[1],1],[440,145,'output','ŷ',r.y,2]];
 const edges=[[0,2],[1,2],[0,3],[1,3],[2,4],[3,4]];
 const paths=edges.map(([a,b],i)=>{
  const A=nodes[a],B=nodes[b],active=s.inspectNetwork?.startsWith('w')?s.inspectNetwork==='w'+(i+1):n===(i<4?1:2)||(i<4?n>=6:n>=5);
  const [lx,ly]=[[150,56],[112,155],[187,188],[150,245],[347,88],[347,222]][i];
  const distance=Math.hypot(B[0]-A[0],B[1]-A[1]),dx=(B[0]-A[0])/distance,dy=(B[1]-A[1])/distance;
  const from=[A[0]+29*dx,A[1]+29*dy],to=[B[0]-29*dx,B[1]-29*dy],tip=backward?from:to,dir=backward?-1:1,color=active?(backward?orange:teal):'#d9cfdf';
  const arrow=`M${tip[0]-dir*10*dx-4*dy} ${tip[1]-dir*10*dy+4*dx}L${tip[0]} ${tip[1]}L${tip[0]-dir*10*dx+4*dy} ${tip[1]-dir*10*dy-4*dx}`;
  return `<g class="network-edge ${active?'is-current':''}" ${interactive?`role="button" tabindex="0" data-story-inspect="w${i+1}" aria-label="Inspect weight w${i+1}: ${fmt(s['w'+(i+1)],4)}"`:''}>${line(...from,...to,color,'stroke-width="2"')}<path d="${arrow}" fill="none" stroke="${color}" stroke-width="2"/>${text(lx,ly,`w${i+1}=${fmt(s['w'+(i+1)],2)}`)}</g>`;
 }).join('');
 const circles=nodes.map(([x,y,key,label,value,stage])=>`<g class="network-node ${n>=stage?'is-computed':''}" ${interactive?`role="button" tabindex="0" data-story-inspect="${key}" aria-label="Inspect ${label}"`:''}><circle cx="${x}" cy="${y}" r="28"/>${text(x,y-5,label)}${text(x,y+14,n>=stage?fmt(value,3):'…')}${(key==='output'?n>=4:key!=='inputs'&&n>=5)?text(x,y+52,'δ = '+fmt(key==='output'?r.delta:r.hidden[key==='h1'?0:1],3)):''}</g>`).join('');
 return `<div class="network-story" data-network-stage="${n}"><p class="example-caption">${s.preset==='Original forward example'?'Slide example with an added target. Its initial ReLU gates block all gradients; choose “Active learning example” to see nonzero updates.':'Added teaching example with active ReLU units.'}</p>${svg(paths+circles,`Six-weight network. ${networkStages[n]}. ${backward?'Orange arrows trace derivatives backward.':'Teal arrows trace the forward pass.'}`)}${networkInspection(s)}${interactive?`<p class="interaction-hint">Select a neuron or weight to inspect it. Playback traces the calculation; Apply update changes the weights.</p><div class="plot-actions">${button('step','Apply update')}</div><details class="weight-inspection" data-morph-key="all-weight-derivatives"><summary>All weight derivatives and batch updates</summary><div class="story-values" aria-label="Inspect a weight derivative">${r.gradient.map((g,i)=>inspect('w'+(i+1),`w${i+1}<small>∂L/∂w = ${fmt(g,4)}</small>`,s.inspectNetwork==='w'+(i+1))).join('')}</div>${button('train','Apply 25 updates')}</details>`:''}<p class="visual-key">Teal: forward · orange: backward.<br>Loss ${fmt(r.loss,6)} · ${s.updates} applied updates${s.last?` · last loss ${fmt(s.last.before,4)} → ${fmt(s.last.after,4)}`:''}</p></div>`;
}
export function inspectNetwork(s,key){
 const stage=/^w[1-6]$/.test(key)?6:({inputs:0,h1:1,h2:1,output:2,loss:3,'output-gradient':4,'h1-gradient':5,'h2-gradient':5,update:7})[key];
 if(stage===undefined)return;s.inspectNetwork=key;s.networkStep=stage;
}
export function pcaResult(s,angle=s.angle){return pcaCalculation(pcaDatasets[s.dataset].map(p=>[p[0]*s.scale,p[1]]),angle)}
function pcaField(s,peer=null,interactive=true){
 const r=pcaResult(s),other=peer?pcaResult(peer):null,extent=1.15*Math.max(1,...r.centered.map(p=>Math.hypot(...p)),...(other?.centered.map(p=>Math.hypot(...p))||[]));
 const X=x=>220+150*x/extent,Y=y=>195-150*y/extent;
 const axis=(a,color,extra='')=>`<g class="pca-direction" transform="rotate(${-Math.atan2(a[1],a[0])*180/Math.PI} 220 195)">${line(70,195,370,195,color,`stroke-width="2" ${extra}`)}</g>`;
 const marks=r.centered.map((p,i)=>{
  const q=r.axis.map(v=>v*r.scores[i]),selected=i===(s.pcaPoint||0);
  return `<g class="pca-observation" ${interactive?`role="button" tabindex="0" data-story-inspect="p${i}" aria-label="Inspect point ${i+1}, projected score ${fmt(r.scores[i],4)}"`:''}>${line(X(p[0]),Y(p[1]),X(q[0]),Y(q[1]),selected?orange:'#c9bacd','stroke-dasharray="4 3"')}<circle cx="${X(p[0])}" cy="${Y(p[1])}" r="${selected?7:5}" fill="${purple}"/><rect x="${X(q[0])-4}" y="${Y(q[1])-4}" width="8" height="8" fill="${teal}"/>${selected?text(X(p[0])+12,Y(p[1])-10,i+1,'start'):''}</g>`;
 }).join('');
 return svg(line(70,195,370,195,'#e1d6e5')+line(220,45,220,345,'#e1d6e5')+(other?axis(other.axis,orange,'stroke-dasharray="6 4"'):'')+axis(r.axis,teal)+marks+text(70,370,fmt(-extent,2))+text(370,370,fmt(extent,2))+text(220,395,'Centered feature 1')+text(12,195,'x₂','start'),`Centered points, orthogonal projections and direction ${fmt(s.angle,2)} degrees. Both axes span ±${fmt(extent,3)}.`,440,410);
}
function variancePlot(s,peer=null){
 const r=pcaResult(s),X=a=>42+330*a/180,Y=f=>160-130*f;
 const curve=(state,color,extra='')=>`<polyline points="${Array.from({length:91},(_,i)=>`${X(i*2)},${Y(pcaResult(state,i*2).fraction)}`).join(' ')}" fill="none" stroke="${color}" stroke-width="2" ${extra}/>`;
 return `<figure class="variance-chart"><figcaption>Variance retained as the line rotates</figcaption>${svg(line(42,30,42,160,'#cfbfd4')+line(42,160,372,160,'#cfbfd4')+(peer?curve(peer,orange,'stroke-dasharray="6 4"'):'')+curve(s,teal)+`<circle cx="${X(s.angle)}" cy="${Y(r.fraction)}" r="5" fill="${purple}"/>`+text(35,35,'100%','end')+text(35,164,'0%','end')+text(42,182,'0°')+text(207,182,'90°')+text(372,182,'180°'),`Retained variance ${fmt(r.fraction*100,2)} percent at ${fmt(s.angle,2)} degrees; fixed axes 0–180 degrees and 0–100 percent.`,410,195)}</figure>`;
}
export function pcaView(s,interactive=true,peer=null){
 const r=pcaResult(s),i=Math.min(s.pcaPoint||0,r.centered.length-1),p=r.centered[i],score=r.scores[i];
 return `<div class="pca-story"><div class="pca-stage">${pcaField(s,peer,interactive)}<div class="metric-pair"><div><span>Retained variance</span><strong>${fmt(r.fraction*100,2)}%</strong></div><div><span>Mean squared error</span><strong>${fmt(r.discarded,3)}</strong></div></div></div><p class="visual-key">● Observation · ■ Projection · dashed segment: reconstruction error. ${Math.abs(r.eigenvalues[0]-r.eigenvalues[1])<1e-10?'Equal eigenvalues: every direction retains the same variance.':''}</p>${interactive?`<p class="interaction-hint">Rotate the line with Play or the angle slider. Select a point to inspect its projection.</p><div class="plot-actions">${button('principal','Best direction')}${button('perpendicular','Perpendicular direction')}</div><details class="point-calculation" data-morph-key="point-calculation"><summary>Inspect a point’s projection</summary>`:''}${panel(`Point ${i+1} · projection onto a unit direction`,`Centered point ${vec(p)} · direction ${vec(r.axis)}.<br>Score = ${fmt(p[0],4)} × ${fmt(r.axis[0],4)} + ${fmt(p[1],4)} × ${fmt(r.axis[1],4)} = <b>${fmt(score,6)}</b>.<br>Reconstruction = mean + score × direction = ${vec(r.reconstructed[i])}.`)}${interactive?'</details><details data-morph-key="variance-sweep"><summary>Variance over a full rotation</summary>':''}${variancePlot(s,peer)}<p class="visual-key">Retained ${fmt(r.variance,4)} + discarded ${fmt(r.discarded,4)} = total variance ${fmt(r.total,4)}.</p>${interactive?'</details>':''}</div>`;
}
export function pcaCompare(before,after){return `<div class="visual-comparison"><p><strong>Directions on shared axes</strong> · orange dashed: pinned · teal: current. Points show current centered data.</p><div class="pca-stage">${pcaField(after,before,false)}${variancePlot(after,before)}</div></div>`}
function chainPlot(s,peer=null,interactive=true){
 const preview=diffusionChain(s.weights,s.condition==='Positive mean'?1:-1,s.sampleSeed,s.predictor);
 const values=s.start===null?[preview.start]:[s.start,...s.chain.map(r=>r.x)],old=peer&&peer.start!==null?[peer.start,...peer.chain.map(r=>r.x)]:[];
 // Fix the vertical scale for a whole seeded run; scrubbing must not stretch it.
 const full=value=>{const c=diffusionChain(value.weights,value.condition==='Positive mean'?1:-1,value.sampleSeed,value.predictor);return [c.start,...c.rows.map(r=>r.x)]};
 const extent=Math.max(2,...full(s).map(Math.abs),...(peer?full(peer).map(Math.abs):[]))*1.1,X=i=>50+390*i/12,Y=v=>140-100*v/extent;
 const path=(a,color,extra='')=>`<polyline points="${a.map((v,i)=>`${X(i)},${Y(v)}`).join(' ')}" fill="none" stroke="${color}" stroke-width="2.5" ${extra}/>`;
 const c=s.condition==='Positive mean'?1:-1;
 const dots=values.map((v,i)=>`<g data-morph-key="diffusion-point-${i}" ${i&&interactive?`role="button" tabindex="0" data-story-inspect="t${i}" aria-label="Inspect transition ${i}, state ${fmt(v,4)}"`:''}><circle cx="${X(i)}" cy="${Y(v)}" r="${i===(s.diffusionPoint||values.length-1)?6:4}" fill="${purple}"/></g>`).join('');
 return svg(line(50,Y(c),440,Y(c),teal,'stroke-dasharray="3 4"')+line(50,40,50,240,'#d8c9de')+line(50,240,440,240,'#d8c9de')+path(old,orange,'stroke-dasharray="6 4"')+path(values,purple)+dots+text(40,45,fmt(extent,2),'end')+text(40,245,fmt(-extent,2),'end')+text(50,264,'t = 12')+text(245,264,'6')+text(440,264,'0')+text(245,286,'Reverse generation'),`Generated scalar states. Vertical extent ±${fmt(extent,3)}. Dashed teal line is the current conditional mean, not a known clean target.`,500,300);
}
export function diffusionView(s,interactive=true,peer=null){
 const row=s.chain[Math.min((s.diffusionPoint||s.chain.length)-1,s.chain.length-1)],train=diffusionBatch(s.weights,s.data).loss,valid=diffusionBatch(s.weights,s.validation).loss;
 return `<div class="diffusion-story"><p class="example-caption">One-dimensional Gaussian example. ${s.predictor==='Learned'?s.updates?'The noise predictor has been fitted to the training examples.':'The noise predictor is untrained. Train it, then replay the chain.':s.predictor==='Analytic reference'?'Using the analytic noise predictor as a reference.':'Using zero predicted noise as an untrained baseline.'}</p>${interactive&&s.predictor==='Learned'?`<div class="plot-actions">${button('train','Train 300 updates')}</div>`:''}${s.predictor==='Learned'?`<p class="visual-key">${s.updates} training updates · train MSE ${fmt(train,4)} · held-out MSE ${fmt(valid,4)}</p>`:''}${chainPlot(s,peer,interactive)}${row?panel(`Transition t = ${row.t} → ${row.t-1}`,`State xₜ = ${fmt(row.xt,5)} · predicted noise ε̂ = ${fmt(row.epsilon,5)}.<br>Next state = mean + √variance × noise<br>${fmt(row.mean,5)} + ${fmt(Math.sqrt(row.variance),5)} × ${fmt(row.noise,5)} = <b>${fmt(row.x,5)}</b>.${row.t===1?' The final transition adds no noise.':''}`):panel('Start from sampled noise','Play follows twelve reverse transitions from the displayed starting point. The seed fixes the noise, so replay follows the same chain.')}<p class="visual-key">Dashed teal: conditional mean. A generated sample has no known clean target.</p>${s.samples?panel('32 generated endpoints',`Mean ${fmt(s.samples.reduce((a,b)=>a+b,0)/s.samples.length,5)}. Inspect the full calculation for the distribution and individual values.`):''}</div>`;
}
export function diffusionCompare(before,after){return `<div class="visual-comparison"><p><strong>Reverse trajectories on shared axes</strong> · orange dashed: pinned · purple: current.</p>${chainPlot(after,before,false)}</div>`}
