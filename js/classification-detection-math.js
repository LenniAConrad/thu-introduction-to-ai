// Small declared fixtures and exact computations; no pretrained detector is implied.
export const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
export function statistics(values){const mean=values.reduce((a,b)=>a+b,0)/values.length,variance=values.reduce((a,v)=>a+(v-mean)**2,0)/values.length,histogram=Array(256).fill(0);values.forEach(v=>histogram[Math.round(clamp(v,0,255))]++);return {mean,variance,std:Math.sqrt(variance),histogram};}
export const grayFixture=()=>Array.from({length:4},(_,r)=>Array.from({length:4},(_,c)=>[0,64,128,255][2*Math.floor(r/2)+Math.floor(c/2)]));
export const rgbFixture=()=>Array.from({length:4},(_,r)=>Array.from({length:4},(_,c)=>[[220,40,30],[20,190,65],[45,75,230],[190,190,190]][2*Math.floor(r/2)+Math.floor(c/2)].slice()));
export function originalMeanImage(){const p=Array.from({length:10},()=>Array(10).fill(0));for(let r=2;r<=5;r++)for(let c=3;c<=7;c++)p[r][c]=90;p[4][4]=0;p[8][2]=90;return p;}
export function noisyImage(){return Array.from({length:24},(_,r)=>Array.from({length:24},(_,c)=>clamp((r<5?50:c%6<2?180:90)+(Math.sin(17*r+13*c)>0?25:-25),0,255)));}
export const kernels={Mean3:Array.from({length:3},()=>Array(3).fill(1/9)),Mean21:Array.from({length:21},()=>Array(21).fill(1/441)),Shift:[[1,0,0],[0,0,0],[0,0,0]],SobelX:[[-1,0,1],[-2,0,2],[-1,0,1]],SobelY:[[-1,-2,-1],[0,0,0],[1,2,1]]};
export function filterTrace(image,kernel,row,col,operation='Convolution',boundary='Valid'){
 const k=Math.floor(kernel.length/2),rows=[];let value=0;
 for(let u=0;u<kernel.length;u++)for(let v=0;v<kernel.length;v++){
  const sign=operation==='Convolution'?-1:1,r=row+sign*(u-k),c=col+sign*(v-k),inside=r>=0&&r<image.length&&c>=0&&c<image[0].length;
  const sample=inside?image[r][c]:boundary==='Replicate'?image[clamp(r,0,image.length-1)][clamp(c,0,image[0].length-1)]:0,product=sample*kernel[u][v];value+=product;rows.push({u:u-k,v:v-k,r,c,inside,sample,weight:kernel[u][v],product});
 }return {value,rows};
}
export function filter(image,kernel,operation='Convolution',boundary='Valid'){
 const k=Math.floor(kernel.length/2),origin=boundary==='Valid'?k:0,height=boundary==='Valid'?Math.max(0,image.length-2*k):image.length,width=boundary==='Valid'?Math.max(0,image[0].length-2*k):image[0].length;
 return {origin,image:Array.from({length:height},(_,r)=>Array.from({length:width},(_,c)=>filterTrace(image,kernel,r+origin,c+origin,operation,boundary).value))};
}
export const lbpPatch=[[7,1,12],[2,5,0],[3,5,15]],lbpOffsets=[[-1,-1],[-1,0],[-1,1],[0,1],[1,1],[1,0],[1,-1],[0,-1]];
export function lbp(p,row=1,col=1){const center=p[row][col],rows=lbpOffsets.map(([dr,dc],bit)=>{const value=p[row+dr][col+dc],binary=value>=center?1:0;return {dr,dc,value,binary,weight:2**bit,product:binary*2**bit}});return {center,rows,code:rows.reduce((a,r)=>a+r.product,0)};}
export function rgbToHsv([r,g,b]){r/=255;g/=255;b/=255;const max=Math.max(r,g,b),min=Math.min(r,g,b),delta=max-min;let hue=null;if(delta){hue=(max===r?(g-b)/delta:max===g?(b-r)/delta+2:(r-g)/delta+4)/6;hue=(hue+1)%1;}return {h:hue,s:max?delta/max:0,v:max};}
export function sceneImage(label=0,variant=0){return Array.from({length:12},(_,r)=>Array.from({length:12},(_,c)=>{
 let p;if(label===0)p=r<4?[55,145,220]:r<8?[35,115,195]:[220,185,110];else if(label===1)p=(r+c+variant)%3?[45,130,55]:[115,80,35];else p=(r%4===0||c%4===0)?[55,60,65]:[150,150,150];
 const offset=(variant%4-1.5)*4+(((r*13+c*7+variant)%5)-2)*2;return p.map(v=>clamp(v+offset,0,255));}));}
export function imageFeatures(image){const hue=Array(16).fill(0),texture=Array(8).fill(0),n=image.length*image[0].length;let achromatic=0;
 for(const p of image.flat()){const hsv=rgbToHsv(p);if(hsv.s<.05||hsv.h===null)achromatic++;else hue[Math.min(15,Math.floor(hsv.h*16))]++;}
 const gray=image.map(row=>row.map(p=>(p[0]+p[1]+p[2])/3));let count=0;for(let r=1;r<gray.length-1;r++)for(let c=1;c<gray[0].length-1;c++){texture[Math.floor(lbp(gray,r,c).code/32)]++;count++;}
 return {x:[...hue.map(v=>v/n),...texture.map(v=>count?v/count:0)],hue,texture,achromatic,gray,centers:count};
}
export const sceneLabels=['Beach','Forest','Urban city'];
export function sceneDataset(heldOut=false){return [0,1,2].flatMap(y=>(heldOut?[4,5,6,7]:[0,1,2,3]).map(variant=>{const image=sceneImage(y,variant);return {y,variant,image,x:[...imageFeatures(image).x,1]}}));}
export function svmPredict(w,x){const scores=w.map(row=>row.reduce((a,v,j)=>a+v*x[j],0)),choice=scores.indexOf(Math.max(...scores));return {scores,choice};}
export function svmBatch(w,data=sceneDataset(),lambda=.01){const gradient=w.map(row=>row.map(()=>0));let loss=0,correct=0;const rows=data.map(row=>{const p=svmPredict(w,row.x),margins=w.map((_,k)=>(row.y===k?1:-1)*p.scores[k]);margins.forEach((margin,k)=>{const y=row.y===k?1:-1;loss+=Math.max(0,1-margin)/(data.length*3);if(margin<1)row.x.forEach((x,j)=>gradient[k][j]-=y*x/(data.length*3))});correct+=p.choice===row.y;return {...row,...p,margins}});w.forEach((row,k)=>row.slice(0,-1).forEach((v,j)=>{loss+=.5*lambda*v*v;gradient[k][j]+=lambda*v}));return {loss,gradient,accuracy:correct/data.length,rows};}
export function seeded(seed=7){return ()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};}
export function pattern(y=0,position=3,brightness=1,noise=0){return Array.from({length:8},(_,r)=>Array.from({length:8},(_,c)=>{const on=(y!==1&&c===position&&r>=1&&r<=6)||(y!==0&&r===position&&c>=1&&c<=6);return clamp((on?.95:.05)*brightness+noise*Math.sin(19*r+11*c));}));}
export function cnnDataset(heldOut=false){return [0,1,2].flatMap(y=>[2,3,4,5].map(position=>({y,position,image:pattern(y,position,heldOut?.8:1,heldOut?.02:0)})));}
export function cnnInitial(){const random=seeded(19);return Array.from({length:77},(_,j)=>j===9||j===19?.1:(random()-.5)*.4);}
export function softmax(logits){const max=Math.max(...logits),e=logits.map(v=>Math.exp(v-max)),sum=e.reduce((a,b)=>a+b);return e.map(v=>v/sum);}
export function cnnForward(w,image){
 const z=[],activation=[],pooled=[],argmax=[];
 for(let k=0;k<2;k++){z[k]=Array.from({length:6},(_,r)=>Array.from({length:6},(_,c)=>{let v=w[k*10+9];for(let u=0;u<3;u++)for(let t=0;t<3;t++)v+=w[k*10+u*3+t]*image[r+u][c+t];return v}));activation[k]=z[k].map(row=>row.map(v=>Math.max(0,v)));argmax[k]=[];pooled[k]=Array.from({length:3},(_,r)=>Array.from({length:3},(_,c)=>{const candidates=[[2*r,2*c],[2*r,2*c+1],[2*r+1,2*c],[2*r+1,2*c+1]],values=candidates.map(([a,b])=>activation[k][a][b]),index=values.indexOf(Math.max(...values));(argmax[k][r]??=[])[c]=candidates[index];return values[index]}));}
 const flat=pooled.flat(2),logits=Array.from({length:3},(_,k)=>w[20+k*19+18]+flat.reduce((a,v,j)=>a+v*w[20+k*19+j],0)),probabilities=softmax(logits);return {z,activation,pooled,argmax,flat,logits,probabilities,choice:probabilities.indexOf(Math.max(...probabilities))};
}
export function cnnExample(w,image,y){const f=cnnForward(w,image),max=Math.max(...f.logits),loss=max+Math.log(f.logits.reduce((a,v)=>a+Math.exp(v-max),0))-f.logits[y],gradient=Array(77).fill(0),df=Array(18).fill(0);
 for(let k=0;k<3;k++){const dz=f.probabilities[k]-(k===y?1:0);gradient[20+k*19+18]=dz;f.flat.forEach((v,j)=>{gradient[20+k*19+j]=dz*v;df[j]+=dz*w[20+k*19+j]});}
 for(let k=0;k<2;k++)for(let r=0;r<3;r++)for(let c=0;c<3;c++){const [a,b]=f.argmax[k][r][c],dz=f.z[k][a][b]>0?df[k*9+r*3+c]:0;gradient[k*10+9]+=dz;for(let u=0;u<3;u++)for(let v=0;v<3;v++)gradient[k*10+u*3+v]+=dz*image[a+u][b+v];}
 return {...f,loss,gradient};
}
export function cnnBatch(w,data=cnnDataset()){const gradient=Array(77).fill(0);let loss=0,correct=0;const rows=data.map(row=>{const r=cnnExample(w,row.image,row.y);loss+=r.loss/data.length;r.gradient.forEach((v,j)=>gradient[j]+=v/data.length);correct+=r.choice===row.y;return {...row,...r}});return {loss,gradient,accuracy:correct/data.length,rows};}
export function metricDataset(imbalanced=false){const P=[.95,.9,.85,.8,.7,.6,.4,.3,.2,.1],N=[.8,.55,.45,.4,.35,.3,.25,.2,.15,.05];return [...P.map(score=>({y:1,score})),...Array.from({length:imbalanced?9:1},()=>N.map(score=>({y:0,score}))).flat()].map((r,i)=>({...r,id:i+1}));}
export function metrics(data,threshold=.5){const counts={tp:0,fn:0,fp:0,tn:0},rows=data.map(row=>{const prediction=row.score>=threshold?1:0,cell=row.y?(prediction?'tp':'fn'):(prediction?'fp':'tn');counts[cell]++;return {...row,prediction,cell}}),{tp,fn,fp,tn}=counts,ratio=(a,b)=>b?a/b:null;return {...counts,rows,precision:ratio(tp,tp+fp),recall:ratio(tp,tp+fn),specificity:ratio(tn,tn+fp),npv:ratio(tn,tn+fn),accuracy:ratio(tp+tn,data.length),f1:ratio(2*tp,2*tp+fp+fn)};}
export function precisionRecall(data){return [...new Set([1,...data.map(r=>r.score),0])].sort((a,b)=>b-a).map(threshold=>({threshold,...metrics(data,threshold)}));}
export const boxCorners=b=>[b.x-b.w/2,b.y-b.h/2,b.x+b.w/2,b.y+b.h/2];
export function encodeBox(proposal,target){return [(target.x-proposal.x)/proposal.w,(target.y-proposal.y)/proposal.h,Math.log(target.w/proposal.w),Math.log(target.h/proposal.h)];}
export function decodeBox(proposal,[tx,ty,tw,th]){return {...proposal,x:proposal.x+proposal.w*tx,y:proposal.y+proposal.h*ty,w:proposal.w*Math.exp(tw),h:proposal.h*Math.exp(th)};}
export function overlap(a,b){const A=boxCorners(a),B=boxCorners(b),intersection=Math.max(0,Math.min(A[2],B[2])-Math.max(A[0],B[0]))*Math.max(0,Math.min(A[3],B[3])-Math.max(A[1],B[1])),union=a.w*a.h+b.w*b.h-intersection;return {intersection,union,iou:union>0?intersection/union:null};}
export function nms(boxes,scoreThreshold=.5,iouThreshold=.5,classAware=true){let pending=boxes.filter(b=>b.score>=scoreThreshold).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id)),kept=[],trace=[];while(pending.length){const selected=pending.shift(),suppressed=[],next=[];kept.push(selected);for(const other of pending){const comparison=overlap(selected,other),same=!classAware||selected.label===other.label;if(same&&comparison.iou>iouThreshold)suppressed.push({id:other.id,...comparison});else next.push(other)}trace.push({selected:selected.id,kept:kept.map(b=>b.id),suppressed,pending:next.map(b=>b.id)});pending=next;}return {kept,trace};}
export const suppliedProposals=()=>[{id:'A',x:90,y:110,w:60,h:120,label:'Person',score:.9,delta:[0,0,0,0]},{id:'B',x:94,y:112,w:64,h:116,label:'Person',score:.85,delta:[0,0,0,0]},{id:'C',x:200,y:105,w:50,h:130,label:'Person',score:.8,delta:[0,0,0,0]},{id:'D',x:90,y:110,w:60,h:120,label:'Ball',score:.7,delta:[0,0,0,0]},{id:'E',x:255,y:220,w:35,h:35,label:'Ball',score:.65,delta:[0,0,0,0]},{id:'F',x:258,y:222,w:40,h:32,label:'Ball',score:.55,delta:[0,0,0,0]}];
export const sceneTruth=[{id:'P1',x:90,y:110,w:60,h:120,label:'Person'},{id:'P2',x:200,y:105,w:50,h:130,label:'Person'},{id:'Ball',x:255,y:220,w:35,h:35,label:'Ball'}];
export function detectionEvaluation(boxes,truth=sceneTruth,threshold=.5){const matched=new Set(),rows=[...boxes].sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id)).map(box=>{const options=truth.filter(t=>t.label===box.label&&!matched.has(t.id)).map(t=>({id:t.id,iou:overlap(box,t).iou})).sort((a,b)=>b.iou-a.iou||a.id.localeCompare(b.id)),best=options[0],tp=best?.iou>=threshold;if(tp)matched.add(best.id);return {id:box.id,tp:!!tp,target:tp?best.id:null,iou:best?.iou??null}});return {rows,tp:matched.size,fp:boxes.length-matched.size,fn:truth.length-matched.size};}
export function gridEncode(box,S=7){const col=Math.min(S-1,Math.floor(box.x*S)),row=Math.min(S-1,Math.floor(box.y*S));return {row,col,bx:box.x*S-col,by:box.y*S-row,w:box.w,h:box.h};}
export function gridDecode(cell,coords,S=7){return {x:(cell.col+coords.bx)/S,y:(cell.row+coords.by)/S,w:coords.w,h:coords.h};}
