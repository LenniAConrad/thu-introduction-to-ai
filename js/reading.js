import {labFirstSteps} from './lab-catalog.js';
import {courseGuide,topicGroups} from './course-guide.js';
import {staticDiagramHTML} from './static-diagrams.js';
import {infrastructureGraphicHTML} from './infrastructure-graphics.js';
import {autonomousGraphicHTML} from './autonomous-graphics.js';
import {alignmentGraphicHTML} from './alignment-graphics.js';
import {transformerGraphicHTML} from './transformer-graphics.js';
import {nlpGraphicHTML} from './nlp-graphics.js';
import {segmentationGenerationGraphicHTML} from './segmentation-generation-graphics.js';
import {classificationDetectionGraphicHTML} from './classification-detection-graphics.js';
import {visionFoundationsGraphicHTML} from './vision-foundations-graphics.js';
import {sequenceGenerativeGraphicHTML} from './sequence-generative-graphics.js';
import {deepLearningGraphicHTML} from './deep-learning-graphics.js';
import {esc,markdown} from './render.js';
import {introductionGraphicHTML} from './introduction-graphics.js';
import {machineLearningGraphicHTML} from './machine-learning-graphics.js';
import {unsupervisedGraphicHTML} from './unsupervised-graphics.js';

export function graphicHTML(id){return staticDiagramHTML(id,rawGraphicHTML(id))}

function rawGraphicHTML(id){
 if(id?.startsWith('ci-'))return infrastructureGraphicHTML(id);
 if(id?.startsWith('av-'))return autonomousGraphicHTML(id);
 if(id?.startsWith('al-'))return alignmentGraphicHTML(id);
 if(id?.startsWith('tf-'))return transformerGraphicHTML(id);
 if(id?.startsWith('np-'))return nlpGraphicHTML(id);
 if(id?.startsWith('ss-'))return segmentationGenerationGraphicHTML(id);
 if(id?.startsWith('vc-'))return classificationDetectionGraphicHTML(id);
 if(id?.startsWith('vp-'))return visionFoundationsGraphicHTML(id);
 if(id?.startsWith('intro-'))return introductionGraphicHTML(id);
 if(id?.startsWith('ml-'))return machineLearningGraphicHTML(id);
 if(id?.startsWith('sg-'))return sequenceGenerativeGraphicHTML(id);
 if(id?.startsWith('dl-'))return deepLearningGraphicHTML(id);
 if(id?.startsWith('ul-'))return unsupervisedGraphicHTML(id);
 if(id!=='ai-timeline')return '';
 const events=[['1950','Turing’s test','A conversation becomes a test of observable behavior.'],['1956','Dartmouth','AI becomes an organized research field.'],['1980s','Expert systems','Knowledge bases and inference engines reach practical applications.'],['1997','Deep Blue','Search and specialized computation defeat the world chess champion.'],['2012','AlexNet','A major milestone in the deep learning wave.'],['2017','Transformer','An architecture at the center of the large model era.'],['2022','ChatGPT','Conversational AI reaches a broad audience.']];
 return `<figure class="lecture-graphic"><figcaption><strong>From explicit knowledge to learned representations</strong><span>Selected milestones. Spacing shows sequence, not elapsed time.</span></figcaption><ol class="ai-timeline">${events.map(([date,title,detail])=>`<li><time>${date}</time><div><strong>${title}</strong><p>${detail}</p></div></li>`).join('')}</ol></figure>`;
}

export function warningHTML(warning){return `<aside class="content-warning" role="note" aria-label="Warning"><strong>WARNING</strong><p>${esc(warning.message)}</p>${warning.reference&&/^https?:\/\//.test(warning.reference.url)?`<p class="warning-reference"><a href="${esc(warning.reference.url)}" rel="noreferrer">${esc(warning.reference.title)}</a></p>`:''}</aside>`}

function proseHTML(body){return String(body).split(/^\[figure: ((?:intro|ml|ul|dl|sg|vp|vc|ss|np|tf|al|av|ci)-[a-z-]+)\]$/gm).map((block,i)=>i%2?graphicHTML(block):`<div class="prose">${markdown(block)}</div>`).join('')}

export function readerHTML(l,_source,{quizHTML,workedHTML,labCatalog,nextLesson}){
 const guide=courseGuide(l),link=s=>`#/lesson/${esc(l.id)}/${esc(s.id)}`;
 const questionSet=quizzes=>`<section class="inline-check" data-question-set><div class="check-heading"><h3>Quick check</h3><span data-question-count></span></div>${quizzes.map(quizHTML).join('')}${quizzes.length>1?'<nav class="question-navigation" aria-label="Practice questions"><button type="button" class="text-button" data-question-move="-1">← Previous question</button><button type="button" class="text-button" data-question-move="1">Next question →</button></nav>':''}</section>`;
 const seen=new Set();
 const body=l.sections.map((s,i)=>{
  const reading=s.reading||{},quizzes=l.questions.filter(q=>(reading.quizIds||[]).includes(q.id)&&!seen.has(q.id));quizzes.forEach(q=>seen.add(q.id));
  const visuals=(reading.visuals||[]).filter(v=>labCatalog.some(lab=>lab[0]===v.id));
  const previous=l.sections[i-1],next=l.sections[i+1];
  const endLink=nextLesson?`<a class="topic-next" rel="next" href="#/lesson/${esc(nextLesson.id)}/${esc(nextLesson.sections[0].id)}"><span>Next lecture →</span><strong>${esc(courseGuide(nextLesson).title)}</strong></a>`:'<a class="topic-next" href="#/lectures"><span>You’ve reached the last topic</span><strong>Browse all lectures →</strong></a>';
  return `<section class="reading lecture-section" id="section-${esc(s.id)}" data-section="${esc(s.id)}" aria-labelledby="heading-${esc(s.id)}" hidden><div class="reading-top"><span>Topic ${i+1} of ${l.sections.length}</span><a href="#/lesson/${esc(l.id)}">All topics</a></div><h2 id="heading-${esc(s.id)}" tabindex="-1">${esc(s.title)}</h2>${(reading.warnings||[]).map(warningHTML).join('')}${proseHTML(s.body)}${reading.takeaway?`<aside class="key-idea"><span class="eyebrow">Remember</span><p>${esc(reading.takeaway)}</p></aside>`:''}${graphicHTML(reading.graphic)}${workedHTML(s.id)}${visuals.map(v=>`<section class="inline-experiment" aria-label="${esc(labCatalog.find(lab=>lab[0]===v.id)[1])}"><div class="experiment-intro"><span class="try-label">Try it yourself</span><h3>${esc(labCatalog.find(lab=>lab[0]===v.id)[1])}</h3><p>${esc(labFirstSteps[v.id]||v.predict)}</p></div><div class="lab-panel" data-lab="${esc(v.id)}"></div><details class="experiment-reflect"><summary>What should you notice?</summary>${labFirstSteps[v.id]?`<p>${esc(v.predict)}</p>`:''}<p>${esc(v.reflect)}</p></details></section>`).join('')}${quizzes.length?questionSet(quizzes):''}<nav class="topic-navigation" aria-label="Topic navigation">${previous?`<a class="topic-previous" rel="prev" href="${link(previous)}"><span>← Previous topic</span><strong>${esc(previous.title)}</strong></a>`:`<a class="topic-previous" href="#/lesson/${esc(l.id)}"><span>← Lecture overview</span></a>`}${next?`<a class="topic-next" rel="next" href="${link(next)}"><span>Next topic →</span><strong>${esc(next.title)}</strong></a>`:endLink}</nav></section>`;
 }).join('');
 const remaining=l.questions.filter(q=>!seen.has(q.id));
 const map=topicGroups(l).map(group=>`<section class="topic-group"><h3>${esc(group.title)}</h3><ol start="${group.start+1}">${group.sections.map((s,i)=>`<li><a href="${link(s)}" data-section-link="${esc(s.id)}"><span class="topic-number">${group.start+i+1}</span><span class="topic-name">${esc(s.title)}</span><span class="topic-kind">${s.reading?.visuals?.length?'Try it':'Read'} <span aria-hidden="true">→</span></span></a></li>`).join('')}</ol></section>`).join('');
 return `<div class="lecture-reader" data-reader-lesson="${esc(l.id)}" data-reader-view="overview"><section class="lecture-overview"><div class="lesson-outcomes"><h2>You’ll learn to</h2><ul>${guide.outcomes.map(text=>`<li>${esc(text)}</li>`).join('')}</ul></div><p class="lesson-before">${esc(guide.before)}${guide.previous?` <a href="#/lesson/${esc(guide.previous)}">Revisit that lecture →</a>`:''}</p><div class="lesson-start"><a class="button" href="${link(l.sections[0])}">Start this lecture <span aria-hidden="true">→</span></a><a class="text-link" href="#/lesson/${esc(l.id)}?view=all">Read the full lecture</a></div><a class="topic-resume" data-topic-resume hidden></a></section><details class="reader-outline" open><summary>Topics in this lecture <span>${l.sections.length} topics</span></summary><nav aria-label="Lecture contents">${map}</nav><a class="read-full-link" href="#/lesson/${esc(l.id)}?view=all">Read the full lecture on one page →</a></details><div class="full-reading-notice" hidden><span>Full lecture · ${l.sections.length} topics</span><a href="#/lesson/${esc(l.id)}/${esc(l.sections[0].id)}">Read one topic at a time →</a></div><article class="lecture-flow">${body}${remaining.length?`<section class="reading lecture-review" hidden><h2>Lecture review</h2>${questionSet(remaining)}</section>`:''}</article></div>`;
}
