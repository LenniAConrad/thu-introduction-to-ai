export const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const asset=path=>'./'+String(path).replace(/^\//,'');
export const fmt=(x,d=3)=>x===null?'Undefined':Number.isFinite(x)?String(Number(x.toFixed(d))):x===-Infinity?'−∞':'Undefined';
// Native MathML for the small TeX subset used by the course notes. No library or build step.
export function math(tex,display=false){
 let i=0;const symbols={rho:'ρ',xi:'ξ',Vert:'‖',zeta:'ζ',ell:'ℓ',leq:'≤',lbrace:'{',rbrace:'}',alpha:'α',beta:'β',delta:'δ',in:'∈',ldots:'…',lfloor:'⌊',rfloor:'⌋',lceil:'⌈',rceil:'⌉',pi:'π',pm:'±',sum:'∑',prod:'∏',eta:'η',gamma:'γ',mu:'μ',phi:'φ',sigma:'σ',theta:'θ',lambda:'λ',tau:'τ',nabla:'∇',varepsilon:'ε',partial:'∂',times:'×',cdot:'·',cdots:'⋯',leftarrow:'←',to:'→',mid:'|',sim:'∼',cap:'∩',cup:'∪',infty:'∞',le:'≤',ge:'≥',ne:'≠',approx:'≈'};
 const ws=()=>{while(/\s/.test(tex[i]||'')&&i<tex.length)i++};
 function atom(single=false){ws();if(i>=tex.length)return '<mrow/>';let c=tex[i++];
  if(c==='{')return `<mrow>${seq('}')}</mrow>`;
  if(c==='\\'){const match=tex.slice(i).match(/^[A-Za-z]+/);if(!match){i++;return '<mspace width="0.15em"/>'}const cmd=match[0];i+=cmd.length;
   if(cmd==='qquad')return '<mspace width="1em"/>';
   if(cmd==='frac')return `<mfrac>${atom(true)}${atom(true)}</mfrac>`;
   if(cmd==='sqrt')return `<msqrt>${atom(true)}</msqrt>`;
   if(cmd==='hat'||cmd==='bar')return `<mover accent="true">${atom(true)}<mo>${cmd==='hat'?'^':'¯'}</mo></mover>`;
   if(['left','right'].includes(cmd))return atom();
   if(['mathbf','mathrm','mathbb','operatorname','text'].includes(cmd))return `<mstyle mathvariant="${cmd==='mathbf'?'bold':cmd==='mathbb'?'double-struck':'normal'}">${atom()}</mstyle>`;
   if(['sin','cos','exp','log','ln','tanh','max','min','softmax'].includes(cmd))return `<mi mathvariant="normal">${cmd}</mi>`;
   return symbols[cmd]?(['rho','xi','zeta','ell','alpha','beta','delta','pi','eta','gamma','mu','phi','sigma','theta','lambda','tau','varepsilon'].includes(cmd)?`<mi>${symbols[cmd]}</mi>`:`<mo>${symbols[cmd]}</mo>`):`<mtext>${esc('\\'+cmd)}</mtext>`;
  }
  if(/[0-9.]/.test(c)){while(!single&&/[0-9.]/.test(tex[i]||'')&&i<tex.length)c+=tex[i++];return `<mn>${c}</mn>`}
  return /\p{L}/u.test(c)?`<mi>${c}</mi>`:`<mo>${esc(c)}</mo>`;
 }
 function seq(end){let out='';while(i<tex.length){ws();if(tex[i]===end){i++;break}if(i>=tex.length)break;let base=atom(),sub=null,sup=null;ws();while(tex[i]==='_'||tex[i]==='^'){const op=tex[i++],v=atom(true);if(op==='_')sub=v;else sup=v;ws()}out+=sub&&sup?`<msubsup>${base}${sub}${sup}</msubsup>`:sub?`<msub>${base}${sub}</msub>`:sup?`<msup>${base}${sup}</msup>`:base;}return out;}
 return `<math xmlns="http://www.w3.org/1998/Math/MathML" ${display?'display="block"':''} aria-label="${esc(tex)}"><semantics><mrow>${seq()}</mrow><annotation encoding="application/x-tex">${esc(tex)}</annotation></semantics></math>`;
}
function inline(text){const tokens=[];const keep=html=>`\u0001${tokens.push(html)-1}\u0001`;let s=text.replace(/`([^`]+)`/g,(_,v)=>keep(`<code>${esc(v)}</code>`)).replace(/\$([^$\n]+)\$/g,(_,v)=>keep(math(v)));s=esc(s).replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/\[([^\]]+)\]\(([^)]+)\)/g,(_,label,url)=>/^(https?:\/\/|#|\.?\.?\/)/.test(url)?`<a href="${url}" rel="noreferrer">${label}</a>`:label);return s.replace(/\u0001(\d+)\u0001/g,(_,i)=>tokens[+i]);}
export function markdown(text=''){
 const lines=String(text).split('\n');let out='',i=0;
 while(i<lines.length){let line=lines[i];if(!line.trim()){i++;continue}
  if(line.startsWith('```')){let code=[];i++;while(i<lines.length&&!lines[i].startsWith('```'))code.push(lines[i++]);i++;out+=`<pre><code>${esc(code.join('\n'))}</code></pre>`;continue}
  if(line.startsWith('$$')){let equation=line.slice(2);while(!equation.includes('$$')&&i+1<lines.length)equation+='\n'+lines[++i];out+=math(equation.replace(/\$\$.*/,''),true);i++;continue}
  if(/^#{1,4} /.test(line)){const level=Math.min(4,line.match(/^#+/)[0].length+1);out+=`<h${level}>${inline(line.replace(/^#+ /,''))}</h${level}>`;i++;continue}
  if(line.startsWith('|')&&/^\|[- :|]+\|$/.test(lines[i+1]||'')){const cells=l=>l.split('|').slice(1,-1).map(x=>x.trim());out+='<div class="table-scroll"><table><thead><tr>'+cells(line).map(x=>`<th>${inline(x)}</th>`).join('')+'</tr></thead><tbody>';i+=2;while(i<lines.length&&lines[i].startsWith('|'))out+='<tr>'+cells(lines[i++]).map(x=>`<td>${inline(x)}</td>`).join('')+'</tr>';out+='</tbody></table></div>';continue}
  if(/^(- |\d+\. )/.test(line)){const ordered=/^\d/.test(line),tag=ordered?'ol':'ul';out+=`<${tag}>`;while(i<lines.length&&(ordered?/^\d+\. /:/^- /).test(lines[i]))out+=`<li>${inline(lines[i++].replace(/^(- |\d+\. )/,''))}</li>`;out+=`</${tag}>`;continue}
  const para=[line];i++;while(i<lines.length&&lines[i].trim()&&!/^(#|\$\$|- |\d+\. |```|\|)/.test(lines[i]))para.push(lines[i++]);out+=`<p>${inline(para.join(' '))}</p>`;
 }return out;
}
export const table=(heads,rows)=>`<div class="table-scroll"><table><thead><tr>${heads.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(v=>`<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
