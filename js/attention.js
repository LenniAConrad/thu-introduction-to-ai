import {esc,fmt,table} from './render.js';
import {softmax} from './math.js';
export const attentionNumber=(x,d=6)=>Number.isFinite(x)&&x!==0&&(Math.abs(x)<0.0001||Math.abs(x)>=1e7)?x.toExponential(5):fmt(x,d);

export function parseMatrix(text,name='Matrix'){
 const rows=text.trim().split(/\n/).map(row=>row.trim().split(/[\s,]+/).map(token=>token!==''&&/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(token)?Number(token):NaN));
 if(!text.trim()||rows.length>8||!rows[0].length||rows[0].length>8||rows.some(row=>row.length!==rows[0].length||row.some(x=>!Number.isFinite(x)||Math.abs(x)>10000)))throw Error(`${name}: enter a rectangular matrix, at most 8 × 8, with finite numbers between −10000 and 10000. Separate rows with newlines.`);
 return rows;
}
export function calculateAttention(Q,K,V,causal=false){
 if(Q[0].length!==K[0].length)throw Error('Q and K must have the same number of columns (dₖ).');
 if(K.length!==V.length)throw Error('K and V must have the same number of rows (one value per key).');
 if(causal&&Q.length!==K.length)throw Error('This causal self-attention example needs one query per key: Q and K must have the same number of rows.');
 return Q.map((q,i)=>{
  const raw=K.map(k=>k.reduce((sum,x,d)=>sum+x*q[d],0));
  const scaled=raw.map(x=>x/Math.sqrt(q.length));
  const masked=scaled.map((x,j)=>causal&&j>i?-Infinity:x);
  const weights=softmax(masked);
  return {raw,scaled,masked,weights,output:V[0].map((_,d)=>V.reduce((sum,v,j)=>sum+weights[j]*v[d],0))};
 });
}
const presets={
 simple:{Q:'1',K:'0\n1.098612289',V:'2\n6',causal:false},
 sequence:{Q:'1 0\n0 1\n1 1',K:'1 0\n0 1\n1 1',V:'2 0\n0 4\n2 2',causal:true}
};
export function mountAttention(host){
 let selected={query:0,key:0};
 host.innerHTML=`<div class="lab-goal"><strong>Goal</strong><p>Enter Q, K, and V. Calculate scores, normalize each query row, and form a weighted average of values. Predict the output before changing a number.</p></div><div class="attention-presets"><button class="button subtle small" data-lab-action="simple">Two-key example</button> <button class="button subtle small" data-lab-action="sequence">Three-token causal example</button> <button class="button subtle small" data-lab-action="reset">Reset</button></div><div class="attention-inputs">${['Q','K','V'].map(name=>`<label>${name}<textarea aria-label="${name} matrix" data-matrix="${name}" rows="2" spellcheck="false" maxlength="1500"></textarea></label>`).join('')}</div><p>Numbers separated by spaces or commas; one row per line. Q: n<sub>q</sub> × d<sub>k</sub>, K: n<sub>k</sub> × d<sub>k</sub>, V: n<sub>k</sub> × d<sub>v</sub>. Inputs are already-projected vectors, not raw words.</p><label class="attention-mask"><input type="checkbox" data-causal> Causal self-attention (query row i may use only keys 1…i)</label><div data-attention-result></div>`;
 const result=host.querySelector('[data-attention-result]');
 function draw(){const opened=[...result.querySelectorAll('details')].map(el=>el.open);try{
  const [Q,K,V]=['Q','K','V'].map(name=>parseMatrix(host.querySelector(`[data-matrix="${name}"]`).value,name));
  const causal=host.querySelector('[data-causal]').checked,rows=calculateAttention(Q,K,V,causal);
  selected.query=Math.min(selected.query,rows.length-1);selected.key=Math.min(selected.key,K.length-1);
  const active=rows[selected.query],weight=active.weights[selected.key],blocked=active.masked[selected.key]===-Infinity;
  const heatmap=`<h3>Attention map</h3><p class="plot-hint">Select a cell to trace how one key contributes to a query’s output. Each row sums to 1.</p><div class="attention-map-scroll"><div class="attention-map" style="--keys:${K.length}"><span aria-hidden="true">Q ↓ K →</span>${K.map((_,j)=>`<span>Key ${j+1}</span>`).join('')}${rows.map((r,i)=>`<span>Q ${i+1}</span>${r.weights.map((w,j)=>`<button type="button" data-attention-cell="${i}-${j}" aria-pressed="${selected.query===i&&selected.key===j}" aria-label="Query ${i+1}, key ${j+1}: ${r.masked[j]===-Infinity?'masked, zero weight':attentionNumber(w*100,3)+' percent weight'}" class="${r.masked[j]===-Infinity?'masked':''}" style="--weight:${w};color:${w>.62?'white':'#000'}">${r.masked[j]===-Infinity?'×':attentionNumber(w*100,1)+'%'}</button>`).join('')}`).join('')}</div></div><p class="attention-map-key">Darker purple = higher weight · × = masked before softmax</p><div class="attention-selection" role="status" aria-live="polite"><strong>Query ${selected.query+1} ← Key ${selected.key+1}</strong><p>${blocked?'This future key is masked. Its weight and every output contribution are exactly zero.':`Scaled score ${attentionNumber(active.scaled[selected.key])} → weight ${attentionNumber(weight*100,4)}%.`}</p><p>Contribution to output: ${attentionNumber(weight)} × [${V[selected.key].map(v=>attentionNumber(v)).join(', ')}] = <strong>[${V[selected.key].map(v=>attentionNumber(weight*v)).join(', ')}]</strong></p><p>Sum contributions from all keys to get [${active.output.map(v=>attentionNumber(v)).join(', ')}].</p></div>`;
  result.innerHTML=heatmap+`<p class="info-note">Scores and weights: ${Q.length} × ${K.length}. Output: ${Q.length} × ${V[0].length}. Divide dot products by √${Q[0].length} before softmax.</p>`+rows.map((r,i)=>{
   const max=Math.max(...r.masked),exps=r.masked.map(x=>Math.exp(x-max)),sum=exps.reduce((a,b)=>a+b,0);
   return `<section class="attention-row"><h3>Query ${i+1}: [${Q[i].map(x=>attentionNumber(x)).join(', ')}]</h3><p class="attention-output"><strong>Output: [${r.output.map(x=>attentionNumber(x)).join(', ')}]</strong></p><div class="attention-bars" aria-label="Attention weights">${r.weights.map((w,j)=>`<div><span>Key ${j+1}</span><meter min="0" max="1" value="${w}" aria-label="Query ${i+1} key ${j+1} weight">${w}</meter><span>${attentionNumber(w*100,4)}%</span></div>`).join('')}</div><p>Weights sum to ${fmt(r.weights.reduce((a,b)=>a+b,0),6)}.</p><details class="attention-calculation"><summary>Show calculation: scores → weights → output</summary><h4>1–3. Dot products, scaling, and mask</h4>${table(['Key','Q · K','÷ √dₖ','+ mask'],r.raw.map((v,j)=>[j+1,attentionNumber(v),attentionNumber(r.scaled[j]),attentionNumber(r.masked[j])]))}<h4>4–5. Stable softmax</h4><p>Subtract row maximum ${attentionNumber(max)} before exponentiating. Divide each exponential by their sum, ${attentionNumber(sum)}.</p>${table(['Key','exp(score − max)','Weight'],exps.map((v,j)=>[j+1,attentionNumber(v),attentionNumber(r.weights[j])]))}<h4>6. Weighted values</h4>${table(['Output coordinate','Σ weight × value ≈','Result'],r.output.map((v,d)=>[d+1,V.map((row,j)=>`${attentionNumber(r.weights[j])} × ${attentionNumber(row[d])}`).join(' + '),attentionNumber(v)]))}<p class="muted">Displayed numbers are rounded; outputs use full precision. Very small nonzero numbers use scientific notation (for example, 1e−5 = 0.00001).</p></details></section>`;
  }).join('')+`<p>Mask M = 0 for allowed keys, −∞ for blocked keys. It is added before softmax; every row here has at least one allowed key. Finite unmasked scores receive positive mathematical weights, although very small weights can round to zero on a computer. Softmax mixes values; it does not keep only the largest score.</p><p><strong>Try:</strong> set all Q entries to 0. Without a mask the weights are uniform, so each output is the mean of the value rows. Then use the causal example: the first output must equal the first value row.</p>`;
  result.querySelectorAll('details').forEach((el,i)=>{if(opened[i])el.open=true});
 }catch(error){result.innerHTML=`<p class="info-note" role="alert">${esc(error.message)}</p>`}}
 function setPreset(name){selected={query:0,key:0};const p=presets[name];for(const key of ['Q','K','V'])host.querySelector(`[data-matrix="${key}"]`).value=p[key];host.querySelector('[data-causal]').checked=p.causal;draw()}
 const click=e=>{const cell=e.target.closest('[data-attention-cell]');if(cell){const [query,key]=cell.dataset.attentionCell.split('-').map(Number);selected={query,key};draw();result.querySelector(`[data-attention-cell="${query}-${key}"]`).focus({preventScroll:true});return;}const action=e.target.closest('[data-lab-action]')?.dataset.labAction;if(action)setPreset(action==='sequence'?'sequence':'simple')};
 host.addEventListener('input',draw);host.addEventListener('click',click);setPreset('simple');
 return()=>{host.removeEventListener('input',draw);host.removeEventListener('click',click)};
}
