import {studySession} from './study-session.js';
import {bindReadingPosition} from './reader-navigation.js';
import {courseGuide} from './course-guide.js';
import {esc} from './render.js';
import {landingHTML,selectorHTML,lessonSummary,bindLearningPreview} from './landing.js';
import {readerHTML} from './reading.js';
import {mountLab,labCatalog} from './labs.js';
import {workedHTML,bindWorked} from './worked.js';

export function createApp(root,allLessons){
 const lessons=allLessons.filter(l=>l.group!=='Coursework');
 const byId=new Map(lessons.map(l=>[l.id,l]));
 const questions=new Map(lessons.flatMap(l=>l.questions).map(q=>[q.id,q]));
 const session=studySession(root.ownerDocument.defaultView);
 const savedAnswers=session.read('answers',{}),answers={};
 for(const [id,a] of Object.entries(savedAnswers||{})){const q=questions.get(id);if(q&&Number.isInteger(a?.choice)&&a.choice>=0&&a.choice<q.choices.length)answers[id]={choice:a.choice,correct:a.choice===q.answer}}
 let cleanup=[],route='',mountedLabs=new Set(),readerView='';
 const focus=el=>{if(!el)return;el.tabIndex=-1;el.focus({preventScroll:true})};
 function quizHTML(q){
  const answer=answers[q.id];
  const choices=q.choices.map((choice,i)=>{
   const chosen=answer?.choice===i,correct=!!answer&&i===q.answer;
   const state=correct?'correct':chosen?'incorrect':'';
   const tag=answer&&(chosen||correct)?`<small class="quiz-answer-label">${correct?(chosen?'Your answer · correct':'Correct answer'):'Your answer'}</small>`:'';
   return `<label class="quiz-choice ${state}"><input type="radio" name="${esc(q.id)}" value="${i}" ${chosen?'checked':''} ${answer?'disabled':''}><span>${esc(choice)}${tag}</span></label>`;
  }).join('');
  return `<form class="quiz" data-quiz="${esc(q.id)}" aria-labelledby="prompt-${esc(q.id)}"><h3 id="prompt-${esc(q.id)}">${esc(q.prompt)}</h3><div class="choices" role="radiogroup" aria-labelledby="prompt-${esc(q.id)}">${choices}</div>${answer?`<div class="quiz-feedback" role="status" tabindex="-1"><strong>${answer.correct?'Correct.':'Not quite.'}</strong>${answer.correct?'':`<p class="quiz-correction">Correct answer: ${esc(q.choices[q.answer])}</p>`}<p>${esc(q.why)}</p><button class="button subtle" type="button" data-action="retry" data-id="${esc(q.id)}">Try again</button></div>`:'<button class="button" type="submit">Check answer</button><p class="quiz-status" role="status"></p>'}</form>`;
 }
 function lessonHTML(l){
  const guide=courseGuide(l);
  const index=lessons.indexOf(l),previous=lessons[index-1],next=lessons[index+1];
  const link=(lesson,direction)=>`<a class="lecture-${direction}" rel="${direction==='previous'?'prev':'next'}" href="#/lesson/${esc(lesson.id)}/${esc(lesson.sections[0].id)}"><span>${direction==='previous'?'← Previous lecture':'Next lecture →'}</span><strong>${esc(lesson.title)}</strong></a>`;
  const navigation=`<nav class="lesson-navigation" aria-label="Lecture navigation">${previous?link(previous,'previous'):''}${next?link(next,'next'):'<a href="#/lectures"><span>Return to the course</span><strong>Browse all lectures →</strong></a>'}</nav>`;
  return `<div class="lecture-page"><a class="back-link" href="#/lectures">← All lectures</a><header class="lesson-header"><div><span class="eyebrow">Lecture ${index+1} · ${esc(l.group)}</span><h1><a href="#/lesson/${esc(l.id)}">${esc(guide.title)}</a></h1><p>${esc(lessonSummary(l))}</p><small class="lecture-original-title">${esc(l.title)}</small></div></header>${readerHTML(l,null,{quizHTML,workedHTML,labCatalog,nextLesson:next})}${navigation}</div>`;
 }
 function destination(){
  const [path,query='']=(window.location.hash.slice(1)||'/').split('?');
  const [page,id,section,...extra]=path.split('/').filter(Boolean),params=new URLSearchParams(query);
  let setup=null;try{const raw=params.get('setup');if(raw&&raw.length<=12000)setup=JSON.parse(raw)}catch{}
  if(page==='lesson'&&!extra.length&&byId.has(id)&&(!section||byId.get(id).sections.some(s=>s.id===section)))return {id,section,lab:params.get('lab'),setup,full:params.get('view')==='all'};
  return null;
 }
 function position(){
  const target=destination();
  if(target)showReader(target);
  if(target?.section){
   root.querySelectorAll('[data-section-link]').forEach(a=>{const active=a.dataset.sectionLink===target.section;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current')});
   const lab=[...root.querySelectorAll('[data-lab]')].find(el=>el.dataset.lab===target.lab&&el.closest('[data-section]')?.dataset.section===target.section);
   const heading=lab?.closest('.inline-experiment')||root.querySelector(`#heading-${target.section}`);focus(heading);
   (lab?heading:root.querySelector(`#section-${target.section}`))?.scrollIntoView?.({block:'start'});
   session.write('position:'+target.id,target.section);session.write('last',{id:target.id,section:target.section});
  }else{
   const group=new URLSearchParams(window.location.hash.split('?')[1]||'').get('group');
   const heading=group?root.ownerDocument.getElementById('group-'+group):null;
   if(heading&&root.contains(heading)){focus(heading);heading.scrollIntoView?.({block:'start'})}
   else{focus(root.querySelector('.page-content h1'));window.scrollTo?.(0,0)}
  }
 }
 function updateQuestions(set,{focusQuestion=false}={}){
  const forms=[...set.querySelectorAll('[data-quiz]')],full=root.querySelector('[data-reader-view]')?.dataset.readerView==='full';
  const index=Math.min(forms.length-1,Math.max(0,Number(set.dataset.questionIndex)||0));set.dataset.questionIndex=String(index);
  forms.forEach((form,i)=>form.hidden=!full&&i!==index);
  set.querySelector('[data-question-count]').textContent=full?`${forms.length} question${forms.length===1?'':'s'}`:`Question ${index+1} of ${forms.length}`;
  const navigation=set.querySelector('.question-navigation');
  if(navigation){navigation.hidden=full;navigation.querySelector('[data-question-move="-1"]').disabled=index===0;navigation.querySelector('[data-question-move="1"]').disabled=index===forms.length-1}
  if(focusQuestion)focus(forms[index]?.querySelector('h3'));
 }
 function showReader(target){
  const lesson=byId.get(target.id),reader=root.querySelector('[data-reader-lesson]');if(!reader)return;
  const view=target.full?'full':target.section?'topic':'overview',viewKey=target.id+'/'+view+'/'+(target.section||'');
  reader.dataset.readerView=view;
  root.querySelector('.lecture-page').classList.toggle('is-studying',view==='topic');
  reader.querySelector('.lecture-overview').hidden=view!=='overview';
  reader.querySelector('.full-reading-notice').hidden=view!=='full';
  if(readerView!==viewKey)reader.querySelector('.reader-outline').open=view==='overview';
  readerView=viewKey;
  for(const section of reader.querySelectorAll('[data-section]')){
   const visible=view==='full'||section.dataset.section===target.section;
   if(!visible)for(const lab of section.querySelectorAll('[data-playing=true]'))lab.querySelector('[data-ui=play]')?.click();
   section.hidden=!visible;
   if(visible)for(const el of section.querySelectorAll('[data-lab]'))if(!mountedLabs.has(el)){
    cleanup.push(mountLab(el,el.dataset.lab,{session,setup:target.lab===el.dataset.lab?target.setup:null}));mountedLabs.add(el);
   }
  }
  const lastTopic=target.section===lesson.sections.at(-1).id;
  root.querySelector('.lesson-navigation').hidden=view!=='full';
  const review=reader.querySelector('.lecture-review');if(review)review.hidden=view!=='full'&&!lastTopic;
  const saved=session.read('position:'+lesson.id),savedSection=lesson.sections.find(s=>s.id===saved),resume=reader.querySelector('[data-topic-resume]');
  resume.hidden=!savedSection;
  if(savedSection){resume.href=`#/lesson/${lesson.id}/${savedSection.id}`;resume.textContent=`Continue: ${savedSection.title} →`}
  reader.querySelectorAll('[data-question-set]').forEach(set=>updateQuestions(set));
 }
 function render(){
  cleanup.forEach(f=>f());cleanup=[];
  mountedLabs=new Set();readerView='';
  route=(window.location.hash.slice(1)||'/').split('?')[0];
  const target=destination(),selector=route==='/lectures'||route==='/lessons';
  root.ownerDocument.title=target?`${byId.get(target.id).title} · Introduction to AI`:selector?'Lectures · Introduction to AI':route==='/'?'Introduction to AI · Tsinghua':'Page not found · Introduction to AI';
  const last=session.read('last'),resume=last&&byId.get(last.id)?.sections.some(s=>s.id===last.section)?`<a class="resume-reading" href="#/lesson/${esc(last.id)}/${esc(last.section)}"><span>Pick up where you left off</span><strong>${esc(courseGuide(byId.get(last.id)).title)} →</strong></a>`:'';
  const body=route==='/'?landingHTML(lessons).replace('<!-- resume -->',resume):selector?selectorHTML(lessons):target?lessonHTML(byId.get(target.id)):'<h1>Page not found</h1><a class="button" href="#/">Back to course</a>';
  root.innerHTML=`<a class="skip-link" href="#main-content" data-action="skip">Skip to content</a><header class="mobile-header"><a href="#/">Introduction to AI</a><button class="button subtle" data-action="menu" aria-label="Toggle navigation" aria-controls="course-navigation" aria-expanded="false">Menu</button></header><aside class="sidebar" id="course-navigation"><a class="brand" href="#/"><span class="brand-mark">AI</span><div><strong>Introduction to AI</strong><small>JUNGONG HAN · TSINGHUA</small></div></a><nav aria-label="Course"><a href="#/" ${route==='/'?'class="active" aria-current="page"':''}>Home</a><a href="#/lectures" ${selector||target?'class="active" aria-current="page"':''}>Lectures</a></nav></aside><main id="main-content" class="main" tabindex="-1"><div class="page-content">${body}</div><footer class="site-footer"><span>Introduction to Artificial Intelligence</span><a href="#/lectures">All lectures</a></footer></main>`;
  cleanup.push(bindLearningPreview(root));
  if(target){showReader(target);cleanup.push(bindReadingPosition(root,byId.get(target.id),session))}
  cleanup.push(bindWorked(root));
 }
 function changed(){
  const target=destination(),reader=root.querySelector('[data-reader-lesson]');
  if(target?.setup||!(target&&reader?.dataset.readerLesson===target.id))render();
  root.querySelector('.sidebar')?.classList.remove('open');
  root.querySelector('[data-action=menu]')?.setAttribute('aria-expanded','false');
  position();
 }
 function onClick(e){
  const questionMove=e.target.closest('[data-question-move]');
  if(questionMove){const set=questionMove.closest('[data-question-set]');set.dataset.questionIndex=String((Number(set.dataset.questionIndex)||0)+Number(questionMove.dataset.questionMove));updateQuestions(set,{focusQuestion:true});return}
  const button=e.target.closest('[data-action]');if(!button)return;
  if(button.dataset.action==='skip'){e.preventDefault();root.querySelector('#main-content').focus();return}
  if(button.dataset.action==='menu'){const sidebar=root.querySelector('.sidebar');sidebar.classList.toggle('open');button.setAttribute('aria-expanded',String(sidebar.classList.contains('open')));return}
  if(button.dataset.action==='retry'){
   const id=button.dataset.id,q=questions.get(id);if(!q)return;
   delete answers[id];session.write('answers',answers);const form=root.querySelector(`[data-quiz="${id}"]`),set=form.closest('[data-question-set]');form.outerHTML=quizHTML(q);updateQuestions(set);root.querySelector(`[data-quiz="${id}"] input`)?.focus({preventScroll:true});
  }
 }
 function onSubmit(e){
  const jump=e.target.closest('[data-lecture-jump]');
  if(jump){e.preventDefault();const id=jump.querySelector('select').value;if(byId.has(id))window.location.hash='/lesson/'+id;return}
  const form=e.target.closest('[data-quiz]');if(!form)return;e.preventDefault();
  const checked=form.querySelector('input:checked');if(!checked){form.querySelector('.quiz-status').textContent='Choose an answer first.';form.querySelector('input')?.focus({preventScroll:true});return}
  const q=questions.get(form.dataset.quiz);if(!q)return;
  const choice=Number(checked.value),set=form.closest('[data-question-set]');answers[q.id]={choice,correct:choice===q.answer};session.write('answers',answers);form.outerHTML=quizHTML(q);updateQuestions(set);focus(root.querySelector(`[data-quiz="${q.id}"] [role=status]`));
 }
 function keyboard(e){if(e.key==='Escape'){const side=root.querySelector('.sidebar');if(side?.classList.contains('open')){side.classList.remove('open');const button=root.querySelector('[data-action=menu]');button?.setAttribute('aria-expanded','false');button?.focus()}}}
 function imageError(e){const img=e.target;if(img.tagName==='IMG'&&!img.dataset.failed){img.dataset.failed='true';img.hidden=true}}
 let printTarget=null;
 function beforePrint(){const target=destination();if(target){printTarget=target;for(const lab of root.querySelectorAll('[data-playing=true]'))lab.querySelector('[data-ui=play]')?.click();showReader({...target,full:true})}}
 function afterPrint(){if(printTarget){showReader(printTarget);printTarget=null}}
 root.addEventListener('click',onClick);root.addEventListener('submit',onSubmit);root.addEventListener('error',imageError,true);window.addEventListener('hashchange',changed);document.addEventListener('keydown',keyboard);
 window.addEventListener('beforeprint',beforePrint);window.addEventListener('afterprint',afterPrint);
 render();position();
 return {render,getState:()=>({answers}),destroy(){cleanup.forEach(f=>f());root.removeEventListener('click',onClick);root.removeEventListener('submit',onSubmit);root.removeEventListener('error',imageError,true);window.removeEventListener('hashchange',changed);document.removeEventListener('keydown',keyboard);window.removeEventListener('beforeprint',beforePrint);window.removeEventListener('afterprint',afterPrint)}};
}
