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
 const focused=parent.contains(parent.ownerDocument.activeElement)?parent.ownerDocument.activeElement:null;
 const selection=focused&&typeof focused.selectionStart==='number'?[focused.selectionStart,focused.selectionEnd]:null;
 function key(node){
  if(node?.nodeType!==1)return null;
  for(const name of ['data-morph-key','data-ui','data-param','data-direct','data-story-inspect','data-lab-action'])if(node.hasAttribute(name))return name+':'+node.getAttribute(name);
  if(node.hasAttribute('data-lab-set'))return 'set:'+node.getAttribute('data-lab-set')+':'+node.getAttribute('data-value');
  if(node.tagName==='DETAILS')return 'details:'+node.querySelector('summary')?.textContent;
  return null;
 }
 function patch(old,next){
  if(!old||old.nodeType!==next.nodeType||old.nodeName!==next.nodeName){const n=next.cloneNode(true);if(old)old.replaceWith(n);return n}
  if(old.nodeType===3){if(old.nodeValue!==next.nodeValue)old.nodeValue=next.nodeValue;return old}
  if(old.nodeType!==1)return old;
  for(const a of [...old.attributes])if(!next.hasAttribute(a.name)&&!(a.name==='open'&&old.tagName==='DETAILS'))old.removeAttribute(a.name);
  for(const a of [...next.attributes])if(!(a.name==='open'&&old.tagName==='DETAILS')&&old.getAttribute(a.name)!==a.value)old.setAttribute(a.name,a.value);
  children(old,next);
  // Setting a value attribute does not update an input after the user has edited
  // it. Keep direct editors correct when selecting another cell or undoing.
  if(old.tagName==='INPUT'){
   if(['checkbox','radio'].includes(old.type))old.checked=next.checked;
   else if(old.value!==next.value&&!(old===old.ownerDocument.activeElement&&old.type==='number'&&old.value!==''&&Number(old.value)===Number(next.value)))old.value=next.value;
  }else if(old.tagName==='SELECT'||old.tagName==='TEXTAREA'){if(old.value!==next.value)old.value=next.value}
  return old;
 }
 function children(old,next){
  const nodes=[...next.childNodes];
  nodes.forEach((n,i)=>{
   const k=key(n),current=old.childNodes[i];
   if(k){
    const match=[...old.childNodes].slice(i).find(candidate=>key(candidate)===k);
    if(match){if(match!==current)old.insertBefore(match,current||null);patch(match,n)}
    else old.insertBefore(n.cloneNode(true),current||null);
   }else if(current&&!key(current))patch(current,n);
   else old.insertBefore(n.cloneNode(true),current||null);
  });
  while(old.childNodes.length>nodes.length)old.lastChild.remove();
 }
 children(parent,template.content);
 // Moving a retained element can still blur its focused descendant in browsers.
 // Restore that same control without scrolling the diagram away from the user.
 if(focused?.isConnected&&parent.contains(focused)&&!focused.disabled&&parent.ownerDocument.activeElement!==focused){
  let visible=true;
  for(let p=focused;p&&p!==parent;p=p.parentElement)if(p.hidden||p.tagName==='DETAILS'&&!p.open&&!p.querySelector('summary')?.contains(focused)){visible=false;break}
  if(visible){focused.focus({preventScroll:true});if(selection)focused.setSelectionRange(...selection)}
 }
}
