import {esc,fmt} from './render.js';
import {convolution,trainingPreview,mlpForward} from './deep-learning-math.js';
import {transformer,targetVocabulary} from './transformer-math.js';
import {numberGrid as grid,convolutionView as convView,convolutionTrace,attentionView,attentionTrace,attentionDetails,attentionExamples,attentionSteps} from './calculation-stories.js';

const purple='#670875',orange='#bb592c';
const pick=(key,value,label,selected=false,extra='')=>`<button type="button" data-lab-set="${key}" data-value="${esc(value)}" aria-pressed="${selected}" ${extra}>${label}</button>`;
const detail=(name,body)=>`<details class="lab-math"><summary>${name}</summary>${body}</details>`;
const vector=v=>'['+v.map(x=>fmt(x,4)).join(', ')+']';
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
   initial:()=>({...base.initial(),viewStep:0,...config.defaults}),
   controls:[...(config.controls||[]),...base.controls],
   normalize:config.normalize,prepareSetup:config.prepareSetup,
   describe:config.describe||base.describe,
   visible:config.visible||base.visible,
   bounds:(s,k)=>config.bounds?.(s,k)??base.bounds?.(s,k),
   change(s,k){if(config.change)config.change(s,k,base);else base.change?.(s,k)},
   render(s){return config.visual(s)+detail('Inspect the full calculation',config.details?config.details(s,base):base.render(s))},
   guide:config,
   action(s,a){base.action?.(s,a)},
  };
 };
 attach('dl-convolution',{
  primary:['scene','kernel','playMode'],visual:convView,snapshot:s=>convView(s,false),
  defaults:{cell:2,convStep:0,playMode:'Explain this cell'},
  controls:[{id:'playMode',label:'Playback',type:'select',options:['Explain this cell','Scan image']}],
  normalize(s){s.convStep??=0;s.playMode??='Explain this cell'},
  change(s,k,base){base.change?.(s,k);s.convStep=0},
  describe(s){const t=convolutionTrace(s);return s.playMode==='Scan image'?`Output ${s.cell}: ${fmt(t.activated,4)}.`:`Output ${s.cell}, step ${t.step} of 11. ${t.step===11?'Final output':'Running total'}: ${fmt(t.running,4)}.`},
  metrics(s){const t=convolutionTrace(s);return [{key:'raw',label:`Raw response at output ${s.cell}`,value:t.w.value},{key:'output',label:`Activated output ${s.cell}`,value:t.activated}]},
  arrays:[['image','Input pixels'],['weights','Kernel weights']],
  label:'Slide one shared filter across the image',
  play:{label:'Animate convolution',finished:s=>s.playMode==='Scan image'?s.cell>=convolutionTrace(s).r.windows.length:s.convStep>=11,
   restart(s){if(s.playMode==='Scan image')s.cell=1;s.convStep=0},
   tick(s){if(this.finished(s))return false;if(s.playMode==='Scan image')s.cell++;else s.convStep++;return true}},
  prediction:{question:'What happens to this output value if the shared bias increases by 0.5? Keep the current activation.',options:directionOptions,
   run(s){const value=()=>{const r=convolution(s.image,s.weights,s.bias,s.stride,s.pad).windows[s.cell-1].value;return s.relu==='On'?Math.max(0,r):r};const before=value();s.bias=Math.min(2,s.bias+.5);s.convStep=11;const after=value();return {answer:changeOutcome(before,after),text:`Output ${fmt(before,4)} → ${fmt(after,4)}. Bias shifts the raw sum; ReLU can keep a negative response at zero. At the bias limit, the setting stays unchanged.`}}}
 });
 attach('tf-attention',{
  primary:['attentionExample','scale','causal'],visual:attentionView,snapshot:s=>attentionView(s,false),
  defaults:{attentionExample:'One dominant key',mixCount:0},
  controls:[{id:'attentionExample',label:'Demonstration',type:'select',options:attentionExamples}],
  normalize(s){s.attentionExample??='Full Transformer';s.mixCount??=s.viewStep===4?attentionTrace(s).keys.length:0},
  prepareSetup(s,values){if(!Object.hasOwn(values,'attentionExample'))s.attentionExample='Full Transformer'},
  visible(s,k){const full=s.attentionExample==='Full Transformer';if(k==='causal')return s.attentionExample==='Blocked future token'||full&&s.stage==='Decoder self-attention';if(k==='future')return full&&s.stage!=='Encoder self-attention';return !['source','stage','heads','head','positions'].includes(k)||full},
  bounds:(s,k)=>k==='query'&&s.attentionExample!=='Full Transformer'?{min:0,max:2}:null,
  change(s,k,base){if(s.attentionExample==='Full Transformer')base.change?.(s,k);if(k==='attentionExample'){s.query=0;s.causal=true;s.scale=true}if(k!=='viewStep')s.viewStep=0;s.mixCount=0},
  details:(s,base)=>s.attentionExample==='Full Transformer'?base.render(s):attentionDetails(s),
  describe(s){const {h,keys}=attentionTrace(s),count=Math.min(s.mixCount,keys.length),total=h.v[0].map((_,c)=>h.v.slice(0,count).reduce((sum,v,j)=>sum+v[c]*h.weights[s.query][j],0));return `Query ${s.query}. ${attentionSteps[s.viewStep]}.${s.viewStep===4?` ${count} of ${keys.length} contributions added. Total ${vector(total)}.`:''}`},
  metrics(s){const {h,keys}=attentionTrace(s),q=s.query;return [...keys.map((k,j)=>({key:'weight'+j,label:`Query ${q} → key ${j} (${k})`,value:h.weights[q][j]*100,unit:'%'})),...h.mixed[q].map((v,j)=>({key:'value'+j,label:`Output coordinate ${j+1}`,value:v}))]},
  label:'Follow one query through attention',
  play:{label:'Walk through attention',finished:s=>s.viewStep>=4&&s.mixCount>=attentionTrace(s).keys.length,
   restart(s){s.viewStep=0;s.mixCount=0},
   tick(s){if(this.finished(s))return false;if(s.viewStep<4)s.viewStep++;else s.mixCount++;return true}},
  prediction:{question:'With the decoder causal mask on, will changing future token 2 alter query 0’s output? This check uses a controlled decoder example.',options:[['unchanged','It stays the same'],['changed','It changes']],
   run(s){Object.assign(s,{attentionExample:'Full Transformer',stage:'Decoder self-attention',query:0,causal:true,future:false,viewStep:4,mixCount:3});const before=attentionTrace(s).h.mixed[0];s.future=true;const after=attentionTrace(s).h.mixed[0];return {answer:before.every((v,i)=>Math.abs(v-after[i])<1e-12)?'unchanged':'changed',text:`Before ${vector(before)} → after ${vector(after)}. Query 0 assigns zero weight to future keys. Turn off the mask in Explore to test leakage.`}}}
 });
 attach('dl-training',{
  primary:['eta','kind','batch'],visual:trainingView,snapshot:(s,peer)=>trainingView(s,false,peer),
  metrics(s){const r=trainingPreview(s);return [{key:'train',label:'Train loss',value:r.full.loss},{key:'validation',label:'Validation loss',value:r.validation.loss},{key:'accuracy',label:'Train accuracy',value:r.full.accuracy*100,unit:'%'},{key:'updates',label:'Batch updates',value:s.model.updates}]},
  arrays:[['model.weights','Fitted weights']],
  label:'Watch the boundary learn from data',
  play:{label:'Train with animation',tick(s){const before=s.model.updates;definitions['dl-training'].action(s,'step');return s.model.updates>before}},
  prediction:{question:'After one batch update, what will happen to the loss on that same batch?',options:directionOptions,
   run(s){const updates=s.model.updates;definitions['dl-training'].action(s,'step');const p=s.model.last;if(s.model.updates===updates)return {answer:'unchanged',text:'No update was applied: the run reached its numerical or update limit. Reset to try another run.'};return {answer:changeOutcome(p.before,p.after),text:`Same-batch loss ${fmt(p.before,5)} → ${fmt(p.after,5)}. A step is not guaranteed to improve loss: learning rate, momentum and batch composition matter.`}}}
 });
 attach('tf-transformer',{
  primary:['source','causal'],visual:architectureView,snapshot:s=>architectureView(s,false),
  metrics(s){const r=transformer(s.source.split(' '),s.future?['<bos>','como','azul']:['<bos>','como','estas'],{heads:s.heads,usePositions:s.positions,causal:s.causal,scale:s.scale});return r.probabilities[0].map((v,j)=>({key:'p'+j,label:`Query 0 · ${targetVocabulary[j]}`,value:v*100,unit:'%'}))},
  label:'Trace the encoder and decoder',
  play:{label:'Trace computation',finished:s=>s.stage===stageNames.at(-1),restart(s){s.stage=stageNames[0]},tick(s){const i=stageNames.indexOf(s.stage);if(i>=stageNames.length-1)return false;s.stage=stageNames[i+1];return true}}
 });
 // Keep all existing k-means calculations and comparisons; add direct selection.
 const k=definitions.kmeans;
 definitions.kmeans={...k,guide:{primary:['dataset','k','start'],label:'Assign points, then move their centers',
  arrays:[['model.centers','Centroid coordinates'],['model.labels','Cluster memberships']],
  metrics(s){const m=s.model,loss=m.labels?m.points.reduce((sum,p,i)=>sum+p.reduce((n,v,j)=>n+(v-m.centers[m.labels[i]][j])**2,0),0):null;return [{key:'objective',label:'Assigned objective J',value:loss},{key:'iterations',label:'Mean updates',value:m.iterations}]},
  play:{label:'Animate clustering',tick(s){if(s.model.stable)return false;k.action(s,'step');return true}}},
  render(s){
   let comparison='';
   if(s.comparison?.length){const sorted=[...s.comparison].sort((a,b)=>a.loss-b.loss);const fits=[sorted[0],sorted.at(-1)];comparison=`<section class="seed-comparison"><h4>Two outcomes from the same data</h4><div class="comparison-panels">${fits.map((fit,i)=>{const run=k.initial();Object.assign(run,{dataset:s.dataset,k:s.k,start:'Seeded',seed:fit.seed});k.change(run,'seed');k.action(run,'run');const plot=k.render(run).match(/<svg[\s\S]*?<\/svg>/)?.[0]||'';return `<figure><figcaption>${i?'Highest':'Lowest'} observed objective · seed ${fit.seed}</figcaption>${plot.replace('data-plot','data-static-plot')}<p>J = ${fmt(fit.loss,5)}</p></figure>`}).join('')}</div><p class="visual-key">Identical axes and data. These are the lowest and highest objectives among the ten tested seeds, not a guarantee of a global optimum.</p></section>`}
   return `<div class="centroid-selector" aria-label="Select a centroid">${s.model.centers.map((_,i)=>pick('center',i+1,`C${i+1}`,s.center===i+1)).join('')}</div>`+k.render(s)+comparison},
  pointerStart(s,p){const x=(p.x-62)/340*12-1,y=(382-p.y)/340*12-1;let nearest=-1,distance=.7;for(let i=0;i<s.model.centers.length;i++){const c=s.model.centers[i],d=Math.hypot(c[0]-x,c[1]-y);if(d<distance){nearest=i;distance=d}}if(nearest>=0){s.center=nearest+1;k.change(s,'center')}},
 };
}
