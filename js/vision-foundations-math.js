// Declared teaching fixtures: no pretrained recognizer, hidden data or fabricated scores.
export const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
export function scene(ballX=18){
 const objects=[{id:1,name:'blue cup',kind:'cup',color:'#4484ba',x:5,y:9},{id:2,name:'yellow cup',kind:'cup',color:'#d8b43b',x:12,y:9},{id:3,name:'pink cup',kind:'cup',color:'#ca789e',x:19,y:9},{id:4,name:'red ball',kind:'ball',color:'#ba4845',x:ballX,y:14}];
 const mask=Array.from({length:18},(_,y)=>Array.from({length:24},(_,x)=>{let id=0;for(const o of objects){if(o.kind==='cup'?(y>=6&&y<=11&&Math.abs(x-o.x)<=2):(x-o.x)**2+(y-o.y)**2<=4)id=o.id;}return id}));
 const rows=objects.map(o=>{const cells=[];mask.forEach((r,y)=>r.forEach((id,x)=>{if(id===o.id)cells.push([x,y])}));return {...o,pixels:cells.length,box:cells.length?[Math.min(...cells.map(p=>p[0])),Math.min(...cells.map(p=>p[1])),Math.max(...cells.map(p=>p[0]))+1,Math.max(...cells.map(p=>p[1]))+1]:null}});
 return {objects:rows,mask};
}
export function refer(scene,query){
 if(query==='All cups')return {ids:[1,2,3],text:'Three cup instances'};
 if(query==='Yellow cup')return {ids:[2],text:'Cup instance 2'};
 const ball=scene.objects[3],ds=scene.objects.slice(0,3).map(o=>({id:o.id,d:(o.x-ball.x)**2+(o.y-ball.y)**2})),min=Math.min(...ds.map(d=>d.d)),ids=ds.filter(d=>Math.abs(d.d-min)<1e-10).map(d=>d.id);
 return {ids,text:ids.length===1?'Cup instance '+ids[0]:'Ambiguous: equally near cups '+ids.join(' and '),distances:ds.map(d=>Math.sqrt(d.d))};
}
export function project(point,{height=3,distance=6,pitch=30,focal=120}={}){
 const a=pitch*Math.PI/180,[X,Y,Z]=point,cam=[X,Math.cos(a)*(Y-height)+Math.sin(a)*(Z+distance),-Math.sin(a)*(Y-height)+Math.cos(a)*(Z+distance)];
 return {cam,uv:cam[2]>0?[220+focal*cam[0]/cam[2],155-focal*cam[1]/cam[2]]:null};
}
export function stereo(f,b,z){const disparity=f*b/z;return {disparity,recovered:f*b/disparity};}
export function glyph(kind='Vertical',position=3,frame=.1,brightness=1,occlusion=0){return Array.from({length:8},(_,y)=>Array.from({length:8},(_,x)=>{const border=x===0||y===0||x===7||y===7;let value=border?frame:.2;if(!border&&(kind==='Vertical'?x===position:y===position))value=.8;if(!border&&x>=3&&x<3+occlusion&&y>=2&&y<=5)value=.2;return clamp(value*brightness)}));}
export function features(p){let dx=0,dy=0,border=0,n=0;for(let y=1;y<=6;y++)for(let x=1;x<=5;x++)dx+=Math.abs(p[y][x+1]-p[y][x]);for(let y=1;y<=5;y++)for(let x=1;x<=6;x++)dy+=Math.abs(p[y+1][x]-p[y][x]);for(let y=0;y<8;y++)for(let x=0;x<8;x++)if(x===0||y===0||x===7||y===7){border+=p[y][x];n++;}return [1,dx/30,dy/30,(border/n-.5)/.4];}
export function domain(name='A'){return ['Vertical','Horizontal'].flatMap((kind,y)=>[2,3,4,5].map(position=>{const frame=(name==='A'?y:1-y)? .9:.1,pixels=glyph(kind,position,frame);return {kind,y,position,frame,pixels,x:features(pixels)}}));}
export const sigmoid=z=>z>=0?1/(1+Math.exp(-z)):Math.exp(z)/(1+Math.exp(z));
export function predict(w,x){const terms=w.map((v,j)=>v*x[j]),logit=terms.reduce((a,b)=>a+b,0);return {terms,logit,p:sigmoid(logit)};}
export function batch(w,data){let loss=0,correct=0;const gradient=[0,0,0,0],confusion=[[0,0],[0,0]],rows=data.map(row=>{const r=predict(w,row.x),choice=r.p>=.5?1:0;loss+=Math.max(r.logit,0)-row.y*r.logit+Math.log1p(Math.exp(-Math.abs(r.logit)));r.terms.forEach((_,j)=>gradient[j]+=(r.p-row.y)*row.x[j]/data.length);correct+=choice===row.y;confusion[row.y][choice]++;return {...row,...r,choice}});return {loss:loss/data.length,accuracy:correct/data.length,gradient,confusion,rows};}
export function mixedBatch(w,replay){const a=batch(w,domain('A')),b=batch(w,domain('B'));return {loss:replay*a.loss+(1-replay)*b.loss,gradient:a.gradient.map((v,j)=>replay*v+(1-replay)*b.gradient[j])};}
export const featureNames=['Bias','Horizontal neighbor contrast','Vertical neighbor contrast','Normalized border brightness'];
export function haze(clean,t,air,noise=0){const observed=clean.map((v,i)=>t*v+(1-t)*air+noise*(i%2?1:-1));return {observed};}
export function restore(observed,t,air){return observed.map(v=>(v-(1-t)*air)/t);}
export const cleanColors=[[.12,.35,.68],[.72,.28,.15],[.25,.62,.3],[.86,.78,.4]];
export const catContour=[[30,130],[40,100],[43,65],[52,20],[71,56],[95,51],[119,18],[126,61],[137,81],[131,101],[118,111],[116,148],[142,153],[155,147],[178,113],[199,117],[206,135],[202,160],[194,181],[208,185],[223,172],[228,149],[237,136],[246,140],[245,163],[235,190],[215,205],[178,208],[137,205],[105,211],[70,208],[42,188],[30,160],[30,130]];
const distanceToSegment=(p,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],den=dx*dx+dy*dy,t=den?clamp(((p[0]-a[0])*dx+(p[1]-a[1])*dy)/den):0;return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy)};
export function simplify(points,tolerance){if(points.length<3)return points;let max=0,index=0;for(let i=1;i<points.length-1;i++){const d=distanceToSegment(points[i],points[0],points.at(-1));if(d>max){max=d;index=i}}return max>tolerance?[...simplify(points.slice(0,index+1),tolerance).slice(0,-1),...simplify(points.slice(index),tolerance)]:[points[0],points.at(-1)];}
export function contourError(points,reduced){return Math.max(...points.map(p=>Math.min(...reduced.slice(1).map((b,i)=>distanceToSegment(p,reduced[i],b)))));}
export const gridSize=6,start=[1,4],goal=[4,1],baseWalls=[[2,2],[2,3],[3,2]];
export const neighbors=([x,y])=>[[x+1,y],[x,y-1],[x-1,y],[x,y+1]].filter(([a,b])=>a>=0&&a<gridSize&&b>=0&&b<gridSize);
export const cellKey=p=>p.join(',');
export function navigationInitial(){return {pose:[...start],known:Array.from({length:6},()=>Array(6).fill(-1)),walls:baseWalls.map(p=>[...p]),path:[],phase:'Observe',moves:0,log:[],done:false};}
export function observe(nav,range=1){const [px,py]=nav.pose;for(let y=0;y<6;y++)for(let x=0;x<6;x++){if(Math.abs(x-px)+Math.abs(y-py)>range)continue; // Cardinal rays plus directly adjacent cells; no seeing through obstacles.
 let visible=true;if(x!==px&&y!==py)continue;const dx=Math.sign(x-px),dy=Math.sign(y-py),steps=Math.max(Math.abs(x-px),Math.abs(y-py));for(let i=1;i<steps;i++)if(nav.walls.some(p=>p[0]===px+i*dx&&p[1]===py+i*dy))visible=false;
 if(visible)nav.known[y][x]=nav.walls.some(p=>p[0]===x&&p[1]===y)?1:0;
 }nav.known[py][px]=0;nav.log.push({phase:'Observe',detail:`Sensor updated from (${px},${py}), cardinal range ${range}.`});nav.phase='Plan';}
export function plan(nav,optimistic=true){const queue=[[nav.pose]],seen=new Set([cellKey(nav.pose)]);let path=[];while(queue.length){const candidate=queue.shift(),p=candidate.at(-1);if(cellKey(p)===cellKey(goal)){path=candidate;break}for(const q of neighbors(p)){const value=nav.known[q[1]][q[0]],k=cellKey(q);if(!seen.has(k)&&(value===0||(optimistic&&value===-1))){seen.add(k);queue.push([...candidate,q])}}}nav.path=path;nav.log.push({phase:'Plan',detail:path.length?`BFS planned ${path.length-1} steps; ${optimistic?'unknown treated as traversable':'known free only'}.`:'No goal route under current map policy.'});nav.phase='Act';}
export function act(nav){if(cellKey(nav.pose)===cellKey(goal)){nav.done=true;nav.log.push({phase:'Act',detail:'Goal reached.'});return}const next=nav.path[1];if(!next){nav.log.push({phase:'Act',detail:'No movement: no planned route.'});nav.phase='Observe';return}if(nav.known[next[1]][next[0]]!==0||nav.walls.some(p=>cellKey(p)===cellKey(next))){nav.log.push({phase:'Act',detail:'Blocked: next cell is not observed free. Re-observe and replan.'});nav.phase='Observe';return}nav.pose=[...next];nav.moves++;nav.log.push({phase:'Act',detail:`Moved to (${next}); pose and map are separate state.`});nav.path=[];nav.phase='Observe';if(cellKey(nav.pose)===cellKey(goal))nav.done=true;}
export function navigationStep(nav,range=1,optimistic=true){if(nav.done)return;if(nav.phase==='Observe')observe(nav,range);else if(nav.phase==='Plan')plan(nav,optimistic);else act(nav);}
