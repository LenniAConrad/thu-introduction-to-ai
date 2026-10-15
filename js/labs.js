import {enhanceLabs} from './guided-labs.js';
import {copy,morph,applySetup} from './study-session.js';
import {readablePlotLabels} from './plot-labels.js';
import {mdpDefinition as ciMdp,eventsDefinition as ciEvents,ordinalDefinition as ciOrdinal,budgetDefinition as ciBudget,energyDefinition as ciEnergy,occupancyDefinition as ciOccupancy,buildingDefinition as ciBuilding,safetyDefinition as ciSafety} from './infrastructure-models.js';
import {rarityDefinition as avRarity,importanceDefinition as avImportance,dimensionDefinition as avDimension,challengeDefinition as avChallenge,trafficDefinition as avTraffic,calibrationDefinition as avCalibration,criticalDefinition as avCritical,denseDefinition as avDense} from './autonomous-models.js';
import {pretrainingDefinition as alPretrain,sftDefinition as alSft,loraDefinition as alLora,evaluationDefinition as alEvaluation,rewardDefinition as alReward,rerankingDefinition as alRerank,policyDefinition as alPolicy,ppoDefinition as alPpo} from './alignment-models.js';
import {clipDefinition as tfClip,candidatesDefinition as tfCandidates,positionDefinition as tfPositions,attentionDefinition as tfAttention,normDefinition as tfNorm,feedForwardDefinition as tfFF,transformerDefinition as tfFull,decodingDefinition as tfDecode} from './transformer-models.js';
import {tokensDefinition as npTokens,countsDefinition as npCounts,embeddingDefinition as npEmbedding,contextDefinition as npContext,pretrainingDefinition as npPretraining,classificationDefinition as npClassification,alignmentDefinition as npAlignment,translationDefinition as npTranslation} from './nlp-models.js';
import {labelsDefinition as ssLabels,clusteringDefinition as ssClustering,denseDefinition as ssDense,transposeDefinition as ssTranspose,upsamplingDefinition as ssUpsampling,skipDefinition as ssSkip,objectiveDefinition as ssObjective,imageGanDefinition as ssGan} from './segmentation-generation-models.js';
import {imageDefinition as vcImage,filterDefinition as vcFilter,lbpDefinition as vcLbp,histogramDefinition as vcHistogram,cnnDefinition as vcCnn,metricsDefinition as vcMetrics,detectionDefinition as vcDetection,yoloDefinition as vcYolo} from './classification-detection-models.js';
import {sceneDefinition as vpScene,cameraDefinition as vpCamera,illusionsDefinition as vpIllusions,shiftDefinition as vpShift,continualDefinition as vpContinual,hazeDefinition as vpHaze,navigationDefinition as vpNavigation} from './vision-foundations-models.js';
import {sequenceDefinition as sgRnn,maskedDefinition as sgMasked,causalDefinition as sgCausal,ganDefinition as sgGan,vaeDefinition as sgVae,diffusionDefinition as sgDiffusion} from './sequence-generative-models.js';
import {activationDefinition as dlActivation,networkDefinition as dlNetwork,landscapeDefinition as dlLandscape,trainingDefinition as dlTraining,convolutionDefinition as dlConvolution,poolingDefinition as dlPooling,shapesDefinition as dlShapes,contextDefinition as dlContext} from './deep-learning-models.js';
import {iouDefinition,convolutionDefinition} from './interactive-plots.js';
import {gradientDefinition,svmDefinition,positionsDefinition} from './interactive-geometry.js';
import {fullKmeansDefinition,fullDbscanDefinition,hypercubeDefinition,fullPcaDefinition,tsneDefinition,fairnessDefinition,federatedDefinition,glyphDefinition} from './unsupervised-models.js';
import {backpropDefinition,diffusionDefinition,metricsDefinition,rnnDefinition,discountDefinition,bowDefinition,visionTasksDefinition,alignmentDefinition,paradigmsDefinition,pythonDefinition,importanceDefinition} from './interactive-models.js';
import {houseRegressionDefinition,ridgeDefinition,multipleDefinition,logisticDefinition,classifierDefinition,sourceKnnDefinition} from './machine-learning-models.js';
import {mountMasks} from './masks.js';
import {mountAttention} from './attention.js';
import {esc,fmt} from './render.js';
import {labCatalog,labGoals} from './lab-catalog.js';
import {rulesDefinition,neuralDefinition,rewardDefinition,outputsDefinition,inpaintingDefinition} from './introduction-models.js';
export {labCatalog,labGoals};

const button=(id,label)=>`<button class="button subtle small" data-lab-action="${id}">${label}</button>`;
const definitions={
 'ci-mdp':ciMdp,'ci-events':ciEvents,'ci-ordinal':ciOrdinal,'ci-budget':ciBudget,'ci-energy':ciEnergy,'ci-occupancy':ciOccupancy,'ci-building':ciBuilding,'ci-safety':ciSafety,
 'av-rarity':avRarity,'av-importance':avImportance,'av-dimensions':avDimension,'av-challenge':avChallenge,'av-traffic':avTraffic,'av-calibration':avCalibration,'av-critical':avCritical,'av-dense':avDense,
 'al-pretraining':alPretrain,'al-sft':alSft,'al-lora':alLora,'al-evaluation':alEvaluation,'al-reward':alReward,'al-reranking':alRerank,'al-policy':alPolicy,'al-ppo':alPpo,
 'tf-clip':tfClip,'tf-candidates':tfCandidates,'tf-positions':tfPositions,'tf-attention':tfAttention,'tf-norm':tfNorm,'tf-feedforward':tfFF,'tf-transformer':tfFull,'tf-decode':tfDecode,
 'np-tokens':npTokens,'np-counts':npCounts,'np-embedding':npEmbedding,'np-context':npContext,'np-pretraining':npPretraining,'np-classification':npClassification,'np-alignment':npAlignment,'np-translation':npTranslation,
 'ss-labels':ssLabels,'ss-clusters':ssClustering,'ss-dense':ssDense,'ss-transpose':ssTranspose,'ss-upsampling':ssUpsampling,'ss-skip':ssSkip,'ss-objective':ssObjective,'ss-gan':ssGan,
 'vc-image':vcImage,'vc-filter':vcFilter,'vc-lbp':vcLbp,'vc-histogram':vcHistogram,'vc-cnn':vcCnn,'vc-metrics':vcMetrics,'vc-detection':vcDetection,'vc-yolo':vcYolo,
 'vp-scene':vpScene,'vp-camera':vpCamera,'vp-illusions':vpIllusions,'vp-shift':vpShift,'vp-continual':vpContinual,'vp-haze':vpHaze,'vp-navigation':vpNavigation,
 'sg-rnn':sgRnn,'sg-masked':sgMasked,'sg-causal':sgCausal,'sg-gan':sgGan,'sg-vae':sgVae,'sg-diffusion':sgDiffusion,
 'dl-activation':dlActivation,'dl-network':dlNetwork,'dl-landscape':dlLandscape,'dl-training':dlTraining,'dl-convolution':dlConvolution,'dl-pooling':dlPooling,'dl-shapes':dlShapes,'dl-context':dlContext,
 'intro-rules':rulesDefinition,
 'intro-neural':neuralDefinition,
 'intro-reward':rewardDefinition,
 'intro-outputs':outputsDefinition,
 'intro-inpainting':inpaintingDefinition,
 regression:houseRegressionDefinition,
 'ml-ridge':ridgeDefinition,
 'ml-multiple':multipleDefinition,
 'ml-logistic':logisticDefinition,
 'ml-classifier':classifierDefinition,
 kmeans:fullKmeansDefinition,
 'ul-hypercube':hypercubeDefinition,
 'ul-tsne':tsneDefinition,
 'ul-fairness':fairnessDefinition,
 'ul-federated':federatedDefinition,
 'ul-glyph':glyphDefinition,
 gradient:gradientDefinition,

 convolution:convolutionDefinition,
 iou:iouDefinition,
 metrics:metricsDefinition,
 bow:bowDefinition,
 rnn:rnnDefinition,
 'vision-tasks':visionTasksDefinition,
 alignment:alignmentDefinition,

 discount:discountDefinition,
 paradigms:paradigmsDefinition,
 python:pythonDefinition
};

definitions.knn=sourceKnnDefinition;
definitions.pca=fullPcaDefinition;
definitions.backprop=backpropDefinition;

definitions.svm=svmDefinition;
definitions.positions=positionsDefinition;
definitions.diffusion=diffusionDefinition;
definitions.dbscan=fullDbscanDefinition;
definitions.importance=importanceDefinition;
enhanceLabs(definitions);

export function mountLab(host,id,{session=null,setup=null}={}){
 if(id==='masks')return mountMasks(host);
 if(id==='attention')return mountAttention(host);
 const def=definitions[id];
 if(!def){host.textContent='Exercise not found.';return ()=>{}}
 const win=host.ownerDocument.defaultView,doc=host.ownerDocument,guide=def.guide;
 const saved=session?.read('lab:'+id);
 let state=def.initial(),pinned=null,drag=null,timer=null,saveTimer=null,disposed=false,steps=[],playing=false,playCount=0;
 let prediction=null,answer=null,mode='guided';
 if(saved){try{def.render(saved.state);if(saved.pinned)def.render(saved.pinned);state=saved.state;pinned=saved.pinned||null;prediction=saved.prediction||null;answer=saved.answer||null;mode=saved.mode==='explore'?'explore':'guided'}catch{}}
 if(setup){state=applySetup(def,setup);pinned=null;prediction=answer=null}
 const primary=guide?.primary||def.controls.slice(0,3).map(c=>c.id);
 host.classList.add('enhanced-lab');
 host.innerHTML=`<div class="lab-heading"><div><span class="eyebrow">INTERACTIVE EXPERIMENT</span><h4>${esc(guide?.label||labCatalog.find(l=>l[0]===id)?.[1]||'Explore the model')}</h4></div><div class="lab-mode" role="group" aria-label="Experiment controls"><button type="button" data-ui="guided">Guided</button><button type="button" data-ui="explore">Explore</button></div></div><div class="lab-goal"><strong>Goal</strong><p>${esc(labGoals[id])}</p></div><div class="experiment-toolbar"><div class="playback-controls"><button type="button" class="button" data-ui="play" hidden>Play</button><button type="button" class="button subtle small" data-ui="back" disabled>Back</button><button type="button" class="button subtle small" data-ui="next" hidden>Next</button><label class="playback-speed" hidden>Speed <select data-ui="speed" aria-label="Playback speed"><option value="1">1×</option><option value="0.5">0.5×</option><option value="2">2×</option></select></label></div><div class="experiment-tools"><button type="button" class="button subtle small" data-ui="pin">Pin result</button><button type="button" class="button subtle small" data-ui="share">Share setup</button>${button('reset','Reset')}</div></div><p class="playback-status" role="status" data-play-status></p><div class="share-setup" hidden><label>Link to a fresh run with these controls<input type="text" readonly data-share-link></label><p>Trained weights, edited arrays, pinned results and predictions stay in this tab.</p></div><div class="native-lab"><div class="lab-controls" data-controls></div><div class="lab-result" data-result></div></div><div data-prediction></div><div data-comparison></div><p class="sr-only" data-plot-status role="status" aria-live="polite"></p>`;
 const controls=host.querySelector('[data-controls]'),result=host.querySelector('[data-result]'),status=host.querySelector('[data-plot-status]');
 const ui=name=>host.querySelector(`[data-ui="${name}"]`);
 const playStatus=host.querySelector('[data-play-status]');
 const control=c=>`<label data-control-label="${c.id}">${esc(c.label)}${c.type==='range'?` <output data-output="${c.id}">${fmt(state[c.id],5)}</output><input type="range" data-param="${c.id}" aria-label="${esc(c.label)}" min="${c.min}" max="${c.max}" step="${c.step}" value="${state[c.id]}">`:c.type==='select'?`<select data-param="${c.id}" aria-label="${esc(c.label)}">${c.options.map(o=>`<option ${String(state[c.id])===o?'selected':''}>${esc(o)}</option>`).join('')}</select>`:c.type==='checkbox'?`<input type="checkbox" data-param="${c.id}" ${state[c.id]?'checked':''}>`:`<input type="text" aria-label="${esc(c.label)}" data-param="${c.id}" value="${esc(state[c.id])}" maxlength="1000">`}</label>`;
 function makeControls(){controls.innerHTML=def.controls.filter(c=>primary.includes(c.id)).map(control).join('')+`<details class="advanced-controls" ${mode==='explore'?'open':''}><summary>More controls</summary><div>${def.controls.filter(c=>!primary.includes(c.id)).map(control).join('')}</div></details>`;controls.querySelector('.advanced-controls').hidden=def.controls.every(c=>primary.includes(c.id))}
 function save(){if(!session)return;session.write('lab:'+id,{state,pinned,prediction,answer,mode})}
 function scheduleSave(){if(saveTimer!==null)win.clearTimeout(saveTimer);saveTimer=win.setTimeout(()=>{saveTimer=null;save()},400)}
 function remember(){steps.push(copy(state));if(steps.length>40)steps.shift();ui('back').disabled=false}
 function announce(){status.textContent=def.describe?.(state)||guide?.label||'Experiment updated.'}
 function staticResult(value,peer){
  const template=doc.createElement('template');template.innerHTML=guide?.snapshot?guide.snapshot(value,peer):def.render(value);
  if(!guide?.snapshot){
   const plot=template.content.querySelector('svg'),summary=template.content.querySelector('.plot-summary,.lab-summary,.intro-result,.intro-stats');
   if(plot){const fragment=doc.createDocumentFragment();fragment.append(plot.cloneNode(true));if(summary)fragment.append(summary.cloneNode(true));template.content.replaceChildren(fragment)}
  }
  for(const el of template.content.querySelectorAll('button,input,select,textarea')){if(el.tagName==='BUTTON'){const span=doc.createElement('span');span.className=el.className;span.style.cssText=el.style.cssText;span.innerHTML=el.innerHTML;el.replaceWith(span)}else el.remove()}
  for(const el of template.content.querySelectorAll('[role=button]'))el.removeAttribute('role');
  for(const el of template.content.querySelectorAll('*'))for(const attr of [...el.attributes])if(attr.name.startsWith('data-')||['id','tabindex','aria-pressed'].includes(attr.name))el.removeAttribute(attr.name);
  return template.innerHTML;
 }
 function compare(){
  const box=host.querySelector('[data-comparison]');
  if(!pinned){box.innerHTML='';return}
  const params=value=>def.controls.filter(c=>primary.includes(c.id)).map(c=>`${c.label}: ${value[c.id]}`).join(' · ');
  morph(box,`<section class="pinned-comparison"><header><div><span class="eyebrow">COMPARE RESULTS</span><h4>What changed?</h4></div><button type="button" class="button subtle small" data-ui="unpin">Remove pin</button></header><div class="comparison-panels"><figure><figcaption>Pinned result</figcaption><p class="comparison-settings">${esc(params(pinned))}</p><div class="snapshot">${staticResult(pinned,state)}</div></figure><figure><figcaption>Current result</figcaption><p class="comparison-settings">${esc(params(state))}</p><div class="snapshot">${staticResult(state,pinned)}</div></figure></div></section>`);
 }
 function predictionHTML(){
  const p=guide?.prediction,box=host.querySelector('[data-prediction]');if(!p)return;
  morph(box,`<section class="prediction-card"><span class="eyebrow">PREDICT → TEST → EXPLAIN</span><h4>${esc(p.question)}</h4><div class="prediction-choices" role="group" aria-label="Your prediction">${p.options.map(([v,t])=>`<button type="button" data-predict="${v}" aria-pressed="${prediction===v}">${t}</button>`).join('')}</div><button type="button" class="button small" data-ui="test-prediction" ${prediction===null?'disabled':''}>Test prediction</button><p data-prediction-feedback role="status">${answer?`${answer.correct?'Your prediction matched.':'A different result than predicted.'} ${esc(answer.text)}`:'Choose a prediction, then run the check. You can keep exploring without answering.'}</p></section>`);
 }
 let playback=guide?.play;
 function draw(){
  morph(result,def.render(state));
  readablePlotLabels(result);
  if(!playback&&result.querySelector('[data-lab-action="step"]'))playback={label:'Play steps',tick(s){const before=JSON.stringify(s);def.action?.(s,'step');return before!==JSON.stringify(s)}};
  for(const c of def.controls){
   const el=controls.querySelector(`[data-param="${c.id}"]`);
   el.closest('label').hidden=def.visible?!def.visible(state,c.id):false;
   const bounds=def.bounds?.(state,c.id);if(c.type==='range'){el.min=bounds?.min??c.min;el.max=bounds?.max??c.max}
   if(c.type==='checkbox')el.checked=state[c.id];else el.value=state[c.id];
   const out=controls.querySelector(`[data-output="${c.id}"]`);if(out)out.textContent=fmt(state[c.id],5);
  }
  ui('play').hidden=ui('next').hidden=host.querySelector('.playback-speed').hidden=!playback;
  ui('play').textContent=playing?'Pause':'Play';ui('play').setAttribute('aria-label',playing?'Pause animation':playback?.label||'Play');
  ui('play').setAttribute('aria-pressed',String(playing));ui('back').disabled=!steps.length;
  for(const name of ['guided','explore'])ui(name).setAttribute('aria-pressed',String(mode===name));
  host.dataset.mode=mode;host.dataset.playing=String(playing);
  compare();predictionHTML();scheduleSave();
 }
 const reduced=win.matchMedia?.('(prefers-reduced-motion: reduce)');
 function stop(message='Paused. Use Next to inspect one step.'){
  playing=false;if(timer!==null)win.clearTimeout(timer);timer=null;
  ui('play').textContent='Play';ui('play').setAttribute('aria-label',playback?.label||'Play');ui('play').setAttribute('aria-pressed','false');host.dataset.playing='false';
  if(message)playStatus.textContent=message;
 }
 function advance(){
  if(!playback)return false;
  remember();if(!playback.tick(state)){steps.pop();ui('back').disabled=!steps.length;stop('This sequence is complete. Use Back or Reset to replay it.');return false}
  draw();return true;
 }
 function tick(){
  timer=null;if(disposed||!playing)return;
  if(doc.hidden){stop('Paused while the tab is hidden.');return}
  if(!advance())return;
  playCount++;if(playCount>=200){stop('Completed 200 steps. Play again to continue.');announce();return}
  timer=win.setTimeout(tick,(id==='dl-training'?170:950)/Number(ui('speed').value));
 }
 function togglePlay(){
  if(playing){stop();announce();return}
  host.dispatchEvent(new win.CustomEvent('lab-play',{bubbles:true,detail:host}));
  playing=true;playCount=0;ui('play').textContent='Pause';ui('play').setAttribute('aria-label','Pause animation');ui('play').setAttribute('aria-pressed','true');host.dataset.playing='true';
  playStatus.textContent=reduced?.matches?'Playing discrete steps; motion effects are disabled.':'Playing. Pause or press Escape to inspect a step.';
  timer=win.setTimeout(tick,350);
 }
 makeControls();draw();
 const resize=()=>readablePlotLabels(result);
 const resizeObserver=typeof win.ResizeObserver==='function'?new win.ResizeObserver(resize):null;
 resizeObserver?.observe(host);result.addEventListener('toggle',resize,true);
 const visibilityObserver=typeof win.IntersectionObserver==='function'?new win.IntersectionObserver(entries=>{if(playing&&!entries[0].isIntersecting)stop('Paused when the experiment left the screen.')}):null;
 visibilityObserver?.observe(host);
 const externalPlay=e=>{if(e.detail!==host&&playing)stop('Paused while another experiment plays.')};
 const visibility=()=>{if(doc.hidden&&playing)stop('Paused while the tab is hidden.')};
 const pagehide=()=>{stop('');save()};
 doc.addEventListener('lab-play',externalPlay);doc.addEventListener('visibilitychange',visibility);win.addEventListener('pagehide',pagehide);
 function setParam(key,value){
  if(key==='viewStep'){remember();state.viewStep=Math.max(0,Math.min(4,Number(value)));draw();return}
  const c=def.controls.find(c=>c.id===key);if(!c)return;
  if(c.type==='range'){
   value=Number(value);if(!Number.isFinite(value))return;
   const bounds=def.bounds?.(state,key);value=Math.max(bounds?.min??c.min,Math.min(bounds?.max??c.max,value));
  }else if(c.type==='select'&&!c.options.includes(value))return;
  remember();state[key]=value;def.change?.(state,key);answer=null;draw();
 }
 const change=e=>{
  if(e.target.dataset.ui==='speed')return;
  const el=e.target,key=el.dataset.param||el.dataset.direct;if(!key)return;
  // Native range input emits both input and change; calculate only the first.
  const value=el.type==='checkbox'?el.checked:el.type==='range'||el.type==='number'?Number(el.value):el.value;
  if(el.type==='number'&&(el.value===''||!el.validity.valid))return;
  if(state[key]===value){if(e.type==='change')announce();return}
  stop('');setParam(key,value);if(e.type==='change')announce();
 };
 const action=e=>{
  const el=e.target.closest('[data-lab-action],[data-ui],[data-lab-set],[data-predict]');if(!el||!host.contains(el))return;
  const name=el.dataset.ui;
  if(name==='speed')return;
  if(name==='play'){togglePlay();return}
  if(name==='next'){stop('One step.');advance();announce();return}
  if(name==='back'){stop('Previous state restored.');if(steps.length){state=steps.pop();draw();announce()}return}
  if(name==='guided'||name==='explore'){mode=name;controls.querySelector('.advanced-controls').open=mode==='explore';draw();return}
  if(name==='pin'){pinned=copy(state);draw();playStatus.textContent='Result pinned below. Change a setting to compare.';return}
  if(name==='unpin'){pinned=null;draw();return}
  if(name==='share'){
   const section=host.closest('[data-section]'),lesson=host.closest('[data-reader-lesson]');
   const url=new URL(win.location.href),params=new URLSearchParams({lab:id,setup:JSON.stringify(Object.fromEntries(def.controls.map(c=>[c.id,state[c.id]])))});
   url.hash=lesson&&section?`/lesson/${lesson.dataset.readerLesson}/${section.dataset.section}?${params}`:`${url.hash.slice(1).split('?')[0]}?${params}`;
   const box=host.querySelector('.share-setup');box.hidden=false;const input=box.querySelector('input');input.value=url.href;input.focus();input.select();return;
  }
  if(el.dataset.predict!==undefined){prediction=el.dataset.predict;answer=null;predictionHTML();scheduleSave();return}
  if(name==='test-prediction'){if(prediction===null)return;stop('Prediction checked.');remember();const outcome=guide.prediction.run(state);answer={...outcome,correct:outcome.answer===prediction};draw();announce();return}
  if(el.dataset.labSet){stop('');setParam(el.dataset.labSet,el.dataset.value);announce();return}
  const a=el.dataset.labAction;if(!a)return;
  stop('');remember();
  if(a==='reset'){state=def.initial();prediction=answer=null;steps=[];makeControls();playStatus.textContent='Experiment reset. A pinned result is kept for comparison.'}
  else{def.action?.(state,a);answer=null}
  draw();announce();
 };
 const move=e=>{
  if(!drag||e.pointerId!==drag.id)return;
  const p=drag.point;p.x=e.clientX;p.y=e.clientY;
  def.pointer(state,p.matrixTransform(drag.matrix));draw();e.preventDefault();
 };
 const start=e=>{
  const plot=e.target.closest('svg[data-plot]');if(!plot||!def.pointer||e.button!==0||drag)return;
  const matrix=plot.getScreenCTM();if(!matrix)return;
  stop('');remember();drag={id:e.pointerId,point:plot.createSVGPoint(),matrix:matrix.inverse()};
  drag.point.x=e.clientX;drag.point.y=e.clientY;def.pointerStart?.(state,drag.point.matrixTransform(drag.matrix));
  host.setPointerCapture(e.pointerId);move(e);
 };
 const end=e=>{if(!drag||e.pointerId!==drag.id)return;drag=null;if(host.hasPointerCapture(e.pointerId))host.releasePointerCapture(e.pointerId);announce();};
 const keydown=e=>{if(e.key==='Escape'&&playing){stop();announce()}if(e.target.matches('g[data-lab-set]')&&['Enter',' '].includes(e.key)){e.preventDefault();action(e)}};
 const events={input:change,change,click:action,keydown,pointerdown:start,pointermove:move,pointerup:end,pointercancel:end,lostpointercapture:end};
 for(const [type,fn] of Object.entries(events))host.addEventListener(type,fn);
 return()=>{disposed=true;stop('');if(saveTimer!==null)win.clearTimeout(saveTimer);save();resizeObserver?.disconnect();visibilityObserver?.disconnect();result.removeEventListener('toggle',resize,true);doc.removeEventListener('lab-play',externalPlay);doc.removeEventListener('visibilitychange',visibility);win.removeEventListener('pagehide',pagehide);if(drag&&host.hasPointerCapture(drag.id))host.releasePointerCapture(drag.id);drag=null;for(const [type,fn] of Object.entries(events))host.removeEventListener(type,fn)};
}
export {definitions};
