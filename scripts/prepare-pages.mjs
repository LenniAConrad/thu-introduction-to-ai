import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),output=path.join(root,'_site');
const files=JSON.parse(await fs.readFile(path.join(root,'site-files.json'),'utf8'));
const listed=new Set(files);
if(listed.size!==files.length)throw Error('Duplicate site files.');
for(const name of files){if(typeof name!=='string'||path.posix.normalize(name)!==name||name.startsWith('../')||path.isAbsolute(name)||name.startsWith('.')&&name!=='.nojekyll'||/^(?:sources|slides|docs|content|node_modules|scripts|tests|_site)\//.test(name))throw Error('Invalid public site path: '+name);if(!(await fs.lstat(path.join(root,name))).isFile())throw Error('Expected a regular public file: '+name)}
const html=await fs.readFile(path.join(root,'index.html'),'utf8');
const references=[...html.matchAll(/(?:src|href)="(\.\/[^"#?]+)(?:[^"#]*)"/g)].map(m=>m[1]);
for(const ref of references)if(!listed.has(path.posix.normalize(ref)))throw Error('Missing HTML resource: '+ref);
for(const name of files.filter(f=>f.endsWith('.js'))){const code=await fs.readFile(path.join(root,name),'utf8');for(const m of code.matchAll(/(?:from\s*|import\s*)['"](\.[^'"]+)['"]/g)){const ref=path.posix.normalize(path.posix.join(path.posix.dirname(name),m[1]));if(!listed.has(ref))throw Error('Missing module: '+ref)}}
const manifest=JSON.parse(await fs.readFile(path.join(root,'course-manifest.json'),'utf8'));
if(manifest.persistence!=='none'||!manifest.publicUrl.startsWith('https://'))throw Error('Invalid public course metadata.');
if(!listed.has(path.posix.normalize(manifest.content.lessons)))throw Error('Missing lecture data.');
const lessons=JSON.parse(await fs.readFile(path.join(root,'data/lessons.json'),'utf8'));
if(lessons.length!==13||lessons.some(l=>l.group==='Coursework'))throw Error('Expected the13 public lectures.');
const assets=JSON.parse(await fs.readFile(path.join(root,'assets/ATTRIBUTIONS.json'),'utf8')).assets;
for(const a of assets){if(!listed.has(a.path)||!a.sourceUrl||!a.creator||!a.license||!a.licenseUrl)throw Error('Incomplete asset attribution.');if(createHash('sha256').update(await fs.readFile(path.join(root,a.path))).digest('hex')!==a.sha256)throw Error('Licensed asset changed: '+a.path)}
if(!listed.has('.nojekyll')||!(await fs.readFile(path.join(root,'.nojekyll'))).equals(Buffer.alloc(0)))throw Error('Missing .nojekyll.');
await fs.rm(output,{recursive:true,force:true});await fs.mkdir(output,{recursive:true});
for(const name of files){const target=path.join(output,name);await fs.mkdir(path.dirname(target),{recursive:true});await fs.copyFile(path.join(root,name),target)}
console.log(`Pages ready: ${files.length} files, ${lessons.length} lectures, ${lessons.reduce((n,l)=>n+l.questions.length,0)} questions; every module and licensed asset verified.`);
