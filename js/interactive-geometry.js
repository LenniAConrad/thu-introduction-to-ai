// Directly manipulable plots for k-means, gradient descent, SVM margins, positional encoding and DBSCAN.
// Each `pointer(state,point)` receives viewBox coordinates from mountLab; sliders remain the keyboard path.
import {esc,fmt,table} from './render.js';
import {assignments,moveCenters,inertia,marginScores,sinusoidalPosition,dbscan1D} from './math.js';

const colors=['#670875','#ce754d','#347ca3','#a98d27'];
const stat=(name,v)=>`<div class="lab-stat"><span>${esc(name)}</span><strong>${esc(v)}</strong></div>`;
const chart=(body,label,viewBox='0 0 440 340')=>`<svg class="explore-plot" data-plot viewBox="${viewBox}" role="img" aria-label="${esc(label)}">${body}</svg>`;
const line=(x1,y1,x2,y2,extra='')=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${extra}/>`;
const grid=(x1,y1,x2,y2)=>line(x1,y1,x2,y2,'class="plot-grid"');
const dot=(x,y,color,r=5,title='',extra='')=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" ${extra}>${title?`<title>${esc(title)}</title>`:''}</circle>`;
const text=(x,y,t,extra='')=>`<text x="${x}" y="${y}" ${extra}>${esc(t)}</text>`;
const range=(id,label,min,max,step=1)=>({id,label,min,max,step,type:'range'});
const select=(id,label,options)=>({id,label,options,type:'select'});
const button=(id,label)=>`<button type="button" class="button subtle small" data-lab-action="${id}">${label}</button>`;
const hint=t=>`<p class="plot-hint">${t}</p>`;
const summary=t=>`<p class="plot-summary">${t}</p>`;
const goal=(met,text)=>`<span class="plot-goal ${met?'met':''}" data-goal="${met?'met':'open'}">${met?'✓ ':''}${esc(text)}</span>`;
const legend=items=>`<div class="plot-legend">${items.map(([mark,label])=>`<span>${mark} ${esc(label)}</span>`).join('')}</div>`;
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
const snap=(v,step)=>Number((Math.round(v/step)*step).toFixed(8));

// ---- k-means: drag a centroid cross to choose your own initialization ----
export const clusterPoints=Array.from({length:42},(_,i)=>{const c=[[1.8,2],[7.6,3],[4.9,7.7]][i%3];return [c[0]+Math.sin(i*3.7)*1.35,c[1]+Math.cos(i*2.3)*1.25]});
export const startCenters=(k,start='Left edge')=>Array.from({length:k},(_,i)=>start==='Spread'?[[1.8,2],[7.6,3],[4.9,7.7],[5,1]][i]:start==='Right edge'?[8.8-i*1.1,8.8-(i%2)*1.4]:[1.2+i*1.1,1.2+(i%2)*1.4]);
const KX=x=>35+x*37,KY=y=>310-y*28;
const restart=s=>Object.assign(s,{labels:null,phase:'assign',steps:0});
export const kmeansDefinition={
 initial:()=>({k:3,start:'Left edge',centers:startCenters(3),labels:null,phase:'assign',steps:0}),
 controls:[range('k','Number of clusters k',2,4),select('start','Initial centers',['Left edge','Spread','Right edge','Custom'])],
 change(s,key){
  if(key==='k'){const base=startCenters(s.k,s.start==='Custom'?'Left edge':s.start);s.centers=s.start==='Custom'?base.map((c,i)=>s.centers[i]?[...s.centers[i]]:c):base;restart(s)}
  if(key==='start'){if(s.start!=='Custom')s.centers=startCenters(s.k,s.start);restart(s)}
 },
 pointer(s,p){
  let best=-1,distance=Infinity;
  s.centers.forEach((c,i)=>{const d=Math.hypot(KX(c[0])-p.x,KY(c[1])-p.y);if(d<distance){distance=d;best=i}});
  if(best<0||distance>30)return;
  s.centers[best]=[clamp(snap((p.x-35)/37,.1),0,10),clamp(snap((310-p.y)/28,.1),0,10)];s.start='Custom';restart(s);
 },
 describe:s=>`${s.k} centroids at ${s.centers.map(c=>`(${fmt(c[0],1)}, ${fmt(c[1],1)})`).join(', ')}. ${s.labels?`Objective ${fmt(inertia(clusterPoints,s.centers,s.labels))}.`:'Points not yet assigned.'} ${s.steps} full iterations.`,
 render(s){
  const preview=s.labels||assignments(clusterPoints,s.centers),cells=22,size=10/cells;
  const regions=Array.from({length:cells*cells},(_,i)=>{const cx=(i%cells+.5)*size,cy=(Math.floor(i/cells)+.5)*size,c=assignments([[cx,cy]],s.centers)[0];return `<rect x="${KX(cx-size/2)}" y="${KY(cy+size/2)}" width="${37*size+.3}" height="${28*size+.3}" fill="${colors[c]}" opacity=".08"/>`}).join('');
  const stable=s.labels&&s.phase==='assign'&&assignments(clusterPoints,s.centers).every((c,i)=>c===s.labels[i])&&moveCenters(clusterPoints,s.centers,s.labels).every((c,i)=>Math.abs(c[0]-s.centers[i][0])<1e-9&&Math.abs(c[1]-s.centers[i][1])<1e-9);
  const axes=[0,2,4,6,8,10].map(v=>grid(35,KY(v),405,KY(v))+grid(KX(v),30,KX(v),310)+text(12,KY(v)+4,v)+text(KX(v)-3,330,v)).join('');
  const links=s.labels?clusterPoints.map(([x,y],i)=>line(KX(x),KY(y),KX(s.centers[s.labels[i]][0]),KY(s.centers[s.labels[i]][1]),`stroke="${colors[s.labels[i]]}" stroke-opacity=".35"`)).join(''):'';
  const points=clusterPoints.map(([x,y],i)=>dot(KX(x),KY(y),s.labels?colors[s.labels[i]]:'#aaa',5,`Point ${i+1} (${fmt(x,2)}, ${fmt(y,2)})${s.labels?` · cluster ${s.labels[i]+1}`:` · nearest centroid ${preview[i]+1} if assigned now`}`)).join('');
  const crosses=s.centers.map(([x,y],i)=>`<g data-handle="center-${i}"><circle cx="${KX(x)}" cy="${KY(y)}" r="16" fill="${colors[i]}" fill-opacity=".12"/><path d="M${KX(x)-8} ${KY(y)-8}l16 16m-16 0l16 -16" stroke="${colors[i]}" stroke-width="4"/><title>Centroid ${i+1} at (${fmt(x,2)}, ${fmt(y,2)}). Drag to move.</title></g>`).join('');
  return hint('Drag a centroid cross to choose your own starting centers; this restarts the iteration. The k slider and preset menu do the same with fixed layouts.')+
   chart(regions+axes+links+points+crosses,`Forty-two unlabeled points and ${s.k} centroid crosses; shaded regions show which centroid is nearest${s.labels?'; lines join each point to its assigned centroid':'; points are grey until assigned'}`)+
   legend([['<i class="legend-dot"></i>','assigned point (grey = unassigned)'],['✕','centroid (drag)'],['<i class="legend-dot" style="opacity:.2"></i>','nearest-centroid region']])+
   summary(`<strong>${s.steps} iteration${s.steps===1?'':'s'}</strong> ${goal(stable,stable?'Converged: another assignment and update would change nothing':s.labels?'Not stable yet: keep alternating':'Goal: alternate until nothing changes')}`)+
   stat('Within-cluster squared distance',s.labels?fmt(inertia(clusterPoints,s.centers,s.labels)):'Assign first')+button('step',s.phase==='assign'?'Assign points':'Move centroids')+
   `<p>${s.steps} full iterations. ${s.labels?new Set(s.labels).size+' occupied cluster(s).':''} Empty clusters keep their previous center. Labels are cluster identities, not known classes.${s.start==='Custom'?' Centers were placed by hand.':''}</p><p><strong>Compare:</strong> hold k fixed and try each initial-center preset, then drag two crosses into the same blob. Changing k, the preset, or a cross restarts assignment. Stop when another assignment/update leaves centers and labels unchanged. Stable runs may reach the same or different objectives; convergence does not certify the global minimum.</p>`;
 },
 action(s,a){if(a==='step'){if(s.phase==='assign'){s.labels=assignments(clusterPoints,s.centers);s.phase='update'}else{s.centers=moveCenters(clusterPoints,s.centers,s.labels);s.phase='assign';s.steps++}}}
};

// ---- Gradient descent on L = (w − 3)²: click the curve to choose the start ----
const GX=x=>40+(x+1)*45,GY=x=>305-(x-3)**2*16;
const step=s=>{const w=s.history.at(-1);if(Math.abs(w)<=20&&s.history.length<100)s.history.push(w-s.eta*2*(w-3))};
export const gradientDefinition={
 initial:()=>({eta:.15,history:[0]}),
 controls:[range('eta','Learning rate η',.05,1.2,.05)],
 pointer(s,p){s.history=[clamp(snap((p.x-40)/45-1,.05),-1,7)]},
 describe:s=>{const w=s.history.at(-1);return `Start w ${fmt(s.history[0],2)}; after ${s.history.length-1} step(s) w = ${fmt(w,5)}, loss ${fmt((w-3)**2,5)}.`},
 render(s){
  const w=s.history.at(-1),slope=2*(w-3),visible=s.history.filter(x=>x>=-1&&x<=7);
  const curve=`<path d="${Array.from({length:81},(_,i)=>{const x=-1+i*.1;return `${i?'L':'M'}${GX(x)},${GY(x)}`}).join(' ')}" fill="none" stroke="#670875" stroke-width="2"/>`;
  const trail=visible.slice(1).map((x,i)=>line(GX(visible[i]),GY(visible[i]),GX(x),GY(x),'stroke="#ce754d" stroke-width="1.5" stroke-dasharray="4 3"')).join('');
  const marks=visible.map((x,i)=>dot(GX(x),GY(x),i===visible.length-1?'#222':'#ce754d',i===visible.length-1?7:4,`Step ${i}: w = ${fmt(x,4)}, L = ${fmt((x-3)**2,4)}`)).join('');
  const tangent=Math.abs(w-3)<=4?(()=>{const dx=45,dy=-slope*16;const n=Math.hypot(dx,dy)/40;return line(GX(w)-dx/n,GY(w)-dy/n,GX(w)+dx/n,GY(w)+dy/n,'stroke="#347ca3" stroke-width="2"')})():'';
  return hint('Click or drag along the curve to choose the starting w, then take steps. The η slider sets the step size.')+
   chart([0,1,2,3,4,5,6,7].filter(v=>v>=-1).map(v=>grid(GX(v),40,GX(v),305)+text(GX(v)-3,325,v)).join('')+grid(GX(-1),305,GX(7),305)+line(GX(3),50,GX(3),305,'stroke="#bbb" stroke-dasharray="3 4"')+curve+trail+tangent+marks+text(GX(3)+6,62,'minimum at w = 3')+text(GX(-1),30,'L = (w − 3)²')+text(GX(7)+12,325,'w'),`Quadratic loss curve with ${visible.length} descent point(s); the blue segment is the tangent at the current w`)+
   summary(`<strong>w = ${fmt(w,5)}</strong> <span>L = ${fmt((w-3)**2,5)} · gradient 2(w − 3) = ${fmt(slope)}</span> ${goal((w-3)**2<.001,Math.abs(w)>20?'Diverged: |w| > 20, updates stopped':(w-3)**2<.001?`Goal reached: L < 0.001 after ${s.history.length-1} step${s.history.length===2?'':'s'}`:'Goal: L < 0.001')}`)+
   `<div class="plot-actions">${button('step','Take one step')}${button('five','Take five steps')}</div>`+
   `<p>The tangent's slope is the gradient; the step moves w by −η × gradient, so a steeper slope means a longer step. For this loss: 0 &lt; η &lt; 1 converges; η = 1 oscillates from w = 0; η &gt; 1 diverges. Updates stop if |w| &gt; 20 or after 99 steps. Points outside the drawn range are listed below but not plotted.</p>`+
   table(['Recent w','Loss'],s.history.slice(-8).map(v=>[fmt(v,5),fmt((v-3)**2,5)]));
 },
 action(s,a){if(a==='step')step(s);if(a==='five')for(let i=0;i<5;i++)step(s)}
};

// ---- SVM: slide the boundary near the line, rotate it farther away ----
export const marginPoints=[[-2,1,-1],[-1,-1,-1],[-2,-2,-1],[1,1,1],[2,-1,1],[2,2,1]];
const SX=x=>220+x*48,SY=y=>170-y*48;
export const svmDefinition={
 initial:()=>({angle:0,offset:0,scale:.5,C:1,reference:false}),
 controls:[range('angle','Normal angle (degrees)',-90,90,.001),range('offset','Boundary offset',-3,3,.05),range('scale','Weight length ‖w‖',.1,3,.000001),range('C','Penalty C',.05,3,.05)],
 change(s){s.reference=false},
 pointer(s,p){
  const ux=(p.x-220)/48,uy=(170-p.y)/48,rad=s.angle*Math.PI/180,n=[Math.cos(rad),Math.sin(rad)],projection=ux*n[0]+uy*n[1];
  if(Math.abs(clamp(projection,-3,3)-s.offset)<=.75)s.offset=clamp(snap(projection,.05),-3,3);
  else{let a=Math.atan2(uy,ux)*180/Math.PI;if(a>90)a-=180;if(a<=-90)a+=180;s.angle=clamp(snap(a,.1),-90,90)}
  s.reference=false;
 },
 describe(s){const rad=s.angle*Math.PI/180,r=marginScores(marginPoints,[Math.cos(rad)*s.scale,Math.sin(rad)*s.scale],-s.scale*s.offset,s.C);return `Angle ${fmt(s.angle,1)} degrees, offset ${fmt(s.offset,2)}. Smallest signed margin ${fmt(r.minMargin,3)}; objective ${fmt(r.objective,4)}; ${r.rows.filter(row=>row.signed<1-1e-10).length} point(s) inside the band or misclassified.`},
 render(s){
  const rad=s.angle*Math.PI/180,n=[Math.cos(rad),Math.sin(rad)],w=n.map(v=>v*s.scale),b=-s.scale*s.offset,r=marginScores(marginPoints,w,b,s.C),center=n.map(v=>v*s.offset),tip=n.map(v=>v*(s.offset+1));
  const boundary=(distance,color,dashed=false)=>{const c=n.map(v=>v*distance),t=[-n[1],n[0]];return line(SX(c[0]-8*t[0]),SY(c[1]-8*t[1]),SX(c[0]+8*t[0]),SY(c[1]+8*t[1]),`stroke="${color}" stroke-width="2" ${dashed?'stroke-dasharray="6 5"':''}`)};
  const normal=`<g data-handle="angle">${line(SX(center[0]),SY(center[1]),SX(tip[0]),SY(tip[1]),'stroke="#222" stroke-width="2"')}<circle cx="${SX(tip[0])}" cy="${SY(tip[1])}" r="9" fill="white" stroke="#222" stroke-width="2"/><title>Normal direction w. Drag away from the line to rotate.</title></g>`;
  return `<p>Use f(x) = w₁x₁ + w₂x₂ + b. Predict class +1 when f(x) &gt; 0, −1 when f(x) &lt; 0. A point at f(x) = 0 is a boundary tie. The normal w is perpendicular to the boundary; its angle is counterclockwise from +x₁. Rotate or move the boundary, then change weight length without moving it.</p>`+
   hint('Drag near the black line to slide it along its normal; drag farther away (for example the arrow tip) to rotate the normal around the origin. Angle and offset sliders do the same.')+
   chart(`<defs><clipPath id="margin-clip"><rect x="28" y="20" width="384" height="288"/></clipPath></defs>`+[-4,-2,2,4].map(v=>grid(SX(v),22,SX(v),318)).join('')+[-3,-2,-1,1,2,3].map(v=>grid(28,SY(v),412,SY(v))).join('')+line(SX(-4),SY(0),SX(4),SY(0),'stroke="#bbb"')+line(SX(0),SY(-3),SX(0),SY(3),'stroke="#bbb"')+text(SX(3.65),SY(0)+18,'x₁')+text(SX(0)+8,SY(2.8),'x₂')+`<g clip-path="url(#margin-clip)">${boundary(s.offset,'#222')}${boundary(s.offset+1/s.scale,colors[1],true)}${boundary(s.offset-1/s.scale,colors[0],true)}${normal}${marginPoints.map(([x,y,label],i)=>{const row=r.rows[i],support=Math.abs(row.signed-1)<1e-6,wrong=row.signed<0;return (support?`<circle cx="${SX(x)}" cy="${SY(y)}" r="11" fill="none" stroke="#222" stroke-width="2" data-support="${i+1}"/>`:'')+dot(SX(x),SY(y),label===1?colors[1]:colors[0],6,`Point ${i+1} (${x}, ${y}), class ${label===1?'+1':'−1'}: f = ${fmt(row.score,3)}, hinge ${fmt(row.hinge,3)}${support?' (support vector: y f = 1)':wrong?' (misclassified)':''}`)+(wrong?`<path d="M${SX(x)-5} ${SY(y)-5}l10 10m-10 0l10 -10" stroke="#fff" stroke-width="2" data-wrong="${i+1}"/>`:'')+text(SX(x)+9,SY(y)-8,`${i+1} (${label===1?'+':'−'})`)}).join('')}</g>`,'Labeled classes on either side of a black decision boundary; dashed lines mark scores plus and minus one; a short arrow shows the normal direction')+
   legend([['<i class="legend-dot"></i>','class −1'],['<i class="legend-dot" style="background:#ce754d"></i>','class +1'],['◯','support vector (y f = 1)'],['✕','misclassified'],['→','normal w (drag tip to rotate)']])+
   `<p>Black: f = 0. Dashed: f = −1 and +1. A dashed line outside the plotting window is clipped, not removed.</p>`+
   summary(`<strong>${r.rows.every(row=>row.signed>=1-1e-10)?'Hard margin holds':`${r.rows.filter(row=>row.signed<1-1e-10).length} point(s) violate y f ≥ 1`}</strong> <span>objective ½‖w‖² + C Σ hinge = ${fmt(r.objective,5)}</span> ${goal(r.rows.every(row=>row.signed>=1-1e-10)&&r.minMargin>=3/Math.sqrt(5)-.01,r.rows.every(row=>row.signed>=1-1e-10)?(r.minMargin>=3/Math.sqrt(5)-.01?`Goal reached: geometric margin ${fmt(r.minMargin,3)} matches the widest possible`:`Separates, but margin ${fmt(r.minMargin,3)} < 1.342: rotate or shift for more room`):'Goal: separate all points with y f ≥ 1, then maximize the margin')}`)+
   table(['Parameters','Value'],[['w',`[${w.map(x=>fmt(x,4)).join(', ')}]`],['b',fmt(b,4)],['Smallest signed geometric margin',fmt(r.minMargin,4)],['Width between f = −1 and +1',fmt(r.bandWidth,4)]])+
   table(['Point / class','Score f','y × f','Signed distance','Hinge'],r.rows.map((row,i)=>[`${i+1} / ${marginPoints[i][2]}`,fmt(row.score,4),fmt(row.signed,4),fmt(row.distance,4),fmt(row.hinge,4)]))+
   table(['Objective term','Value'],[['½‖w‖²',fmt(r.penalty,5)],['Σ max(0, 1 − y f)',fmt(r.hinge,5)],['½‖w‖² + C Σ hinge',fmt(r.objective,5)]])+
   `<p>${r.rows.every(row=>row.signed>=1-1e-10)?'All points meet y f ≥ 1: the canonical band is a valid hard margin here.':'Some points have y f < 1: the dashed band is not an empty hard margin. A point may be correctly classified and still have hinge loss.'}</p>`+
   button('reference','Set hard-margin reference')+(s.reference?'<p class="info-note">For these fixed points, w = [2/3, 1/3], b = 0 is a hard-margin solution. Its band width is 6/√5 ≈ 2.6833. This reference need not minimize the soft-margin objective at small C.</p>':'')+
   `<p><strong>Try:</strong> hold angle and offset fixed and increase ‖w‖. Predictions and geometric distances stay unchanged, but the canonical band narrows and hinge losses change. Lower C to see why accepting violations can cost less than a large weight penalty. This evaluates chosen parameters; it does not train an SVM.</p>`;
 },
 action(s,a){if(a==='reference')Object.assign(s,{angle:Math.atan2(1,2)*180/Math.PI,offset:0,scale:Math.sqrt(5)/3,reference:true})}
};

// ---- Sinusoidal positional encoding: click a position on the curves ----
const PX=p=>40+p*18,PY=v=>155-v*105;
const positionPaths=Array.from({length:4},(_,d)=>Array.from({length:81},(_,i)=>{const p=i/4;return `${i?'L':'M'}${PX(p)},${PY(sinusoidalPosition(p)[d])}`}).join(' '));
export const positionsDefinition={
 initial:()=>({p:1,kind:'Sinusoidal',e0:1,e1:2,e2:3,e3:4}),
 controls:[range('p','Token position p (zero-based)',0,20),select('kind','Position signal',['Sinusoidal','None']),...[0,1,2,3].map(d=>range('e'+d,`Embedding E[${d}]`,-4,4,.1))],
 pointer(s,p){s.p=clamp(Math.round((p.x-40)/18),0,20)},
 describe:s=>{const pe=s.kind==='None'?[0,0,0,0]:sinusoidalPosition(s.p);return `Position ${s.p}. PE = [${pe.map(v=>fmt(v,3)).join(', ')}]. Combined vector [${[s.e0,s.e1,s.e2,s.e3].map((v,i)=>fmt(v+pe[i],3)).join(', ')}].`},
 render(s){
  const E=[s.e0,s.e1,s.e2,s.e3],pe=s.kind==='None'?[0,0,0,0]:sinusoidalPosition(s.p),out=E.map((v,i)=>v+pe[i]);
  return `<p>Fixed width d_model = 4. E is the token vector <em>after any embedding scaling</em>; these four coordinates are editable teaching values, not a trained embedding.</p>`+
   hint('Click or drag along the curves to choose the token position p. The position slider does the same.')+
   chart([0,5,10,15,20].map(v=>grid(PX(v),35,PX(v),275)+text(PX(v)-3,290,v)).join('')+grid(40,PY(.5),400,PY(.5))+grid(40,PY(-.5),400,PY(-.5))+line(40,155,410,155,'stroke="#bbb"')+line(40,40,40,270,'stroke="#bbb"')+text(14,54,'+1')+text(22,159,'0')+text(14,264,'−1')+text(150,318,'Token position p')+(s.kind==='None'?line(40,155,400,155,`stroke="${colors[0]}" stroke-width="2"`):positionPaths.map((path,d)=>`<path d="${path}" stroke="${colors[d]}" fill="none" stroke-width="2"/>`).join(''))+line(PX(s.p),35,PX(s.p),275,'stroke="#444" stroke-dasharray="3 4"')+pe.map((v,d)=>dot(PX(s.p),PY(v),colors[d],5,`PE(${s.p})[${d}] = ${fmt(v,5)}`)).join('')+text(PX(s.p)+5,44,`p = ${s.p}`),`Four position coordinates over positions zero to twenty, with position ${s.p} marked`)+
   `<p>Purple: sin(p). Orange: cos(p). Blue: sin(p/100). Gold: cos(p/100). The second pair changes more slowly; curves are drawn continuously for readability, but token positions here are integers.</p>`+
   `<p><strong>Combined vector:</strong> [${out.map(v=>fmt(v,5)).join(', ')}]. With sinusoidal encoding, PE(0) = [0, 1, 0, 1], not a zero vector.</p>`+
   table(['Channel','Signal (radians)','PE(p)'],pe.map((v,i)=>[i,['sin(p)','cos(p)','sin(p/100)','cos(p/100)'][i]+(s.kind==='None'?' → disabled':''),fmt(v,5)]))+
   table(['Channel','E','+ PE(p)','Result'],pe.map((v,i)=>[i,fmt(E[i]),fmt(v,5),fmt(out[i],5)]))+
   `<div class="plot-actions">${button('zero','Compare position 0')}${button('one','Compare position 1')}</div>`+
   `<p><strong>Try:</strong> keep E fixed, compare positions 0 and 1, then choose “None.” The same token at two positions can receive different input vectors with a position signal; without it, both vectors are identical. This arithmetic alone does not measure language-model accuracy. Sinusoidal encoding is the original Transformer's method; other architectures can use different positional mechanisms.</p>`;
 },
 action(s,a){if(a==='zero')s.p=0;if(a==='one')s.p=1}
};

// ---- DBSCAN on a line: click a point to inspect it; drag the ruler to set ε ----
export const densityPoints=[0,.2,.4,1.4,2.4,2.6,2.8,5],densityNames='ABCDEFGH'.split('');
const DX=v=>65+60*v;
export const dbscanDefinition={
 initial:()=>({eps:1,minPts:4,point:'C',order:'Left core cluster first'}),
 controls:[range('eps','Neighborhood radius ε',.1,2,.05),range('minPts','MinPts (includes the point itself)',2,6),select('point','Inspect point',densityNames),select('order','Core expansion order',['Left core cluster first','Right core cluster first'])],
 pointer(s,p){
  if(p.y>=212&&p.y<=250){s.eps=clamp(snap(Math.abs((p.x-65)/60-densityPoints[densityNames.indexOf(s.point)]),.05),.1,2);return}
  if(p.y<125||p.y>210)return;
  let best=-1,distance=Infinity;densityPoints.forEach((v,j)=>{const d=Math.abs(DX(v)-p.x);if(d<distance){distance=d;best=j}});
  if(distance<=24)s.point=densityNames[best];
 },
 describe(s){const r=dbscan1D(densityPoints,s.eps,s.minPts,s.order==='Right core cluster first'),i=densityNames.indexOf(s.point);return `${r.count} cluster(s) at radius ${fmt(s.eps,2)}, MinPts ${s.minPts}. ${s.point} has ${r.neighbors[i].length} neighbors and is ${r.types[i].toLowerCase()}${r.labels[i]>=0?` in cluster ${r.labels[i]+1}`:''}.`},
 render(s){
  const r=dbscan1D(densityPoints,s.eps,s.minPts,s.order==='Right core cluster first'),i=densityNames.indexOf(s.point),x=densityPoints[i],neighbor=new Set(r.neighbors[i]);
  const marks=densityPoints.map((v,j)=>{const color=r.labels[j]<0?'#666':colors[r.labels[j]%colors.length],cx=DX(v),cy=165,title=`${densityNames[j]} (x = ${v}): ${r.types[j]}${r.labels[j]>=0?`, cluster ${r.labels[j]+1}`:''}, ${r.neighbors[j].length} neighbors`;
   const shape=r.types[j]==='Noise'?`<path d="M${cx-5} ${cy-5}l10 10m-10 0l10 -10" stroke="${color}" stroke-width="2"/>`:`<circle cx="${cx}" cy="${cy}" r="${r.core[j]?7:5}" fill="${r.core[j]?color:'#fff'}" stroke="${color}" stroke-width="2"/>`;
   return `<g data-point="${densityNames[j]}">${i===j?`<circle cx="${cx}" cy="${cy}" r="11" fill="none" stroke="#222"/>`:''}<circle cx="${cx}" cy="${cy}" r="14" fill="transparent"/>${shape}<title>${esc(title)}</title></g>`+text(cx-4,j%2?194:140,densityNames[j]);
  }).join('');
  return `<p><strong>${r.count} core-connected cluster(s).</strong> Core ${r.core.filter(Boolean).length}; border ${r.types.filter(v=>v==='Border').length}; noise ${r.types.filter(v=>v==='Noise').length}. Every point lies on the same one-dimensional axis.</p>`+
   hint(`Click a point to inspect it. Drag along the ruler below the axis to set ε as a distance from ${s.point}. The sliders and menus do the same.`)+
   chart(`<defs><clipPath id="density-clip"><rect x="20" y="100" width="400" height="115"/></clipPath></defs><g clip-path="url(#density-clip)"><rect x="${DX(x-s.eps)}" y="151" width="${120*s.eps}" height="28" fill="#e9ddee"/>${line(20,165,420,165,'stroke="#aaa"')}${marks}</g><rect x="20" y="212" width="400" height="38" fill="#f7f2f8"/>${[0,1,2,3,4,5].map(v=>line(DX(v),215,DX(v),221,'stroke="#888"')+text(DX(v)-3,240,v)).join('')}${line(DX(x),212,DX(x),250,'stroke="#222" stroke-dasharray="2 3"')}${line(DX(x+s.eps),212,DX(x+s.eps),250,`stroke="${colors[0]}" stroke-width="2"`)}${text(55,285,`Shaded interval: ${fmt(x-s.eps)} ≤ x ≤ ${fmt(x+s.eps)}`)}`,`One-dimensional DBSCAN points; ${s.point}'s neighborhood of radius ${fmt(s.eps,2)} is shaded`,'0 115 440 190')+
   `<p>Filled circle = core; hollow circle = border; × = noise. Color and the table identify cluster membership. The black ring marks the inspected point; the purple ruler tick marks x + ε. Cluster IDs stay tied to the core components when expansion order changes.</p>`+
   table(['Point (x)','Neighborhood, including self','Role · cluster'],densityPoints.map((v,j)=>[`${densityNames[j]} (${v})`,`${r.neighbors[j].map(k=>densityNames[k]).join(', ')} (${r.neighbors[j].length})`,`${r.types[j]}${r.labels[j]<0?'':` · ${r.labels[j]+1}`}`]))+
   `<h3>Inspect ${s.point}: count before classifying</h3><p>Its ${r.neighbors[i].length} neighbors ${r.core[i]?'meet':'do not meet'} MinPts = ${s.minPts}. ${!r.core[i]&&r.candidates[i].length?`Adjacent core-cluster IDs: ${r.candidates[i].map(c=>c+1).join(', ')}.`:''}</p>`+
   table(['Point','Distance from '+s.point,'Within ε?'],densityPoints.map((v,j)=>[densityNames[j],fmt(Math.abs(v-x)),neighbor.has(j)?'Yes':'No']))+
   `<p><strong>Try:</strong> reset, inspect D, then reverse core expansion order. D has three neighbors and is a border of both clusters. Only its assigned cluster changes; a border point does not extend a core-connected path. Now lower MinPts to 3: D becomes core and joins the two groups. H remains isolated at the default radius.</p><p>Distance ≤ ε counts, including the point itself. This tiny example explains connectivity; it does not demonstrate discovery of real classes or reliable parameters for high-dimensional data.</p>`;
 }
};
