import {esc,fmt,table} from './render.js';

const range=(id,label,min,max,step=.05)=>({id,label,type:'range',min,max,step});
const select=(id,label,options)=>({id,label,type:'select',options});
const check=(id,label)=>({id,label,type:'checkbox'});
const button=(id,label,disabled=false)=>`<button type="button" class="button subtle small" data-lab-action="${id}" ${disabled?'disabled':''}>${label}</button>`;
const svg=(body,label,viewBox='0 0 440 280')=>`<svg class="intro-plot" viewBox="${viewBox}" role="img" aria-label="${esc(label)}"><title>${esc(label)}</title>${body}</svg>`;
const purple='#670875',orange='#b94d08';

// Monotone forward chaining. Every round tests the same old fact set.
export function inferRobot(s,limit=8){
 const rules=[
  ['R1',`front ≥ ${fmt(s.threshold,2)} → front clear`,f=>s.known&&s.front>=s.threshold,'front clear'],
  ['R2',`front < ${fmt(s.threshold,2)} → front blocked`,f=>s.known&&s.front<s.threshold,'front blocked'],
  ['R3',`battery ≥ ${fmt(s.minBattery,2)} → powered`,f=>s.battery>=s.minBattery,'powered'],
  ['R4',`battery < ${fmt(s.minBattery,2)} → stop`,f=>s.battery<s.minBattery,'stop'],
  ['R5','powered AND front clear → advance',f=>f.has('powered')&&f.has('front clear'),'advance'],
  ['R6',`powered AND front blocked AND left ≥ ${fmt(s.threshold,2)} → turn`,f=>s.turnEnabled&&f.has('powered')&&f.has('front blocked')&&s.left>=s.threshold,'turn'],
  ['R7',`powered AND front blocked AND left < ${fmt(s.threshold,2)} → stop`,f=>f.has('powered')&&f.has('front blocked')&&s.left<s.threshold,'stop'],
 ];
 const facts=new Set(),rounds=[];
 for(let i=0;i<limit;i++){
  const firing=rules.filter(r=>r[2](facts)&&!facts.has(r[3]));
  if(!firing.length)break;
  rounds.push({before:[...facts],firing:firing.map(r=>({id:r[0],fact:r[3]}))});
  firing.forEach(r=>facts.add(r[3]));
 }
 return {facts:[...facts],rounds,rules:rules.map(r=>({id:r[0],text:r[1],satisfied:!!r[2](facts),enabled:r[0]!=='R6'||s.turnEnabled})),actions:[...facts].filter(f=>['advance','turn','stop'].includes(f))};
}

export const rulesDefinition={
 initial:()=>({front:.8,left:.8,battery:.6,threshold:.5,minBattery:.2,known:true,turnEnabled:true,round:0}),
 controls:[range('front','Front distance (normalized)',0,1),range('left','Left distance (normalized)',0,1),range('battery','Battery fraction',0,1),range('threshold','Rule: clear-distance threshold',.1,.9),range('minBattery','Rule: minimum battery',.1,.5),check('known','Front sensor available'),check('turnEnabled','Enable the turn rule R6')],
 change(s){s.round=0},
 describe(s){const r=inferRobot(s,s.round);return `After ${s.round} inference rounds: ${r.facts.join(', ')||'no derived facts'}. Action: ${r.actions.join(', ')||'undetermined'}.`},
 render(s){
  const all=inferRobot(s),r=inferRobot(s,s.round),settled=s.round>=all.rounds.length;
  return `<p class="intro-result"><strong data-rule-output>${r.actions.length?esc(r.actions.join(', ')):'Action undetermined'}</strong><span>${s.round} inference round${s.round===1?'':'s'} applied</span></p>`+
   `<div class="intro-facts"><div><h4>Observed information</h4><p>front: ${s.known?fmt(s.front,2):'unknown'} · left: ${fmt(s.left,2)} · battery: ${fmt(s.battery,2)}</p></div><div><h4>Derived facts</h4><p>${r.facts.length?r.facts.map(esc).join(' · '):'None yet. Apply a round.'}</p></div></div>`+
   `<div class="plot-actions">${button('step','Apply one inference round',settled)}${button('run','Run to a fixed point',settled)}</div>`+
   table(['Rule','Condition → conclusion','After the current round'],r.rules.map(rule=>[rule.id,rule.text,!rule.enabled?'Disabled':rule.satisfied?'Premises satisfied':'Premises not established']))+
   (r.rounds.length?`<h4>Inference trace</h4>`+table(['Round','Facts available before','New conclusions'],r.rounds.map((round,i)=>[i+1,round.before.join(', ')||'No derived facts',round.firing.map(f=>f.id+' → '+f.fact).join('; ')])):'')+
   (settled&&!r.actions.length?'<p role="status"><strong>Coverage gap:</strong> no enabled rule establishes an action. Unknown information is not treated as a negative reading.</p>':'')+
   `<p>All rules in one round use the old fact set. A newly derived fact can support another rule in the next round. These are movement permissions in a toy rule base, not a physical robot controller.</p><p><strong>Try:</strong> set front below the clear threshold, keep left clear, and disable R6. Run inference and explain why the result becomes undetermined. Change the threshold to edit the rule; change a sensor to edit the observation.</p>`;
 },
 action(s,a){const count=inferRobot(s).rounds.length;if(a==='step')s.round=Math.min(count,s.round+1);if(a==='run')s.round=count}
};

// A real 2→3→1 ReLU/sigmoid network trained by full-batch cross-entropy.
export const initialNetwork=()=>({w:[[-1,1],[1,.2],[.5,-.5]],b:[.6,-.3,.1],v:[.4,-.2,.3],c:-.1});
export const robotExamples=()=>[.15,.35,.65,.85].flatMap(front=>[.2,.8].map(left=>({x:[front,left],y:front>=.5?1:0})));
const sigmoid=z=>z>=0?1/(1+Math.exp(-z)):Math.exp(z)/(1+Math.exp(z));
const softplus=z=>Math.max(0,z)+Math.log1p(Math.exp(-Math.abs(z)));
export function networkForward(net,x){
 const z=net.w.map((w,j)=>w[0]*x[0]+w[1]*x[1]+net.b[j]),h=z.map(v=>Math.max(0,v));
 const score=h.reduce((sum,v,j)=>sum+v*net.v[j],net.c);
 return {z,h,score,p:sigmoid(score)};
}
export function networkLoss(net,data){return data.reduce((sum,e)=>{const f=networkForward(net,e.x);return sum+softplus(f.score)-e.y*f.score},0)/data.length}
export function networkGradient(net,data){
 const g={w:[[0,0],[0,0],[0,0]],b:[0,0,0],v:[0,0,0],c:0};
 for(const e of data){const f=networkForward(net,e.x),d=(f.p-e.y)/data.length;g.c+=d;
  for(let j=0;j<3;j++){g.v[j]+=d*f.h[j];const dh=d*net.v[j]*(f.z[j]>0?1:0);g.b[j]+=dh;for(let k=0;k<2;k++)g.w[j][k]+=dh*e.x[k]}
 }
 return g;
}
export function trainNetwork(net,data,eta){const g=networkGradient(net,data);return {w:net.w.map((w,j)=>w.map((v,k)=>v-eta*g.w[j][k])),b:net.b.map((v,j)=>v-eta*g.b[j]),v:net.v.map((v,j)=>v-eta*g.v[j]),c:net.c-eta*g.c}}

function networkMap(net,data,x){
 let cells='';for(let i=0;i<20;i++)for(let j=0;j<20;j++){const p=networkForward(net,[(i+.5)/20,(j+.5)/20]).p;cells+=`<rect x="${50+i*15}" y="${40+(19-j)*9}" width="15" height="9" fill="${p>=.5?purple:orange}" opacity="${.12+.45*Math.abs(p-.5)*2}"/>`}
 const points=data.map((e,i)=>`<g><circle cx="${50+e.x[0]*300}" cy="${220-e.x[1]*180}" r="6" fill="${e.y?purple:orange}" stroke="#fff" stroke-width="2"/><title>Example ${i+1}: front ${e.x[0]}, left ${e.x[1]}, label ${e.y?'advance':'turn'}</title></g>`).join('');
 return svg(cells+points+`<path d="M${50+x[0]*300-7} ${220-x[1]*180-7}l14 14m0-14-14 14" stroke="#111" stroke-width="3"/><path d="M50 40v180h300" fill="none" stroke="#777"/><text x="50" y="240">0</text><text x="340" y="240">1</text><text x="170" y="264">front distance</text><text x="22" y="46">1</text><text x="22" y="224">0</text><text data-plot-caption x="50" y="24">left distance · × current observation</text>`,`Learned action regions and eight labeled examples; current advance score ${fmt(networkForward(net,x).p,3)}`);
}
export const neuralDefinition={
 initial:()=>({front:.8,left:.8,eta:.5,example:8,net:initialNetwork(),data:robotExamples(),updates:0,previousLoss:null}),
 controls:[range('front','Query: front distance',0,1),range('left','Query: left distance',0,1),range('eta','Learning rate',.02,1,.02),range('example','Training example to inspect',1,8,1)],
 describe(s){const f=networkForward(s.net,[s.front,s.left]);return `After ${s.updates} updates, training loss ${fmt(networkLoss(s.net,s.data),5)}. Advance score ${fmt(f.p,4)}, decision ${f.p>=.5?'advance':'turn'}.`},
 render(s){
  const f=networkForward(s.net,[s.front,s.left]),loss=networkLoss(s.net,s.data),e=s.data[s.example-1],correct=s.data.filter(e=>(networkForward(s.net,e.x).p>=.5?1:0)===e.y).length;
  return `<p class="intro-result"><strong data-network-output>${f.p>=.5?'Advance':'Turn'}</strong><span>advance score ${fmt(f.p,4)} · threshold 0.5</span></p>`+
   networkMap(s.net,s.data,[s.front,s.left])+
   `<p>Purple region: advance. Orange region: turn. Points are the labeled examples; the × is your query. The regions are calculated from the current weights, not painted from the labels.</p>`+
   `<div class="intro-stats"><p><strong data-network-loss>${fmt(loss,6)}</strong>mean training loss</p><p><strong data-network-updates>${s.updates}</strong>full-batch updates</p><p><strong>${correct} / 8</strong>training actions matched</p></div>`+
   `<div class="plot-actions">${button('step','Train one update',s.updates>=2000)}${button('train','Train 20 updates',s.updates>=2000)}</div>`+
   (s.previousLoss!==null?`<p>Before the last update: ${fmt(s.previousLoss,6)}. After it: ${fmt(loss,6)}. These losses use the same current label set.</p>`:'')+
   `<h4>One forward computation</h4><div class="intro-network-flow"><div><strong>2 inputs</strong><span>front ${fmt(s.front,2)}</span><span>left ${fmt(s.left,2)}</span></div><div><strong>3 hidden units</strong>${f.h.map((v,j)=>`<span>ReLU ${j+1}: ${fmt(v,3)}</span>`).join('')}</div><div><strong>1 output</strong><span>sigmoid: ${fmt(f.p,4)}</span></div></div><p>Both inputs connect to every hidden unit. Every hidden activation contributes through an output weight.</p>`+table(['Hidden unit','Front contribution','Left contribution','Bias','ReLU output'],s.net.w.map((w,j)=>[j+1,fmt(w[0]*s.front,4),fmt(w[1]*s.left,4),fmt(s.net.b[j],4),fmt(f.h[j],4)]))+
   table(['Output calculation','Value'],[['Σ hidden activation × output weight',fmt(f.score-s.net.c,5)],['Output bias',fmt(s.net.c,5)],['Score before sigmoid',fmt(f.score,5)],['Score after sigmoid',fmt(f.p,5)]])+
   `<h4>Inspect a training example</h4><p>Example ${s.example}: front ${e.x[0]}, left ${e.x[1]}, demonstrated action <strong>${e.y?'advance':'turn'}</strong>. Current advance score: ${fmt(networkForward(s.net,e.x).p,4)}.</p>${button('label','Change this example’s label')}`+
   `<details><summary>Inspect all examples and current weights</summary>`+table(['Example','Front','Left','Demonstrated action','Current advance score'],s.data.map((e,i)=>[i+1,...e.x,e.y?'advance':'turn',fmt(networkForward(s.net,e.x).p,4)]))+table(['Hidden unit','Front weight','Left weight','Bias','Output weight'],s.net.w.map((w,j)=>[j+1,...w.map(v=>fmt(v,5)),fmt(s.net.b[j],5),fmt(s.net.v[j],5)]))+`<p>Output bias: ${fmt(s.net.c,5)}. Every update averages the eight cross-entropy gradients and changes all parameters from the same previous network.</p></details>`+
   `<p><strong>Try:</strong> train, then move the query. Next change a label and train again. Moving the query changes inference; changing a label changes later training. This small supervised network copies toy demonstrations. Its score and training accuracy do not establish physical safety or generalization. Training is capped at 2,000 updates.</p>`;
 },
 action(s,a){if(a==='label'){s.data[s.example-1].y=1-s.data[s.example-1].y;s.previousLoss=null}const count=a==='step'?1:a==='train'?20:0;for(let i=0;i<count&&s.updates<2000;i++){s.previousLoss=networkLoss(s.net,s.data);s.net=trainNetwork(s.net,s.data,s.eta);s.updates++}}
};

// A finite MDP with two nonterminal states and explicit terminal transitions.
export function robotTransition(state,action,collisionReward=-4){
 if(state===0)return {next:action===0?1:0,reward:-.1,terminal:false};
 if(state===1)return action===0?{next:3,reward:collisionReward,terminal:true}:{next:2,reward:2,terminal:true};
 throw Error('A terminal state has no outgoing transition');
}
export function qUpdate(old,reward,nextBest,alpha,gamma,terminal){const target=reward+(terminal?0:gamma*nextBest);return {target,value:old+alpha*(target-old)}}
const stateNames=['Entrance','Junction','Goal','Collision'],actionNames=['Advance','Turn'];
export function initialRewardState(){return {alpha:.5,gamma:.9,epsilon:.25,collisionReward:-4,q:[[0,0],[0,0]],state:0,seed:51966,steps:0,completed:0,trace:[],limited:false}}
function random(s){s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0;return s.seed/4294967296}
export function rewardStep(s,action){
 if(s.state>1)return null;
 const state=s.state,t=robotTransition(state,action,s.collisionReward),old=s.q[state][action],nextBest=t.terminal?0:Math.max(...s.q[t.next]),u=qUpdate(old,t.reward,nextBest,s.alpha,s.gamma,t.terminal);
 s.q[state][action]=u.value;s.state=t.next;s.steps++;
 const event={state,action,...t,old,nextBest,target:u.target,value:u.value};s.trace.push(event);s.trace=s.trace.slice(-12);if(t.terminal)s.completed++;
 return event;
}
export function rewardEpisode(s){
 s.state=0;s.limited=false;
 for(let i=0;i<12&&s.state<2;i++){const action=random(s)<s.epsilon?(random(s)<.5?0:1):(s.q[s.state][0]>=s.q[s.state][1]?0:1);rewardStep(s,action)}
 s.limited=s.state<2;
}
function rewardDiagram(s){
 const nodes=[[125,90],[355,90],[125,250],[355,250]];
 // End arrows outside each circle. Labels have their own space, including the
 // self-loop, so enlarging the text on a narrow screen cannot cover an edge.
 const edges=`<g fill="none" stroke="#8c8297" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M176 90H304m-8-6 8 6-8 6"/><path d="M355 141V199m-6-8 6 8 6-8"/><path d="M312 120 169 219m10-1-10 1 4-10"/><path d="M105 45C43 10 24 121 78 109m-8-6 8 6-9 4"/></g><g class="reward-edge-label" text-anchor="middle"><text x="240" y="44">Advance</text><text x="240" y="65">−0.1</text><text x="453" y="165">Advance</text><text x="453" y="186">${s.collisionReward>0?'+':''}${fmt(s.collisionReward,2)}</text><text x="207" y="151">Turn · +2</text><text x="63" y="26">Turn · −0.1</text></g>`;
 return svg(edges+nodes.map(([x,y],i)=>`<g><circle cx="${x}" cy="${y}" r="46" fill="${s.state===i?purple:'#fff'}" stroke="${i===3?'#bc3030':i===2?'#187d86':'#a888ae'}" stroke-width="1.5"/><text x="${x}" y="${y+5}" data-label-max-width="86" fill="${s.state===i?'white':'#222'}" text-anchor="middle">${stateNames[i]}</text></g>`).join('')+`<g class="reward-terminal" text-anchor="middle"><text x="125" y="317">Episode ends</text><text x="355" y="317">Episode ends</text></g>`,'Robot environment. Entrance: advance to junction or turn and stay, both reward −0.1. Junction: turn to goal for +2 or advance to collision for '+fmt(s.collisionReward,2)+'. Goal and collision end the episode.','0 0 520 338').replace('class="intro-plot"','class="intro-plot reward-diagram"');
}
export const rewardDefinition={
 initial:initialRewardState,
 controls:[range('alpha','Learning rate α',.1,1,.1),range('gamma','Discount γ',0,1,.05),range('epsilon','Exploration probability',0,1,.05),range('collisionReward','Reward on collision',-6,4,.5)],
 describe(s){return `${stateNames[s.state]}. ${s.steps} transitions, ${s.completed} completed episodes. Junction values: advance ${fmt(s.q[1][0],4)}, turn ${fmt(s.q[1][1],4)}.`},
 render(s){const e=s.trace.at(-1);return `<p class="intro-result"><strong data-reward-state>${stateNames[s.state]}</strong><span>${s.steps} transitions · ${s.completed} completed episodes</span></p>`+rewardDiagram(s)+
   `<div class="plot-actions">${button('advance','Take action: advance',s.state>1)}${button('turn','Take action: turn',s.state>1)}${button('episode','Start at entrance')}</div>`+
   table(['State','Q(advance)','Q(turn)','Greedy choice'],s.q.map((q,i)=>[stateNames[i],fmt(q[0],5),fmt(q[1],5),q[0]>=q[1]?'Advance':'Turn']))+
   `<div class="plot-actions">${button('train','Learn from 25 episodes')}${button('clear','Clear learned values')}</div>`+
   (s.limited?'<p role="status">The last episode reached its 12-transition limit without terminating. Its observed transitions still updated the table.</p>':'')+
   (e?`<h4>Most recent value update</h4>`+table(['Quantity','Value'],[['Observed transition',`${stateNames[e.state]} — ${actionNames[e.action]} → ${stateNames[e.next]}`],['Reward r',fmt(e.reward,5)],['Old value',fmt(e.old,5)],['Best next value',e.terminal?'0: terminal transition':fmt(e.nextBest,5)],['Target r + γ max Q(next)',fmt(e.target,5)],['New value',fmt(e.value,5)]])+`<details><summary>Inspect the last ${s.trace.length} transitions</summary>`+table(['State','Action','Next state','Reward','Old Q','New Q'],s.trace.map(e=>[stateNames[e.state],actionNames[e.action],stateNames[e.next],fmt(e.reward,3),fmt(e.old,4),fmt(e.value,4)]))+'</details>':'<p>No transition observed yet. Choose an action or run episodes.</p>')+
   `<p>Manual actions bypass the policy and let you inspect a chosen transition. Episode learning uses ε-greedy action selection: explore with probability ε, otherwise choose the larger value; equal values choose advance. The seed and environment are deterministic on reset. Each episode is bounded to 12 transitions. Changing α, γ, or rewards keeps the old value estimates; clear them for a fresh comparison.</p>`+
   `<p><strong>Try:</strong> first learn with a negative collision reward. Then set it to +4, clear learned values, and learn again. The agent can prefer collision because it optimizes the specified reward. Reaching a high reward and achieving the intended behavior are separate questions.</p>`;
 },
 action(s,a){if(a==='advance')rewardStep(s,0);if(a==='turn')rewardStep(s,1);if(a==='episode'){s.state=0;s.limited=false}if(a==='train')for(let i=0;i<25;i++)rewardEpisode(s);if(a==='clear'){const settings={alpha:s.alpha,gamma:s.gamma,epsilon:s.epsilon,collisionReward:s.collisionReward};Object.assign(s,initialRewardState(),settings)}}
};

// Rasterized ground-truth shapes expose annotation formats, not model predictions.
export function constructedScene(frame,occlusion){
 const objects=[{id:'A',x:40+18*frame,y:110},{id:'B',x:280-10*frame,y:190}];
 const masks=objects.map(o=>{const cells=[];for(let y=0;y<260;y+=10)for(let x=0;x<400;x+=10){const cx=x+5,cy=y+5,dx=cx-o.x,dy=cy-o.y;
  const inside=(dx>=0&&dx<60&&dy>=0&&dy<25)||(dx>=15&&dx<45&&dy>=-15&&dy<0)||(((dx>=8&&dx<20)||(dx>=40&&dx<52))&&dy>=25&&dy<35);
  if(inside&&!(occlusion&&cx>=170&&cx<240&&cy>=70&&cy<155))cells.push({x,y});
 }return {...o,cells,box:cells.length?[Math.min(...cells.map(c=>c.x))/10,Math.min(...cells.map(c=>c.y))/10,Math.max(...cells.map(c=>c.x))/10+1,Math.max(...cells.map(c=>c.y))/10+1]:null}});
 return {objects:masks,visible:masks.filter(o=>o.cells.length),pixels:masks.reduce((n,o)=>n+o.cells.length,0)};
}
const taskModes=['Classification','Detection','Semantic segmentation','Instance segmentation','Tracking'];
export const outputsDefinition={
 initial:()=>({mode:'Detection',frame:0,occlusion:false}),
 controls:[select('mode','Required output',taskModes),range('frame','Frame',0,10,1),check('occlusion','Place an occluder in the scene')],
 describe(s){const r=constructedScene(s.frame,s.occlusion);return `${s.mode}, frame ${s.frame}. ${r.visible.length} visible vehicles, ${r.pixels} visible vehicle pixels on the 40 by 26 grid.`},
 render(s){
  const r=constructedScene(s.frame,s.occlusion),mask=s.mode.includes('segmentation'),instances=s.mode==='Instance segmentation'||s.mode==='Tracking';
  const pixels=r.objects.map((o,i)=>o.cells.map(c=>`<rect x="${c.x}" y="${c.y}" width="10" height="10" fill="${mask||instances?(s.mode==='Semantic segmentation'?purple:i?orange:purple):'#7c8997'}"/>`).join('')).join('');
  const boxes=s.mode==='Detection'?r.visible.map(o=>{const [x,y,x2,y2]=o.box.map(v=>v*10);return `<rect x="${x}" y="${y}" width="${x2-x}" height="${y2-y}" fill="none" stroke="${purple}" stroke-width="2"/><text x="${x}" y="${y-8}" fill="${purple}">vehicle</text>`}).join(''):'';
  const ids=instances?r.visible.map(o=>`<text x="${o.box[0]*10}" y="${o.box[1]*10-10}" font-weight="bold">${o.id}</text>`).join(''):'';
  const scene=svg(`<rect x="0" y="0" width="400" height="260" fill="#f6f6f3"/><path d="M0 145h400" stroke="#d6d6d0" stroke-dasharray="9 8"/>${pixels}${s.occlusion?'<rect x="170" y="70" width="70" height="85" fill="#d4c7b4"/><text x="205" y="62" text-anchor="middle">occluder</text>':''}${boxes}${ids}`,`${s.mode} annotation on a constructed vehicle scene, frame ${s.frame}`,'0 0 400 270');
  const output=s.mode==='Classification'?'<p>Image label: <strong>vehicle present</strong>. No locations or identities are returned.</p>':s.mode==='Detection'?table(['Object label','Visible bounding box [left, top, right, bottom]'],r.visible.map(o=>['vehicle',o.box.join(', ')])):s.mode==='Semantic segmentation'?`<p>Class mask: <strong>${r.pixels} vehicle pixels</strong>. Both vehicles share one class label; the class does not separate their identities.</p>`:table(['Instance identity','Visible foreground cells',s.mode==='Tracking'?'Correspondence across frames':'Separate mask'],r.objects.map(o=>[o.id,o.cells.length,s.mode==='Tracking'?`${o.id} remains ${o.id} at frame ${s.frame}`:'An individually labeled vehicle region']));
  return scene+`<div class="intro-output" data-scene-output><h4>${esc(s.mode)} output</h4>${output}</div>`+
   `<p>The constructed image is 40 × 26 pixels, each enlarged into a square for display. Boxes use pixel coordinates, with right and bottom boundaries excluded; coordinates increase rightward and downward. The occluder removes hidden pixels from visible masks.</p>`+
   `<p><strong>Try:</strong> compare a label, boxes, class pixels, and individual masks on the same scene. At frame 7, enable occlusion and follow A across frames. Its identity stays A while its visible region changes.</p><p>This scene provides known shapes and IDs, so annotations are calculated directly. It illustrates target output formats and visible occlusion; it does not perform image recognition or learned tracking. Real systems must infer these outputs from observations.</p>`;
 }
};

// Synchronous Jacobi inpainting of a 4×4 missing region, with fixed boundary.
export const inpaintHole=Array.from({length:16},(_,i)=>({x:6+i%4,y:6+Math.floor(i/4)}));
export function originalPixels(pattern){return Array.from({length:256},(_,i)=>{const x=i%16,y=Math.floor(i/16);return pattern==='Sharp edge'?(x<8?40:210):20+12*x+3*y})}
export function damagedPixels(original){const a=[...original];inpaintHole.forEach(({x,y})=>{a[y*16+x]=0});return a}
export function inpaintStep(old){const next=[...old];for(const {x,y} of inpaintHole){const i=y*16+x;next[i]=(old[i-16]+old[i+16]+old[i-1]+old[i+1])/4}return next}
export function inpaintError(values,original){return inpaintHole.reduce((sum,{x,y})=>sum+(values[y*16+x]-original[y*16+x])**2,0)/inpaintHole.length}
function pixelGrid(values,x,y,offset,reveal=true){
 const cells=values.map((v,i)=>{const px=i%16,py=Math.floor(i/16),hole=px>=6&&px<=9&&py>=6&&py<=9,color=!reveal&&hole?'#e9dbea':`rgb(${Math.round(v)},${Math.round(v)},${Math.round(v)})`;return `<rect x="${offset+px*10}" y="${30+py*10}" width="10" height="10" fill="${color}"/>`}).join('');
 return `${cells}<rect x="${offset+60}" y="90" width="40" height="40" fill="none" stroke="${orange}" stroke-dasharray="3 2"/><rect x="${offset+x*10}" y="${30+y*10}" width="10" height="10" fill="none" stroke="${purple}" stroke-width="2"/>`;
}
export const inpaintingDefinition={
 initial(){const pattern='Smooth gradient',original=originalPixels(pattern);return {pattern,x:7,y:7,reveal:true,original,values:damagedPixels(original),previous:null,steps:0}},
 controls:[select('pattern','Constructed image', ['Smooth gradient','Sharp edge']),range('x','Inspect missing pixel: column',6,9,1),range('y','Inspect missing pixel: row',6,9,1),check('reveal','Reveal the hidden reference')],
 change(s,key){if(key==='pattern'){s.original=originalPixels(s.pattern);s.values=damagedPixels(s.original);s.previous=null;s.steps=0}},
 describe(s){return `After ${s.steps} synchronous steps, missing-region mean squared error ${fmt(inpaintError(s.values,s.original),4)}. Pixel (${s.x}, ${s.y}) = ${fmt(s.values[s.y*16+s.x],4)}.`},
 render(s){const i=s.y*16+s.x,old=s.previous||s.values,neighbors=[old[i-16],old[i+16],old[i-1],old[i+1]],mean=neighbors.reduce((a,b)=>a+b)/4;
  return `<div class="intro-pixel-titles"><span>${s.reveal?'Known reference':'Known pixels'}</span><span>Reconstruction</span></div>`+svg(pixelGrid(s.original,s.x,s.y,20,s.reveal)+pixelGrid(s.values,s.x,s.y,220),'Original and reconstructed 16 by 16 grayscale grids with a four by four missing region','0 20 400 180')+
   `<p>Orange boundary: missing region. Purple outline: selected pixel (${s.x}, ${s.y}).</p>`+
   `<div class="intro-stats"><p><strong data-inpaint-steps>${s.steps}</strong>synchronous steps</p><p><strong data-inpaint-value>${fmt(s.values[i],4)}</strong>selected pixel value</p><p><strong>${fmt(inpaintError(s.values,s.original),4)}</strong>missing-region MSE</p></div>`+
   `<div class="plot-actions">${button('step','Update the missing region once',s.steps>=500)}${button('run','Apply 20 steps',s.steps>=500)}</div>`+
   `<h4>${s.previous?'Last update':'Next update'} for the selected pixel</h4>`+table(['Neighbor from the same old grid','Intensity'],['Above','Below','Left','Right'].map((name,j)=>[name,fmt(neighbors[j],5)]).concat([['Mean of the four neighbors',fmt(mean,5)]]))+
   `<p>Known pixels stay fixed. All 16 missing pixels update simultaneously from the previous grid. Intensity ranges from 0 (black) to 255 (white). Columns and rows are numbered from 0. Reconstruction error uses the hidden original only as a reference; that information is not given to the update.</p>`+
   `<p><strong>Try:</strong> fill the smooth gradient, then switch to the sharp edge and repeat. Boundary averaging imposes a smoothness assumption and blurs an edge through the missing region. A plausible reconstruction can still differ from what was hidden.</p><p>This is numerical diffusion inpainting with a fixed boundary, not a generative neural model. There is no learned texture, text prompt, or hidden-object recovery. The run is capped at 500 steps.</p>`;
 },
 action(s,a){const n=a==='step'?1:a==='run'?20:0;for(let j=0;j<n&&s.steps<500;j++){s.previous=s.values;s.values=inpaintStep(s.values);s.steps++}}
};
