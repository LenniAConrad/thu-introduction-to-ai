import {labFirstSteps} from './lab-catalog.js';
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

export function readerHTML(l,_source,{quizHTML,workedHTML,labCatalog}){
 const seen=new Set();
 const body=l.sections.map((s,i)=>{
  const reading=s.reading||{},quizzes=l.questions.filter(q=>(reading.quizIds||[]).includes(q.id)&&!seen.has(q.id));quizzes.forEach(q=>seen.add(q.id));
  const visuals=(reading.visuals||[]).filter(v=>labCatalog.some(lab=>lab[0]===v.id));
  return `<section class="reading lecture-section" id="section-${esc(s.id)}" data-section="${esc(s.id)}" aria-labelledby="heading-${esc(s.id)}"><div class="reading-top"><span class="eyebrow">${String(i+1).padStart(2,'0')} / ${String(l.sections.length).padStart(2,'0')}</span></div><h2 id="heading-${esc(s.id)}" tabindex="-1">${esc(s.title)}</h2>${(reading.warnings||[]).map(warningHTML).join('')}${proseHTML(s.body)}${reading.takeaway?`<aside class="key-idea"><span class="eyebrow">The key idea</span><p>${esc(reading.takeaway)}</p></aside>`:''}${graphicHTML(reading.graphic)}${workedHTML(s.id)}${visuals.map(v=>`<section class="inline-experiment" aria-label="${esc(labCatalog.find(lab=>lab[0]===v.id)[1])}"><div class="experiment-intro"><span class="try-label">Try it</span><h3>${esc(labCatalog.find(lab=>lab[0]===v.id)[1])}</h3><p>${esc(labFirstSteps[v.id]||v.predict)}</p></div><div class="lab-panel" data-lab="${esc(v.id)}"></div><details class="experiment-reflect"><summary>Think it through</summary>${labFirstSteps[v.id]?`<p>${esc(v.predict)}</p>`:''}<p>${esc(v.reflect)}</p></details></section>`).join('')}${quizzes.length?`<section class="inline-check"><span class="eyebrow">Check your understanding</span>${quizzes.map(quizHTML).join('')}</section>`:''}</section>`;
 }).join('');
 const remaining=l.questions.filter(q=>!seen.has(q.id));
 return `<div class="lecture-reader" data-reader-lesson="${esc(l.id)}"><details class="reader-outline"><summary>In this lecture <span>${l.sections.length} sections</span></summary><nav aria-label="Lecture contents">${l.sections.map((s,i)=>`<a href="#/lesson/${l.id}/${s.id}" data-section-link="${esc(s.id)}"><span>${String(i+1).padStart(2,'0')}</span>${esc(s.title)}</a>`).join('')}</nav></details><article class="lecture-flow">${body}${remaining.length?`<section class="reading lecture-section"><h2>Lecture review</h2>${remaining.map(quizHTML).join('')}</section>`:''}<p class="reader-end"><a href="#/lectures">Choose another lecture →</a></p></article></div>`;
}
