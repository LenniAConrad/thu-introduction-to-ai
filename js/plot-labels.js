// Keep units and long explanations outside the scalable picture. Resize labels only;
// plot geometry, data, hit testing and numerical state retain their original coordinates.
export const plotNote=markup=>markup.replace('<text ','<text data-plot-caption ');

export function readablePlotLabels(result){
 const win=result.ownerDocument.defaultView;
 if(!win)return;
 for(const svg of result.querySelectorAll('svg')){
  if(typeof svg.getBBox!=='function')continue;
  const rect=svg.getBoundingClientRect(),view=svg.viewBox?.baseVal;
  if(!rect.width||!view?.width)continue;
  const matrix=svg.getScreenCTM();
  const scale=matrix?Math.hypot(matrix.a,matrix.b):Math.min(rect.width/view.width,rect.height/view.height);
  if(!scale)continue;
  for(const t of svg.querySelectorAll('text')){
   if(!t.getBoundingClientRect().width)continue;
   // Keep labels in place as their values change. Moving text into/out of a
   // caption based on its character count made whole experiments jump in height.
   if(!t.dataset.originalFont)t.dataset.originalFont=t.style.fontSize||'css';
   t.style.fontSize=t.dataset.originalFont==='css'?'':t.dataset.originalFont;
   if(t.x.baseVal.numberOfItems&&t.y.baseVal.numberOfItems){
    if(t.dataset.originalX===undefined){t.dataset.originalX=t.x.baseVal.getItem(0).value;t.dataset.originalY=t.y.baseVal.getItem(0).value}
    t.x.baseVal.getItem(0).value=+t.dataset.originalX;t.y.baseVal.getItem(0).value=+t.dataset.originalY;
   }
   const size=parseFloat(win.getComputedStyle(t).fontSize);
   if(size*scale<11.5)t.style.fontSize=(11.5/scale)+'px';
   const width=t.getBoundingClientRect().width;
   const limit=Math.min(rect.width-8,Number(t.dataset.labelMaxWidth||Infinity)*scale);
   if(width>limit&&limit>0)t.style.fontSize=(parseFloat(win.getComputedStyle(t).fontSize)*limit/width)+'px';
   // A CSS default must not override semantic contrast inside a colored node.
   if(t.hasAttribute('fill'))t.style.fill=t.getAttribute('fill');
   const b=t.getBoundingClientRect(),m=t.getScreenCTM();
   if(m&&t.x.baseVal.numberOfItems&&t.y.baseVal.numberOfItems){
    const dx=b.left<rect.left+2?rect.left+2-b.left:b.right>rect.right-2?rect.right-2-b.right:0;
    const dy=b.top<rect.top+2?rect.top+2-b.top:b.bottom>rect.bottom-2?rect.bottom-2-b.bottom:0;
    const determinant=m.a*m.d-m.b*m.c;
    if(determinant){
     t.x.baseVal.getItem(0).value+=(m.d*dx-m.c*dy)/determinant;
     t.y.baseVal.getItem(0).value+=(-m.b*dx+m.a*dy)/determinant;
    }
   }
  }
 }
}
