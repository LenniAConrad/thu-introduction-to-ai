import {esc} from './render.js';

export function readerNavigationHTML(lesson,labCatalog){
 const experiments=lesson.sections.flatMap(s=>(s.reading?.visuals||[]).map(v=>({section:s.id,id:v.id,title:labCatalog.find(l=>l[0]===v.id)?.[1]||v.id})));
 return `<nav class="reader-navigation" aria-label="Reading navigation"><label><span class="eyebrow">IN THIS LECTURE</span><select data-reading-section aria-label="Jump to section">${lesson.sections.map((s,i)=>`<option value="${s.id}">${i+1}. ${esc(s.title)}</option>`).join('')}</select></label><label><span class="eyebrow">TRY AN EXPERIMENT</span><select data-reading-experiment aria-label="Jump to experiment"><option value="">Choose an experiment…</option>${experiments.map(x=>`<option value="${x.section}?lab=${x.id}">${esc(x.title)}</option>`).join('')}</select></label><span class="reading-position" data-reading-position>1 / ${lesson.sections.length}</span></nav>`;
}

export function bindReaderNavigation(root,lesson,session){
 const win=root.ownerDocument.defaultView,nav=root.querySelector('.reader-navigation');if(!nav)return ()=>{};
 const sections=[...root.querySelectorAll('[data-section]')],select=nav.querySelector('[data-reading-section]');
 let pending=null,current='';
 function active(id){
  if(current===id||!lesson.sections.some(s=>s.id===id))return;
  current=id;select.value=id;nav.querySelector('[data-reading-position]').textContent=`${lesson.sections.findIndex(s=>s.id===id)+1} / ${lesson.sections.length}`;
  for(const link of root.querySelectorAll('[data-section-link]')){const yes=link.dataset.sectionLink===id;link.classList.toggle('active',yes);if(yes)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current')}
  session?.write('position:'+lesson.id,id);session?.write('last',{id:lesson.id,section:id});
 }
 function update(){
  pending=null;const threshold=nav.getBoundingClientRect().bottom+32;
  const measured=sections.filter(s=>s.getBoundingClientRect().height>0);if(!measured.length)return;
  let visible=measured[0];for(const section of measured){if(section.getBoundingClientRect().top<=threshold)visible=section;else break}
  active(visible.dataset.section);
 }
 const scroll=()=>{if(pending===null)pending=win.requestAnimationFrame?win.requestAnimationFrame(update):win.setTimeout(update,16)};
 const change=e=>{if(e.target===select)win.location.hash=`/lesson/${lesson.id}/${select.value}`;if(e.target.matches('[data-reading-experiment]')&&e.target.value){win.location.hash=`/lesson/${lesson.id}/${e.target.value}`;e.target.value=''}};
 const hash=()=>{const target=win.location.hash.split('?')[0].split('/')[3];if(target)active(target)};
 nav.addEventListener('change',change);win.addEventListener('scroll',scroll,{passive:true});win.addEventListener('resize',scroll);win.addEventListener('hashchange',hash);
 hash();
 return()=>{nav.removeEventListener('change',change);win.removeEventListener('scroll',scroll);win.removeEventListener('resize',scroll);win.removeEventListener('hashchange',hash);if(pending!==null){if(win.cancelAnimationFrame)win.cancelAnimationFrame(pending);else win.clearTimeout(pending)}};
}
