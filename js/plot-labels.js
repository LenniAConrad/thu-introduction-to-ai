// Keep units and long explanations outside the scalable picture. Resize labels only;
// plot geometry, data, hit testing and numerical state retain their original coordinates.
export function readablePlotLabels(result){
 const win=result.ownerDocument.defaultView;
 if(!win)return;
 for(const svg of result.querySelectorAll('svg')){
  if(typeof svg.getBBox!=='function')continue;
  const rect=svg.getBoundingClientRect(),view=svg.viewBox?.baseVal;
  if(!rect.width||!view?.width)continue;
  const scale=rect.width/view.width;
  for(const t of svg.querySelectorAll('text')){
   if(!t.getBoundingClientRect().width)continue;
   if(t.textContent.length>27){
    let caption=svg.nextElementSibling;
    if(!caption?.classList.contains('plot-text-key')){caption=result.ownerDocument.createElement('div');caption.className='plot-text-key';svg.after(caption)}
    const p=result.ownerDocument.createElement('p');p.textContent=t.textContent;caption.append(p);t.remove();continue;
   }
   if(!t.dataset.originalFont)t.dataset.originalFont=t.style.fontSize||'css';
   t.style.fontSize=t.dataset.originalFont==='css'?'':t.dataset.originalFont;
   if(t.x.baseVal.numberOfItems&&t.y.baseVal.numberOfItems){
    if(t.dataset.originalX===undefined){t.dataset.originalX=t.x.baseVal.getItem(0).value;t.dataset.originalY=t.y.baseVal.getItem(0).value}
    t.x.baseVal.getItem(0).value=+t.dataset.originalX;t.y.baseVal.getItem(0).value=+t.dataset.originalY;
   }
   const size=parseFloat(win.getComputedStyle(t).fontSize);
   if(size*scale<11.5)t.style.fontSize=(11.5/scale)+'px';
   const b=t.getBoundingClientRect(),m=t.getScreenCTM();
   if(m&&t.x.baseVal.numberOfItems&&t.y.baseVal.numberOfItems){
    const dx=b.left<rect.left+2?rect.left+2-b.left:b.right>rect.right-2?rect.right-2-b.right:0;
    const dy=b.top<rect.top+2?rect.top+2-b.top:b.bottom>rect.bottom-2?rect.bottom-2-b.bottom:0;
    if(dx&&m.a)t.x.baseVal.getItem(0).value+=dx/m.a;
    if(dy&&m.d)t.y.baseVal.getItem(0).value+=dy/m.d;
   }
  }
 }
}
