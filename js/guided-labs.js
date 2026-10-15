import {esc,fmt,table} from './render.js';
import {convolution,trainingPreview,mlpForward} from './deep-learning-math.js';
import {transformer} from './transformer-math.js';

const purple='#670875',orange='#bb592c';
const action=(name,label,extra='')=>`<button type="button" class="button subtle small" data-lab-action="${name}" ${extra}>${label}</button>`;
const pick=(key,value,label,selected=false,extra='')=>`<button type="button" data-lab-set="${key}" data-value="${esc(value)}" aria-pressed="${selected}" ${extra}>${label}</button>`;
const detail=(name,body)=>`<details class="lab-math"><summary>${name}</summary>${body}</details>`;
const headline=(label,value,note)=>`<div class="experiment-outcome"><span>${label}</span><strong>${value}</strong><p>${note}</p></div>`;
const vector=v=>'['+v.map(x=>fmt(x,4)).join(', ')+']';
const stepper=(steps,selected)=>`<ol class="computation-steps" aria-label="Computation stages">${steps.map((label,i)=>`<li>${pick('viewStep',i,`<span>${i+1}</span>${label}`,selected===i)}</li>`).join('')}</ol>`;
function grid(a,{key,selected=-1,active=[],title,overlay=null,scale=3}={}){
 const n=a[0].length;
 return `<figure class="interactive-array"><figcaption>${title}</figcaption><div class="array-board" style="--columns:${n}">${a.flat().map((v,i)=>{
  const extra=`class="array-cell ${active.includes(i)?'in-patch':''} ${i===selected?'is-selected':''}" style="--cell-color:${v>=0?purple:orange};--intensity:${Math.min(.65,Math.abs(v)/scale*.6)}" aria-label="${esc(title)}, row ${Math.floor(i/n)+1}, column ${i%n+1}: ${fmt(v,4)}"`;
  return key?pick(key,i+1,fmt(v,2),i===selected,extra):`<span ${extra}>${fmt(v,2)}</span>`;
 }).join('')}${overlay||''}</div></figure>`;
}
function convView(s,interactive=true){
 const r=convolution(s.image,s.weights,s.bias,s.stride,s.pad),w=r.windows[s.cell-1];
 const output=r.out.map(row=>row.map(v=>s.relu==='On'?Math.max(0,v):v));
 const active=w.products.filter(p=>p.iy>=0&&p.iy<6&&p.ix>=0&&p.ix<6).map(p=>p.iy*6+p.ix);
 const x=Math.max(0,w.x*s.stride-s.pad),y=Math.max(0,w.y*s.stride-s.pad);
 const width=Math.min(6,w.x*s.stride-s.pad+3)-x,height=Math.min(6,w.y*s.stride-s.pad+3)-y;
 const overlay=`<span aria-hidden="true" class="receptive-window" style="left:${x/6*100}%;top:${y/6*100}%;width:${width/6*100}%;height:${height/6*100}%"></span>`;
 return `<div class="convolution-stage" data-visual="convolution">${grid(s.image,{key:interactive?'pixel':null,selected:s.pixel-1,active,title:'Input · 6 × 6',overlay,scale:2})}<span class="computation-symbol" aria-hidden="true">×</span>${grid(s.weights,{key:interactive?'weight':null,selected:s.weight-1,title:'Shared kernel · 3 × 3',scale:2})}<span class="computation-symbol" aria-hidden="true">→</span>${grid(output,{key:interactive?'cell':null,selected:s.cell-1,title:`Output · ${output.length} × ${output.length}`,scale:12})}</div>`+
 headline(`Output (${w.y+1}, ${w.x+1})`,fmt(output[w.y][w.x],4),`Nine products + bias ${fmt(s.bias)}${s.relu==='On'?', then ReLU':''}. The outline marks the input patch used by this output.`)+
 (interactive?`<p class="interaction-hint">Choose an output cell to move the window. Choose an input pixel or kernel weight to edit its value below. Play scans the output from left to right.</p><div class="direct-editors"><label>Input (${Math.floor((s.pixel-1)/6)+1}, ${(s.pixel-1)%6+1}) <input type="number" min="-2" max="2" step="0.1" data-direct="pixelValue" value="${s.pixelValue}"></label><label>Kernel (${Math.floor((s.weight-1)/3)+1}, ${(s.weight-1)%3+1}) <input type="number" min="-2" max="2" step="0.1" data-direct="weightValue" value="${s.weightValue}"></label></div><div class="product-strip" aria-label="Nine products in row order">${w.products.map((p,i)=>`<span style="--order:${i}"><small>${fmt(p.pixel,2)} × ${fmt(p.weight,2)}</small><strong>${fmt(p.product,3)}</strong></span>`).join('')}</div><p class="calculation-line">Σ products ${fmt(w.value-s.bias,4)} + bias ${fmt(s.bias)} = <strong>${fmt(w.value,4)}</strong>${s.relu==='On'?` → ReLU → <strong>${fmt(output[w.y][w.x],4)}</strong>`:''}</p><p class="visual-key">Purple: positive · orange: negative · outlined: selected. Pixel values are a synthetic fixture; the filter uses CNN cross-correlation.</p>`:'');
}
function attentionTrace(s){
 const r=transformer(s.source.split(' '),s.future?['<bos>','como','azul']:['<bos>','como','estas'],{heads:s.heads,usePositions:s.positions,causal:s.causal,scale:s.scale});
 const a=s.stage==='Encoder self-attention'?r.encoderAttention:s.stage==='Decoder self-attention'?r.decoderAttention:r.crossAttention;
 return {r,a,h:a.heads[Math.min(s.head||0,s.heads-1)],queries:s.stage==='Encoder self-attention'?r.source:r.target,keys:s.stage==='Decoder self-attention'?r.target:r.source};
}
const attentionSteps=['Choose a query','Score the keys','Scale & mask','Normalize','Combine values'];
function attentionView(s,interactive=true){
 const {h,queries,keys}=attentionTrace(s),q=Math.min(s.query,h.q.length-1),step=s.viewStep||0;
 const raw=h.k.map(k=>k.reduce((sum,v,i)=>sum+v*h.q[q][i],0));
 const explanations=[`Choose a token. Its query vector is ${vector(h.q[q])}. Each token has its own row of weights.`,
  'Each score is a dot product: matching directions in the query and key increase the score.',
  `${s.scale?'Divide the dot products by √dₖ.':'Scaling is off.'} ${s.stage==='Decoder self-attention'&&s.causal?'Future keys are masked before softmax.':'All keys shown are available to this query.'}`,
  'Softmax turns the permitted scores into nonnegative weights that sum to 1. Masked keys receive exactly zero.',
  'Multiply each value vector by its attention weight, then add coordinate by coordinate. This is one head, before the output projection.'];
 return (interactive?stepper(attentionSteps,step):'')+`<div class="attention-story" data-visual="attention"><div class="query-tokens" aria-label="Select a query token">${queries.map((word,i)=>interactive?pick('query',i,`${esc(word)}<small>query ${i}</small>`,q===i):`<span class="token-static ${q===i?'selected':''}">${esc(word)}</span>`).join('')}</div><p class="stage-explanation">${explanations[interactive?step:4]}</p><div class="attention-flow"><div class="query-source"><small>QUERY ${q}</small><strong>${esc(queries[q])}</strong><span>${vector(h.q[q])}</span></div><div class="attention-destinations">${keys.map((word,j)=>{
  const masked=h.scores[q][j]===-Infinity,w=h.weights[q][j];
  const value=step<2?raw[j]:step===2?(masked?'Masked':h.scores[q][j]):w;
  return `<div class="attention-connection ${masked&&step>=2?'is-masked':''}"><div class="attention-key"><strong>${esc(word)}</strong><small>key ${j}</small><span>${typeof value==='number'?fmt(value,4):value}${step>=3?' weight':''}</span></div><div class="weight-track"><span style="width:${step>=3?w*100:100}%;opacity:${step>=3?1:.25}"></span></div>${step>=4||!interactive?`<p>${fmt(w,4)} × ${vector(h.v[j])} = <strong>${vector(h.v[j].map(v=>v*w))}</strong></p>`:''}</div>`;
 }).join('')}</div></div>`+(step>=4||!interactive?headline('Weighted value output',vector(h.mixed[q]),'Same colors follow the query and its contributions. These are fixed teaching vectors, not a trained translator.'):`<p class="stage-progress">Stage ${step+1} of 5 · ${attentionSteps[step]}</p>`)+`</div>`;
}
function trainingPlot(s,interactive=true){
 const r=trainingPreview(s),X=x=>44+(x+1.2)/2.4*312,Y=y=>344-(y+1.2)/2.4*312;
 const cells=Array.from({length:400},(_,i)=>{const x=-1.2+(i%20+.5)*.12,y=-1.2+(Math.floor(i/20)+.5)*.12,p=mlpForward(s.model.weights,[x,y]).p;
  return `<rect x="${X(x-.06)}" y="${Y(y+.06)}" width="15.8" height="15.8" fill="${p>=.5?purple:orange}" opacity="${.06+Math.abs(p-.5)*.65}"/>`;
 }).join('');
 const dots=r.full.rows.map((p,i)=>{
  const selected=i===s.point-1,attr=interactive?`role="button" tabindex="0" data-lab-set="point" data-value="${i+1}" aria-pressed="${selected}" aria-label="Example ${i+1}, input ${p.x.join(', ')}, class ${p.y}, prediction ${fmt(p.p,3)}"`:'';
  const shape=p.y?`<circle cx="${X(p.x[0])}" cy="${Y(p.x[1])}" r="6"/>`:`<rect x="${X(p.x[0])-5}" y="${Y(p.x[1])-5}" width="10" height="10"/>`;
  return `<g ${attr} class="training-point" fill="${p.y?purple:orange}" stroke="white" stroke-width="2"><circle cx="${X(p.x[0])}" cy="${Y(p.x[1])}" r="13" fill="transparent" stroke="${selected?'#201b25':'transparent'}" stroke-width="2"/>${shape}</g>`;
 }).join('');
 return `<svg viewBox="0 0 400 390" class="training-field" ${interactive?'role="group"':'role="img"'} aria-label="XOR decision field: circles are class 1, squares class 0. Horizontal x₁ and vertical x₂ range from −1.2 to 1.2.">${cells}<path d="M44 188H356 M200 32V344" stroke="#c9bccb" stroke-dasharray="3 4"/>${dots}<g fill="#655b68" font-size="13"><text x="44" y="365">−1.2</text><text x="335" y="365">1.2</text><text x="195" y="385">x₁</text><text x="8" y="39">1.2</text><text x="6" y="345">−1.2</text><text x="9" y="196">x₂</text></g></svg>`;
}
function lossPlot(s,peer=null){
 const history=s.model.history.length?s.model.history:[{update:0,train:trainingPreview(s).full.loss,validation:trainingPreview(s).validation.loss}];
 const other=peer?.model.history||[];
 const hi=Math.max(1,...history.flatMap(p=>[p.train,p.validation]),...other.flatMap(p=>[p.train,p.validation])),last=Math.max(200,s.model.updates,peer?.model.updates||0);
 const path=key=>history.map(p=>`${42+310*p.update/last},${160-130*p[key]/hi}`).join(' ');
 return `<figure class="loss-chart"><figcaption>Loss over training</figcaption><svg viewBox="0 0 390 200" role="img" aria-label="Train loss in purple, validation loss in dashed teal; ${s.model.updates} updates"><path d="M42 24V160H352" fill="none" stroke="#cabdce"/><polyline points="${path('train')}" fill="none" stroke="${purple}" stroke-width="2.5"/><polyline points="${path('validation')}" fill="none" stroke="#187d86" stroke-width="2.5" stroke-dasharray="6 4"/><g fill="#655b68" font-size="13"><text x="5" y="33">${fmt(hi,2)}</text><text x="23" y="165">0</text><text x="40" y="182">0</text><text x="325" y="182">${last}</text><text x="145" y="198">Batch updates</text></g></svg><p class="visual-key"><span class="series-train">━ Train</span><span class="series-validation">┄ Validation</span></p></figure>`;
}
function trainingView(s,interactive=true,peer=null){
 const r=trainingPreview(s),p=r.full.rows[s.point-1];
 return `<div class="training-stage" data-visual="training"><div>${trainingPlot(s,interactive)}<p class="visual-key">● Class 1 · ■ Class 0<br>Background shows predicted class; stronger color means farther from p = 0.5.</p></div><div class="training-results"><div class="metric-pair"><div><span>Train loss</span><strong data-guided-train-loss>${fmt(r.full.loss,4)}</strong></div><div><span>Validation loss</span><strong>${fmt(r.validation.loss,4)}</strong></div></div>${lossPlot(s,peer)}<p><strong>${s.model.updates}</strong> batch updates · ${s.model.epochs} epochs</p></div></div>`+(interactive?`<p class="interaction-hint">Choose a point to inspect it. Play applies real batch updates; pause at any time to examine the boundary.</p><div class="point-inspector"><strong>Example ${s.point}</strong><span>Input ${vector(p.x)}</span><span>Target ${p.y}</span><span>p(class 1) ${fmt(p.p,4)}</span><span>Loss ${fmt(p.loss,4)}</span></div><p class="stage-explanation">${s.model.last?`Last batch loss: ${fmt(s.model.last.before,4)} → ${fmt(s.model.last.after,4)}. Validation points never enter an update.`:'The model starts with seeded weights. Compare the training and validation losses as it learns XOR.'}</p>`:'');
}
const stageNames=['Source embedding + position','Encoder attention','Encoder residual + normalization','Encoder feed-forward','Encoder final states','Target embedding + position','Decoder masked attention','Decoder self residual + normalization','Decoder cross-attention','Decoder cross residual + normalization','Decoder feed-forward','Decoder final states','Vocabulary logits','Vocabulary probabilities'];
const shortNames=['Embeddings','Self-attention','Add & normalize','Feed-forward','Add & normalize','Embeddings','Masked attention','Add & normalize','Cross-attention','Add & normalize','Feed-forward','Add & normalize','Output projection','Softmax'];
const stageNotes=['Look up each source token and add its position vector.','Each source token mixes information from the source sequence.','Add the input through a residual connection, then normalize each row.','Apply the same 4 → 6 → 4 network independently to each token.','Add the feed-forward residual and normalize: this is the encoder memory.','Embed the shifted target tokens and add their positions.','Each target token can attend only to itself and earlier target positions when masking is on.','Add the target residual and normalize each row.','Queries come from the decoder; keys and values come from the encoder memory.','Add the cross-attention residual, then normalize.','Apply the shared decoder feed-forward network to each token.','Add the final residual and normalize each target row.','Project each four-coordinate state into six vocabulary logits.','Normalize the six logits into next-token probabilities.'];
function architectureView(s,interactive=true){
 const r=transformer(s.source.split(' '),s.future?['<bos>','como','azul']:['<bos>','como','estas'],{heads:s.heads,usePositions:s.positions,causal:s.causal,scale:s.scale});
 const matrices=[r.sourceInput.map(x=>x.input),r.encoderAttention.output,r.encoderAdd.output,r.encoderFF.output,r.encoderFinal.output,r.targetInput.map(x=>x.input),r.decoderAttention.output,r.decoderAdd.output,r.crossAttention.output,r.crossAdd.output,r.decoderFF.output,r.decoderFinal.output,r.logits,r.probabilities];
 const i=stageNames.indexOf(s.stage),a=matrices[i];
 const lane=(name,start,end)=>`<section><h4>${name}</h4><ol>${stageNames.slice(start,end).map((stage,j)=>{const n=start+j;return `<li>${interactive?pick('stage',stage,`${shortNames[n]}<small>${matrices[n].length} × ${matrices[n][0].length}</small>`,i===n):`<span>${shortNames[n]}</span>`}${n===8?'<p class="memory-link">↖ Encoder memory supplies K and V</p>':''}</li>`}).join('')}</ol></section>`;
 return `<div class="transformer-map" data-visual="architecture">${lane('Encoder · source',0,5)}${lane('Decoder · target',5,12)}${lane('Prediction',12,14)}</div><div class="stage-explanation"><strong>${i+1} / 14 · ${esc(s.stage)}</strong><p>${stageNotes[i]}</p></div><div class="stage-matrix">${grid(a,{title:`Output · ${a.length} tokens × ${a[0].length} coordinates`,scale:3})}</div>`;
}
function changeOutcome(before,after){return Math.abs(before-after)<1e-10?'unchanged':after<before?'lower':'higher'}
const directionOptions=[['lower','Lower'],['higher','Higher'],['unchanged','Unchanged']];

export function enhanceLabs(definitions){
 const attach=(id,config)=>{
  const base=definitions[id];
  definitions[id]={...base,
   initial:()=>({...base.initial(),viewStep:0}),
   render(s){return config.visual(s)+detail('Inspect the full calculation',base.render(s))},
   guide:config,
   action(s,a){base.action?.(s,a)},
  };
 };
 attach('dl-convolution',{
  primary:['scene','kernel','stride'],visual:convView,snapshot:s=>convView(s,false),
  label:'Slide one shared filter across the image',
  play:{label:'Scan output',tick(s){const n=convolution(s.image,s.weights,s.bias,s.stride,s.pad).windows.length;if(s.cell>=n)return false;s.cell++;return true}},
  prediction:{question:'What happens to this output value if the shared bias increases by 0.5? Keep the current activation.',options:directionOptions,
   run(s){const value=()=>{const r=convolution(s.image,s.weights,s.bias,s.stride,s.pad).windows[s.cell-1].value;return s.relu==='On'?Math.max(0,r):r};const before=value();s.bias=Math.min(2,s.bias+.5);const after=value();return {answer:changeOutcome(before,after),text:`Output ${fmt(before,4)} → ${fmt(after,4)}. Bias shifts the raw sum; ReLU can keep a negative response at zero. At the bias limit, the setting stays unchanged.`}}}
 });
 attach('tf-attention',{
  primary:['source','stage','causal'],visual:attentionView,snapshot:s=>attentionView({...s,viewStep:4},false),
  label:'Follow one query through attention',
  play:{label:'Walk through attention',tick(s){if(s.viewStep>=4)return false;s.viewStep++;return true}},
  prediction:{question:'With the decoder causal mask on, will changing future token 2 alter query 0’s output? This check uses a controlled decoder example.',options:[['unchanged','It stays the same'],['changed','It changes']],
   run(s){Object.assign(s,{stage:'Decoder self-attention',query:0,causal:true,future:false,viewStep:4});const before=attentionTrace(s).h.mixed[0];s.future=true;const after=attentionTrace(s).h.mixed[0];return {answer:before.every((v,i)=>Math.abs(v-after[i])<1e-12)?'unchanged':'changed',text:`Before ${vector(before)} → after ${vector(after)}. Query 0 assigns zero weight to future keys. Turn off the mask in Explore to test leakage.`}}}
 });
 attach('dl-training',{
  primary:['eta','kind','batch'],visual:trainingView,snapshot:(s,peer)=>trainingView(s,false,peer),
  label:'Watch the boundary learn from data',
  play:{label:'Train with animation',tick(s){const before=s.model.updates;definitions['dl-training'].action(s,'step');return s.model.updates>before}},
  prediction:{question:'After one batch update, what will happen to the loss on that same batch?',options:directionOptions,
   run(s){const updates=s.model.updates;definitions['dl-training'].action(s,'step');const p=s.model.last;if(s.model.updates===updates)return {answer:'unchanged',text:'No update was applied: the run reached its numerical or update limit. Reset to try another run.'};return {answer:changeOutcome(p.before,p.after),text:`Same-batch loss ${fmt(p.before,5)} → ${fmt(p.after,5)}. A step is not guaranteed to improve loss: learning rate, momentum and batch composition matter.`}}}
 });
 attach('tf-transformer',{
  primary:['source','causal'],visual:architectureView,snapshot:s=>architectureView(s,false),
  label:'Trace the encoder and decoder',
  play:{label:'Trace computation',tick(s){const i=stageNames.indexOf(s.stage);if(i>=stageNames.length-1)return false;s.stage=stageNames[i+1];return true}}
 });
 // Keep all existing k-means calculations and comparisons; add direct selection.
 const k=definitions.kmeans;
 definitions.kmeans={...k,guide:{primary:['dataset','k','start'],label:'Assign points, then move their centers',
  play:{label:'Animate clustering',tick(s){if(s.model.stable)return false;k.action(s,'step');return true}}},
  render(s){
   let comparison='';
   if(s.comparison?.length){const sorted=[...s.comparison].sort((a,b)=>a.loss-b.loss);const fits=[sorted[0],sorted.at(-1)];comparison=`<section class="seed-comparison"><h4>Two outcomes from the same data</h4><div class="comparison-panels">${fits.map((fit,i)=>{const run=k.initial();Object.assign(run,{dataset:s.dataset,k:s.k,start:'Seeded',seed:fit.seed});k.change(run,'seed');k.action(run,'run');const plot=k.render(run).match(/<svg[\s\S]*?<\/svg>/)?.[0]||'';return `<figure><figcaption>${i?'Highest':'Lowest'} observed objective · seed ${fit.seed}</figcaption>${plot.replace('data-plot','data-static-plot')}<p>J = ${fmt(fit.loss,5)}</p></figure>`}).join('')}</div><p class="visual-key">Identical axes and data. These are the lowest and highest objectives among the ten tested seeds, not a guarantee of a global optimum.</p></section>`}
   return `<div class="centroid-selector" aria-label="Select a centroid">${s.model.centers.map((_,i)=>pick('center',i+1,`C${i+1}`,s.center===i+1)).join('')}</div>`+k.render(s)+comparison},
  pointerStart(s,p){const x=(p.x-62)/340*12-1,y=(382-p.y)/340*12-1;let nearest=-1,distance=.7;for(let i=0;i<s.model.centers.length;i++){const c=s.model.centers[i],d=Math.hypot(c[0]-x,c[1]-y);if(d<distance){nearest=i;distance=d}}if(nearest>=0){s.center=nearest+1;k.change(s,'center')}},
 };
}
