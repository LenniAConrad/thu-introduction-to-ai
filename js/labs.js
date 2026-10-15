import {enhanceLabs} from './guided-labs.js';
import {comparisonDetails} from './experiment-comparison.js';
import {copy,morph,applySetup} from './study-session.js';
import {readablePlotLabels} from './plot-labels.js';
import {experimentLayout} from './experiment-layout.js';
import {presentExperiment,controlOptionLabel,controlLabel} from './experiment-presentation.js';
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
 let prediction=null,answer=null,mode='guided',seeking=false,editing=null,shareVersion=0,shareCopying=false;
 if(saved){try{def.normalize?.(saved.state);if(saved.pinned)def.normalize?.(saved.pinned);def.render(saved.state);if(saved.pinned)def.render(saved.pinned);state=saved.state;pinned=saved.pinned||null;prediction=saved.prediction||null;answer=saved.answer||null;mode=saved.mode==='explore'?'explore':'guided'}catch{}}
 if(setup){state=applySetup(def,setup);pinned=null;prediction=answer=null}
 const primary=guide?.primary||def.controls.slice(0,3).map(c=>c.id);
 host.classList.add('enhanced-lab');
 const heading=host.closest('.inline-experiment')?'':`<div class="lab-heading"><h4>${esc(guide?.label||labCatalog.find(l=>l[0]===id)?.[1]||'Explore the model')}</h4></div><p class="lab-goal">${esc(labGoals[id])}</p>`;
 host.innerHTML=`${heading}<div class="native-lab"><div class="lab-controls" data-controls></div><div class="lab-result" data-result></div></div><div class="experiment-transport">${guide?.timeline?'<label class="calculation-timeline" hidden><span data-timeline-label>Calculation step</span><input type="range" data-ui="timeline" aria-label="Calculation step" min="0" value="0"></label>':''}<div class="experiment-toolbar"><div class="playback-controls"><button type="button" class="button" data-ui="play" hidden>Play</button><button type="button" class="button subtle small" data-ui="previous" aria-label="Previous step" hidden>Previous</button><button type="button" class="button subtle small" data-ui="next" aria-label="Next step" hidden>Next</button><label class="playback-speed" hidden><span class="sr-only">Speed</span><select data-ui="speed" aria-label="Playback speed"><option value="0.5">0.5×</option><option value="1" selected>1×</option><option value="2">2×</option></select></label></div><details class="experiment-options"><summary>Options</summary><div class="experiment-tools"><button type="button" class="button subtle small" data-ui="back" disabled>Undo change</button><button type="button" class="button subtle small" data-ui="pin">Pin result</button><button type="button" class="button subtle small" data-ui="share">Share setup</button>${button('reset','Reset experiment')}</div></details></div><p class="playback-status" role="status" data-play-status></p></div><div class="share-setup" hidden><label>Link to a fresh run with these controls<input type="text" readonly data-share-link></label><p>Trained weights and edited arrays stay in this tab.</p><div class="share-actions"><button type="button" class="button small" data-ui="copy-share">Copy link</button><button type="button" class="button subtle small" data-ui="close-share">Close</button><span role="status" data-copy-status></span></div></div><div class="lab-result lab-explanations" data-explanations></div><div data-prediction></div><div data-comparison></div><p class="sr-only" data-plot-status role="status" aria-live="polite"></p>`;
 const controls=host.querySelector('[data-controls]'),result=host.querySelector('[data-result]'),explanations=host.querySelector('[data-explanations]'),status=host.querySelector('[data-plot-status]');
 const ui=name=>host.querySelector(`[data-ui="${name}"]`);
 const playStatus=host.querySelector('[data-play-status]');
 function presentation(html){
  const view=doc.createElement('template');view.innerHTML=presentExperiment(doc,html,{guided:!!guide?.visual,stepAction:!!playback});
  const details=[...view.content.querySelectorAll('details.lab-math,details.calculation-products,details.cell-editors,details.architecture-overview,details.weight-inspection,details.point-calculation,details[data-morph-key="variance-sweep"]')];
  const extra=details.map(el=>{el.remove();return el.outerHTML}).join('');
  return {main:view.innerHTML,extra};
 }
 const layout=experimentLayout(host,result,{samples(){
  const timeline=guide?.timeline,max=timeline?.max(state);
  // These are previews of copied state; they never train or advance the live model.
  if(guide?.visual&&Number.isInteger(max)&&max<=20)return Array.from({length:max+1},(_,step)=>{const preview=copy(state);timeline.seek(preview,step);return presentation(guide.visual(preview)).main});
  // Some training demos add an update record on their first step. Measure that
  // state before interaction so it cannot push the transport down when it appears.
  if(!timeline&&def.action){const preview=copy(state);def.action(preview,'step');return [presentation(def.render(preview)).main]}
  return [];
 }});
 // Every Transformer stage was measured together; changing the playhead must
 // not render all fourteen stages again on each animation frame.
 const layoutKey=()=>JSON.stringify(def.controls.filter(c=>(c.type==='select'||c.type==='checkbox')&&!(id==='tf-transformer'&&c.id==='stage')).map(c=>state[c.id]).concat(guide?.timeline?.max(state)??null));
 const control=c=>`<label data-control-label="${c.id}" data-control-type="${c.type}"><span class="control-name">${esc(controlLabel(c.label))}</span>${c.type==='range'?` <output data-output="${c.id}">${fmt(state[c.id],5)}</output><input type="range" data-param="${c.id}" aria-label="${esc(controlLabel(c.label))}" min="${c.min}" max="${c.max}" step="${c.step}" value="${state[c.id]}">`:c.type==='select'?`<select data-param="${c.id}" aria-label="${esc(controlLabel(c.label))}">${c.options.map(o=>`<option value="${esc(o)}" ${String(state[c.id])===o?'selected':''}>${esc(controlOptionLabel(o))}</option>`).join('')}</select>`:c.type==='checkbox'?`<input type="checkbox" data-param="${c.id}" ${state[c.id]?'checked':''}>`:`<input type="text" aria-label="${esc(controlLabel(c.label))}" data-param="${c.id}" value="${esc(state[c.id])}" maxlength="1000">`}</label>`;
 function makeControls(){controls.innerHTML=def.controls.filter(c=>primary.includes(c.id)).map(control).join('')+`<details class="advanced-controls" ${mode==='explore'?'open':''}><summary>More controls</summary><div>${def.controls.filter(c=>!primary.includes(c.id)).map(control).join('')}</div></details>`;controls.querySelector('.advanced-controls').hidden=def.controls.every(c=>primary.includes(c.id))}
 function save(){if(!session)return;session.write('lab:'+id,{state,pinned,prediction,answer,mode})}
 function scheduleSave(){if(saveTimer!==null)win.clearTimeout(saveTimer);saveTimer=win.setTimeout(()=>{saveTimer=null;save()},400)}
 function remember(kind='change'){steps.push({state:copy(state),kind});if(steps.length>40)steps.shift();ui('back').disabled=false}
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
  const params=value=>def.controls.filter(c=>primary.includes(c.id)).map(c=>`${controlLabel(c.label)}: ${value[c.id]}`).join(' · ');
  const visual=guide?.compare?.(pinned,state)||'';
  morph(box,`<section class="pinned-comparison"><header><h4>What changed?</h4><button type="button" class="button subtle small" data-ui="unpin">Remove pin</button></header>${visual}<details data-morph-key="comparison-numbers" class="comparison-records"><summary>Numerical differences</summary>${comparisonDetails(def,pinned,state)}</details>${visual?'<details data-morph-key="comparison-snapshots" class="comparison-records"><summary>View both results</summary>':''}<div class="comparison-panels"><figure><figcaption>Pinned result</figcaption><p class="comparison-settings">${esc(params(pinned))}</p><div class="snapshot">${staticResult(pinned,state)}</div></figure><figure><figcaption>Current result</figcaption><p class="comparison-settings">${esc(params(state))}</p><div class="snapshot">${staticResult(state,pinned)}</div></figure></div>${visual?'</details>':''}</section>`);
 }
 function predictionHTML(){
  const p=guide?.prediction,box=host.querySelector('[data-prediction]');if(!p)return;
  morph(box,`<details class="prediction-card"><summary>Predict and test</summary><h4>${esc(p.question)}</h4><div class="prediction-choices" role="group" aria-label="Your prediction">${p.options.map(([v,t])=>`<button type="button" data-predict="${v}" aria-pressed="${prediction===v}">${t}</button>`).join('')}</div><button type="button" class="button small" data-ui="test-prediction" ${prediction===null?'disabled':''}>Test prediction</button><p data-prediction-feedback role="status">${answer?`${answer.correct?'Your prediction matched.':'A different result than predicted.'} ${esc(answer.text)}`:'Choose an answer, then test it.'}</p></details>`);
 }
 let playback=guide?.play;
 function draw(){
  const html=def.render(state);
  if(!playback&&html.includes('data-lab-action="step"'))playback={label:'Play steps',tick(s){const before=JSON.stringify(s);def.action?.(s,'step');return before!==JSON.stringify(s)}};
  const view=presentation(html);
  morph(result,view.main);morph(explanations,view.extra);
  readablePlotLabels(result);
  readablePlotLabels(explanations);
  layout.update(layoutKey());
  for(const c of def.controls){
   const el=controls.querySelector(`[data-param="${c.id}"]`);
   el.closest('label').hidden=def.visible?!def.visible(state,c.id):false;
   const bounds=def.bounds?.(state,c.id);if(c.type==='range'){el.min=bounds?.min??c.min;el.max=bounds?.max??c.max}
   if(c.type==='checkbox')el.checked=state[c.id];else el.value=state[c.id];
   const out=controls.querySelector(`[data-output="${c.id}"]`);if(out)out.textContent=fmt(state[c.id],5);
  }
  const advanced=controls.querySelector('.advanced-controls');advanced.hidden=![...advanced.querySelectorAll('[data-control-label]')].some(el=>!el.hidden);
  ui('play').hidden=ui('next').hidden=ui('previous').hidden=host.querySelector('.playback-speed').hidden=!playback;
  ui('next').disabled=!!playback?.finished?.(state);
  ui('play').textContent=playing?'Pause':playback?.finished?.(state)?'Replay':'Play';ui('play').setAttribute('aria-label',playing?'Pause animation':playback?.finished?.(state)?'Replay calculation':playback?.label||'Play');
  ui('play').setAttribute('aria-pressed',String(playing));ui('back').disabled=!steps.length;
  const timeline=guide?.timeline;
  ui('previous').disabled=timeline?timeline.get(state)<=0:steps.at(-1)?.kind!=='step';
  if(timeline)host.querySelector('.calculation-timeline').hidden=false;
  if(timeline){const slider=ui('timeline');slider.max=timeline.max(state);slider.step=timeline.step||1;slider.value=timeline.get(state);slider.setAttribute('aria-valuetext',timeline.label(state));host.querySelector('[data-timeline-label]').textContent=timeline.label(state)}
  host.dataset.mode=mode;host.dataset.playing=String(playing);host.dataset.animated=String(!!playback);
  compare();predictionHTML();scheduleSave();
 }
 const reduced=win.matchMedia?.('(prefers-reduced-motion: reduce)');
 function stop(message='Paused. Use Next to inspect one step.'){
  playing=false;if(timer!==null)win.clearTimeout(timer);timer=null;
  ui('play').textContent=playback?.finished?.(state)?'Replay':'Play';ui('play').setAttribute('aria-label',playback?.finished?.(state)?'Replay calculation':playback?.label||'Play');ui('play').setAttribute('aria-pressed','false');host.dataset.playing='false';
  playStatus.textContent=message;
 }
 function advance(){
  if(!playback)return false;
  remember('step');if(!playback.tick(state)){steps.pop();ui('back').disabled=!steps.length;stop(playback.restart?'Complete. Replay uses the same settings.':'Complete. Use Previous or reset the experiment.');return false}
  draw();if(playback.finished?.(state)){stop('Complete. Replay uses the same settings.');return false}return true;
 }
 function tick(){
  timer=null;if(disposed||!playing)return;
  if(doc.hidden){stop('Paused while the tab is hidden.');return}
  if(!advance())return;
  playCount++;if(playCount>=200){stop('Completed 200 steps. Play again to continue.');announce();return}
  timer=win.setTimeout(tick,(playback.interval||1250)/Number(ui('speed').value));
 }
 function togglePlay(){
  if(playing){stop();announce();return}
  editing=null;seeking=false;
  if(playback?.finished?.(state)&&playback.restart){remember();playback.restart(state);draw()}
  host.dispatchEvent(new win.CustomEvent('lab-play',{bubbles:true,detail:host}));
  playing=true;playCount=0;ui('play').textContent='Pause';ui('play').setAttribute('aria-label','Pause animation');ui('play').setAttribute('aria-pressed','true');host.dataset.playing='true';
  playStatus.textContent=reduced?.matches?'Playing discrete steps; motion effects are disabled.':'Playing. Pause or press Escape to inspect a step.';
  timer=win.setTimeout(tick,(playback.interval||1250)/Number(ui('speed').value));
 }
 makeControls();draw();
 const resize=()=>{readablePlotLabels(result);readablePlotLabels(explanations);layout.update(layoutKey())};
 const resizeObserver=typeof win.ResizeObserver==='function'?new win.ResizeObserver(resize):null;
 resizeObserver?.observe(host);result.addEventListener('toggle',resize,true);explanations.addEventListener('toggle',resize,true);
 const visibilityObserver=typeof win.IntersectionObserver==='function'?new win.IntersectionObserver(entries=>{if(playing&&!entries[0].isIntersecting)stop('Paused when the experiment left the screen.')}):null;
 visibilityObserver?.observe(result);
 const externalPlay=e=>{if(e.detail!==host&&playing)stop('Paused while another experiment plays.')};
 const visibility=()=>{if(doc.hidden&&playing)stop('Paused while the tab is hidden.')};
 const pagehide=()=>{stop('');save()};
 doc.addEventListener('lab-play',externalPlay);doc.addEventListener('visibilitychange',visibility);win.addEventListener('pagehide',pagehide);
 function setParam(key,value,rememberChange=true){
  if(key==='viewStep'){remember();state.viewStep=Math.max(0,Math.min(4,Number(value)));def.change?.(state,key);draw();return}
  const c=def.controls.find(c=>c.id===key);if(!c)return;
  if(c.type==='range'){
   value=Number(value);if(!Number.isFinite(value))return;
   const bounds=def.bounds?.(state,key);value=Math.max(bounds?.min??c.min,Math.min(bounds?.max??c.max,value));
  }else if(c.type==='select'&&!c.options.includes(value))return;
  if(rememberChange)remember();state[key]=value;def.change?.(state,key);answer=null;draw();
 }
 const change=e=>{
  if(e.target.dataset.ui==='speed'){if(playing){win.clearTimeout(timer);timer=win.setTimeout(tick,(playback.interval||1250)/Number(ui('speed').value))}return}
  if(e.target.dataset.ui==='timeline'){
   const n=Number(e.target.value);if(!guide?.timeline||!Number.isFinite(n))return;
   stop('');if(!seeking){remember();seeking=true}
   guide.timeline.seek(state,Math.max(0,Math.min(guide.timeline.max(state),n)));draw();
   if(e.type==='change'){seeking=false;announce()}return;
  }
  const el=e.target,key=el.dataset.param||el.dataset.direct;if(!key)return;
  // Native range input emits both input and change; calculate only the first.
  const value=el.type==='checkbox'?el.checked:el.type==='range'||el.type==='number'?Number(el.value):el.value;
  if(el.type==='number'&&(el.value===''||!el.validity.valid))return;
  if(state[key]===value){if(e.type==='change'){editing=null;announce()}return}
  stop('');setParam(key,value,editing!==key);editing=key;if(e.type==='change'){editing=null;announce()}
 };
 const action=e=>{
  const el=e.target.closest('[data-lab-action],[data-ui],[data-lab-set],[data-predict],[data-story-inspect]');if(!el||!host.contains(el))return;
  const name=el.dataset.ui;
  if(name==='speed'||name==='timeline')return;
  editing=null;seeking=false;
  if(el.dataset.storyInspect!==undefined){stop('');guide?.inspect?.(state,el.dataset.storyInspect);draw();const detail=host.querySelector('.point-calculation');if(detail)detail.open=true;announce();return}
  if(name==='play'){togglePlay();return}
  if(name==='next'){stop('One step.');advance();announce();return}
  if(name==='previous'){
   stop('Previous step.');const timeline=guide?.timeline;
   if(timeline&&timeline.get(state)>0){remember('seek');guide.timeline.seek(state,Math.max(0,timeline.get(state)-(timeline.previousStep||timeline.step||1)));draw()}
   else if(steps.at(-1)?.kind==='step'){state=steps.pop().state;draw()}
   announce();return;
  }
  if(name==='back'){stop('Last change undone.');if(steps.length){state=steps.pop().state;draw();announce()}return}
  if(name==='pin'){stop('');pinned=copy(state);draw();playStatus.textContent='Result pinned below. Change a setting to compare.';host.querySelector('.experiment-options').open=false;host.querySelector('.experiment-options>summary').focus({preventScroll:true});return}
  if(name==='unpin'){pinned=null;draw();host.querySelector('.experiment-options>summary').focus({preventScroll:true});return}
  if(name==='share'){
   stop('');host.querySelector('.experiment-options').open=false;
   const section=host.closest('[data-section]'),lesson=host.closest('[data-reader-lesson]');
   const url=new URL(win.location.href),params=new URLSearchParams({lab:id,setup:JSON.stringify(Object.fromEntries(def.controls.map(c=>[c.id,state[c.id]])))});
   url.hash=lesson&&section?`/lesson/${lesson.dataset.readerLesson}/${section.dataset.section}?${params}`:`${url.hash.slice(1).split('?')[0]}?${params}`;
   const box=host.querySelector('.share-setup');box.hidden=false;shareVersion++;shareCopying=false;box.querySelector('[data-copy-status]').textContent='';ui('copy-share').removeAttribute('aria-busy');const input=box.querySelector('input');input.value=url.href;input.focus();input.select();return;
  }
  if(name==='copy-share'){
   const box=host.querySelector('.share-setup'),input=box.querySelector('input'),message=box.querySelector('[data-copy-status]'),version=shareVersion;
   if(shareCopying)return;shareCopying=true;el.setAttribute('aria-busy','true');message.textContent='Copying…';
   const valid=()=>!disposed&&!box.hidden&&version===shareVersion;
   const fallback=()=>{if(!valid())return;message.textContent='Select and copy the link above.';input.focus();input.select()};
   try{
    if(!win.navigator.clipboard?.writeText){fallback();shareCopying=false;el.removeAttribute('aria-busy');return}
    Promise.resolve(win.navigator.clipboard.writeText(input.value)).then(()=>{if(valid())message.textContent='Link copied.'},fallback).finally(()=>{if(valid()){shareCopying=false;el.removeAttribute('aria-busy')}});
   }catch{fallback();shareCopying=false;el.removeAttribute('aria-busy')}
   return;
  }
  if(name==='close-share'){shareVersion++;host.querySelector('.share-setup').hidden=true;host.querySelector('.experiment-options>summary').focus({preventScroll:true});return}
  if(el.dataset.predict!==undefined){prediction=el.dataset.predict;answer=null;predictionHTML();scheduleSave();return}
  if(name==='test-prediction'){if(prediction===null)return;stop('Prediction checked.');remember();const outcome=guide.prediction.run(state);answer={...outcome,correct:outcome.answer===prediction};draw();announce();return}
  if(el.dataset.labSet){stop('');setParam(el.dataset.labSet,el.dataset.value);if(['pixel','weight'].includes(el.dataset.labSet)){const editor=host.querySelector('.cell-editors');if(editor)editor.open=true}announce();return}
  const a=el.dataset.labAction;if(!a)return;
  stop('');
  if(a==='reset'){state=def.initial();prediction=answer=null;steps=[];makeControls();playStatus.textContent=pinned?'Experiment reset. Pinned result kept for comparison.':'Experiment reset.'}
  else{remember();def.action?.(state,a);answer=null}
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
 const keydown=e=>{if(e.key==='Escape'&&playing){stop();announce()}if(e.target.matches('g[data-lab-set],g[data-story-inspect]')&&['Enter',' '].includes(e.key)){e.preventDefault();action(e)}};
 const controlsToggle=()=>{mode=controls.querySelector('.advanced-controls').open?'explore':'guided';scheduleSave()};
 controls.addEventListener('toggle',controlsToggle,true);
 const inspectToggle=e=>{
  if(!playing||!e.target.open)return;
  for(let p=e.target.parentElement;p&&p!==host;p=p.parentElement)if(p.tagName==='DETAILS'&&!p.open)return;
  stop('Paused for inspection.');
 };
 host.addEventListener('toggle',inspectToggle,true);
 const events={input:change,change,click:action,keydown,pointerdown:start,pointermove:move,pointerup:end,pointercancel:end,lostpointercapture:end};
 for(const [type,fn] of Object.entries(events))host.addEventListener(type,fn);
 return()=>{disposed=true;stop('');layout.destroy();if(saveTimer!==null)win.clearTimeout(saveTimer);save();resizeObserver?.disconnect();visibilityObserver?.disconnect();result.removeEventListener('toggle',resize,true);explanations.removeEventListener('toggle',resize,true);doc.removeEventListener('lab-play',externalPlay);doc.removeEventListener('visibilitychange',visibility);win.removeEventListener('pagehide',pagehide);if(drag&&host.hasPointerCapture(drag.id))host.releasePointerCapture(drag.id);drag=null;controls.removeEventListener('toggle',controlsToggle,true);host.removeEventListener('toggle',inspectToggle,true);for(const [type,fn] of Object.entries(events))host.removeEventListener(type,fn)};
}
export {definitions};
