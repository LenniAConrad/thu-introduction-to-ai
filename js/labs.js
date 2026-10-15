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
export function mountLab(host,id){
 if(id==='masks')return mountMasks(host);
 if(id==='attention')return mountAttention(host);
 const def=definitions[id];
 if(!def){host.textContent='Exercise not found.';return ()=>{}}
 let state=def.initial(),drag=null;
 host.innerHTML=`<div class="lab-goal"><strong>Goal</strong><p>${esc(labGoals[id])}</p></div><div class="native-lab"><div class="lab-controls" data-controls></div><div class="lab-result" data-result></div></div><p class="sr-only" data-plot-status role="status" aria-live="polite"></p>`;
 const controls=host.querySelector('[data-controls]'),result=host.querySelector('[data-result]'),status=host.querySelector('[data-plot-status]');
 const controlsHTML=()=>def.controls.map(c=>`<label>${esc(c.label)}${c.type==='range'?` <output data-output="${c.id}">${fmt(state[c.id],5)}</output><input type="range" data-param="${c.id}" aria-label="${esc(c.label)}" min="${c.min}" max="${c.max}" step="${c.step}" value="${state[c.id]}">`:c.type==='select'?`<select data-param="${c.id}" aria-label="${esc(c.label)}">${c.options.map(o=>`<option ${String(state[c.id])===o?'selected':''}>${esc(o)}</option>`).join('')}</select>`:c.type==='checkbox'?`<input type="checkbox" data-param="${c.id}" ${state[c.id]?'checked':''}>`:`<input type="text" data-param="${c.id}" value="${esc(state[c.id])}" maxlength="1000">`}</label>`).join('')+button('reset','Reset');
 const draw=()=>{
  const expanded=[...result.querySelectorAll('details')].map(el=>el.open);
  result.innerHTML=def.render(state);
  result.querySelectorAll('details').forEach((el,i)=>{if(expanded[i])el.open=true});
  readablePlotLabels(result);
  for(const c of def.controls){
   const el=controls.querySelector(`[data-param="${c.id}"]`);
   if(def.visible)el.closest('label').hidden=!def.visible(state,c.id);
   const bounds=def.bounds?.(state,c.id);if(c.type==='range'&&bounds){el.min=bounds.min??c.min;el.max=bounds.max??c.max;}
   if(c.type==='checkbox')el.checked=state[c.id];else el.value=state[c.id];
   const out=controls.querySelector(`[data-output="${c.id}"]`);if(out)out.textContent=fmt(state[c.id],5);
  }
 };
 const announce=()=>{status.textContent=def.describe?.(state)||'';};
 controls.innerHTML=controlsHTML();draw();
 const resize=()=>readablePlotLabels(result);
 const observer=typeof host.ownerDocument.defaultView?.ResizeObserver==='function'?new host.ownerDocument.defaultView.ResizeObserver(resize):null;
 observer?.observe(host);result.addEventListener('toggle',resize,true);
 const change=e=>{
  const el=e.target,key=el.dataset.param;if(!key)return;
  state[key]=el.type==='checkbox'?el.checked:el.type==='range'?Number(el.value):el.value;
  def.change?.(state,key);draw();if(e.type==='change')announce();
 };
 const action=e=>{
  const el=e.target.closest('[data-lab-action]');if(!el)return;
  const a=el.dataset.labAction,focused=el===host.ownerDocument.activeElement||el.contains(host.ownerDocument.activeElement);
  if(a==='reset'){state=def.initial();controls.innerHTML=controlsHTML();result.innerHTML='';}else def.action?.(state,a);
  draw();announce();
  if(focused){const next=[...host.querySelectorAll('[data-lab-action]')].find(button=>button.dataset.labAction===a);if(next)next.focus({preventScroll:true});else{result.tabIndex=-1;result.focus({preventScroll:true})}}
 };
 const move=e=>{
  if(!drag||e.pointerId!==drag.id)return;
  const p=drag.point;p.x=e.clientX;p.y=e.clientY;
  def.pointer(state,p.matrixTransform(drag.matrix));draw();e.preventDefault();
 };
 const start=e=>{
  const plot=e.target.closest('svg[data-plot]');
  if(!plot||!def.pointer||e.button!==0||drag)return;
  const matrix=plot.getScreenCTM();if(!matrix)return;
  drag={id:e.pointerId,point:plot.createSVGPoint(),matrix:matrix.inverse()};
  host.setPointerCapture(e.pointerId);move(e);
 };
 const end=e=>{if(!drag||e.pointerId!==drag.id)return;drag=null;if(host.hasPointerCapture(e.pointerId))host.releasePointerCapture(e.pointerId);announce();};
 const events={input:change,change,click:action,pointerdown:start,pointermove:move,pointerup:end,pointercancel:end,lostpointercapture:end};
 for(const [type,fn] of Object.entries(events))host.addEventListener(type,fn);
 return()=>{observer?.disconnect();result.removeEventListener('toggle',resize,true);if(drag&&host.hasPointerCapture(drag.id))host.releasePointerCapture(drag.id);drag=null;for(const [type,fn] of Object.entries(events))host.removeEventListener(type,fn);};
}
export {definitions};
