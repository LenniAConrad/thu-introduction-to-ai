import {esc} from './render.js';
import {courseGuide} from './course-guide.js';

const summaries={
 introduction:'What makes a system intelligent? Start with rules, examples, and learning from experience.',
 supervised:'How can a line predict a house price? Fit models to examples, then check their predictions.',
 unsupervised:'What can we learn without answer labels? Find groups in data and simpler ways to describe it.',
 'neural-networks':'Follow a prediction through a neural network, then see how an error changes its weights.',
 'sequence-generative':'See how models remember a sequence, predict the next word, and create new examples.',
 vision:'Explore how computers turn pixels into information about objects, depth, and movement.',
 'classification-detection':'Build image features, recognize patterns, and find objects inside an image.',
 segmentation:'Label an image pixel by pixel, recover fine detail, and train a small image generator.',
 nlp:'Turn words into numbers, see how context changes meaning, and try text classification and translation.',
 transformers:'Follow how a Transformer connects words and generates a sequence, one step at a time.',
 alignment:'Explore how examples and human preferences shape a model’s responses.',
 transportation:'How do you test a vehicle for rare failures? Try traffic simulations and compare testing strategies.',
 infrastructure:'Explore how AI schedules energy, cools buildings, and makes decisions under safety limits.'
};
export const lessonSummary=l=>summaries[l.id]||l.summary;

function previewHTML(){
 return `<section class="learning-preview" aria-labelledby="preview-title" data-learning-preview><div class="preview-heading"><span class="try-label">Start with an experiment</span><span class="preview-step" data-preview-step>1 · Fit</span></div><h2 id="preview-title">Can you find the pattern?</h2><p>The dots are examples. Tilt the line to match them.</p><svg viewBox="0 0 340 240" role="img" aria-labelledby="preview-chart-title preview-chart-description"><title id="preview-chart-title">Fit a line to five examples</title><desc id="preview-chart-description">The examples are (1, 2), (2, 4), (3, 6), (4, 8), and (5, 10). The line predicts output from input.</desc><defs><clipPath id="preview-plot-clip"><rect x="39" y="15" width="281" height="188"/></clipPath></defs><g class="preview-grid"><path d="M40 72H312M40 137H312"/></g><path class="preview-axes" d="M40 18V202H312"/><g class="preview-ticks"><text x="29" y="206" text-anchor="end">0</text><text x="29" y="141" text-anchor="end">5</text><text x="29" y="76" text-anchor="end">10</text>${[1,3,5].map(x=>`<text x="${40+x*48}" y="220" text-anchor="middle">${x}</text>`).join('')}<text x="40" y="11">Output</text><text x="312" y="238" text-anchor="end">Input</text></g><g clip-path="url(#preview-plot-clip)"><g class="preview-misses">${[1,2,3,4,5].map(x=>`<line data-preview-gap="${x}" x1="${40+x*48}" x2="${40+x*48}" y1="${202-x*26}" y2="${202-x*13*.8}"/>`).join('')}</g><g data-preview-line class="preview-line" transform="rotate(-12.225 40 202)"><line x1="40" y1="202" x2="390" y2="202"/></g>${[1,2,3,4,5].map(x=>`<circle class="preview-example" cx="${40+x*48}" cy="${202-x*26}" r="5.5"/>`).join('')}</g></svg><div class="preview-legend"><span><i class="example-key" aria-hidden="true"></i>Examples</span><span><i class="line-key" aria-hidden="true"></i>Your model</span></div><label class="preview-control" for="preview-slope"><span>Your rule: input × <output for="preview-slope" data-preview-slope>0.8</output></span><input id="preview-slope" type="range" min="0" max="3" step="0.1" value="0.8" aria-describedby="preview-feedback"></label><p class="preview-feedback" id="preview-feedback" data-preview-feedback>The line is below the dots. Try making it steeper.</p><div class="preview-practice" data-preview-practice hidden><h3 id="preview-question">What would this line predict for an input of 6?</h3><div class="preview-answers" role="group" aria-labelledby="preview-question">${[10,12,14].map(n=>`<button type="button" data-preview-answer="${n}" aria-pressed="false">${n}</button>`).join('')}</div><p data-preview-answer-feedback role="status"></p><a href="#/lesson/supervised/supervised-gradient" data-preview-next hidden>Now try a model with real errors <span aria-hidden="true">→</span></a></div><p class="sr-only" data-preview-status role="status"></p></section>`;
}

export function bindLearningPreview(root){
 const box=root.querySelector('[data-learning-preview]');if(!box)return ()=>{};
 const input=box.querySelector('input'),output=box.querySelector('[data-preview-slope]'),feedback=box.querySelector('[data-preview-feedback]');
 function update(e){
  const slope=Number(input.value),matched=Math.abs(slope-2)<.001;
  output.value=slope.toFixed(1);
  box.querySelector('[data-preview-line]').setAttribute('transform',`rotate(${-Math.atan(slope*13/48)*180/Math.PI} 40 202)`);
  box.querySelectorAll('[data-preview-gap]').forEach(line=>line.setAttribute('y2',202-Number(line.dataset.previewGap)*13*slope));
  box.dataset.matched=String(matched);
  feedback.textContent=matched?'You found it: output = 2 × input. Now try a new input below.':slope<2?'The line is below the dots. Try making it steeper.':'The line is above the dots. Try making it flatter.';
  box.querySelector('[data-preview-practice]').hidden=!matched;
  box.querySelector('[data-preview-step]').textContent=matched?'2 · Predict':'1 · Fit';
  if(!matched){box.querySelector('[data-preview-answer-feedback]').textContent='';box.querySelector('[data-preview-next]').hidden=true;for(const button of box.querySelectorAll('[data-preview-answer]')){button.setAttribute('aria-pressed','false');button.removeAttribute('data-correct')}}
  input.setAttribute('aria-valuetext',`${slope.toFixed(1)} times the input${matched?'; matches all five examples':''}`);
  box.querySelector('#preview-chart-description').textContent=`The five examples have output twice their input. Your line predicts ${slope.toFixed(1)} times the input. Average absolute error: ${(3*Math.abs(slope-2)).toFixed(1)}.`;
  if(e?.type==='change')box.querySelector('[data-preview-status]').textContent=feedback.textContent;
 }
 function answer(e){
  const button=e.target.closest('[data-preview-answer]');if(!button||box.dataset.matched!=='true')return;
  const correct=Number(button.dataset.previewAnswer)===12;
  for(const choice of box.querySelectorAll('[data-preview-answer]')){choice.setAttribute('aria-pressed',String(choice===button));choice.removeAttribute('data-correct')}
  if(correct)button.dataset.correct='true';
  box.querySelector('[data-preview-answer-feedback]').textContent=correct?'Yes: 2 × 6 = 12. Fitting the examples is training. Using the fitted line on a new input is prediction. Real examples rarely line up this neatly.':'This line doubles its input. What is 2 × 6? You can choose again.';
  box.querySelector('[data-preview-next]').hidden=!correct;
 }
 update();input.addEventListener('input',update);input.addEventListener('change',update);box.addEventListener('click',answer);
 return ()=>{input.removeEventListener('input',update);input.removeEventListener('change',update);box.removeEventListener('click',answer)};
}

function pathDrawing(index){
 const art=[
  `<path d="M24 62L82 20" class="path-model"/><g class="path-dots"><circle cx="30" cy="57" r="5"/><circle cx="48" cy="43" r="5"/><circle cx="65" cy="37" r="5"/><circle cx="80" cy="17" r="5"/></g><path d="M113 41H154m-6-6 6 6-6 6" class="path-arrow"/><rect x="183" y="22" width="58" height="38" rx="8" class="path-output"/><text x="212" y="47" text-anchor="middle">price?</text>`,
  `<g class="path-pixels">${[0,1,2,3,4,5,6,7,8].map((n)=>`<rect x="${25+n%3*17}" y="${15+Math.floor(n/3)*17}" width="13" height="13" rx="2" opacity="${[.2,.6,.2,.6,1,.6,.2,.6,.2][n]}"/>`).join('')}</g><path d="M113 41H154m-6-6 6 6-6 6" class="path-arrow"/><rect x="178" y="21" width="70" height="40" rx="8" class="path-output"/><text x="213" y="47" text-anchor="middle">“flower”</text>`,
  `<path d="M44 50Q96-12 148 50M95 50Q147 1 199 50" class="path-context"/><g class="path-tokens">${['I','can','learn','…'].map((word,i)=>`<rect x="${24+i*58}" y="38" width="46" height="30" rx="6"/><text x="${47+i*58}" y="58" text-anchor="middle">${word}</text>`).join('')}</g>`
 ];
 return `<svg class="path-drawing" viewBox="0 0 276 84" aria-hidden="true" focusable="false">${art[index]}</svg>`;
}

export function landingHTML(lessons){
 const lectures=lessons.filter(l=>l.group!=='Coursework');
 const first=lectures[0],start=`#/lesson/${esc(first.id)}/${esc(first.sections[0].id)}`;
 const paths=[
  ['Lectures 1–5','How does learning work?','Rules, examples, neural networks, and generative models.',lectures[0]],
  ['Lectures 6–9','How do models see and read?','Pixels, objects, words, and the representations between them.',lectures[5]],
  ['Lectures 10–13','How do we put AI to work?','Transformers, human preferences, and decisions in the world.',lectures[9]]
 ];
 return `<div class="course-landing"><header class="landing-intro"><div class="landing-welcome"><p class="landing-kicker">Introduction to Artificial Intelligence</p><h1>Learn how<br><span>AI works.</span></h1><p class="landing-description">From a line that predicts numbers to a model that writes text. Work through the ideas with small experiments and questions along the way.</p><div class="landing-actions"><a class="button" href="${start}">Start with the basics <span aria-hidden="true">→</span></a><a class="text-link" href="#/lectures">Browse all lectures</a></div><p class="landing-note">New to AI? The first lecture starts from the beginning.</p><!-- resume --></div>${previewHTML()}</header><section class="course-path" aria-labelledby="course-path-title"><div class="path-label"><h2 id="course-path-title">The course, in three parts</h2><span>${lectures.length} lectures</span></div><ol>${paths.map(([n,title,body,lesson],i)=>`<li><a href="#/lectures?group=${esc(lesson.id)}">${pathDrawing(i)}<span class="path-step">${n}</span><h3>${title}</h3><p>${body}</p><span class="path-link">Explore this part <span aria-hidden="true">→</span></span></a></li>`).join('')}</ol></section><section class="landing-professor" aria-label="About the lecturer"><img src="./instructor/han-jungong.jpg" alt="Professor Jungong Han" width="68" height="68"><div><span>Based on lectures by</span><strong>Prof. Jungong Han</strong><p><a href="https://www.au.tsinghua.edu.cn/en/" target="_blank" rel="noopener noreferrer">Department of Automation</a> · <a href="https://www.tsinghua.edu.cn/en/" target="_blank" rel="noopener noreferrer">Tsinghua University</a></p><nav class="faculty-links" aria-label="Professor Han’s profiles"><a href="https://www.au.tsinghua.edu.cn/en/info/1092/3503.htm" target="_blank" rel="noopener noreferrer">Tsinghua profile <span aria-hidden="true">↗</span></a><a href="https://jungonghan.github.io/" target="_blank" rel="noopener noreferrer">Academic website <span aria-hidden="true">↗</span></a></nav></div></section><footer class="course-provenance">Student-built study companion · based on the 2025–26 lectures.</footer></div>`;
}

export function selectorHTML(lessons){
 const lectures=lessons.filter(l=>l.group!=='Coursework');
 const groups=[['Start with the basics','AI, learning from examples, and neural networks.',lectures.slice(0,5)],['Explore images and words','How models recognize objects and work with language.',lectures.slice(5,9)],['Put the ideas to work','Transformers, human preferences, and real-world decisions.',lectures.slice(9)]];
 return `<section class="lecture-selector"><a class="back-link" href="#/">← Course overview</a><header class="selector-header"><h1>What would you like to learn?</h1><p>Start at the beginning, or choose the topic you’re studying.</p></header><form class="lecture-jump" data-lecture-jump><label for="lecture-select">Jump to a lecture</label><div><select id="lecture-select" name="lecture">${lectures.map((l,i)=>`<option value="${esc(l.id)}">${i+1} · ${esc(courseGuide(l).title)}</option>`).join('')}</select><button class="button" type="submit">Open <span aria-hidden="true">→</span></button></div></form>${groups.map(([name,summary,items])=>`<section class="lecture-group" aria-labelledby="group-${esc(items[0].id)}"><div class="lecture-group-heading"><h2 id="group-${esc(items[0].id)}">${name}</h2><p>${summary}</p></div>${items.map(l=>{const i=lectures.indexOf(l);return `<a class="lecture-row" href="#/lesson/${esc(l.id)}"><span class="lecture-row-number">${i+1}</span><div><h3>${esc(courseGuide(l).title)}</h3><p>${esc(lessonSummary(l))}</p><span class="lecture-row-source">${esc(l.title)} · ${l.sections.length} topics</span></div><span class="lecture-row-arrow" aria-hidden="true">→</span></a>`}).join('')}</section>`).join('')}</section>`;
}
