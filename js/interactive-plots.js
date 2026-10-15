import {esc,fmt,table} from './render.js';
import {nearestNeighbors,projectPCA,iou,convolve} from './math.js';

const purple='#670875',orange='#bb592c';
const range=(id,label,min,max,step=1)=>({id,label,min,max,step,type:'range'});
const button=(id,label)=>`<button type="button" class="button subtle small" data-lab-action="${id}">${label}</button>`;
const label=(x,y,value,anchor='middle')=>`<text x="${x}" y="${y}" text-anchor="${anchor}">${esc(value)}</text>`;
const line=(x1,y1,x2,y2,extra='')=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${extra}/>`;
const chart=(body,name,interactive=true)=>`<svg class="explore-plot" ${interactive?'data-plot':''} viewBox="0 0 400 360" role="img" aria-label="${esc(name)}">${body}</svg>`;
const summary=(text)=>`<p class="plot-summary">${text}</p>`;
const hint=text=>`<p class="plot-hint">${text}</p>`;
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const rounded=v=>Math.round(v*10)/10;
const X=x=>52+x*36,Y=y=>312-y*36;
const axes=()=>[0,2,4,6,8].map(v=>line(X(v),Y(0),X(v),Y(8),'class="plot-grid"')+line(X(0),Y(v),X(8),Y(v),'class="plot-grid"')+label(X(v),336,v)+label(32,Y(v)+5,v)).join('')+label(360,336,'x')+label(52,16,'y','start');
const xyPointer=(s,p,max=8)=>{s.x=rounded(clamp((p.x-52)/36,0,max));s.y=rounded(clamp((312-p.y)/36,0,max));};
export const neighborPoints=[[1,1,'A'],[2,2,'A'],[3,1,'A'],[5,5,'B'],[6,4,'B'],[7,6,'B']];
export const projectionPoints=[[1,1],[2,2.5],[3,2],[4,4.5],[5,4],[6,6]];

export const knnDefinition={
 initial:()=>({x:4,y:3,k:3,scale:1}),
 controls:[range('x','Query x',0,8,.1),range('y','Query y',0,8,.1),range('k','Neighbors k',1,6),range('scale','x feature scale',.1,4,.1)],
 pointer:xyPointer,
 describe:s=>`Query (${s.x}, ${s.y}). Predicted class ${nearestNeighbors(neighborPoints,[s.x,s.y],s.k,s.scale).label}.`,
 render(s){
  const r=nearestNeighbors(neighborPoints,[s.x,s.y],s.k,s.scale),selected=new Set(r.neighbors.map(n=>n.index)),radius=r.neighbors.at(-1).distance;
  const regions=Array.from({length:256},(_,i)=>{const x=i%16/2,y=Math.floor(i/16)/2,c=nearestNeighbors(neighborPoints,[x+.25,y+.25],s.k,s.scale).label;return `<rect x="${X(x)}" y="${Y(y+.5)}" width="18.1" height="18.1" fill="${c==='A'?purple:orange}" opacity=".07"/>`}).join('');
  const links=r.neighbors.map(n=>line(X(s.x),Y(s.y),X(neighborPoints[n.index][0]),Y(neighborPoints[n.index][1]),'class="neighbor-link"')).join('');
  const marks=neighborPoints.map(([x,y,c],i)=>`${selected.has(i)?`<circle cx="${X(x)}" cy="${Y(y)}" r="12" class="neighbor-ring"/>`:''}${c==='A'?`<circle cx="${X(x)}" cy="${Y(y)}" r="6" fill="${purple}"/>`:`<rect x="${X(x)-6}" y="${Y(y)-6}" width="12" height="12" fill="${orange}"/>`}${label(X(x)+12,Y(y)-14,`${i+1}${c}`)}`).join('');
  return hint('Drag or tap the plot to move the query. The x and y sliders do the same thing.')+
   chart(`<defs><clipPath id="knn-field"><rect x="52" y="24" width="288" height="288"/></clipPath></defs>${regions}${axes()}<g clip-path="url(#knn-field)"><ellipse cx="${X(s.x)}" cy="${Y(s.y)}" rx="${radius/s.scale*36}" ry="${radius*36}" class="neighbor-radius"/>${links}</g>${marks}<g class="query-mark"><circle cx="${X(s.x)}" cy="${Y(s.y)}" r="12" fill="white" stroke="#272329" stroke-width="2"/>${line(X(s.x)-7,Y(s.y),X(s.x)+7,Y(s.y))}${line(X(s.x),Y(s.y)-7,X(s.x),Y(s.y)+7)}</g>`,`kNN query (${s.x}, ${s.y}), predicted ${r.label}. Lines connect the ${s.k} nearest neighbors.`)+
   summary(`Prediction <strong>${r.label}</strong> <span>A: ${r.votes.A||0} votes · B: ${r.votes.B||0} votes</span>`)+
   `<div class="plot-legend"><span><i class="legend-dot"></i> Class A</span><span><i class="legend-square"></i> Class B</span><span>⊕ Query</span></div><p>The dashed ellipse reaches the kth neighbor in the scaled distance. Shading samples the predicted class on a coarse grid; the exact decision boundary can lie between cells.</p>`+
   table(['Rank','Point / class','Scaled distance'],r.neighbors.map((n,i)=>[i+1,`${n.index+1} / ${n.label}`,fmt(n.distance,4)]))+
   `<p>Distance = √[(scale × Δx)² + Δy²]. Axes show original coordinates. Increase the x scale: the neighborhood becomes narrower horizontally.</p><p>Equal distances use point order. Equal votes use the closest neighbor of each tied class, then alphabetical class order. These are this example’s tie rules.</p>`;
 }
};

export const pcaDefinition={
 initial:()=>({angle:0,help:false}),controls:[range('angle','Projection angle (degrees)',0,179)],
 pointer(s,p){const dx=p.x-200,dy=168-p.y;if(Math.hypot(dx,dy)<12)return;s.angle=Math.round((Math.atan2(dy,dx)*180/Math.PI+180)%180)%180;},
 describe:s=>`${s.angle} degrees. ${fmt(projectPCA(projectionPoints,s.angle).fraction*100,1)} percent of variance retained.`,
 render(s){
  const r=projectPCA(projectionPoints,s.angle),px=x=>200+x*34,py=y=>168-y*34;
  const axis=line(px(-4*r.axis[0]),py(-4*r.axis[1]),px(4*r.axis[0]),py(4*r.axis[1]),`stroke="${orange}" stroke-width="3"`);
  const marks=r.centered.map((p,i)=>{const score=r.scores[i],x=score*r.axis[0],y=score*r.axis[1];return line(px(p[0]),py(p[1]),px(x),py(y),'class="projection-drop"')+`<circle cx="${px(p[0])}" cy="${py(p[1])}" r="5" fill="${purple}"/><rect x="${px(x)-4}" y="${py(y)-4}" width="8" height="8" fill="${orange}"/>`;}).join('');
  const axisGrid=[-4,-2,0,2,4].map(v=>line(px(v),32,px(v),304,'class="plot-grid"')+line(64,py(v),336,py(v),'class="plot-grid"')+label(px(v),326,v)+label(44,py(v)+5,v)).join('');
  return hint('Drag the axis handle, or tap anywhere to aim the projection. Use the angle slider with a keyboard.')+
   chart(`${axisGrid}${axis}${marks}<circle cx="${px(4*r.axis[0])}" cy="${py(4*r.axis[1])}" r="11" fill="white" stroke="${orange}" stroke-width="3"/>${label(350,326,'x')}${label(64,18,'y','start')}${label(200,351,'Centered coordinates')}`,`PCA axis at ${s.angle} degrees. ${fmt(r.fraction*100,1)} percent retained. Purple circles are observations; orange squares are projections.`)+
   summary(`<strong>${fmt(r.fraction*100,2)}%</strong> of variance retained <span>Target: 95%</span>`)+
   `<meter class="variance-meter" min="0" max="1" value="${r.fraction}" aria-label="Fraction of variance retained">${fmt(r.fraction*100,2)}%</meter>`+
   `<div class="plot-legend"><span><i class="legend-dot"></i> Centered data</span><span><i class="legend-square"></i> Projection</span></div><p>The handle marks the positive direction. Dashed segments show what the projection discards. Rotate toward the long direction of the data to preserve more spread.</p>`+
   `<div class="plot-actions">${button('best','Reveal principal direction')}${button('apply','Use principal direction')}${button('perpendicular','Rotate 90°')}</div>`+
   (s.help?`<p class="info-note">Exact principal direction: ${fmt(r.optimalAngle,2)}°. The control uses its nearest whole degree. Rotating 180° describes the same axis with opposite score signs.</p>`:'')+
   `<details><summary>Inspect centered coordinates and scores</summary><p>Mean = [${r.mean.map(v=>fmt(v)).join(', ')}]. Unit axis = [${r.axis.map(v=>fmt(v)).join(', ')}]. Projected variance (divide by n) = ${fmt(r.variance,5)}.</p>${table(['Point','Centered x','Centered y','Score'],r.centered.map((p,i)=>[i+1,...p.map(v=>fmt(v)),fmt(r.scores[i],4)]))}</details><p>Comparable feature units are assumed. Centering does not standardize scales; retained variance is not classification accuracy.</p>`;
 },
 action(s,a){if(a==='best')s.help=true;if(a==='apply'){s.angle=Math.round((projectPCA(projectionPoints,s.angle).optimalAngle+180)%180)%180;s.help=true;}if(a==='perpendicular')s.angle=(s.angle+90)%180;}
};

export const iouDefinition={
 initial:()=>({x:3,y:3}),controls:[range('x','Predicted box x',0,6,.1),range('y','Predicted box y',0,6,.1)],
 // Pointer coordinates choose the box center; native controls specify its top-left corner.
 pointer(s,p){s.x=rounded(clamp((p.x-52)/28-2,0,6));s.y=rounded(clamp((p.y-24)/28-2,0,6));},
 describe:s=>`Prediction at (${s.x}, ${s.y}). IoU ${fmt(iou([2,2,4,4],[s.x,s.y,4,4]).value,3)}.`,
 render(s){
  const r=iou([2,2,4,4],[s.x,s.y,4,4]),x=v=>52+v*28,y=v=>24+v*28;
  const left=Math.max(2,s.x),top=Math.max(2,s.y),width=Math.max(0,Math.min(6,s.x+4)-left),height=Math.max(0,Math.min(6,s.y+4)-top);
  const grid=[0,2,4,6,8,10].map(v=>line(x(v),y(0),x(v),y(10),'class="plot-grid"')+line(x(0),y(v),x(10),y(v),'class="plot-grid"')+label(x(v),330,v)+label(32,y(v)+5,v)).join('');
  return hint('Drag or tap to place the center of the prediction box. The sliders move its top-left corner.')+
   chart(`${grid}<rect x="${x(2)}" y="${y(2)}" width="112" height="112" fill="${purple}" fill-opacity=".08" stroke="${purple}" stroke-width="2"/><rect x="${x(s.x)}" y="${y(s.y)}" width="112" height="112" fill="${orange}" fill-opacity=".1" stroke="${orange}" stroke-width="3" stroke-dasharray="8 4"/><rect x="${x(left)}" y="${y(top)}" width="${width*28}" height="${height*28}" fill="${purple}" fill-opacity=".3"/>${label(x(s.x+2),y(s.y+2)+6,'⊕')}${label(355,330,'x')}${label(52,16,'y ↓','start')}`,`Target and prediction boxes. Intersection ${fmt(r.overlap)}, union ${fmt(r.union)}, IoU ${fmt(r.value,3)}.`)+
   summary(`<strong>IoU ${fmt(r.value,3)}</strong> <span>${fmt(r.overlap)} intersection ÷ ${fmt(r.union)} union</span>`)+
   `<div class="plot-legend"><span><i class="legend-dot"></i> Solid: target</span><span><i class="legend-square"></i> Dashed: prediction</span></div><p>The darker region is the intersection. Union counts both boxes, but counts their overlap only once: 16 + 16 − ${fmt(r.overlap)} = ${fmt(r.union)}.</p><div class="plot-actions">${button('align','Perfect overlap')}${button('apart','No overlap')}${button('half','Half-width overlap')}</div><p>Half-width overlap gives IoU ⅓, not ½: intersection is 8 and union is 24. Coordinates increase rightward and downward, as in an image.</p>`;
 },
 action(s,a){if(a==='align')Object.assign(s,{x:2,y:2});if(a==='apart')Object.assign(s,{x:6,y:6});if(a==='half')Object.assign(s,{x:4,y:2});}
};

const originalImage=[[0,0,0,8,8],[0,1,1,8,8],[0,1,2,8,8],[0,1,1,8,8],[0,0,0,8,8]];
const kernels={Mean:[[1/9,1/9,1/9],[1/9,1/9,1/9],[1/9,1/9,1/9]],'Sobel X':[[-1,0,1],[-2,0,2],[-1,0,1]],Sharpen:[[0,-1,0],[-1,5,-1],[0,-1,0]]};
export const convolutionDefinition={
 initial:()=>({kernel:'Mean',x:0,y:0,pixels:originalImage.map(row=>[...row])}),
 controls:[{id:'kernel',label:'Kernel',options:Object.keys(kernels),type:'select'},range('x','Patch column',0,2),range('y','Patch row',0,2)],
 describe:s=>`Output row ${s.y+1}, column ${s.x+1}: ${fmt(convolve(s.pixels.slice(s.y,s.y+3).map(row=>row.slice(s.x,s.x+3)),kernels[s.kernel]),4)}.`,
 render(s){
  const k=kernels[s.kernel],patch=s.pixels.slice(s.y,s.y+3).map(row=>row.slice(s.x,s.x+3));
  const values=Array.from({length:9},(_,i)=>{const y=Math.floor(i/3),x=i%3;return convolve(s.pixels.slice(y,y+3).map(row=>row.slice(x,x+3)),k);}),max=Math.max(1,...values.map(Math.abs));
  return hint('Click input pixels to cycle their intensity (0–8). Select an output cell to inspect its 3 × 3 input patch.')+
   `<div class="filter-maps"><section><h3>1. Input · 5 × 5</h3><div class="pixel-map">${s.pixels.flat().map((v,i)=>{const y=Math.floor(i/5),x=i%5,inside=x>=s.x&&x<s.x+3&&y>=s.y&&y<s.y+3;return `<button type="button" data-lab-action="pixel-${i}" class="${inside?'in-patch':''}" style="--intensity:${v/8}" aria-label="Input row ${y+1} column ${x+1}, intensity ${v}. Increase by 1, wrapping after 8.">${v}</button>`;}).join('')}</div><p>Outlined cells feed the selected output.</p></section><section><h3>2. Kernel · 3 × 3</h3><div class="kernel-map">${k.flat().map(v=>`<span class="${v<0?'negative':v>0?'positive':''}">${s.kernel==='Mean'?'1/9':v}</span>`).join('')}</div><p>Multiply corresponding cells, then add.</p></section><section><h3>3. Output · 3 × 3</h3><div class="matrix feature-map">${values.map((v,i)=>{const y=Math.floor(i/3),x=i%3;return `<button type="button" data-lab-action="cell-${x}-${y}" class="${s.x===x&&s.y===y?'selected':''}" style="--response:${Math.abs(v)/max};--response-color:${v<0?'187,89,44':'103,8,117'}" aria-pressed="${s.x===x&&s.y===y}" aria-label="Inspect output row ${y+1} column ${x+1}, value ${fmt(v)}">${fmt(v,2)}</button>`;}).join('')}</div><p>Purple: positive · orange: negative. Intensity is relative to this output’s largest magnitude.</p></section></div>`+
   summary(`Selected output <strong>${fmt(convolve(patch,k),4)}</strong> <span>Row ${s.y+1} · column ${s.x+1}</span>`)+
   `<div class="plot-actions">${button('next','Next patch')}${button('edge','Vertical edge')}${button('impulse','Single bright pixel')}</div>`+
   `<details class="filter-calculation"><summary>Inspect all nine products</summary>${table(['Pixel','Kernel weight','Product'],patch.flat().map((v,i)=>[v,fmt(k.flat()[i]),fmt(v*k.flat()[i])]))}</details><p>Stride 1, no padding: 5 − 3 + 1 = 3 positions per axis. This uses CNN cross-correlation (no kernel flip). Input values are illustrative intensities, not a photograph.</p>`;
 },
 action(s,a){
  if(a.startsWith('cell-')){const [,x,y]=a.split('-');s.x=+x;s.y=+y;}
  if(a.startsWith('pixel-')){const i=+a.slice(6),y=Math.floor(i/5),x=i%5;s.pixels[y][x]=(s.pixels[y][x]+1)%9;}
  if(a==='next'){const i=(s.y*3+s.x+1)%9;s.x=i%3;s.y=Math.floor(i/3);}
  if(a==='edge')s.pixels=originalImage.map(row=>[...row]);
  if(a==='impulse')s.pixels=Array.from({length:5},(_,y)=>Array.from({length:5},(_,x)=>x===2&&y===2?8:0));
 }
};
