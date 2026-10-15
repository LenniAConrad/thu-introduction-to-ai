import {esc,fmt} from './render.js';

// Reserve the space used by changing readouts, not by user-opened disclosures.
// Measurements are local to one experiment and discarded when its width changes.
const regions=[
 '.stage-explanation','.story-inspector','.attention-key','.attention-connection',
 '.attention-readout','.stage-matrix','.experiment-outcome','.point-inspector',
 '.visual-key','.plot-summary','.lab-summary','.intro-result','.history-key','.plot-text-key',':scope > p'
];
function slots(root){
 const seen=new Set(),out=[];
 for(const selector of regions)for(const [i,node] of [...root.querySelectorAll(selector)].entries()){
  if(seen.has(node)||node.closest('details'))continue;
  seen.add(node);out.push([selector+':'+i,node]);
 }
 return out;
}

export function experimentLayout(host,result,{samples=()=>[]}={}){
 let width=0,signature=null,disposed=false;
 const heights=new Map();
 function measure(root){
  const nodes=slots(root);
  for(const [,node] of nodes)node.style.minHeight='';
  for(const [key,node] of nodes){
   const height=node.getBoundingClientRect().height;
   if(height>0)heights.set(key,Math.max(heights.get(key)||0,Math.ceil(height)));
  }
 }
 function apply(root){
  for(const [key,node] of slots(root))if(heights.has(key))node.style.minHeight=heights.get(key)+'px';
 }
 function update(key=''){
  if(disposed)return;
  const nextWidth=result.getBoundingClientRect().width;
  // A hidden topic has no layout yet. Its first visible resize will measure it.
  if(nextWidth<=0)return;
  const resized=Math.abs(nextWidth-width)>1;
  if(resized){heights.clear();width=nextWidth}
  if(resized||key!==signature){
   signature=key;
   const frames=samples();
   if(frames.length){
    const probe=result.ownerDocument.createElement('div');
    probe.className='lab-result experiment-layout-probe';
    probe.inert=true;probe.setAttribute('aria-hidden','true');
    // Keep the real container queries and typography without taking up space.
    Object.assign(probe.style,{position:'absolute',width:width+'px',visibility:'hidden',pointerEvents:'none',inset:'0 auto auto 0'});
    host.append(probe);
    try{
     for(const frame of frames){probe.innerHTML=frame;measure(probe)}
    }finally{probe.remove()}
   }
  }
  measure(result);apply(result);
 }
 return {update,destroy(){disposed=true;heights.clear()}};
}

// An empty chart has the same canvas as a populated chart. Never invent data
// points just to hold space before the learner starts training.
export function measuredHistoryPlot(rows,{keys=['loss'],labels=['Loss'],width=440,height=205,className='intro-plot',xLabel='Updates',legend=null}={}){
 const values=rows.flatMap(row=>keys.map(key=>row[key])).filter(Number.isFinite);
 const low=Math.min(0,...values),high=Math.max(.001,...values);
 const steps=rows.map((row,i)=>row.step??row.update??i),start=steps[0]??0,end=steps.at(-1)??1;
 const X=t=>54+(width-80)*(t-start)/Math.max(1,end-start),Y=v=>height-42-(height-70)*(v-low)/(high-low);
 const colors=['#670875','#187d86','#bb592c'];
 const label=(x,y,value,anchor='middle')=>`<text x="${x}" y="${y}" text-anchor="${anchor}" ${anchor==='end'?'data-label-max-width="40"':''}>${esc(value)}</text>`;
 const tick=v=>v!==0&&(Math.abs(v)<.01||Math.abs(v)>=10000)?v.toExponential(1).replace('e+','e'):fmt(v,3);
 const curves=keys.map((key,i)=>`<polyline points="${rows.map((row,j)=>`${X(steps[j])},${Y(row[key])}`).join(' ')}" fill="none" stroke="${colors[i%colors.length]}" stroke-width="2" ${i===1?'stroke-dasharray="6 4"':''}/>`).join('');
 const axes=`<path d="M54 24V${height-42}H${width-26}" fill="none" stroke="#d9d1df"/>`;
 const ticks=rows.length?label(47,32,tick(high),'end')+label(47,height-38,tick(low),'end')+label(54,height-21,start)+label(width-26,height-21,end):'';
 const empty=label(width/2,height/2-4,'No updates yet')+label(width/2,height/2+20,'Run a step to begin');
 const key=legend||labels.map((name,i)=>`${labels.length>1?['Purple','Dashed teal','Orange'][i%3]+': ':''}${name}`).join(' · ');
 return `<svg class="${className} history-plot" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(key)} over ${esc(xLabel.toLowerCase())}${rows.length?'':'; no updates yet'}">${axes}${rows.length?curves+ticks:empty}${label(width/2,height-3,xLabel)}</svg><p class="history-key">${esc(key)}. ${rows.length?'Each point is a measured value.':'The curve appears after the first update.'}</p>`;
}
