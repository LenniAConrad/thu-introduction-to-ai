import {esc,fmt,table} from './render.js';
import {convolution} from './deep-learning-math.js';
import {attention,transformer} from './transformer-math.js';

const purple='#670875',orange='#bb592c';
const vector=v=>'['+v.map(x=>fmt(x,4)).join(', ')+']';
const pick=(key,value,label,selected=false,extra='')=>`<button type="button" data-lab-set="${key}" data-value="${esc(value)}" aria-pressed="${selected}" ${extra}>${label}</button>`;
const outcome=(label,value,note)=>`<div class="experiment-outcome"><span>${label}</span><strong>${value}</strong><p>${note}</p></div>`;

export function numberGrid(a,{key,selected=-1,active=[],working=-1,title,overlay='',scale=3}={}){
 const n=a[0].length;
 return `<figure class="interactive-array"><figcaption>${title}</figcaption><div class="array-board" style="--columns:${n}">${a.flat().map((v,i)=>{
  const extra=`class="array-cell ${active.includes(i)?'in-patch':''} ${i===selected?'is-selected':''} ${i===working?'is-working':''}" style="--cell-color:${v>=0?purple:orange};--intensity:${Math.min(.65,Math.abs(v)/scale*.6)}" aria-label="${esc(title)}, row ${Math.floor(i/n)+1}, column ${i%n+1}: ${fmt(v,4)}"`;
  return key?pick(key,i+1,fmt(v,2),i===selected,extra):`<span ${extra}>${fmt(v,2)}</span>`;
 }).join('')}${overlay}</div></figure>`;
}

export function convolutionTrace(s){
 const r=convolution(s.image,s.weights,s.bias,s.stride,s.pad),w=r.windows[s.cell-1];
 const step=Math.max(0,Math.min(11,s.convStep||0)),count=Math.min(9,step);
 const sum=w.products.slice(0,count).reduce((total,p)=>total+p.product,0);
 const activated=s.relu==='On'?Math.max(0,w.value):w.value;
 return {r,w,step,count,sum,activated,running:step===11?activated:step===10?sum+s.bias:sum};
}

export function convolutionView(s,interactive=true){
 const {r,w,step,count,sum,running,activated}=convolutionTrace(s);
 const explaining=interactive&&s.playMode!=='Scan image',current=explaining&&step>0&&step<10?step-1:-1,p=w.products[current];
 const output=r.out.map(row=>row.map(v=>s.relu==='On'?Math.max(0,v):v));
 const inside=p=>p.iy>=0&&p.iy<6&&p.ix>=0&&p.ix<6;
 const active=w.products.filter(inside).map(p=>p.iy*6+p.ix);
 const x=Math.max(0,w.x*s.stride-s.pad),y=Math.max(0,w.y*s.stride-s.pad);
 const width=Math.min(6,w.x*s.stride-s.pad+3)-x,height=Math.min(6,w.y*s.stride-s.pad+3)-y;
 const overlay=`<span aria-hidden="true" class="receptive-window" style="left:${x/6*100}%;top:${y/6*100}%;width:${width/6*100}%;height:${height/6*100}%"></span>`;
 let explanation='Start with a sum of 0. Next multiplies the first input value by its matching kernel weight.';
 if(p)explanation=`Product ${step} of 9: ${inside(p)?`input (${p.iy+1}, ${p.ix+1})`:'zero padding outside the image'} × kernel (${Math.floor(current/3)+1}, ${current%3+1}). ${fmt(sum-p.product,4)} + ${fmt(p.product,4)} = ${fmt(sum,4)}.`;
 if(step===10)explanation=`Add the shared bias once: ${fmt(sum,4)} + ${fmt(s.bias,4)} = ${fmt(w.value,4)}.`;
 if(step===11)explanation=s.relu==='On'?`Apply ReLU: max(0, ${fmt(w.value,4)}) = ${fmt(activated,4)}. Write this value to the selected output.`:`Activation is off. Write ${fmt(activated,4)} to the selected output.`;
 return `<div class="convolution-stage" data-visual="convolution">${numberGrid(s.image,{key:interactive?'pixel':null,selected:s.pixel-1,active,working:p&&inside(p)?p.iy*6+p.ix:-1,title:'Input · 6 × 6',overlay,scale:2})}<span class="computation-symbol" aria-hidden="true">×</span>${numberGrid(s.weights,{key:interactive?'weight':null,selected:s.weight-1,working:current,title:'Shared kernel · 3 × 3',scale:2})}<span class="computation-symbol" aria-hidden="true">→</span>${numberGrid(output,{key:interactive?'cell':null,selected:s.cell-1,working:explaining&&step===11?s.cell-1:-1,title:`Computed output · ${output.length} × ${output.length}`,scale:12})}</div>`+
 (explaining?`<section class="calculation-story" aria-label="Build the selected output"><div class="calculation-progress"><span>Output (${w.y+1}, ${w.x+1}) · Step ${step} / 11</span><progress max="11" value="${step}" aria-label="Calculation progress"></progress></div><p class="stage-explanation">${explanation}</p><div class="product-strip" aria-label="Nine products in row order">${w.products.map((v,i)=>`<span class="${i<count?'is-computed':''} ${i===current?'is-current':''}" data-product="${i}"><small>${fmt(v.pixel,2)} × ${fmt(v.weight,2)}</small><strong>${i<count?fmt(v.product,3):'…'}</strong></span>`).join('')}</div>${outcome(step===11?'Final output':step===10?'Sum + bias':'Running sum',`<span data-running-sum>${fmt(running,4)}</span>`,step===11?'Choose another output, or Replay to follow this calculation again.':'The output grid shows the complete result. This running total shows how the selected cell is calculated.')}</section>`:outcome(`Output (${w.y+1}, ${w.x+1})`,fmt(activated,4),`Nine products + bias ${fmt(s.bias)}${s.relu==='On'?', then ReLU':''}. The outline marks this output’s input patch.`))+
 (interactive?`<p class="interaction-hint">Choose an output to inspect its patch. Play ${explaining?'builds this cell one product at a time':'scans the output from left to right'}. Choose an input or kernel entry to edit it below.</p><div class="direct-editors"><label>Input (${Math.floor((s.pixel-1)/6)+1}, ${(s.pixel-1)%6+1}) <input type="number" min="-2" max="2" step="0.1" data-direct="pixelValue" value="${s.pixelValue}"></label><label>Kernel (${Math.floor((s.weight-1)/3)+1}, ${(s.weight-1)%3+1}) <input type="number" min="-2" max="2" step="0.1" data-direct="weightValue" value="${s.weightValue}"></label></div><p class="visual-key">Purple: positive · orange: negative · teal highlight: current multiplication. Pixel values are synthetic; the filter uses CNN cross-correlation.</p>`:'');
}

export const attentionExamples=['One dominant key','Uniform attention','Blocked future token','Full Transformer'];
export const attentionSteps=['Choose a query','Score the keys','Scale & mask','Normalize','Combine values'];

export function attentionTrace(s){
 if(s.attentionExample&&s.attentionExample!=='Full Transformer'){
  const q=[[Math.SQRT2,0],[0,Math.SQRT2],[-Math.SQRT2,0]];
  const k=s.attentionExample==='Uniform attention'?[[0,0],[0,0],[0,0]]:s.attentionExample==='Blocked future token'?[[-1,0],[0,0],[3,0]]:[[2,0],[0,2],[-2,-2]];
  const v=[[2,0],[0,4],[-2,2]],causal=s.attentionExample==='Blocked future token'&&s.causal;
  return {h:attention(q,k,v,{causal,scale:s.scale}),queries:['A','B','C'],keys:['A','B','C'],teaching:true,causal};
 }
 const r=transformer(s.source.split(' '),s.future?['<bos>','como','azul']:['<bos>','como','estas'],{heads:s.heads,usePositions:s.positions,causal:s.causal,scale:s.scale});
 const a=s.stage==='Encoder self-attention'?r.encoderAttention:s.stage==='Decoder self-attention'?r.decoderAttention:r.crossAttention;
 return {r,h:a.heads[Math.min(s.head||0,s.heads-1)],queries:s.stage==='Encoder self-attention'?r.source:r.target,keys:s.stage==='Decoder self-attention'?r.target:r.source,teaching:false,causal:s.stage==='Decoder self-attention'&&s.causal};
}

export function attentionView(s,interactive=true){
 const {h,queries,keys,teaching,causal}=attentionTrace(s),q=Math.min(s.query,h.q.length-1),step=interactive?s.viewStep||0:4;
 const count=interactive?Math.min(s.mixCount||0,keys.length):keys.length;
 const raw=h.k.map(k=>k.reduce((sum,v,i)=>sum+v*h.q[q][i],0));
 const bound=Math.max(...raw.map(Math.abs))||1,weights=h.weights[q],scores=h.scores[q],max=Math.max(...scores),terms=scores.map(x=>Math.exp(x-max)),denominator=terms.reduce((a,b)=>a+b,0);
 const total=h.v[0].map((_,c)=>h.v.slice(0,count).reduce((sum,v,j)=>sum+v[c]*weights[j],0));
 const contribution=count?h.v[count-1].map(v=>v*weights[count-1]):null;
 const addition=count?`${vector(total.map((v,c)=>v-contribution[c]))} + ${vector(contribution)} = ${vector(total)}.`:'Start with a zero vector.';
 const explanations=[`Choose a token. Its query is ${vector(h.q[q])}. Compare it with each key vector before calculating scores.`,
  'Take a dot product with each key. Bars extend left for negative scores and right for positive scores; length shows magnitude.',
  `${s.scale?`Divide each score by √${h.q[q].length}.`:'Scaling is off.'} ${causal?'The causal mask blocks keys to the right of this query. Blocked scores become −∞.':'All keys are available to this query.'}`,
  'Softmax gives each allowed key a share of 100%. Masked keys have weight 0; all weights together sum to 1.',
  'Multiply each value vector by its weight, then add one vector at a time. Follow each coordinate into the running total.'];
 return (interactive?`<ol class="computation-steps" aria-label="Computation stages">${attentionSteps.map((label,i)=>`<li>${pick('viewStep',i,`<span>${i+1}</span>${label}`,step===i)}</li>`).join('')}</ol>`:'')+
 `<div class="attention-story" data-visual="attention"><p class="example-caption">${teaching?`${esc(s.attentionExample)} · deliberately chosen Q, K and V vectors; no fitted parameters.`:'Full Transformer · exact vectors from the fixed encoder–decoder teaching model.'}</p><div class="query-tokens" aria-label="Select a query token">${queries.map((word,i)=>interactive?pick('query',i,`${esc(word)}<small>query ${i}</small>`,q===i):`<span class="token-static ${q===i?'selected':''}">${esc(word)}</span>`).join('')}</div><p class="stage-explanation">${explanations[step]}</p><div class="attention-flow"><div class="query-source"><small>QUERY ${q}</small><strong>${esc(queries[q])}</strong><span>${vector(h.q[q])}</span></div><div class="attention-destinations">${step===1||step===2?`<div class="score-axis" aria-label="Shared signed score scale"><span>−${fmt(bound,3)}</span><span>0</span><span>+${fmt(bound,3)}</span></div>`:step>=3?'<div class="score-axis"><span>0%</span><span>Attention weight</span><span>100%</span></div>':''}${keys.map((word,j)=>{
  const masked=scores[j]===-Infinity,w=weights[j],score=step===1?raw[j]:scores[j],length=Number.isFinite(score)?Math.abs(score)/bound*50:0;
  const value=step===0?`K = ${vector(h.k[j])}`:step===1?`${fmt(raw[j],4)} raw score`:step===2?(masked?'Masked · −∞':`${fmt(score,4)} score`):`${fmt(w*100,2)}%`;
  let bar=step===0?'':step<3?`<div class="signed-score-track ${score<0?'is-negative':''}" aria-hidden="true"><span style="left:${score<0?50-length:50}%;width:${length}%"></span></div>`:`<div class="weight-track" aria-hidden="true"><span style="width:${w*100}%"></span></div>`;
  const formula=step===1?h.q[q].map((v,c)=>`${fmt(v,4)} × ${fmt(h.k[j][c],4)}`).join(' + '):step===2?(masked?'Excluded before softmax':`${fmt(raw[j],4)} ${s.scale?`/ √${h.q[q].length}`:'/ 1'} = ${fmt(score,4)}`):step===3?(masked?'Masked: weight = 0':`exp(${fmt(score-max,4)}) / ${fmt(denominator,4)} = ${fmt(w,4)}`):'';
  return `<div class="attention-connection ${masked&&step>=2?'is-masked':''} ${step===4&&j<count?'is-computed':''} ${step===4&&j===count-1?'is-current':''}" data-attention-key="${j}"><div class="attention-key"><strong>${esc(word)}</strong><small>key ${j}</small><span>${value}</span></div>${bar}${step===4?`<p class="value-contribution">${fmt(w,4)} × ${vector(h.v[j])} = <strong>${vector(h.v[j].map(v=>v*w))}</strong><span class="contribution-status">${j<count?'Added':j===count?'Next to add':'Waiting'}</span></p>`:formula?`<p class="score-formula">${formula}</p>`:''}</div>`;
 }).join('')}</div></div>`+
 (step===4?outcome(count===keys.length?'Weighted value output':`Running value · ${count} / ${keys.length} contributions`,`<span data-attention-total>${vector(total)}</span>`,`${addition} ${count===keys.length?'This is one head, before any output projection.':`Next adds key ${count}’s weighted value. Masked keys contribute zero.`}`):`<p class="stage-progress">Stage ${step+1} of 5 · ${attentionSteps[step]}${step===3?` · Σ weights = ${fmt(weights.reduce((a,b)=>a+b,0),4)}. For stability, subtract the largest allowed score (${fmt(max,4)}) before exponentiating.`:''}</p>`)+`</div>`;
}

export function attentionDetails(s){
 const {h,keys}=attentionTrace(s),q=s.query;
 return '<p>These chosen vectors isolate attention arithmetic. They are not token embeddings from the full Transformer. Select “Full Transformer” to inspect that model.</p>'+table(['Token','Q','K','V'],keys.map((k,i)=>[esc(k),vector(h.q[i]),vector(h.k[i]),vector(h.v[i])]))+table(['Key','Score after scaling / mask','Weight','Weighted value'],keys.map((k,i)=>[esc(k),h.scores[q][i]===-Infinity?'−∞':fmt(h.scores[q][i],8),fmt(h.weights[q][i],8),vector(h.v[i].map(v=>v*h.weights[q][i]))]))+`<p>Final weighted value: ${vector(h.mixed[q])}. Calculations retain full precision; displayed values are rounded.</p>`;
}
