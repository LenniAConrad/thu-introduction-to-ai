// Separate, versioned keys: never read or alter the retired study guide's data.
const prefix='thu-reader-v4:';
const sessions=new WeakMap();
export const copy=value=>structuredClone(value);
export function studySession(win){
 if(sessions.has(win))return sessions.get(win);
 const memory=new Map();
 const session={
  read(key,fallback=null){
   if(memory.has(key))return copy(memory.get(key));
   try{const raw=win.sessionStorage.getItem(prefix+key);if(raw&&raw.length<700000){const value=JSON.parse(raw);memory.set(key,value);return copy(value)}}catch{}
   return copy(fallback);
  },
  write(key,value){
   memory.set(key,copy(value));
   try{const raw=JSON.stringify(value);if(raw.length<700000)win.sessionStorage.setItem(prefix+key,raw)}catch{}
  }
 };
 sessions.set(win,session);return session;
}

// A shared setup contains only declared controls, never executable HTML or model data.
export function applySetup(def,values){
 const state=def.initial();
 if(!values||typeof values!=='object'||Array.isArray(values))return state;
 def.prepareSetup?.(state,values);
 for(const c of def.controls){
  if(!Object.hasOwn(values,c.id))continue;
  const v=values[c.id],bounds=def.bounds?.(state,c.id)||c;
  if(c.type==='range'){
   if(typeof v!=='number'||!Number.isFinite(v))continue;
   const min=bounds.min??c.min,max=bounds.max??c.max;
   state[c.id]=Math.max(min,Math.min(max,v));
  }else if(c.type==='select'){if(!c.options.includes(v))continue;state[c.id]=v}
  else if(c.type==='checkbox'){if(typeof v!=='boolean')continue;state[c.id]=v}
  else{if(typeof v!=='string'||v.length>1000)continue;state[c.id]=v}
  def.change?.(state,c.id);
 }
 return state;
}

// Retain existing nodes so chart colors, bar lengths and highlights can transition.
// This also keeps focus and expanded calculations stable during a model update.
export function morph(parent,html){
 const template=parent.ownerDocument.createElement('template');template.innerHTML=html;
 function patch(old,next){
  if(!old||old.nodeType!==next.nodeType||old.nodeName!==next.nodeName){const n=next.cloneNode(true);if(old)old.replaceWith(n);return n}
  if(old.nodeType===3){if(old.nodeValue!==next.nodeValue)old.nodeValue=next.nodeValue;return old}
  if(old.nodeType!==1)return old;
  for(const a of [...old.attributes])if(!next.hasAttribute(a.name)&&!(a.name==='open'&&old.tagName==='DETAILS'))old.removeAttribute(a.name);
  for(const a of [...next.attributes])if(old.getAttribute(a.name)!==a.value)old.setAttribute(a.name,a.value);
  children(old,next);return old;
 }
 function children(old,next){
  const nodes=[...next.childNodes];
  nodes.forEach((n,i)=>{if(old.childNodes[i])patch(old.childNodes[i],n);else old.append(n.cloneNode(true))});
  while(old.childNodes.length>nodes.length)old.lastChild.remove();
 }
 children(parent,template.content);
}
