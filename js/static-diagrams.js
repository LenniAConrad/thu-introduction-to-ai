import {esc} from './render.js';

// Static figures remain complete in ordinary reading, on narrow screens and in print.
// Comparison tables reflow by record; numeric matrices retain their spatial columns.
export function staticDiagramHTML(id,html){
 if(!html)return '';
 html=html.replace('<figure class="','<figure data-static-figure="'+esc(id)+'" class="');
 return html.replace(/<table([^>]*)>\s*<thead>([\s\S]*?)<\/thead>\s*<tbody>([\s\S]*?)<\/tbody>\s*<\/table>/g,(_match,attrs,head,body)=>{
  const headers=[...head.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)].map(m=>m[1].replace(/<[^>]+>/g,''));
  const matrix=headers.length>1&&headers.slice(1).every(h=>/^\d+$/.test(h));
  const rowHead=head.replace(/<tr>/g,'<tr role="row">').replace(/<th>/g,'<th role="columnheader" scope="col">');
  const rows=body.replace(/<tr>([\s\S]*?)<\/tr>/g,(_row,cells)=>{let i=0;return '<tr role="row">'+cells.replace(/<(td|th)([^>]*)>([\s\S]*?)<\/(td|th)>/g,(_cell,tag,a,value)=>{
   const label=headers[i++]||'',cellTag=matrix&&i===1?'th':tag,role=cellTag==='th'?'rowheader':'cell';return `<${cellTag}${a} role="${role}"${cellTag==='th'?' scope="row"':''} data-label="${label.replace(/"/g,'&quot;')}">${value}</${cellTag}>`;
  })+'</tr>';});
  return `<table${attrs} class="${matrix?'diagram-matrix':'diagram-records'}" role="table"><thead>${rowHead}</thead><tbody>${rows}</tbody></table>`;
 });
}

export const diagramBox=(title,body)=>`<div class="intro-diagram-box"><strong>${esc(title)}</strong>${body.startsWith('<')?body:`<p>${esc(body)}</p>`}</div>`;
export const diagramGrid=items=>`<div class="intro-grid">${items.map(x=>diagramBox(...x)).join('')}</div>`;
export const diagramFlow=items=>`<div class="intro-diagram-flow">${items.map(x=>diagramBox(...x)).join('<span class="intro-flow-arrow" aria-hidden="true">→</span>')}</div>`;
export const diagramLegend=items=>`<ul class="diagram-legend">${items.map(({label,color,dashed=false,marker})=>`<li><i aria-hidden="true" style="--series:${color}" class="${dashed?'dashed ':''}${marker||''}"></i><span>${esc(label)}</span></li>`).join('')}</ul>`;

// Axes occupy fixed space; units and legends are HTML, so they wrap without shrinking.
export function curvePlot({label,xLabel,yLabel,xDomain,yDomain,xTicks,yTicks,series,points=[],logX=false}){
 const [x0,x1]=xDomain,[y0,y1]=yDomain,X=x=>52+288*(logX?Math.log(x/x0)/Math.log(x1/x0):(x-x0)/(x1-x0)),Y=y=>218-198*(y-y0)/(y1-y0);
 const grid=yTicks.map(t=>{const v=typeof t==='number'?t:t.value,l=typeof t==='number'?t:t.label;return `<path d="M52 ${Y(v)}H340" stroke="#e4dfe5"/><text x="42" y="${Y(v)+5}" text-anchor="end">${esc(l)}</text>`}).join('');
 const ticks=xTicks.map(t=>{const v=typeof t==='number'?t:t.value,l=typeof t==='number'?t:t.label;return `<path d="M${X(v)} 218v5" stroke="#786d7a"/><text x="${X(v)}" y="242" text-anchor="${v===x0?'start':v===x1?'end':'middle'}">${esc(l)}</text>`}).join('');
 const lines=series.map(s=>`<polyline points="${s.values.map(([x,y])=>`${X(x)},${Y(y)}`).join(' ')}" fill="none" stroke="${s.color}" stroke-width="2.5"${s.dashed?' stroke-dasharray="6 4"':''}/>`).join('');
 const marks=points.map(p=>p.square?`<rect x="${X(p.x)-5}" y="${Y(p.y)-5}" width="10" height="10" fill="${p.color}" stroke="white"/>`:`<circle cx="${X(p.x)}" cy="${Y(p.y)}" r="4.5" fill="${p.color}" stroke="white"/>`).join('');
 return `<div class="diagram-chart"><p class="diagram-axis-title">${esc(yLabel)}</p><svg class="intro-plot" viewBox="0 0 360 250" role="img" aria-label="${esc(label)}">${grid}<path d="M52 20V218H340" fill="none" stroke="#786d7a"/>${ticks}${lines}${marks}</svg><p class="diagram-axis-label">${esc(xLabel)}</p></div>`;
}
