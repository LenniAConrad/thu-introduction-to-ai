import {createApp} from './app.js';
const root=document.getElementById('app');
async function start(retrying=false){
 root.innerHTML='<p class="startup" role="status">Loading course content…</p>';
 try{
  const response=await fetch('./data/lessons.json');
  if(!response.ok)throw Error('Could not load lectures');
  const lessons=await response.json();
  createApp(root,lessons);
  if(retrying){const heading=root.querySelector(".page-content h1");if(heading){heading.tabIndex=-1;heading.focus()}}
 }catch(error){
  root.innerHTML='<div class="startup"><h1 tabindex="-1">Could not load the course</h1><p>Check your connection and try again. For a local copy, run start.sh and open its HTTP address.</p><button class="button" type="button">Retry</button></div>';
  root.querySelector('h1').focus();
  root.querySelector('button').addEventListener('click',start,{once:true});
  console.error(error);
 }
}
await start();
