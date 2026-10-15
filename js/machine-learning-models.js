import {esc,fmt,table} from './render.js';
import {houseData,lineFit,lineGradient,lineStep,errorMean,curveTraining,curveValidation,referenceCurve,curveFit,multipleData,multipleFit,dot,logisticCalculation,exerciseNeighbors,neighborVote,classifierTraining,classifierValidation,classifierBatch,classifierStep,sigmoid} from './machine-learning-math.js';

const purple='#670875',orange='#bb592c';
const range=(id,label,min,max,step=1)=>({id,label,min,max,step,type:'range'});
const select=(id,label,options)=>({id,label,options,type:'select'});
const button=(id,text)=>`<button type="button" class="button subtle small" data-lab-action="${id}">${text}</button>`;
const actions=items=>`<div class="plot-actions">${items.map(([id,text])=>button(id,text)).join('')}</div>`;
const line=(x1,y1,x2,y2,extra='')=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${extra}/>`;
const text=(x,y,value,anchor='middle')=>`<text x="${x}" y="${y}" text-anchor="${anchor}">${esc(value)}</text>`;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const summary=(html)=>`<p class="plot-summary">${html}</p>`;
const svg=(body,name,interactive=false,height=340)=>`<svg class="explore-plot ml-plot" ${interactive?'data-plot':''} viewBox="0 0 440 ${height}" role="img" aria-label="${esc(name)}">${body}</svg>`;
function chartAxes(xmin,xmax,ymin,ymax,xlabel,ylabel,xticks,yticks,square=false){
 const bottom=square?382:282,height=square?340:246;
 const X=x=>62+(x-xmin)/(xmax-xmin)*340,Y=y=>bottom-(y-ymin)/(ymax-ymin)*height;
 const grid=xticks.map(v=>line(X(v),bottom-height,X(v),bottom,'class="plot-grid"')+text(X(v),bottom+22,v)).join('')+yticks.map(v=>line(62,Y(v),402,Y(v),'class="plot-grid"')+text(50,Y(v)+5,v,'end')).join('');
 return {X,Y,body:grid+text(232,bottom+48,xlabel)+text(62,19,ylabel,'start')};
}
const path=points=>points.map(([x,y],i)=>(i?'L':'M')+x.toFixed(3)+' '+y.toFixed(3)).join(' ');

export const houseRegressionDefinition={
 initial:()=>({w:1,b:100,query:80,point:3,price:260,eta:.1,points:houseData.map(p=>[...p]),updates:0,last:null,history:[],stopped:''}),
 controls:[range('w','Slope w ($1000 per m²)',-5,8,.01),range('b','Intercept b ($1000)',-700,700,.1),range('query','Predict size (m²)',0,200),range('point','Inspect observation',1,5),range('price','Selected observed price ($1000)',100,450),range('eta','Learning rate in normalized coordinates',.001,1.5,.001)],
 change(s,key){if(key==='point')s.price=s.points[s.point-1][1];if(key==='price')s.points[s.point-1][1]=s.price;if(['w','b','price'].includes(key)){s.last=null;s.history=[];s.stopped='';s.updates=0;}},
 pointer(s,p){const x=(p.x-62)/340*200;s.point=s.points.reduce((best,point,i)=>Math.abs(point[0]-x)<Math.abs(s.points[best][0]-x)?i:best,0)+1;s.price=s.points[s.point-1][1];},
 describe:s=>`Selected observation ${s.point}: size ${s.points[s.point-1][0]}, observed price ${s.points[s.point-1][1]}. Query prediction ${fmt(s.w*s.query+s.b,3)} thousand dollars. ${s.updates} gradient updates.`,
 render(s){
  const fit=lineFit(s.points),predictions=s.points.map(([x])=>s.w*x+s.b),mse=errorMean(s.points.map(p=>p[1]),predictions),g=lineGradient(s.points,s.w,s.b),[x,y]=s.points[s.point-1],pred=s.w*x+s.b;
  const a=chartAxes(0,200,0,500,'Size (m²)','Price ($1000)',[0,50,100,150,200],[0,100,200,300,400,500]);
  const curve=line(a.X(0),a.Y(s.b),a.X(200),a.Y(s.w*200+s.b),`stroke="${purple}" stroke-width="3"`);
  const residuals=s.points.map(([x,y],i)=>line(a.X(x),a.Y(y),a.X(x),a.Y(predictions[i]),`stroke="${orange}" stroke-dasharray="4 3"`)).join('');
  const marks=s.points.map(([x,y],i)=>`<circle cx="${a.X(x)}" cy="${a.Y(y)}" r="${i===s.point-1?8:5}" fill="${orange}"/>${text(a.X(x)+10,a.Y(y)-12,i+1)}`).join('');
  const query=s.w*s.query+s.b;
  return `<p>Tap a data point to inspect its residual, or use the observation control. Change its observed price to refit a perturbed dataset. All five starting observations are the house-price exercise.</p>`+
   svg(`<defs><clipPath id="ml-house-clip"><rect x="62" y="36" width="340" height="246"/></clipPath></defs>${a.body}<g clip-path="url(#ml-house-clip)">${curve}${residuals}${marks}<path d="M${a.X(s.query)-6} ${a.Y(query)-6}l12 12m0-12-12 12" stroke="${purple}" stroke-width="3"/></g>`,`House prices, fitted line and vertical residuals. Selected observation ${s.point}: size ${x}, price ${y}, residual ${fmt(y-pred)}. Query prediction ${fmt(query)} at ${s.query} square metres.`,true)+
   summary(`Prediction <strong data-house-prediction>${fmt(query,6)}</strong> ($1000) <span>MSE <strong data-house-mse>${fmt(mse,6)}</strong> · updates <strong data-house-updates>${s.updates}</strong></span>`)+
   `<p>Current line: ŷ = ${fmt(s.b,6)} + ${fmt(s.w,6)}x. Fits and training retain full precision; the sliders set manual values in their stated increments. Fixed chart window: 0–500; predictions outside it are reported numerically.</p>`+
   actions([['fit','Fit least squares'],['rounded','Use rounded exercise line'],['step','One gradient step'],['train','20 gradient steps']])+
   (s.stopped?`<p class="info-note" role="status">${esc(s.stopped)}</p>`:'')+
   `<p>Observation ${s.point}: predicted ${fmt(pred,4)}, observed ${y}, residual y − ŷ = ${fmt(y-pred,4)}, squared error ${fmt((y-pred)**2,4)}. MSE averages all five squared errors.</p>`+
   `<details><summary>Inspect observations, exact fit, and gradients</summary>${table(['Observation','Size m²','Price $1000','Prediction','y − ŷ','Squared error'],s.points.map(([x,y],i)=>[i+1,x,y,fmt(predictions[i],6),fmt(y-predictions[i],6),fmt((y-predictions[i])**2,6)]))}<p>Means (${fmt(fit.mx)}, ${fmt(fit.my)}); cross-product sum ${fmt(fit.xy)}; squared-x sum ${fmt(fit.xx)}. Exact fit w = ${fmt(fit.w,9)}, b = ${fmt(fit.b,9)}, minimum MSE = ${fmt(fit.mse,9)}.</p><p>Raw gradients ∂L/∂w = ${fmt(g.dw,6)}, ∂L/∂b = ${fmt(g.db,6)}. Training uses t = (x − 98)/50, a = 50w, c = b + 98w, so the same line is ŷ = c + at. Normalized gradients ∂L/∂a = ${fmt(g.da,6)}, ∂L/∂c = ${fmt(g.dc,6)}. Both are computed at the same old parameters.</p></details>`+
   (s.last?`<div class="info-note" data-house-step><strong>Last actual update</strong><p>a: ${fmt(s.last.a,6)} − ${s.last.eta} × (${fmt(s.last.g.da,6)}); c: ${fmt(s.last.c,6)} − ${s.last.eta} × (${fmt(s.last.g.dc,6)}). MSE ${fmt(s.last.before,6)} → ${fmt(mse,6)}.</p></div>`:'')+
   (s.history.length?`<details><summary>Inspect training loss history</summary>${table(['Update','MSE'],s.history.map(h=>[h.step,fmt(h.loss,6)]))}</details>`:'')+
   `<p>The training buttons optimize this dataset only. Fixed centering/scaling changes the parameter coordinates and suitable learning rate, not the available lines. The rounded line is 50 + 2.08x; it is deliberately distinct from the unrounded least-squares fit. Reset restores the original table.</p>`;
 },
 action(s,a){
  s.stopped='';
  if(a==='fit'||a==='rounded'){const f=a==='fit'?lineFit(s.points):{w:2.08,b:50};s.w=f.w;s.b=f.b;s.updates=0;s.last=null;s.history=[];return;}
  if(a==='step'||a==='train')for(let i=0;i<(a==='step'?1:20);i++){
   const before=errorMean(s.points.map(p=>p[1]),s.points.map(p=>s.w*p[0]+s.b)),r=lineStep(s.points,s.w,s.b,s.eta);
   if(!Number.isFinite(r.w)||r.w<-5||r.w>8||r.b<-700||r.b>700){s.stopped='Next update exceeds the parameter controls. Training stopped before applying it. Reduce the learning rate or reset.';break;}
   if(!s.history.length)s.history.push({step:s.updates,loss:before});
   s.last={a:50*s.w,c:s.b+98*s.w,eta:s.eta,g:r.g,before};s.w=r.w;s.b=r.b;s.updates++;
   s.history.push({step:s.updates,loss:errorMean(s.points.map(p=>p[1]),s.points.map(p=>s.w*p[0]+s.b))});if(s.history.length>101)s.history.splice(1,1);
  }
 }
};

export const ridgeDefinition={
 initial:()=>({degree:7,lambda:'0',perturb:false}),
 controls:[range('degree','Polynomial degree',1,8),select('lambda','Penalty λ',['0','0.00001','0.001','0.1','1']),{id:'perturb',label:'Increase training observation 5 by 0.2',type:'checkbox'}],
 describe:s=>`Degree ${s.degree}, lambda ${s.lambda}.`,
 render(s){
  const training=curveTraining.map((p,i)=>[p[0],p[1]+(s.perturb&&i===4?.2:0)]),r=curveFit(s.degree,Number(s.lambda),training),a=chartAxes(0,6,-1,3,'x','y',[0,1,2,3,4,5,6],[-1,0,1,2,3]);
  const samples=Array.from({length:181},(_,i)=>i/30),curve=path(samples.map(x=>[a.X(x),a.Y(r.predict(x))])),reference=path(samples.map(x=>[a.X(x),a.Y(referenceCurve(x))]));
  const marks=training.map(([x,y])=>`<circle cx="${a.X(x)}" cy="${a.Y(y)}" r="5" fill="${purple}"/>`).join('')+curveValidation.map(([x,y])=>`<rect x="${a.X(x)-4}" y="${a.Y(y)-4}" width="8" height="8" fill="white" stroke="${orange}" stroke-width="2"/>`).join('');
  return `<p>This added numerical fixture makes the fitting process reproducible: nine noisy training observations and eight separate validation observations from a declared synthetic curve. Every control change solves the selected least-squares or ridge objective.</p>`+
   svg(`<defs><clipPath id="ml-ridge-clip"><rect x="62" y="36" width="340" height="246"/></clipPath></defs>${a.body}<g clip-path="url(#ml-ridge-clip)"><path d="${reference}" fill="none" stroke="#777" stroke-dasharray="5 4"/><path d="${curve}" fill="none" stroke="${purple}" stroke-width="3"/>${marks}</g>`,`Actual degree ${s.degree} polynomial fit. Training MSE ${fmt(r.mse,5)}, validation MSE ${fmt(r.validation,5)}.`)+
   summary(`Training MSE <strong data-ridge-train>${fmt(r.mse,6)}</strong><span>Validation MSE <strong data-ridge-validation>${fmt(r.validation,6)}</strong> · objective ${fmt(r.objective,6)}</span>`)+
   `<div class="plot-legend"><span>● Training</span><span>□ Validation</span><span>Solid: fitted model · dashed: synthetic reference</span></div><p>Objective = training MSE + λΣaⱼ², j ≥ 1. Current penalty ${fmt(r.penalty,6)}. The intercept a₀ is unpenalized. Fixed plotting window y ∈ [−1,3]; curves beyond it are clipped, while the errors use unmodified predictions.</p>`+
   `<details><summary>Inspect coefficients and every observation</summary><p>t = (x − 3)/3. ŷ = a₀ + a₁t + … + a₍degree₎tᵈᵉᵍʳᵉᵉ. Coefficient magnitudes and penalties refer to this normalized basis.</p>${table(['Power j','Coefficient aⱼ'],r.coefficients.map((v,j)=>[j,fmt(v,8)]))}${table(['Split','x','Observed y','Prediction'],[...training.map(([x,y])=>['Training',x,fmt(y,6),fmt(r.predict(x),6)]),...curveValidation.map(([x,y])=>['Validation',x,fmt(y,6),fmt(r.predict(x),6)])])}<p>Reference y = 1 + 0.55 sin(x − 0.4); training noise = [0.16, −0.12, 0.23, −0.21, 0.08, −0.18, 0.2, −0.09, 0.13]. Validation noise = [0.04, −0.06, 0.03, −0.04, 0.05, −0.02, 0.06, −0.03]. The perturbation changes only training observation 5.</p></details><p>Try degree 8 with λ = 0, then λ = 0.001. Compare errors and sensitivity to the perturbation. A penalty changes the preferred coefficients; it is not an update algorithm. Repeatedly choosing settings on these eight validation points can also overfit that small validation set.</p>`;
 }
};

export const multipleDefinition={
 initial:()=>({size:100,rooms:3,age:15,b:20,ws:1,wr:0,wa:0,fitted:false}),
 controls:[range('size','Query size (m²)',60,160),range('rooms','Query bedrooms',1,5),range('age','Query age (years)',0,40),range('b','Intercept ($1000)',-50,100),range('ws','Size coefficient ($1000/m²)',0,4,.01),range('wr','Bedroom coefficient ($1000/bedroom)',-30,40,.1),range('wa','Age coefficient ($1000/year)',-4,4,.01)],
 describe:s=>`Predicted price ${fmt(s.b+s.ws*s.size+s.wr*s.rooms+s.wa*s.age)} thousand dollars.`,
 change(s,key){if(['b','ws','wr','wa'].includes(key))s.fitted=false;},
 render(s){
  const weights=[s.b,s.ws,s.wr,s.wa],prediction=dot(weights,[1,s.size,s.rooms,s.age]),preds=multipleData.map(p=>dot(weights,[1,p.size,p.rooms,p.age])),mse=errorMean(multipleData.map(p=>p.price),preds);
  const a=chartAxes(60,160,1,5,'Size (m²)','Bedrooms · fixed age '+s.age,[60,80,100,120,140,160],[1,2,3,4,5]);
  const cells=Array.from({length:80},(_,i)=>{const x=60+i%20*5,y=1+Math.floor(i/20),p=dot(weights,[1,x+2.5,y+.5,s.age]),level=clamp((p-100)/300,0,1);return `<rect x="${a.X(x)}" y="${a.Y(y+1)}" width="17.1" height="61.6" fill="${purple}" opacity="${.04+level*.72}"/>`}).join('');
  return `<p>These eight houses are an added teaching dataset, with all numeric values listed below. Fit four coefficients from eight labeled observations, then change one query feature while holding the others fixed.</p>`+
   svg(`${cells}${a.body}<circle cx="${a.X(s.size)}" cy="${a.Y(s.rooms)}" r="8" fill="white" stroke="${orange}" stroke-width="3"/>`,`Price surface slice at age ${s.age}; query size ${s.size}, bedrooms ${s.rooms}, price ${fmt(prediction)}. Darker purple means higher predicted price.`)+
   summary(`Price <strong data-multiple-prediction>${fmt(prediction,6)}</strong> ($1000)<span>Training MSE <strong data-multiple-mse>${fmt(mse,6)}</strong> · ${s.fitted?'least-squares coefficients':'current coefficients'}</span>`)+
   `<p>Color encodes predicted price on a fixed 100–400 ($1000) scale, saturated beyond those bounds. This is a two-feature slice of the affine price surface at the selected age.</p>`+actions([['fit','Fit all eight observations']])+
   table(['Term','Coefficient × feature','Contribution ($1000)'],[['Intercept',`${fmt(s.b)} × 1`,fmt(s.b)],['Size',`${fmt(s.ws)} × ${s.size}`,fmt(s.ws*s.size)],['Bedrooms',`${fmt(s.wr)} × ${s.rooms}`,fmt(s.wr*s.rooms)],['Age',`${fmt(s.wa)} × ${s.age}`,fmt(s.wa*s.age)]])+
   `<details><summary>Inspect the training data and fit</summary>${table(['Size m²','Bedrooms','Age years','Price $1000','Predicted'],multipleData.map((p,i)=>[p.size,p.rooms,p.age,p.price,fmt(preds[i],6)]))}<p>The browser solves the four normal equations for an unpenalized least-squares fit. This balanced fixture has a unique fit [b, wsize, wrooms, wage] = [20, 2, 15, −1], with nonzero residuals and MSE 25. It is generated from that affine relation plus the declared noise [−5,5,5,−5,5,−5,−5,5]. No claim about real house markets is implied.</p></details><p>More bedrooms contribute wrooms for each added bedroom only while size and age stay fixed. Coefficient signs are properties of a fitted dataset, not universal rules about buildings.</p>`;
 },
 action(s,a){if(a==='fit'){[s.b,s.ws,s.wr,s.wa]=multipleFit();s.fitted=true;}}
};

export const logisticDefinition={
 initial:()=>({b:1,w1:2,w2:-1,w3:5,x1:0,x2:10,x3:2,threshold:.5,target:'1'}),
 controls:[range('b','Bias b',-4,4,.1),range('w1','Coefficient w₁',-6,6,.1),range('w2','Coefficient w₂',-6,6,.1),range('w3','Coefficient w₃',-6,6,.1),range('x1','Feature x₁',-2,2,.1),range('x2','Feature x₂',0,12,.1),range('x3','Feature x₃',-2,4,.1),range('threshold','Decision threshold τ',.05,.95,.01),select('target','Assumed target for loss',['1','0'])],
 describe:s=>{const r=logisticCalculation([s.b,s.w1,s.w2,s.w3],[s.x1,s.x2,s.x3],+s.target,s.threshold);return `Score ${fmt(r.z)}, probability ${fmt(r.p)}, class ${r.label}.`;},
 render(s){
  const r=logisticCalculation([s.b,s.w1,s.w2,s.w3],[s.x1,s.x2,s.x3],+s.target,s.threshold),a=chartAxes(-8,8,0,1,'Score z','Probability p',[ -8,-4,0,4,8],[0,.25,.5,.75,1]),curve=path(Array.from({length:161},(_,i)=>{const z=-8+i*.1;return [a.X(z),a.Y(sigmoid(z))]}));
  return svg(`${a.body}<path d="${curve}" fill="none" stroke="${purple}" stroke-width="3"/>${line(62,a.Y(s.threshold),402,a.Y(s.threshold),`stroke="${orange}" stroke-dasharray="5 4"`)}<circle cx="${a.X(clamp(r.z,-8,8))}" cy="${a.Y(r.p)}" r="7" fill="${orange}"/>`,`Sigmoid probability ${fmt(r.p)} at score ${fmt(r.z)}; threshold ${s.threshold}.`)+
   summary(`Score <strong data-logistic-score>${fmt(r.z,6)}</strong> → probability <strong data-logistic-probability>${fmt(r.p,9)}</strong><span>Class <strong data-logistic-class>${r.label}</strong> at threshold ${s.threshold} · BCE ${fmt(r.loss,6)}</span>`)+
   table(['Term','Multiplication','Contribution'],[['Bias',`${s.b} × 1`,fmt(r.contributions[0])],['Feature 1',`${s.w1} × ${s.x1}`,fmt(r.contributions[1])],['Feature 2',`${s.w2} × ${s.x2}`,fmt(r.contributions[2])],['Feature 3',`${s.w3} × ${s.x3}`,fmt(r.contributions[3])]])+
   `<p>p = 1/(1 + exp(−z)). Class 1 is chosen when p ≥ τ, including equality. The target selection is an assumption for computing loss; the original numerical exercise supplies no true label. BCE = −y ln p − (1 − y) ln(1 − p), calculated with a stable equivalent expression. ${Math.abs(r.z)>8?'This score is outside the displayed −8…8 window; its marker is placed at the nearest edge.':''}</p><p>Change only the threshold: the class can change, while the score, probability, and loss stay fixed. These controls inspect a supplied model; the next experiment actually learns coefficients.</p>`;
 }
};

const classifierPoints=s=>classifierTraining.map((p,i)=>[p[0],p[1],s.noise&&i===0?1:p[2]]);
export const classifierDefinition={
 initial:()=>({eta:.2,lambda:0,noise:false,threshold:.5,x:.5,y:.5,weights:[0,0,0],epochs:0,last:null,history:[],stopped:''}),
 controls:[range('eta','Learning rate η',.01,1,.01),range('lambda','L2 penalty λ',0,1,.01),{id:'noise',label:'Flip the label of training point 1',type:'checkbox'},range('threshold','Decision threshold τ',.05,.95,.01),range('x','Query feature x₁',-2,2,.05),range('y','Query feature x₂',-2,2,.05)],
 change(s,key){s.stopped='';if(['noise','lambda'].includes(key)){s.last=null;s.history=[];}},
 pointer(s,p){s.x=Math.round(clamp((p.x-62)/340*4-2,-2,2)*20)/20;s.y=Math.round(clamp((282-p.y)/246*4-2,-2,2)*20)/20;},
 describe:s=>`${s.epochs} training updates. Query probability ${fmt(sigmoid(dot(s.weights,[1,s.x,s.y])))}.`,
 render(s){
  const points=classifierPoints(s),train=classifierBatch(s.weights,points,s.lambda,s.threshold),val=classifierBatch(s.weights,classifierValidation,0,s.threshold),a=chartAxes(-2,2,-2,2,'Feature x₁','Feature x₂',[-2,-1,0,1,2],[-2,-1,0,1,2]);
  const regions=Array.from({length:400},(_,i)=>{const x=-2+i%20*.2,y=-2+Math.floor(i/20)*.2,p=sigmoid(dot(s.weights,[1,x+.1,y+.1]));return `<rect x="${a.X(x)}" y="${a.Y(y+.2)}" width="17.1" height="12.4" fill="${p>=s.threshold?orange:purple}" opacity=".12"/>`}).join('');
  const marks=points.map(([x,y,c],i)=>`<circle cx="${a.X(x)}" cy="${a.Y(y)}" r="6" fill="${c?orange:purple}"/>${text(a.X(x)+9,a.Y(y)-10,i+1)}`).join('')+classifierValidation.map(([x,y,c])=>`<rect x="${a.X(x)-5}" y="${a.Y(y)-5}" width="10" height="10" fill="white" stroke="${c?orange:purple}" stroke-width="2"/>`).join('');
  const query=logisticCalculation(s.weights,[s.x,s.y],0,s.threshold),boundaryZ=Math.log(s.threshold/(1-s.threshold)),[b,w1,w2]=s.weights;
  let boundary='';if(Math.abs(w2)>1e-12)boundary=line(a.X(-2),a.Y((boundaryZ-b+2*w1)/w2),a.X(2),a.Y((boundaryZ-b-2*w1)/w2),'stroke="#29222c" stroke-width="2"');else if(Math.abs(w1)>1e-12){const x=(boundaryZ-b)/w1;boundary=line(a.X(x),36,a.X(x),282,'stroke="#29222c" stroke-width="2"');}
  return `<p>Train a binary logistic model on eight listed examples. Four validation examples measure held-out behavior and never supply gradients. This is a small added teaching dataset with two numeric features; every training button performs real full-batch updates in the browser.</p>`+
   svg(`<defs><clipPath id="ml-classifier-clip"><rect x="62" y="36" width="340" height="246"/></clipPath></defs>${regions}${a.body}<g clip-path="url(#ml-classifier-clip)">${boundary}${marks}<path d="M${a.X(s.x)-7} ${a.Y(s.y)}h14m-7-7v14" stroke="#222" stroke-width="3"/></g>`,`Logistic decision field after ${s.epochs} updates. Training accuracy ${fmt(train.accuracy)}, validation accuracy ${fmt(val.accuracy)}.`,true)+
   summary(`Updates <strong data-classifier-epochs>${s.epochs}</strong><span>Training BCE <strong data-classifier-loss>${fmt(train.loss,6)}</strong> · validation BCE <strong data-classifier-validation>${fmt(val.loss,6)}</strong></span>`)+
   `<p>Training accuracy ${fmt(train.accuracy*100,1)}%; validation accuracy ${fmt(val.accuracy*100,1)}%. Objective = training BCE + λ(w₁² + w₂²) = ${fmt(train.objective,6)}. Coefficients [b,w₁,w₂] = [${s.weights.map(v=>fmt(v,6)).join(', ')}]. Query: z = ${fmt(query.z,6)}, p = ${fmt(query.p,6)}, class ${query.label}.</p>`+
   actions([['step','One training update'],['train','50 training updates'],['restart','Restart with zero weights']])+
   (s.stopped?`<p class="info-note" role="status">${esc(s.stopped)}</p>`:'')+
   `<div class="plot-legend"><span>● Training · □ Validation</span><span>Purple: class 0 · orange: class 1</span><span>Cross: query · line: threshold boundary</span></div><p>Move the query by tapping the field or using its sliders. Query, threshold, and learning-rate controls never update the weights. Changing the label or penalty changes the objective; existing weights are retained until you restart. Restart clears the learned weights and history while retaining these experiment settings. Reset restores everything.</p>`+
   `<details><summary>Inspect data, predictions, and full-batch gradients</summary>${table(['Split / point','x₁','x₂','Target y','p(class 1)'],[...points.map((p,i)=>['Train '+(i+1),...p,fmt(train.rows[i].p,6)]),...classifierValidation.map((p,i)=>['Validation '+(i+1),...p,fmt(val.rows[i].p,6)])])}<p>∂J/∂b = mean(p − y); ∂J/∂wⱼ = mean((p − y)xⱼ) + 2λwⱼ. Current gradient [b,w₁,w₂] = [${train.gradient.map(v=>fmt(v,8)).join(', ')}]. Bias is unpenalized. All derivatives use the same pre-update weights.</p></details>`+
   (s.last?`<div class="info-note" data-classifier-step><strong>Last actual update</strong>${table(['Parameter','Old','Gradient','New'],['b','w₁','w₂'].map((name,i)=>[name,fmt(s.last.old[i],8),fmt(s.last.gradient[i],8),fmt(s.weights[i],8)]))}<p>New = old − ${s.last.eta} × gradient. Objective ${fmt(s.last.before,8)} → ${fmt(s.last.after,8)}.</p></div>`:'')+
   (s.history.length?classifierHistory(s.history):'')+
   `<p>The untrained zero model gives p = 0.5 everywhere and has no single separating line. With λ = 0 and perfectly separable training data, loss can keep falling as weight magnitudes grow; there is no finite unpenalized optimum. Regularization limits that growth. This tiny validation set is a diagnostic for the fixture, not an estimate of performance on a real application.</p>`;
 },
 action(s,a){
  s.stopped='';
  if(a==='restart'){s.weights=[0,0,0];s.epochs=0;s.history=[];s.last=null;return;}
  if(a==='step'||a==='train')for(let i=0;i<(a==='step'?1:50);i++){
   const points=classifierPoints(s),r=classifierStep(s.weights,points,s.eta,s.lambda);
   if(r.weights.some(w=>!Number.isFinite(w)||Math.abs(w)>10000)){s.stopped='Next update exceeds the numerical teaching bound (coefficient magnitude 10,000). It was not applied. Reduce the learning rate or restart.';break;}
   if(!s.history.length)s.history.push({step:s.epochs,train:r.before.loss,val:classifierBatch(s.weights,classifierValidation).loss});
   s.last={old:[...s.weights],gradient:r.before.gradient,eta:s.eta,before:r.before.objective,after:r.after.objective};s.weights=r.weights;s.epochs++;
   s.history.push({step:s.epochs,train:r.after.loss,val:classifierBatch(s.weights,classifierValidation).loss});if(s.history.length>201)s.history.splice(1,1);
  }
 }
};
function classifierHistory(history){
 const max=Math.max(.01,...history.flatMap(h=>[h.train,h.val])),last=history.at(-1).step,first=history[0].step;
 const X=s=>62+(s-first)/Math.max(1,last-first)*340,Y=v=>282-v/max*246;
 const train=path(history.map(h=>[X(h.step),Y(h.train)])),val=path(history.map(h=>[X(h.step),Y(h.val)]));
 return `<figure class="ml-loss-history"><figcaption>Actual training history · BCE, without penalty</figcaption>${svg(`${line(62,282,402,282,'class="plot-grid"')}${text(62,304,first)}${text(402,304,last)}${text(232,330,'Update')}${text(62,19,'BCE: 0 to '+fmt(max,3),'start')}<path d="${train}" fill="none" stroke="${purple}" stroke-width="3"/><path d="${val}" fill="none" stroke="${orange}" stroke-width="3" stroke-dasharray="6 4"/>`,'Training BCE in purple and validation BCE in dashed orange versus actual gradient updates.')}<p>Solid purple: training; dashed orange: validation. Displays the initial entry and up to 200 recent updates for the current data and penalty settings.</p></figure>`;
}

export const sourceKnnDefinition={
 initial:()=>({x:4.5,y:4,k:3,scale:1,ties:'Ascending'}),
 controls:[range('x','Query feature 1',0,8,.1),range('y','Query feature 2',0,8,.1),range('k','Neighbors k',1,10),range('scale','Feature 1 distance scale',.1,4,.1),select('ties','Equal-distance point order',['Ascending','Descending'])],
 pointer(s,p){s.x=Math.round(clamp((p.x-62)/340*8,0,8)*10)/10;s.y=Math.round(clamp((382-p.y)/340*8,0,8)*10)/10;},
 describe:s=>{const r=neighborVote(exerciseNeighbors,[s.x,s.y],s.k,s.scale,s.ties==='Descending');return `Query (${s.x}, ${s.y}), class ${r.label}, ${s.k} neighbors.`;},
 render(s){
  const vote=(x,y)=>neighborVote(exerciseNeighbors,[x,y],s.k,s.scale,s.ties==='Descending'),r=vote(s.x,s.y),a=chartAxes(0,8,0,8,'Feature 1','Feature 2',[0,2,4,6,8],[0,2,4,6,8],true),selected=new Set(r.neighbors.map(n=>n.index));
  const regions=Array.from({length:400},(_,i)=>{const x=i%20*.4,y=Math.floor(i/20)*.4,c=vote(x+.2,y+.2).label;return `<rect x="${a.X(x)}" y="${a.Y(y+.4)}" width="17.1" height="17.1" fill="${c==='0'?purple:orange}" opacity=".1"/>`}).join('');
  const marks=exerciseNeighbors.map(([x,y,c],i)=>`${selected.has(i)?`<circle cx="${a.X(x)}" cy="${a.Y(y)}" r="11" fill="none" stroke="#29222c"/>`:''}${c==='0'?`<circle cx="${a.X(x)}" cy="${a.Y(y)}" r="5" fill="${purple}"/>`:`<rect x="${a.X(x)-5}" y="${a.Y(y)-5}" width="10" height="10" fill="${orange}"/>`}${text(a.X(x)+10,a.Y(y)-13,i+1)}`).join('');
  const radius=r.neighbors.at(-1).distance,links=r.neighbors.map(n=>line(a.X(s.x),a.Y(s.y),a.X(exerciseNeighbors[n.index][0]),a.Y(exerciseNeighbors[n.index][1]),'class="neighbor-link"')).join('');
  return `<p>These ten labeled points rebuild the integer-grid neighborhood exercise. Tap or drag the query; sliders provide the same operation with a keyboard. All ranked distances and votes are calculated from the listed coordinates.</p>`+
   svg(`<defs><clipPath id="ml-knn-clip"><rect x="62" y="42" width="340" height="340"/></clipPath></defs>${regions}${a.body}<g clip-path="url(#ml-knn-clip)"><ellipse cx="${a.X(s.x)}" cy="${a.Y(s.y)}" rx="${radius/s.scale*340/8}" ry="${radius*340/8}" class="neighbor-radius"/>${links}${marks}<circle cx="${a.X(s.x)}" cy="${a.Y(s.y)}" r="9" fill="white" stroke="#222" stroke-width="2"/>${line(a.X(s.x)-5,a.Y(s.y),a.X(s.x)+5,a.Y(s.y))}${line(a.X(s.x),a.Y(s.y)-5,a.X(s.x),a.Y(s.y)+5)}</g>`,`kNN class ${r.label}; class 0 has ${r.votes['0']||0} votes and class 1 has ${r.votes['1']||0} votes.`,true,440)+
   summary(`Prediction <strong data-knn-class>${r.label}</strong><span>Class 0: ${r.votes['0']||0} votes · class 1: ${r.votes['1']||0} votes</span>`)+
   `<div class="plot-legend"><span>● Class 0 · ■ Class 1 · ⊕ Query</span><span>Outlined: selected neighbors</span></div><p>Distance = √[(scale × Δx₁)² + Δx₂²]. Axes remain in original coordinates with equal aspect ratio. The dashed contour reaches the kth neighbor: a circle at scale 1, an ellipse when the feature scale differs. Background cells sample predictions on a 20 × 20 grid; cell edges approximate the boundary.</p>`+
   `<p class="info-note" data-knn-tie>${r.cutoffTie?'Equal distances cross the k cutoff: neighbor ordering can change which points vote.':'No equal-distance tie crosses the k cutoff.'} ${r.voteTie?'Votes are tied; the declared class tie rule chooses class 0.':'There is a majority vote.'}</p>`+
   `<details open><summary>Inspect all ranked neighbors</summary>${table(['Rank','Point','Coordinates','Class','Distance²','Selected'],r.ranked.map((n,i)=>[i+1,n.index+1,`(${exerciseNeighbors[n.index][0]}, ${exerciseNeighbors[n.index][1]})`,n.label,fmt(n.distance**2,6),i<s.k?'Yes':'No']))}</details><p>Equal distances are ordered by point number, ascending or descending as selected. Equal class votes choose the lower class number (0). These are explicit conventions, not universal kNN rules. Odd k prevents binary equal-count votes but does not remove distance ties. Reset restores query (4.5,4), unscaled features, and k = 3.</p>`;
 }
};
