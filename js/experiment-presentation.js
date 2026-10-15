// Keep the first view about the result. Numerical records and model notes remain
// available in the same experiment, without competing with its main diagram.
export function presentExperiment(doc,html,{guided=false,stepAction=false}={}){
 const template=doc.createElement('template');template.innerHTML=html;
 const root=template.content;
 if(guided)return template.innerHTML;
 const extra=doc.createElement('details');
 extra.className='lab-math experiment-details';extra.dataset.morphKey='experiment-details';
 const summary=doc.createElement('summary');summary.textContent='Numbers and explanation';extra.append(summary);
 let tables=0;
 const hasVisual=!!root.querySelector('svg,.vp-map-pair,.filter-maps,.np-token-figure');
 for(const node of [...root.children]){
  if(node.tagName==='DETAILS'){
   extra.append(node);continue;
  }
  if(node.matches('.table-scroll')){
   tables++;
   // Keep a small primary result table. Long records and secondary matrices are
   // inspectable below; their values, captions and accessible labels are intact.
   if(tables>1||(hasVisual&&node.querySelectorAll('tbody tr').length>8)){
    const heading=node.previousElementSibling;
    if(heading?.matches('h3,h4'))extra.append(heading);
    extra.append(node);
   }
   continue;
  }
  if(node.tagName==='P'&&!node.attributes.length&&!node.querySelector('button,input,select')&&![...node.querySelectorAll('*')].some(el=>[...el.attributes].some(a=>a.name.startsWith('data-')))&&node.textContent.trim().split(/\s+/).length>38){
   // Dynamic status paragraphs carry data attributes; legends and interaction
   // instructions have classes. Neither is hidden by this prose-only rule.
   const heading=node.previousElementSibling;
   if(heading?.matches('h3,h4'))extra.append(heading);
   extra.append(node);
  }
 }
 if(stepAction){
  const rows=[...root.children].filter(el=>el.matches('.lab-actions,.plot-actions'));
  const buttons=[...rows.flatMap(row=>[...row.children].filter(el=>el.matches('[data-lab-action="step"]'))),...[...root.children].filter(el=>el.matches('button[data-lab-action="step"]'))];
  for(const button of buttons){
   const row=doc.createElement('div');row.className='lab-actions';row.append(button);extra.append(row);
  }
  for(const row of rows)if(!row.children.length)row.remove();
 }
 if(extra.children.length>1)root.append(extra);
 return template.innerHTML;
}

// Labels describe what the student can change, while stored values stay stable
// for existing setup links and saved experiments.
export function controlOptionLabel(value){
 return value.replace(/\bfixture\b/gi,word=>word[0]==='F'?'Example':'example');
}

export function controlLabel(value){
 const names={
  'Declared score table':'Example scores',
  'Actual generator-training objective':'Generator objective',
  'Declared model initialization':'Model initialization',
  'Declared fixed input features':'Input features',
  'Declared scoring units':'Scoring units',
  'Declared loss surface':'Loss surface'
 };
 return names[value]||controlOptionLabel(value);
}
