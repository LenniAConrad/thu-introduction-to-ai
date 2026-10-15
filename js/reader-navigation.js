// Save the reading position and update the collapsible outline without a toolbar.
export function bindReadingPosition(root,lesson,session){
 const win=root.ownerDocument.defaultView;
 const sections=[...root.querySelectorAll('[data-section]')];
 let pending=null,current='';
 function active(id){
  if(current===id||!lesson.sections.some(s=>s.id===id))return;
  current=id;
  for(const link of root.querySelectorAll('[data-section-link]')){const yes=link.dataset.sectionLink===id;link.classList.toggle('active',yes);if(yes)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current')}
  session?.write('position:'+lesson.id,id);session?.write('last',{id:lesson.id,section:id});
 }
 function update(){
  pending=null;
  if(root.querySelector('[data-reader-view]')?.dataset.readerView!=='full')return;
  const mobile=root.querySelector('.mobile-header')?.getBoundingClientRect(),desktop=root.querySelector('.sidebar')?.getBoundingClientRect();
  const threshold=(mobile?.height?mobile.bottom:desktop?.height?desktop.bottom:0)+32;
  const measured=sections.filter(s=>s.getBoundingClientRect().height>0);if(!measured.length)return;
  let visible=measured[0];for(const section of measured){if(section.getBoundingClientRect().top<=threshold)visible=section;else break}
  active(visible.dataset.section);
 }
 const scroll=()=>{if(pending===null)pending=win.requestAnimationFrame?win.requestAnimationFrame(update):win.setTimeout(update,16)};
 const hash=()=>{const target=win.location.hash.split('?')[0].split('/')[3];if(target)active(target)};
 win.addEventListener('scroll',scroll,{passive:true});win.addEventListener('resize',scroll);win.addEventListener('hashchange',hash);
 hash();
 return()=>{win.removeEventListener('scroll',scroll);win.removeEventListener('resize',scroll);win.removeEventListener('hashchange',hash);if(pending!==null){if(win.cancelAnimationFrame)win.cancelAnimationFrame(pending);else win.clearTimeout(pending)}};
}
