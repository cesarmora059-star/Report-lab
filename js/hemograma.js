'use strict';

const $ = (s) => document.querySelector(s);
const imagen = $('#imagen');
const leer = $('#leer-imagen');
const previa = $('#vista-previa');
const estado = $('#estado-ocr');
const form = $('#form-reporte');
const tbody = $('#filas-resultados');
const especieSelect = $('#especie');

const CONFIG = {
  perro: {
    filas: {
      WBC:[.125,'6.0','17.0',1], LYM:[.168,'0.9','5.0',1], MONO:[.205,'0.3','1.5',1], NEUT:[.243,'3.5','12.0',1], EOS:[.281,'0.1','1.5',1],
      HGB:[.332,'12.0','18.0',1], HCT:[.386,'37.0','55.0',1], RBC:[.431,'5.50','8.50',2], MCV:[.465,'60.0','72.0',1], MCHC:[.510,'32.0','38.5',1], RDW:[.552,'12.0','17.5',1], PLT:[.603,'200','500',0]
    }
  },
  gato: {
    filas: {
      WBC:[.157,'5.5','19.5',1], LYM:[.213,'1.0','7.0',1], MONO:[.261,'0.2','1.0',1], GRAN:[.310,'2.8','13.0',1],
      HGB:[.414,'8.0','15.0',1], HCT:[.480,'25.0','45.0',1], RBC:[.534,'5.00','11.00',2], MCV:[.580,'39.0','50.0',1], MCHC:[.626,'31.0','38.5',1], RDW:[.672,'14.0','18.5',1], PLT:[.727,'200','500',0]
    }
  }
};
const NOMBRES = {RDW:'RDW%'};

function hoyLocal(){ const d=new Date(); const o=d.getTimezoneOffset(); return new Date(d.getTime()-o*60000).toISOString().slice(0,10); }
function numeroReporte(){
  const d=new Date(); const p=n=>String(n).padStart(2,'0');
  const base=`${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
  const rand=(window.crypto && window.crypto.getRandomValues) ? window.crypto.getRandomValues(new Uint16Array(1))[0].toString(36).toUpperCase().slice(0,3) : Math.random().toString(36).slice(2,5).toUpperCase();
  return `${base}-${rand}`;
}
$('#fecha').value = hoyLocal();
$('#numero_reporte').value = numeroReporte();

function setEstado(texto,tipo=''){ estado.hidden=false; estado.className='status-box'+(tipo?` ${tipo}`:''); estado.textContent=texto; }
function titulo(v){ if(!v)return ''; v=String(v).trim().toLowerCase(); return v.charAt(0).toUpperCase()+v.slice(1); }
function clave(p){ return p.toLowerCase().replace('%','pct'); }
function htmlEsc(v){ return String(v??'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function filasPorTipo(tipo){ return Object.keys(CONFIG[tipo]?.filas || CONFIG.perro.filas).map(k=>NOMBRES[k]||k); }
function cfg(tipo,param){ return CONFIG[tipo].filas[param==='RDW%'?'RDW':param]; }

function crearFilas(tipo, detectadas=[]){
  const mapa=Object.fromEntries(detectadas.map(f=>[f.parametro,f])); tbody.innerHTML='';
  filasPorTipo(tipo).forEach(param=>{
    const c=cfg(tipo,param); const d=mapa[param]||{minimo:c[1],maximo:c[2],resultado:'',bandera:''}; const k=clave(param); const tr=document.createElement('tr');
    tr.innerHTML=`<th>${param}</th><td><input name="${k}_resultado" inputmode="decimal" value="${htmlEsc(d.resultado)}" required></td><td><input name="${k}_minimo" inputmode="decimal" value="${htmlEsc(d.minimo)}" required></td><td><input name="${k}_maximo" inputmode="decimal" value="${htmlEsc(d.maximo)}" required></td><td><select name="${k}_bandera"><option value="">Normal</option><option value="H" ${d.bandera==='H'?'selected':''}>H · Alto</option><option value="L" ${d.bandera==='L'?'selected':''}>L · Bajo</option></select></td>`;
    tbody.appendChild(tr);
  });
}
crearFilas('perro');

function cargarImagen(file){ return new Promise((resolve,reject)=>{ const r=new FileReader(); r.onload=e=>{const img=new Image(); img.onload=()=>resolve(img); img.onerror=()=>reject(new Error('No se pudo abrir la fotografía.')); img.src=e.target.result;}; r.onerror=()=>reject(new Error('No se pudo leer la fotografía.')); r.readAsDataURL(file); }); }
function prepararCanvas(img){
  const max=1800; const scale=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight)); const w=Math.round(img.naturalWidth*scale),h=Math.round(img.naturalHeight*scale);
  const c=document.createElement('canvas'); c.width=w;c.height=h; const x=c.getContext('2d',{willReadFrequently:true}); x.drawImage(img,0,0,w,h); return c;
}
function localizarPantalla(canvas){
  const ctx=canvas.getContext('2d',{willReadFrequently:true}), w=canvas.width,h=canvas.height, data=ctx.getImageData(0,0,w,h).data;
  const bright=(x,y)=>{const i=(y*w+x)*4; return (data[i]+data[i+1]+data[i+2])/3>140;};
  const stepX=Math.max(1,Math.floor(w/700)), stepY=Math.max(1,Math.floor(h/700)); const ys=[];
  for(let y=0;y<h;y+=stepY){let n=0,t=0;for(let x=0;x<w;x+=stepX){t++;if(bright(x,y))n++;} if(n/t>.30)ys.push(y);}
  if(!ys.length) return canvas;
  let y0=Math.max(0,Math.min(...ys)-Math.round(h*.01)), y1=Math.min(h-1,Math.max(...ys)+Math.round(h*.01)); const xs=[];
  for(let x=0;x<w;x+=stepX){let n=0,t=0;for(let y=y0;y<=y1;y+=stepY){t++;if(bright(x,y))n++;} if(t&&n/t>.45)xs.push(x);}
  if(!xs.length) return canvas;
  let x0=Math.max(0,Math.min(...xs)-Math.round(w*.015)), x1=Math.min(w-1,Math.max(...xs)+Math.round(w*.015));
  if(x1-x0<w*.35 || y1-y0<h*.35) return canvas;
  const out=document.createElement('canvas'); out.width=x1-x0+1;out.height=y1-y0+1;out.getContext('2d').drawImage(canvas,x0,y0,out.width,out.height,0,0,out.width,out.height); return out;
}
function numero(texto){ const limpio=String(texto).toUpperCase().replace(/O/g,'0').replace(/,/g,'.'); const m=limpio.match(/\d+(?:\.\d+)?/g); if(!m)return ''; return /[A-Z]/.test(limpio)&&m.length>1?m[m.length-1]:m[0]; }
function formato(valor,dec){ if(!valor)return ''; let v=String(valor); if(!v.includes('.')&&dec&&v.length>dec)v=v.slice(0,-dec)+'.'+v.slice(-dec); const n=Number(v); if(!Number.isFinite(n))return ''; return dec?n.toFixed(dec):String(Math.round(n)); }
function normalizarWords(data,w,h){
  const words=[];
  for(const block of (data.blocks||[])) for(const paragraph of (block.paragraphs||[])) for(const line of (paragraph.lines||[])) for(const x of (line.words||[])) {
    if(x.text && x.bbox) words.push({texto:x.text.toUpperCase().replace(/,/g,'.'),confianza:(x.confidence||0)/100,x:((x.bbox.x0+x.bbox.x1)/2)/w,y:((x.bbox.y0+x.bbox.y1)/2)/h});
  }
  return words;
}
function resultadoFila(tokens,y,dec,param){
  for(const t of tokens){ const letras=t.texto.replace(/[^A-Z%]/g,''); if(Math.abs(t.y-y)<.060 && letras.includes(param.replace('%',''))){const nums=t.texto.match(/\d+(?:\.\d+)?/g);if(nums?.length)return formato(nums[nums.length-1],dec);} }
  const cand=tokens.filter(t=>Math.abs(t.y-y)<.035&&t.x>.18&&t.x<.62&&numero(t.texto)).sort((a,b)=>a.x-b.x); const simples=cand.map(t=>numero(t.texto));
  if(dec&&simples.length>=2&&simples.slice(0,2).every(s=>!s.includes('.')&&s.length<=2)){const comb=simples[0]+'.'+simples[1];if(Number(comb)<1000)return formato(comb,dec);} return cand.length?formato(numero(cand[0].texto),dec):'';
}
function identidades(tokens){
  let propietario='',paciente=''; const ord=[...tokens].sort((a,b)=>a.y-b.y||a.x-b.x);
  ord.forEach((t,i)=>{const tx=t.texto;
    if(/^ID\s*:/.test(tx)&&!tx.startsWith('ID2')){propietario=tx.replace(/^ID\s*:\s*/,'').trim();if(!propietario&&ord[i+1]&&Math.abs(ord[i+1].y-t.y)<.03)propietario=ord[i+1].texto;}
    if(tx.startsWith('ID2')){paciente=tx.replace(/^ID2\s*:\s*/,'').trim();if(!paciente){const c=ord.filter(x=>Math.abs(x.y-t.y)<.060&&x.x>t.x&&!x.texto.includes('ID')&&!['DOG','CAT','OT'].includes(x.texto));if(c.length)paciente=c[0].texto;}}
  });
  const limpiar=x=>String(x).toUpperCase().replace(/\b(?:DOG|CAT|OT|3P)\b.*$/,'').replace(/[^A-ZÁÉÍÓÚÑ ]/g,' ').replace(/\s+/g,' ').trim(); return [limpiar(propietario),limpiar(paciente)];
}
async function analizar(file){
  if(!window.Tesseract) throw new Error('No se pudo cargar el lector OCR. Revise la conexión a Internet y vuelva a intentar.');
  const img=await cargarImagen(file); if(img.naturalWidth<500||img.naturalHeight<500)throw new Error('La fotografía es demasiado pequeña; acerque la cámara.');
  const canvas=localizarPantalla(prepararCanvas(img));
  const worker=await Tesseract.createWorker('eng',1,{logger:m=>{if(m.status==='recognizing text')setEstado(`Leyendo fotografía… ${Math.round((m.progress||0)*100)}%`);}});
  let result;
  try { result=await worker.recognize(canvas,{}, {blocks:true}); }
  finally { await worker.terminate(); }
  const tokens=normalizarWords(result.data,canvas.width,canvas.height);
  if(!tokens.length) throw new Error('El OCR no pudo ubicar texto en la pantalla. Intente una foto más recta y cercana.');
  const todo=tokens.map(t=>t.texto).join(' ');
  let tipo=/CAT|GRAN|2\/3/.test(todo)?'gato':/DOG|NEUT|2\/4/.test(todo)?'perro':''; const avisos=[]; if(!tipo){tipo='perro';avisos.push('Confirme la especie: DOG/CAT no se leyó con seguridad.');}
  const [propietario,paciente]=identidades(tokens); const filas=[];
  for(const param of filasPorTipo(tipo)){const [y,min,max,dec]=cfg(tipo,param);const res=resultadoFila(tokens,y,dec,param);let bandera='';const n=Number(res);if(Number.isFinite(n))bandera=n<Number(min)?'L':n>Number(max)?'H':'';else avisos.push(`No se pudo leer ${param}; complételo manualmente.`);filas.push({parametro:param,resultado:res,minimo:min,maximo:max,bandera});}
  avisos.push('Revise cada valor contra la fotografía antes de generar el reporte.'); return {propietario,paciente,especie:tipo,filas,advertencias:[...new Set(avisos)]};
}

imagen.addEventListener('change',()=>{const f=imagen.files?.[0]; leer.disabled=!f; if(!f){previa.hidden=true;return;} previa.src=URL.createObjectURL(f);previa.hidden=false;estado.hidden=true;});
leer.addEventListener('click',async()=>{const f=imagen.files?.[0];if(!f)return; leer.disabled=true;leer.textContent='Leyendo fotografía…';setEstado('Preparando OCR en este dispositivo…');try{const d=await analizar(f);$('#propietario').value=titulo(d.propietario);$('#paciente').value=titulo(d.paciente);especieSelect.value=d.especie;crearFilas(d.especie,d.filas);form.hidden=false;setEstado(d.advertencias.join(' '),d.advertencias.length?'warning':'success');form.scrollIntoView({behavior:'smooth',block:'start'});}catch(e){setEstado(e.message||'No se pudo procesar la fotografía.','error');}finally{leer.disabled=false;leer.textContent='Leer resultados';}});
especieSelect.addEventListener('change',()=>crearFilas(especieSelect.value||'perro'));
$('#volver-leer').addEventListener('click',()=>{form.hidden=true;imagen.click();});

const UNIDADES={WBC:'10³/µL',LYM:'10³/µL',MONO:'10³/µL',NEUT:'10³/µL',EOS:'10³/µL',GRAN:'10³/µL',HGB:'g/dL',HCT:'%',RBC:'10⁶/µL',MCV:'fL',MCHC:'g/dL','RDW%':'%',PLT:'10³/µL'};
function estadoValor(resultado,min,max,bandera){if(bandera==='H')return 'Alto';if(bandera==='L')return 'Bajo';const n=Number(resultado),lo=Number(min),hi=Number(max);if(![n,lo,hi].every(Number.isFinite))return '';return n<lo?'Bajo':n>hi?'Alto':'Dentro de referencia';}
form.addEventListener('submit',(e)=>{e.preventDefault();const fd=new FormData(form);const tipo=fd.get('especie')||'perro';const filas=filasPorTipo(tipo).map(param=>{const k=clave(param),resultado=String(fd.get(`${k}_resultado`)||'').trim(),minimo=String(fd.get(`${k}_minimo`)||'').trim(),maximo=String(fd.get(`${k}_maximo`)||'').trim(),bandera=String(fd.get(`${k}_bandera`)||'');return {parametro:param,resultado,unidad:UNIDADES[param]||'',minimo,maximo,referencia:minimo&&maximo?`${minimo} - ${maximo}`:'',bandera,estado:estadoValor(resultado,minimo,maximo,bandera)};});
  const datos={propietario:titulo(fd.get('propietario')),paciente:titulo(fd.get('paciente')),especie:tipo,edad:String(fd.get('edad')||'').trim(),expediente:String(fd.get('expediente')||'').trim(),veterinario:String(fd.get('veterinario')||'Gabriela Quesada Víquez').trim(),fecha:String(fd.get('fecha')||hoyLocal()),reporte:String(fd.get('numero_reporte')||numeroReporte()),observaciones:String(fd.get('observaciones')||'').trim().slice(0,800),filas}; sessionStorage.setItem('vetlab_ultimo_reporte',JSON.stringify(datos)); location.href='./reporte.html';
});
