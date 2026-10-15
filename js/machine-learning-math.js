// Small, inspectable numerical models. No model service or persistence.
export const houseData=[[50,150],[70,200],[100,260],[120,300],[150,360]];
export const advertisingData=[[1,3],[2,5],[3,7],[4,9]];
export const exerciseNeighbors=[[2,5,'0'],[2,2,'0'],[3,3,'0'],[5,2,'0'],[6,3,'0'],[4,5,'1'],[5,6,'1'],[6,6,'1'],[7,7,'1'],[7,5,'1']];
export const errorMean=(targets,predictions)=>targets.reduce((sum,y,i)=>sum+(y-predictions[i])**2,0)/targets.length;
export function lineFit(points){
 const n=points.length,mx=points.reduce((s,p)=>s+p[0],0)/n,my=points.reduce((s,p)=>s+p[1],0)/n;
 const xx=points.reduce((s,p)=>s+(p[0]-mx)**2,0),xy=points.reduce((s,p)=>s+(p[0]-mx)*(p[1]-my),0);
 if(!xx)throw Error('A slope requires distinct feature values.');
 const w=xy/xx,b=my-w*mx;
 return {mx,my,xx,xy,w,b,mse:errorMean(points.map(p=>p[1]),points.map(p=>w*p[0]+b))};
}
export function lineGradient(points,w,b){
 const errors=points.map(([x,y])=>w*x+b-y),n=points.length;
 return {dw:2*errors.reduce((s,e,i)=>s+e*points[i][0],0)/n,db:2*errors.reduce((s,e)=>s+e,0)/n,
  da:2*errors.reduce((s,e,i)=>s+e*(points[i][0]-98)/50,0)/n,dc:2*errors.reduce((s,e)=>s+e,0)/n};
}
// Update normalized coordinates a=50w, c=b+98w together, then convert back.
export function lineStep(points,w,b,eta){
 const g=lineGradient(points,w,b),a=50*w-eta*g.da,c=b+98*w-eta*g.dc;
 return {w:a/50,b:c-98*a/50,g};
}
export function solveSystem(matrix,rhs){
 const n=rhs.length,a=matrix.map((row,i)=>[...row,rhs[i]]);
 for(let j=0;j<n;j++){
  let pivot=j;for(let i=j+1;i<n;i++)if(Math.abs(a[i][j])>Math.abs(a[pivot][j]))pivot=i;
  if(Math.abs(a[pivot][j])<1e-13)throw Error('The feature columns do not determine a unique fit.');
  [a[j],a[pivot]]=[a[pivot],a[j]];const d=a[j][j];for(let k=j;k<=n;k++)a[j][k]/=d;
  for(let i=0;i<n;i++)if(i!==j){const f=a[i][j];for(let k=j;k<=n;k++)a[i][k]-=f*a[j][k];}
 }
 return a.map(row=>row[n]);
}
export function leastSquares(features,targets,lambda=0){
 const d=features[0].length,n=features.length;
 const gram=Array.from({length:d},(_,j)=>Array.from({length:d},(_,k)=>features.reduce((s,row)=>s+row[j]*row[k],0)/n+(j===k&&j>0?lambda:0)));
 const rhs=Array.from({length:d},(_,j)=>features.reduce((s,row,i)=>s+row[j]*targets[i],0)/n);
 return solveSystem(gram,rhs);
}
export const referenceCurve=x=>1+0.55*Math.sin(x-0.4);
const trainingNoise=[.16,-.12,.23,-.21,.08,-.18,.2,-.09,.13];
export const curveTraining=trainingNoise.map((noise,i)=>{const x=i*.75;return [x,referenceCurve(x)+noise]});
export const curveValidation=Array.from({length:8},(_,i)=>{const x=.375+i*.75;return [x,referenceCurve(x)+[.04,-.06,.03,-.04,.05,-.02,.06,-.03][i]]});
export const polynomialFeatures=(x,degree)=>Array.from({length:degree+1},(_,j)=>((x-3)/3)**j);
export const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
export function curveFit(degree,lambda,training=curveTraining){
 const coefficients=leastSquares(training.map(p=>polynomialFeatures(p[0],degree)),training.map(p=>p[1]),lambda);
 const predict=x=>dot(coefficients,polynomialFeatures(x,degree));
 const mse=errorMean(training.map(p=>p[1]),training.map(p=>predict(p[0]))),validation=errorMean(curveValidation.map(p=>p[1]),curveValidation.map(p=>predict(p[0])));
 const norm=coefficients.slice(1).reduce((s,v)=>s+v*v,0),penalty=lambda*norm;
 return {coefficients,predict,mse,validation,norm,penalty,objective:mse+penalty};
}
// Added balanced teaching fixture, not empirical house data. Noise is orthogonal
// to the four design columns, making the OLS coefficients independently known.
export const multipleData=Array.from({length:8},(_,i)=>{
 const size=i&4?120:80,rooms=i&2?4:2,age=i&1?25:5;
 const noise=[-5,5,5,-5,5,-5,-5,5][i];
 return {size,rooms,age,price:20+2*size+15*rooms-age+noise};
});
export const multipleFit=()=>leastSquares(multipleData.map(p=>[1,p.size,p.rooms,p.age]),multipleData.map(p=>p.price));
export const sigmoid=z=>z>=0?1/(1+Math.exp(-z)):Math.exp(z)/(1+Math.exp(z));
export function logisticCalculation(weights,features,target,threshold=.5){
 const contributions=weights.map((w,i)=>w*(i?features[i-1]:1)),z=contributions.reduce((a,b)=>a+b,0),p=sigmoid(z);
 const loss=Math.max(z,0)-target*z+Math.log1p(Math.exp(-Math.abs(z))),gradient=[1,...features].map(x=>(p-target)*x);
 return {contributions,z,p,label:p>=threshold?1:0,loss,gradient};
}
export function logisticStep(weights,features,target,eta){
 const before=logisticCalculation(weights,features,target);
 const next=weights.map((w,i)=>w-eta*before.gradient[i]);
 return {weights:next,before,after:logisticCalculation(next,features,target)};
}
export const classifierTraining=[[-1.5,-1,0],[-1,-.3,0],[-.6,-1.4,0],[-.2,-.4,0],[.4,.2,1],[.7,1.3,1],[1.3,.4,1],[1.5,1.4,1]];
export const classifierValidation=[[-1.4,.2,0],[.2,-1.2,0],[1,.1,1],[-.1,1.1,1]];
export function classifierBatch(weights,points,lambda=0,threshold=.5){
 const rows=points.map(([x,y,target])=>logisticCalculation(weights,[x,y],target,threshold)),n=points.length;
 const gradient=weights.map((w,j)=>rows.reduce((s,r)=>s+r.gradient[j],0)/n+(j?2*lambda*w:0));
 const loss=rows.reduce((s,r)=>s+r.loss,0)/n,penalty=lambda*weights.slice(1).reduce((s,w)=>s+w*w,0);
 return {rows,gradient,loss,penalty,objective:loss+penalty,accuracy:rows.filter((r,i)=>r.label===points[i][2]).length/n};
}
export function classifierStep(weights,points,eta,lambda=0){
 const before=classifierBatch(weights,points,lambda),next=weights.map((w,i)=>w-eta*before.gradient[i]);
 return {weights:next,before,after:classifierBatch(next,points,lambda)};
}
export function neighborVote(points,query,k,scale=1,reverse=false){
 const ranked=points.map(([x,y,label],index)=>({index,label,distance:Math.hypot(scale*(x-query[0]),y-query[1])})).sort((a,b)=>a.distance-b.distance||(reverse?b.index-a.index:a.index-b.index));
 const neighbors=ranked.slice(0,k),votes={};for(const n of neighbors)votes[n.label]=(votes[n.label]||0)+1;
 const classes=Object.keys(votes).sort((a,b)=>votes[b]-votes[a]||Number(a)-Number(b));
 const voteTie=classes.length>1&&votes[classes[0]]===votes[classes[1]];
 const cutoffTie=k<ranked.length&&Math.abs(ranked[k-1].distance-ranked[k].distance)<1e-10;
 return {ranked,neighbors,votes,label:classes[0],voteTie,cutoffTie};
}
