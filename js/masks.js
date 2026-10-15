import {esc,fmt,table} from './render.js';
import {maskScores} from './math.js';
import {labGoals} from './lab-catalog.js';
const masks={Square:[5,6,9,10],Line:[1,5,9,13],'Five pixels':[1,5,6,9,13],Empty:[]};
const binary=indices=>Array.from({length:16},(_,i)=>Number(indices.includes(i)));
export function mountMasks(host){
 let target=binary(masks.Square),prediction=binary([5,6,9,13]);
 host.innerHTML=`<div class="lab-goal"><strong>Goal</strong><p>${esc(labGoals.masks)}</p></div>
 <p>Each cell is one pixel: 1 = foreground, 0 = background. Toggle prediction pixels to maximize foreground IoU. These are binary class masks; they do not distinguish separate object instances.</p>
 <label>Target shape <select data-mask-target aria-label="Target shape">${Object.keys(masks).map(v=>`<option>${v}</option>`).join('')}</select></label>
 <div class="mask-pair"><section><h3>Target mask</h3><div class="pixel-mask" data-target role="img" aria-label="Target mask, rows top to bottom">${target.map((_,i)=>`<span data-cell="${i}" aria-hidden="true"></span>`).join('')}</div></section>
 <section><h3>Your prediction</h3><div class="pixel-mask" role="group" aria-label="Prediction mask: toggle pixels">${prediction.map((_,i)=>`<button type="button" data-pixel="${i}" aria-label="Prediction row ${Math.floor(i/4)+1}, column ${i%4+1}" aria-pressed="false"></button>`).join('')}</div></section></div>
 <div class="mask-actions"><button class="button subtle small" data-lab-action="clear">Predict all background</button> <button class="button subtle small" data-lab-action="perfect">Show exact mask</button> <button class="button subtle small" data-lab-action="reset">Reset</button></div>
 <p data-mask-summary role="status" aria-live="polite"></p><div data-mask-results></div>
 <p><strong>Try:</strong> on the square target, predict all background. Accuracy is 75%, yet foreground IoU is 0. Correct background pixels do not rescue a missed object. Switch to Empty to inspect an absent class.</p>
 <p><strong>Absent-class convention:</strong> if a class is absent from both masks, its union is zero. This demo reports its IoU as undefined and excludes it from the two-class mean. Evaluation protocols differ; always state the convention. When the target is empty, any predicted foreground makes the foreground union nonzero and its IoU 0.</p>`;
 const targetCells=[...host.querySelectorAll('[data-cell]')],pixels=[...host.querySelectorAll('[data-pixel]')];
 function draw(){
  targetCells.forEach((el,i)=>{el.textContent=target[i];el.dataset.on=target[i];});
  host.querySelector('[data-target]').setAttribute('aria-label','Target mask, four rows of four pixels, top to bottom: '+[0,1,2,3].map(r=>target.slice(r*4,r*4+4).join(', ')).join('; '));
  pixels.forEach((el,i)=>{el.textContent=prediction[i];el.dataset.on=prediction[i];el.setAttribute('aria-pressed',String(Boolean(prediction[i])))});
  const r=maskScores(target,prediction),value=v=>v===null?'Undefined (empty union)':fmt(v,4);
  host.querySelector('[data-mask-summary]').textContent=`Foreground IoU: ${value(r.foreground)}. Intersection ${r.tp}; union ${r.tp+r.fp+r.fn}. Pixel accuracy: ${fmt(100*r.accuracy,1)}%.`;
  host.querySelector('[data-mask-results]').innerHTML=table(['Pixel count','Value'],[['TP: target 1, prediction 1',r.tp],['FP: target 0, prediction 1',r.fp],['FN: target 1, prediction 0',r.fn],['TN: target 0, prediction 0',r.tn]])+table(['Score','Calculation','Value'],[['Foreground IoU',`${r.tp} / ${r.tp+r.fp+r.fn}`,value(r.foreground)],['Background IoU',`${r.tn} / ${r.tn+r.fp+r.fn}`,value(r.background)],['Mean defined class IoU',`${Number(r.foreground!==null)+Number(r.background!==null)} class(es), equal weight`,value(r.mean)]])+`<p>Foreground IoU = TP / (TP + FP + FN). Pixel accuracy = (TP + TN) / 16. The mean gives each defined class equal weight, unlike pixel accuracy.</p>`;
 }
 let painting=null,suppressClick=false;
 const pixelAt=e=>{const el=host.ownerDocument.elementFromPoint?.(e.clientX,e.clientY)?.closest?.('[data-pixel]');return el&&host.contains(el)?el:null};
 const down=e=>{const pixel=e.target.closest?.('[data-pixel]');if(!pixel||(e.button!==undefined&&e.button!==0))return;const i=Number(pixel.dataset.pixel);painting={value:1-prediction[i],touched:new Set([i])};suppressClick=true;prediction[i]=painting.value;draw();e.preventDefault()};
 const move=e=>{if(!painting)return;const pixel=pixelAt(e);if(!pixel)return;const i=Number(pixel.dataset.pixel);if(painting.touched.has(i))return;painting.touched.add(i);prediction[i]=painting.value;draw()};
 const up=()=>{painting=null};
 const click=e=>{const afterPointer=suppressClick;suppressClick=false;const pixel=e.target.closest('[data-pixel]');if(pixel){if(afterPointer)return;const i=Number(pixel.dataset.pixel);prediction[i]=1-prediction[i];draw();return}const action=e.target.closest('[data-lab-action]')?.dataset.labAction;if(action==='clear')prediction=Array(16).fill(0);else if(action==='perfect')prediction=[...target];else if(action==='reset'){target=binary(masks.Square);prediction=binary([5,6,9,13]);host.querySelector('select').value='Square'}else return;draw()};
 const change=e=>{if(e.target.matches('[data-mask-target]')){target=binary(masks[e.target.value]);draw()}};
 host.addEventListener('pointerdown',down);host.addEventListener('pointermove',move);host.addEventListener('pointerup',up);host.addEventListener('pointercancel',up);host.addEventListener('click',click);host.addEventListener('change',change);draw();
 return()=>{painting=null;for(const [type,fn] of [['pointerdown',down],['pointermove',move],['pointerup',up],['pointercancel',up],['click',click],['change',change]])host.removeEventListener(type,fn)};
}
