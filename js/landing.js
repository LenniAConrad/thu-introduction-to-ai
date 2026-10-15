import {esc} from './render.js';

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
 return `<section class="learning-preview" aria-labelledby="preview-title" data-learning-preview><span class="try-label">Try a small example</span><h2 id="preview-title">Can you find the pattern?</h2><p>The dots are examples. Tilt the line to match them.</p><svg viewBox="0 0 340 240" role="img" aria-labelledby="preview-chart-title preview-chart-description"><title id="preview-chart-title">Fit a line to five examples</title><desc id="preview-chart-description">The examples are (1, 2), (2, 4), (3, 6), (4, 8), and (5, 10). The line predicts output from input.</desc><defs><clipPath id="preview-plot-clip"><rect x="39" y="15" width="281" height="188"/></clipPath></defs><g class="preview-grid"><path d="M40 72H312M40 137H312"/></g><path class="preview-axes" d="M40 18V202H312"/><g class="preview-ticks"><text x="29" y="206" text-anchor="end">0</text><text x="29" y="141" text-anchor="end">5</text><text x="29" y="76" text-anchor="end">10</text>${[1,3,5].map(x=>`<text x="${40+x*48}" y="220" text-anchor="middle">${x}</text>`).join('')}<text x="40" y="11">Output</text><text x="312" y="238" text-anchor="end">Input</text></g><g clip-path="url(#preview-plot-clip)"><g class="preview-misses">${[1,2,3,4,5].map(x=>`<line data-preview-gap="${x}" x1="${40+x*48}" x2="${40+x*48}" y1="${202-x*26}" y2="${202-x*13*.8}"/>`).join('')}</g><g data-preview-line class="preview-line" transform="rotate(-12.225 40 202)"><line x1="40" y1="202" x2="390" y2="202"/></g>${[1,2,3,4,5].map(x=>`<circle class="preview-example" cx="${40+x*48}" cy="${202-x*26}" r="5.5"/>`).join('')}</g></svg><div class="preview-legend"><span><i class="example-key" aria-hidden="true"></i>Examples</span><span><i class="line-key" aria-hidden="true"></i>Your line</span></div><label class="preview-control" for="preview-slope"><span>Tilt the line <output for="preview-slope" data-preview-slope>0.8</output></span><input id="preview-slope" type="range" min="0" max="3" step="0.1" value="0.8" aria-describedby="preview-feedback"></label><p class="preview-feedback" id="preview-feedback" data-preview-feedback>The line is below the dots. Try making it steeper.</p><p class="sr-only" data-preview-status role="status"></p></section>`;
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
  feedback.textContent=matched?'You found it: output = 2 × input. Training adjusts a model to reduce errors like these.':slope<2?'The line is below the dots. Try making it steeper.':'The line is above the dots. Try making it flatter.';
  input.setAttribute('aria-valuetext',`${slope.toFixed(1)} times the input${matched?'; matches all five examples':''}`);
  box.querySelector('#preview-chart-description').textContent=`The five examples have output twice their input. Your line predicts ${slope.toFixed(1)} times the input. Average absolute error: ${(3*Math.abs(slope-2)).toFixed(1)}.`;
  if(e?.type==='change')box.querySelector('[data-preview-status]').textContent=feedback.textContent;
 }
 update();input.addEventListener('input',update);input.addEventListener('change',update);
 return ()=>{input.removeEventListener('input',update);input.removeEventListener('change',update)};
}

export function landingHTML(lessons){
 const lectures=lessons.filter(l=>l.group!=='Coursework');
 const first=lectures[0],start=`#/lesson/${esc(first.id)}/${esc(first.sections[0].id)}`;
 const paths=[
  ['01','Start with the basics','What AI is, how models learn, and how neural networks work.',lectures[0]],
  ['02','Explore images and words','Recognize objects, work with language, and see what a model notices.',lectures[5]],
  ['03','Put the ideas to work','Try Transformers, generative models, and decisions in the world.',lectures[9]]
 ];
 return `<div class="course-landing"><header class="landing-intro"><div class="landing-welcome"><p class="landing-kicker">Learn a little. Try it out.</p><h1>Introduction to<br>Artificial Intelligence</h1><p class="landing-description">How does a model learn? Start with a simple example, change something, and see what happens.</p><div class="landing-actions"><a class="button" href="${start}">Start with the basics <span aria-hidden="true">→</span></a><a class="text-link" href="#/lectures">Browse lectures</a></div><p class="landing-note">Read, experiment, and check your understanding. Go at your own pace.</p></div>${previewHTML()}</header><section class="course-path" aria-labelledby="course-path-title"><div class="path-label"><h2 id="course-path-title">Build up one idea at a time</h2><span>${lectures.length} lectures</span></div><ol>${paths.map(([n,title,body,lesson])=>`<li><a href="#/lesson/${esc(lesson.id)}"><span class="path-step">${n}</span><h3>${title} <span aria-hidden="true">→</span></h3><p>${body}</p></a></li>`).join('')}</ol></section><section class="landing-professor" aria-label="About the lecturer"><img src="./instructor/han-jungong.jpg" alt="Professor Jungong Han" width="68" height="68"><div><span>Lectures by</span><strong>Prof. Jungong Han</strong><p><a href="https://www.au.tsinghua.edu.cn/en/" target="_blank" rel="noopener noreferrer">Department of Automation</a> · <a href="https://www.tsinghua.edu.cn/en/" target="_blank" rel="noopener noreferrer">Tsinghua University</a><br>Tenured Professor · <span lang="zh">长聘教授</span> · Fellow of IAPR · Fellow of AAIA</p><nav class="faculty-links" aria-label="Professor Han’s profiles"><a href="https://www.au.tsinghua.edu.cn/en/info/1092/3503.htm" target="_blank" rel="noopener noreferrer">Tsinghua profile <span aria-hidden="true">↗</span></a><a href="https://jungonghan.github.io/" target="_blank" rel="noopener noreferrer">Academic website <span aria-hidden="true">↗</span></a></nav></div></section><footer class="course-provenance">Student-built study companion · based on the 2025–26 lectures.</footer></div>`;
}

export function selectorHTML(lessons){
 const lectures=lessons.filter(l=>l.group!=='Coursework');
 const groups=[['Start with the basics','AI, learning from examples, and neural networks.',lectures.slice(0,5)],['Explore images and words','How models recognize objects and work with language.',lectures.slice(5,9)],['Put the ideas to work','Transformers, human preferences, and real-world decisions.',lectures.slice(9)]];
 return `<section class="lecture-selector"><a class="back-link" href="#/">← Course overview</a><header class="selector-header"><h1>What would you like to learn?</h1><p>New to AI? Begin with lecture 1. Already following the course? Pick up wherever you need.</p></header><form class="lecture-jump" data-lecture-jump><label for="lecture-select">Jump to a lecture</label><div><select id="lecture-select" name="lecture">${lectures.map((l,i)=>`<option value="${esc(l.id)}">${String(i+1).padStart(2,'0')} · ${esc(l.title)}</option>`).join('')}</select><button class="button" type="submit">Open <span aria-hidden="true">→</span></button></div></form>${groups.map(([name,summary,items])=>`<section class="lecture-group" aria-labelledby="group-${esc(items[0].id)}"><div class="lecture-group-heading"><h2 id="group-${esc(items[0].id)}">${name}</h2><p>${summary}</p></div>${items.map(l=>{const i=lectures.indexOf(l);return `<a class="lecture-row" href="#/lesson/${esc(l.id)}"><span class="lecture-row-number">${String(i+1).padStart(2,'0')}</span><div><h3>${esc(l.title)}</h3><p>${esc(lessonSummary(l))}</p></div><span class="lecture-row-arrow" aria-hidden="true">→</span></a>`}).join('')}</section>`).join('')}</section>`;
}
