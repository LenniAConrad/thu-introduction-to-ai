import {esc} from './render.js';

const number=v=>v===0?'0':Math.abs(v)<.000001?v.toExponential(3):Number(v.toPrecision(6)).toString();
const display=v=>typeof v==='boolean'?v?'On':'Off':typeof v==='number'?number(v):v==null?'—':String(v);
const at=(s,path)=>path.split('.').reduce((value,key)=>value?.[key],s);
const cells=row=>row.map(v=>`<td>${esc(v)}</td>`).join('');
const table=(name,headers,rows)=>`<div class="comparison-table-wrap"><table class="difference-table"><caption>${name}</caption><thead><tr>${headers.map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${cells(row)}</tr>`).join('')}</tbody></table></div>`;

// Compare every declared control, including controls folded away in Guided mode.
// Model arrays are compared separately so equal controls never imply equal models.
export function comparisonDetails(def,before,after){
 const changed=def.controls.filter(c=>!Object.is(before[c.id],after[c.id]));
 let html=changed.length?table(`${changed.length} changed control${changed.length===1?'':'s'}`,['Setting','Pinned','Current'],changed.map(c=>[c.label,display(before[c.id]),display(after[c.id])])):'<p class="comparison-match">All declared control settings match.</p>';
 const arrays=[];
 for(const [path,label] of def.guide?.arrays||[]){
  const old=at(before,path),next=at(after,path);
  if(JSON.stringify(old)===JSON.stringify(next))continue;
  const differences=[];
  function walk(a,b,indices=[]){
   if(Array.isArray(a)||Array.isArray(b)){for(let i=0;i<Math.max(a?.length||0,b?.length||0);i++)walk(a?.[i],b?.[i],[...indices,i+1]);return}
   if(!Object.is(a,b))differences.push([`${label} [${indices.join(', ')}]`,display(a),display(b)]);
  }
  walk(old,next);arrays.push(`<details class="array-differences"><summary>${esc(label)}: ${differences.length} changed value${differences.length===1?'':'s'}</summary>${table('Changed array entries (indices start at 1)',['Entry','Pinned','Current'],differences)}</details>`);
 }
 html+=arrays.join('');
 if(def.guide?.metrics){
  const old=def.guide.metrics(before),next=def.guide.metrics(after),byKey=new Map(old.map(m=>[m.key,m])),current=new Map(next.map(m=>[m.key,m]));
  const rows=[...new Set([...old,...next].map(m=>m.key))].map(key=>{
   const previous=byKey.get(key),m=current.get(key),a=previous?.value,b=m?.value,both=Number.isFinite(a)&&Number.isFinite(b),delta=both?b-a:null,unit=m?.unit||previous?.unit||'';
   const label=previous&&m&&previous.label!==m.label?`${previous.label} → ${m.label}`:m?.label||`${previous.label} (removed)`;
   const value=x=>Number.isFinite(x)?number(x)+unit:'—';
   return [label,value(a),value(b),both?(delta===0?'0':`${delta>0?'+':''}${number(delta)}`)+(unit==='%'?' pp':unit):'—'];
  });
  html+=table('Computed results · current minus pinned',['Result','Pinned','Current','Change'],rows);
  html+='<p class="comparison-note">Values use the complete calculation, regardless of animation progress. Displayed numbers are rounded; “pp” means percentage points.</p>';
 }
 return `<div class="comparison-differences">${html}</div>`;
}
