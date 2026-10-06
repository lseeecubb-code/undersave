// devstudio.js — adds NPC LIFE, STORY and EXPORT tabs to the hidden dev mode (type D E V M O D E).
// Load LAST in index.html (after devtools.js). It does not edit devtools.js.
// Edits made in these tabs apply live and autosave to this browser. EXPORT bakes everything
// (rooms, enemies, NPCs, shops, sprites, attacks, story) into ONE file: game-data.js.
(function(){
const dt=document.getElementById('devtools');
if(!dt){console.warn('[devstudio] #devtools not found');return}
const KEY='wick-studio-v1',SAVE_KEYS=['wick-save-slot','wick-endings'];
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const G=expr=>{try{return(0,eval)(expr)}catch(e){return undefined}};
const pretty=v=>v===undefined?'':JSON.stringify(v,null,1);
const freshOv=()=>({npcs:{},objs:{},rooms:{},tiles:{},layout:{},story:{scenes:{},endings:{},chapters:{},prompt:null}});
let ov=freshOv();
try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s){ov={...ov,...s};ov.story={...ov.story,...(s.story||{})};ov.tiles=ov.tiles||{};ov.layout=ov.layout||{}}}catch(_){}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(ov))}catch(_){}}
const roomId=r=>r.id||R.indexOf(r);
const story=()=>{const d=G('GAME_REPO_STORY_DATA');return d&&d.dialogue};

/* ---------- re-apply saved studio edits at startup ---------- */
function applyOverlay(){
 try{
  const NPCS=G('NPCS')||[],R=G('R')||[];
  for(const id in ov.npcs){const n=NPCS.find(x=>x.id===id);if(!n)continue;for(const k in ov.npcs[id]){if(ov.npcs[id][k]==null)delete n[k];else n[k]=ov.npcs[id][k]}}
  for(const key in ov.objs){const [rid,i]=key.split('|'),r=R.find((x,xi)=>String(roomId(x))===rid),o=r&&r.o[+i];if(!o)continue;for(const k in ov.objs[key]){if(ov.objs[key][k]==null)delete o[k];else o[k]=ov.objs[key][k]}}
  for(const rid in ov.rooms){const r=R.find(x=>String(roomId(x))===rid);if(r){if(ov.rooms[rid])r.sceneId=ov.rooms[rid];else delete r.sceneId}}
  const d=story();if(d){
   for(const id in ov.story.scenes)(d.STORY_SCENES=d.STORY_SCENES||{})[id]=ov.story.scenes[id];
   for(const k in ov.story.endings)d.ENDINGS[k]={...(d.ENDINGS[k]||{}),...ov.story.endings[k]};
   for(const id in ov.story.chapters){const c=(d.STORY_CHAPTERS||[]).find(x=>String(x.id)===id);if(c)c.title=ov.story.chapters[id]}
   if(ov.story.prompt)d.ENDGAME_PROMPT=ov.story.prompt
  }
 }catch(e){console.warn('[devstudio] could not re-apply saved edits',e)}
}
applyOverlay();
try{window.BIGMAP&&BIGMAP.applyStored()}catch(e){console.warn('[devstudio] tiles/layout',e)}

/* ---------- tabs ---------- */
const PANELS={};
const nav=dt.querySelector('nav'),closeBtn=$('dev-close');
function addTab(name,label,html,onShow){
 const b=document.createElement('button');b.dataset.devtab=name;b.textContent=label;nav.insertBefore(b,closeBtn);
 const s=document.createElement('section');s.className='devtab';s.id='dev-'+name;s.innerHTML=html;dt.appendChild(s);PANELS[name]=onShow
}
dt.addEventListener('click',e=>{
 const b=e.target.closest&&e.target.closest('[data-devtab]');if(!b)return;
 const n=b.dataset.devtab;
 setTimeout(()=>{dt.querySelectorAll('.devtab').forEach(s=>s.classList.toggle('active',s.id==='dev-'+n));if(PANELS[n])try{PANELS[n]()}catch(err){console.error('[devstudio]',err)}},0)
});
const say=(id,msg,bad)=>{const e=$(id);if(e){e.textContent=msg;e.style.color=bad?'#f88':'#8f8'}};
function parse(id,want){
 const t=$(id).value.trim();if(!t)return null;
 const v=JSON.parse(t);
 if(want==='array'&&!Array.isArray(v))throw new Error('must be a [list]');
 if(want==='object'&&(Array.isArray(v)||typeof v!=='object'))throw new Error('must be an {object}');
 return v
}

/* ================= NPC LIFE ================= */
addTab('npclife','NPC life',`
<aside class="devpanel"><h2>NPC life</h2>
<label>NPC record (applies everywhere)<select id="nl-npc"></select></label>
<label>Movement (JSON)<textarea id="nl-move" placeholder='{"mode":"wander","radius":48}'></textarea></label>
<label>Dialogue variants (JSON list)<textarea id="nl-var" placeholder='[{"talks":2,"lines":["* Oh, you again."]}]'></textarea></label>
<label>After talking (JSON)<textarea id="nl-after" placeholder='[{"a":"step","dx":40,"dy":0}]'></textarea></label>
<button id="nl-save-npc">Save NPC</button><div id="nl-s1" class="hint"></div>
<hr>
<label>Placed NPC (this room only)<select id="nl-obj"></select></label>
<label>Placement overrides (JSON: move / after / variants)<textarea id="nl-objjson" placeholder='{"move":{"mode":"pace","axis":"y"}}'></textarea></label>
<button id="nl-save-obj">Save placement</button><div id="nl-s2" class="hint"></div></aside>
<div class="devpanel"><h2>How NPC life works</h2>
<p class="hint">Movement modes: <b>wander</b> (radius, speed, pause), <b>pace</b> (axis x/y, radius), <b>path</b> (path:[[dx,dy],...]), <b>follow</b> (gap), <b>watch</b> (turns toward you), <b>stand</b>. Add <b>flipLeft:true</b> to mirror the sprite.</p>
<p class="hint">Variants pick different dialogue by <b>talk</b> (exactly n), <b>talks</b> (n or more), <b>flag</b>, <b>notFlag</b>, <b>spared</b>, <b>beaten</b>, <b>hasItem</b>. First match wins, so put specific ones first. A variant can also set <b>setFlag</b>, replace <b>options</b>, or have its own <b>after</b>.</p>
<p class="hint">After talking: a list of steps, or {"first":[...],"every":[...],"byTalk":{"3":[...]}}. Steps: move, step, wait, face, say, scene, mode, setFlag, hide, blip, lock, give, heal.</p>
<pre class="hint">Example — Pip steps aside after the first chat, then follows you:
{"first":[
 {"a":"say","lines":["* Let me get out of your way."]},
 {"a":"step","dx":-50,"dy":0},
 {"a":"setFlag","flag":"pipMoved"}],
 "byTalk":{"3":[{"a":"mode","mode":"follow"}]}}</pre>
<p class="hint">Changes apply instantly and autosave in this browser. Use the EXPORT tab to keep them in game-data.js.</p></div>`,
function(){
 const NPCS=G('NPCS')||[],R=G('R')||[];
 const sel=$('nl-npc'),keep=sel.value;
 sel.innerHTML=NPCS.map(n=>`<option value="${esc(n.id)}">${esc(n.name||n.id)} (${esc(n.id)})</option>`).join('');if(keep)sel.value=keep;
 const loadNpc=()=>{const n=NPCS.find(x=>x.id===sel.value)||{};$('nl-move').value=pretty(n.move);$('nl-var').value=pretty(n.variants);$('nl-after').value=pretty(n.after)};
 sel.onchange=loadNpc;loadNpc();
 const os=$('nl-obj'),opts=[];
 R.forEach((r,ri)=>(r.o||[]).forEach((o,i)=>{if(o.k==='npc')opts.push(`<option value="${esc(roomId(r))}|${i}">${esc(r.n||ri)} #${i} · ${esc(o.npcId||'npc')}</option>`)}));
 os.innerHTML=opts.join('')||'<option value="">(no NPCs placed)</option>';
 const loadObj=()=>{const [rid,i]=(os.value||'|').split('|'),r=R.find(x=>String(roomId(x))===rid),o=r&&r.o[+i];$('nl-objjson').value=o?pretty({move:o.move,after:o.after,variants:o.variants}).replace(/"[a-z]+": undefined,?\n?/g,''):''};
 os.onchange=loadObj;loadObj();
 $('nl-save-npc').onclick=()=>{
  try{
   const n=NPCS.find(x=>x.id===sel.value);if(!n)throw new Error('pick an NPC');
   const f={move:parse('nl-move','object'),variants:parse('nl-var','array'),after:parse('nl-after')};
   for(const k in f){if(f[k]==null)delete n[k];else n[k]=f[k]}
   ov.npcs[n.id]=f;persist();window.NPCLIFE&&NPCLIFE.suspend();say('nl-s1','Saved '+n.id+'. Export to keep it in game-data.js.')
  }catch(e){say('nl-s1','JSON problem: '+e.message,1)}
 };
 $('nl-save-obj').onclick=()=>{
  try{
   const [rid,i]=(os.value||'|').split('|'),r=R.find(x=>String(roomId(x))===rid),o=r&&r.o[+i];if(!o)throw new Error('pick a placed NPC');
   const v=parse('nl-objjson','object')||{},f={move:v.move,after:v.after,variants:v.variants};
   for(const k in f){if(f[k]==null)delete o[k];else o[k]=f[k]}
   ov.objs[rid+'|'+i]=f;persist();window.NPCLIFE&&NPCLIFE.suspend();say('nl-s2','Saved placement.')
  }catch(e){say('nl-s2','JSON problem: '+e.message,1)}
 }
});

/* ================= STORY ================= */
addTab('story','Story',`
<aside class="devpanel"><h2>Story editor</h2>
<label>Group<select id="st-group"><option value="scenes">Chapter scenes</option><option value="endings">Endings</option><option value="prompt">Final choice text</option><option value="chapters">Chapter titles</option></select></label>
<label>Entry<select id="st-entry"></select></label>
<label id="st-title-l">Title<input id="st-title"></label>
<label id="st-text-l">Text (one dialogue box per line)<textarea id="st-text" rows="10"></textarea></label>
<div class="toolbar"><button id="st-save">Save</button><button id="st-new">New scene</button></div>
<div id="st-s" class="hint"></div><hr>
<label>Attach a scene to a room<select id="st-room"></select></label>
<label>Scene<select id="st-roomscene"></select></label>
<button id="st-attach">Attach to room</button><div id="st-s2" class="hint"></div></aside>
<div class="devpanel"><h2>Story notes</h2>
<p class="hint">Scenes play automatically the first time you enter their room. Each line becomes one dialogue box (long lines shrink to fit four lines). Start lines with "* " for the classic look.</p>
<p class="hint">Attaching a scene sets <b>sceneId</b> on the room. NPC steps can also play scenes: {"a":"scene","id":"your_scene_id"}.</p>
<p class="hint">Endings have a title and a body. The third ending only unlocks if Wick was spared (set in story.js).</p></div>`,
function(){
 const d=story(),R=G('R')||[];
 if(!d){say('st-s','GAME_REPO_STORY_DATA was not found.',1);return}
 d.STORY_SCENES=d.STORY_SCENES||{};
 const grp=$('st-group'),ent=$('st-entry');
 const fill=()=>{
  const g=grp.value;let items=[];
  if(g==='scenes')items=Object.keys(d.STORY_SCENES);
  else if(g==='endings')items=Object.keys(d.ENDINGS||{});
  else if(g==='prompt')items=['final choice'];
  else items=(d.STORY_CHAPTERS||[]).map(c=>String(c.id));
  ent.innerHTML=items.map(i=>`<option>${esc(i)}</option>`).join('');load()
 };
 const load=()=>{
  const g=grp.value,k=ent.value;
  $('st-title-l').style.display=(g==='endings'||g==='chapters')?'block':'none';
  $('st-text-l').style.display=g==='chapters'?'none':'block';
  if(g==='scenes')$('st-text').value=(d.STORY_SCENES[k]||[]).join('\n');
  else if(g==='endings'){const e=(d.ENDINGS||{})[k]||{};$('st-title').value=e.title||'';$('st-text').value=e.text||''}
  else if(g==='prompt')$('st-text').value=(d.ENDGAME_PROMPT||[]).join('\n');
  else $('st-title').value=((d.STORY_CHAPTERS||[]).find(c=>String(c.id)===k)||{}).title||''
 };
 grp.onchange=fill;ent.onchange=load;fill();
 $('st-save').onclick=()=>{
  const g=grp.value,k=ent.value,lines=$('st-text').value.split('\n').map(s=>s.trimEnd()).filter(s=>s.trim());
  if(g==='scenes'&&k){d.STORY_SCENES[k]=lines;ov.story.scenes[k]=lines}
  else if(g==='endings'&&k){d.ENDINGS[k]={...d.ENDINGS[k],title:$('st-title').value,text:$('st-text').value};ov.story.endings[k]={title:$('st-title').value,text:$('st-text').value}}
  else if(g==='prompt'){d.ENDGAME_PROMPT=lines;ov.story.prompt=lines}
  else if(g==='chapters'){const c=(d.STORY_CHAPTERS||[]).find(c=>String(c.id)===k);if(c){c.title=$('st-title').value;ov.story.chapters[k]=c.title}}
  persist();say('st-s','Saved. Export to keep it in game-data.js.')
 };
 $('st-new').onclick=()=>{
  const id=(prompt('New scene id (letters, numbers, underscores):','my_scene')||'').replace(/[^A-Za-z0-9_]/g,'');
  if(!id)return;if(d.STORY_SCENES[id]){say('st-s','That id already exists.',1);return}
  d.STORY_SCENES[id]=['* New scene.'];ov.story.scenes[id]=d.STORY_SCENES[id];persist();grp.value='scenes';fill();ent.value=id;load()
 };
 const rs=$('st-room'),ss=$('st-roomscene');
 rs.innerHTML=R.map((r,i)=>`<option value="${esc(roomId(r))}">${esc(r.n||i)}${r.sceneId?' — '+esc(r.sceneId):''}</option>`).join('');
 ss.innerHTML='<option value="">(none)</option>'+Object.keys(d.STORY_SCENES).map(i=>`<option>${esc(i)}</option>`).join('');
 const cur=()=>{const r=R.find(x=>String(roomId(x))===rs.value);ss.value=(r&&r.sceneId)||''};rs.onchange=cur;cur();
 $('st-attach').onclick=()=>{
  const r=R.find(x=>String(roomId(x))===rs.value);if(!r)return;
  if(ss.value)r.sceneId=ss.value;else delete r.sceneId;
  ov.rooms[rs.value]=ss.value||null;persist();say('st-s2','Attached.')
 }
});

/* ================= EXPORT ================= */
const BASE=['R','ENEMIES','NPCS','SHOPS','SPRITES','GAME_TILES','GAME_REPO_STORY_DATA'];
const ATTACK_NAMES=['ATTACKS','ATTACK_PATTERNS','PATTERNS','ATTACK_LIST','PATTERN_LIST','BULLET_PATTERNS','WICK_PATTERNS','ATTACK_DEFS'];
function detectAttacks(){
 const E=G('ENEMIES')||[],ids=new Set();
 for(const e of E){if(e.pattern)ids.add(e.pattern);for(const a of e.attacks||[])ids.add(a&&a.id||a)}
 let first='';
 for(const n of ATTACK_NAMES){
  const v=G(n);if(!v||typeof v!=='object')continue;
  first=first||n;
  const items=Array.isArray(v)?v:Object.values(v);
  if(items.some(x=>x&&ids.has(x.id)))return n
 }
 return first
}
addTab('export','Export',`
<aside class="devpanel"><h2>Export game-data.js</h2>
<p class="hint">One file with all rooms, enemies, NPCs (movement, variants, after-talk), shops, sprites, attack patterns and story.</p>
<div id="ex-list"></div>
<label>Attack patterns variable<input id="ex-attacks" placeholder="auto-detected"></label>
<label>Extra variables (comma separated)<input id="ex-extra" placeholder="e.g. ITEMS, QUESTS"></label>
<label>Mode<select id="ex-mode"><option value="overlay">Overlay — replaces content in place (safe, recommended)</option><option value="standalone">Standalone — declares the variables (advanced)</option></select></label>
<div class="toolbar"><button id="ex-download">Download game-data.js</button><button id="ex-copy">Copy to clipboard</button><button id="ex-refresh">Refresh summary</button></div>
<div id="ex-s" class="hint"></div><hr>
<div class="toolbar"><button id="ex-clear-studio">Clear Studio edits</button><button id="ex-clear-all">Clear all editor browser data</button></div>
<div id="ex-s2" class="hint"></div></aside>
<div class="devpanel"><h2>How to use it</h2>
<p class="hint"><b>1.</b> Edit in dev mode (maps, enemies, NPC life, story). <b>2.</b> Download game-data.js. <b>3.</b> Put it in the <b>js</b> folder, replacing the old one. It loads right after maps.js. <b>4.</b> Clear the editor browser data so the file is the single source of truth.</p>
<p class="hint">Overlay mode keeps your old data files as a base and overwrites them in place at startup. Standalone mode declares the variables itself, so you must remove the old data scripts (enemies.js, attack-patterns.js, npcs.js, shops.js, sprites.js, maps.js) from index.html, and anything else in those files will be gone. Try it on a copy first.</p>
<pre id="ex-preview" class="hint"></pre></div>`,
function(){
 const list=$('ex-list');
 if(!$('ex-attacks').value)$('ex-attacks').value=detectAttacks();
 list.innerHTML=BASE.map(n=>{const v=G(n);return `<label><input type="checkbox" data-var="${n}" ${v?'checked':'disabled'} style="display:inline;width:auto"> ${n} <span class="hint">${v?(Array.isArray(v)?v.length+' entries':Object.keys(v).length+' keys'):'not found'}</span></label>`}).join('');
 summary()
});
function chosen(){
 const out=[...dt.querySelectorAll('#ex-list input:checked')].map(i=>i.dataset.var);
 const a=$('ex-attacks').value.trim();if(a&&!out.includes(a))out.push(a);
 for(const x of $('ex-extra').value.split(',').map(s=>s.trim()).filter(Boolean))if(!out.includes(x))out.push(x);
 return out
}
const STRIP=new Set(['_rt','_ok','_opt']);
const J=v=>JSON.stringify(v,(k,x)=>STRIP.has(k)||k.startsWith('__')?undefined:x);
function fmt(v,d){
 const c=J(v);
 if(c===undefined)return 'null';
 if(d>=3||v===null||typeof v!=='object'||c.length<=160)return c;
 const pad=' '.repeat(d+1),end=' '.repeat(d);
 if(Array.isArray(v))return '[\n'+v.map(x=>pad+fmt(x,d+1)).join(',\n')+'\n'+end+']';
 return '{\n'+Object.keys(v).filter(k=>!STRIP.has(k)&&!k.startsWith('__')&&v[k]!==undefined).map(k=>pad+JSON.stringify(k)+':'+fmt(v[k],d+1)).join(',\n')+'\n'+end+'}'
}
function build(){
 if(window.NPCLIFE)NPCLIFE.suspend();                       // NPCs back at their placed spots
 const names=chosen(),missing=[],data={};
 for(const n of names){const v=G(n);if(v==null||typeof v!=='object'){missing.push(n);continue}data[n]=v}
 const stamp=new Date().toISOString(),standalone=$('ex-mode').value==='standalone';
 let t='// game-data.js — exported from WICK DEV MODE on '+stamp+'\n';
 if(standalone){
  t+='// STANDALONE: declares the game data itself. Remove enemies.js, attack-patterns.js, npcs.js, shops.js,\n// sprites.js and maps.js from index.html and load this file in their place (before world.js).\n';
  for(const n in data)t+='let '+n+'='+fmt(data[n],0)+';\n'
 }else{
  t+='// OVERLAY: load right after js/maps.js and before js/world.js. It replaces the built-in content in place.\n(function(){\nconst D={\n';
  t+=Object.keys(data).map(n=>' '+JSON.stringify(n)+': '+fmt(data[n],1)).join(',\n')+'\n};\n';
  t+="const put=(name,data)=>{let t;try{t=(0,eval)(name)}catch(e){if(name==='GAME_TILES'){window.GAME_TILES=data;return}console.warn('[game-data] '+name+' is not defined yet; skipped');return}\n if(Array.isArray(t)){t.length=0;for(const x of data)t.push(x)}\n else if(t&&typeof t==='object'){for(const k of Object.keys(t))delete t[k];Object.assign(t,data)}\n else console.warn('[game-data] cannot replace '+name)};\nfor(const n in D)put(n,D[n]);\nwindow.GAME_DATA_INFO={exported:"+JSON.stringify(stamp)+',vars:Object.keys(D)};\n})();\n'
 }
 return {text:t,missing,names:Object.keys(data)}
}
function summary(){
 try{const b=build();say('ex-s',b.names.length+' variable(s), '+(b.text.length/1024).toFixed(1)+' KB'+(b.missing.length?'. Not found: '+b.missing.join(', '):''),b.missing.length>0);$('ex-preview').textContent=b.text.slice(0,1500)+(b.text.length>1500?'\n…':'')}
 catch(e){say('ex-s','Could not build: '+e.message,1)}
}
dt.addEventListener('click',e=>{
 const id=e.target&&e.target.id;
 if(id==='ex-refresh')summary();
 else if(id==='ex-download'){
  try{const b=build(),a=document.createElement('a');a.href=URL.createObjectURL(new Blob([b.text],{type:'text/javascript'}));a.download='game-data.js';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000);say('ex-s','Downloaded game-data.js ('+(b.text.length/1024).toFixed(1)+' KB).')}catch(err){say('ex-s','Could not build: '+err.message,1)}
 }
 else if(id==='ex-copy'){
  try{
   const b=build(),done=()=>say('ex-s','Copied '+(b.text.length/1024).toFixed(1)+' KB to the clipboard.');
   const fb=()=>{const t=document.createElement('textarea');t.value=b.text;t.style.cssText='position:fixed;opacity:0';document.body.appendChild(t);t.select();try{document.execCommand('copy')}catch(_){}t.remove();done()};
   navigator.clipboard&&navigator.clipboard.writeText?navigator.clipboard.writeText(b.text).then(done,fb):fb()
  }catch(err){say('ex-s','Could not build: '+err.message,1)}
 }
 else if(id==='ex-clear-studio'){try{localStorage.removeItem(KEY)}catch(_){}ov=freshOv();say('ex-s2','Studio edits cleared. Reload the page.')}
 else if(id==='ex-clear-all'){
  const keys=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(/wick|undersave|project|dev/i.test(k)&&!SAVE_KEYS.includes(k))keys.push(k)}
  if(!keys.length){say('ex-s2','No editor data found.');return}
  if(confirm('Delete these saved editor items (your save game is kept)?\n\n'+keys.join('\n'))){keys.forEach(k=>localStorage.removeItem(k));ov=freshOv();say('ex-s2','Cleared '+keys.length+' item(s). Reload the page.')}
 }
});
window.STUDIO={build,applyOverlay,overlay:()=>ov};
})();
