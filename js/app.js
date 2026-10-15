import {esc} from './render.js';
import {landingHTML,selectorHTML} from './landing.js';
import {readerHTML} from './reading.js';
import {mountLab,labCatalog} from './labs.js';
import {workedHTML,bindWorked} from './worked.js';

export function createApp(root,allLessons){
 const lessons=allLessons.filter(l=>l.group!=='Coursework');
 const byId=new Map(lessons.map(l=>[l.id,l]));
 const questions=new Map(lessons.flatMap(l=>l.questions).map(q=>[q.id,q]));
 // Answers live only in this page's memory. No storage reads or writes.
 const answers={};
 let cleanup=[],route='';
 const focus=el=>{if(!el)return;el.tabIndex=-1;el.focus({preventScroll:true})};
 function quizHTML(q){
  const answer=answers[q.id];
  return `<form class="quiz" data-quiz="${esc(q.id)}" aria-labelledby="prompt-${esc(q.id)}"><h3 id="prompt-${esc(q.id)}">${esc(q.prompt)}</h3><div class="choices">${q.choices.map((choice,i)=>`<label class="quiz-choice ${answer&&i===q.answer?'correct':''}"><input type="radio" name="${esc(q.id)}" value="${i}" ${answer?.choice===i?'checked':''} ${answer?'disabled':''}>${esc(choice)}</label>`).join('')}</div>${answer?`<div role="status" tabindex="-1"><strong>${answer.correct?'Correct':'Try a different approach'}</strong><p>${esc(q.why)}</p><button class="button subtle" type="button" data-action="retry" data-id="${esc(q.id)}">Try again</button></div>`:'<button class="button" type="submit">Check answer</button><p class="quiz-status" role="status"></p>'}</form>`;
 }
 function lessonHTML(l){
  return `<div class="lecture-page"><a class="back-link" href="#/lectures">← Lectures</a><header class="lesson-header"><div><span class="eyebrow">LECTURE ${String(lessons.indexOf(l)+1).padStart(2,'0')} · ${esc(l.group)}</span><h1>${esc(l.title)}</h1><p>${esc(l.id==='introduction'?'History, approaches to AI, and the problems intelligent systems solve.':l.summary)}</p></div></header>${readerHTML(l,null,{quizHTML,workedHTML,labCatalog})}</div>`;
 }
 function destination(){
  const [page,id,section]=(window.location.hash.slice(1)||'/').split('/').filter(Boolean);
  if(page==='lesson'&&byId.has(id)&&(!section||byId.get(id).sections.some(s=>s.id===section)))return {id,section};
  return null;
 }
 function position(){
  const target=destination();
  if(target?.section){
   root.querySelectorAll('[data-section-link]').forEach(a=>{const active=a.dataset.sectionLink===target.section;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current')});
   const heading=root.querySelector(`#heading-${target.section}`);focus(heading);heading?.scrollIntoView?.({block:'start'});
  }else{focus(root.querySelector('.page-content h1'));window.scrollTo?.(0,0)}
 }
 function render(){
  cleanup.forEach(f=>f());cleanup=[];
  route=window.location.hash.slice(1)||'/';
  const page=route.split('/').filter(Boolean)[0],target=destination();
  const body=route==='/'?landingHTML(lessons):page==='lectures'||page==='lessons'?selectorHTML(lessons):target?lessonHTML(byId.get(target.id)):'<h1>Page not found</h1><a class="button" href="#/">Back to course</a>';
  root.innerHTML=`<a class="skip-link" href="#main-content" data-action="skip">Skip to content</a><header class="mobile-header"><a href="#/">Introduction to AI</a><button class="button subtle" data-action="menu" aria-label="Toggle navigation" aria-expanded="false">Menu</button></header><aside class="sidebar"><a class="brand" href="#/"><span class="brand-mark">AI</span><div><strong>Introduction to AI</strong><small>JUNGONG HAN · TSINGHUA</small></div></a><nav aria-label="Course"><a href="#/" ${route==='/'?'class="active" aria-current="page"':''}>Home</a><a href="#/lectures" ${page==='lectures'||page==='lessons'||target?'class="active" aria-current="page"':''}>Lectures</a></nav></aside><main id="main-content" class="main" tabindex="-1"><div class="page-content">${body}</div><footer class="site-footer"><span>Introduction to Artificial Intelligence</span><a href="#/lectures">All lectures</a></footer></main>`;
  root.querySelectorAll('[data-lab]').forEach(el=>cleanup.push(mountLab(el,el.dataset.lab)));
  cleanup.push(bindWorked(root));
 }
 function changed(){
  const target=destination(),reader=root.querySelector('[data-reader-lesson]');
  if(!(target&&reader?.dataset.readerLesson===target.id))render();
  root.querySelector('.sidebar')?.classList.remove('open');
  root.querySelector('[data-action=menu]')?.setAttribute('aria-expanded','false');
  position();
 }
 function onClick(e){
  const button=e.target.closest('[data-action]');if(!button)return;
  if(button.dataset.action==='skip'){e.preventDefault();root.querySelector('#main-content').focus();return}
  if(button.dataset.action==='menu'){const sidebar=root.querySelector('.sidebar');sidebar.classList.toggle('open');button.setAttribute('aria-expanded',String(sidebar.classList.contains('open')));return}
  if(button.dataset.action==='retry'){
   const id=button.dataset.id,q=questions.get(id);if(!q)return;
   delete answers[id];const form=root.querySelector(`[data-quiz="${id}"]`);form.outerHTML=quizHTML(q);root.querySelector(`[data-quiz="${id}"] input`)?.focus({preventScroll:true});
  }
 }
 function onSubmit(e){
  const jump=e.target.closest('[data-lecture-jump]');
  if(jump){e.preventDefault();const id=jump.querySelector('select').value;if(byId.has(id))window.location.hash='/lesson/'+id;return}
  const form=e.target.closest('[data-quiz]');if(!form)return;e.preventDefault();
  const checked=form.querySelector('input:checked');if(!checked){form.querySelector('.quiz-status').textContent='Choose an answer first.';return}
  const q=questions.get(form.dataset.quiz);if(!q)return;
  const choice=Number(checked.value);answers[q.id]={choice,correct:choice===q.answer};form.outerHTML=quizHTML(q);focus(root.querySelector(`[data-quiz="${q.id}"] [role=status]`));
 }
 function keyboard(e){if(e.key==='Escape'){const side=root.querySelector('.sidebar');if(side?.classList.contains('open')){side.classList.remove('open');const button=root.querySelector('[data-action=menu]');button?.setAttribute('aria-expanded','false');button?.focus()}}}
 function imageError(e){const img=e.target;if(img.tagName==='IMG'&&!img.dataset.failed){img.dataset.failed='true';img.hidden=true}}
 root.addEventListener('click',onClick);root.addEventListener('submit',onSubmit);root.addEventListener('error',imageError,true);window.addEventListener('hashchange',changed);document.addEventListener('keydown',keyboard);
 render();if(destination()?.section)position();
 return {render,getState:()=>({answers}),destroy(){cleanup.forEach(f=>f());root.removeEventListener('click',onClick);root.removeEventListener('submit',onSubmit);root.removeEventListener('error',imageError,true);window.removeEventListener('hashchange',changed);document.removeEventListener('keydown',keyboard)}};
}
