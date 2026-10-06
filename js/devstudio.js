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

/* ================= TILES ================= */
addTab('tiles','Tiles',`
<aside class="devpanel"><h2>Tile editor</h2>
<label>Tile<select id="tl-sel"></select></label>
<div class="toolbar"><button id="tl-new">New tile</button><button id="tl-del">Delete tile</button></div>
<label>Name<input id="tl-name" value="New tile"></label>
<label>Size (pixels)<select id="tl-size"><option>16</option><option>32</option></select></label>
<label>Color<input id="tl-color" type="color" value="#6bbf59"></label>
<div class="toolbar" id="tl-tools"><button data-tool="draw">Draw</button><button data-tool="erase">Erase</button><button data-tool="fill">Fill</button><button data-tool="pick">Pick color</button></div>
<label><input id="tl-solid" type="checkbox" style="display:inline;width:auto"> Solid (blocks walking)</label>
<label>Import an image (scaled to the tile)<input id="tl-import" type="file" accept="image/*"></label>
<div class="toolbar"><button id="tl-clear">Clear</button><button id="tl-save">Save tile</button></div>
<div id="tl-s" class="hint"></div>
<canvas id="tl-canvas" width="384" height="384"></canvas></aside>
<div class="devpanel"><h2>Seamless preview</h2><canvas id="tl-prev" width="256" height="256"></canvas>
<p class="hint">The preview repeats the tile 4×4 so you can check that edges join. Tiles are drawn on a 32×32 grid: 16-pixel tiles are doubled, 32-pixel tiles are shown 1:1.</p>
<p class="hint">Saved tiles show up in the BIG MAPS tab for painting. Solid tiles block the player and walking NPCs. Max 52 colors per tile (extra colors are rounded automatically).</p></div>`,
function(){
 const BM=window.BIGMAP;if(!BM){say('tl-s','bigmap.js is not loaded.',1);return}
 const arr=BM.tiles(),cv=$('tl-canvas'),k=cv.getContext('2d'),pv=$('tl-prev').getContext('2d');
 let T=PANELS._T||(PANELS._T={id:null,s:16,px:[],tool:'draw'});
 const sizeOf=()=>+$('tl-size').value;
 const blank=s=>Array(s*s).fill(null);
 if(!T.px.length)T.px=blank(T.s);
 const refreshSel=()=>{$('tl-sel').innerHTML='<option value="">(new tile)</option>'+arr.map(t=>`<option value="${esc(t.id)}">${esc(t.name||t.id)} (${esc(t.id)})</option>`).join('');$('tl-sel').value=T.id||''};
 const decode=t=>{const s=t.s||16,px=[];for(let i=0;i<s*s;i++){const c=t.px[i];px.push(c&&c!=='.'&&t.pal[c]?t.pal[c]:null)}return px};
 const draw=()=>{
  const s=T.s,c=cv.width/s;
  for(let y=0;y<s;y++)for(let x=0;x<s;x++){
   k.fillStyle=(x+y)%2?'#2a2a33':'#202028';k.fillRect(x*c,y*c,c,c);
   const col=T.px[y*s+x];if(col){k.fillStyle=col;k.fillRect(x*c,y*c,c,c)}
  }
  k.strokeStyle='rgba(255,255,255,.08)';k.lineWidth=1;
  for(let i=0;i<=s;i++){k.beginPath();k.moveTo(i*c+.5,0);k.lineTo(i*c+.5,cv.width);k.stroke();k.beginPath();k.moveTo(0,i*c+.5);k.lineTo(cv.width,i*c+.5);k.stroke()}
  const m=document.createElement('canvas');m.width=m.height=s;const mk=m.getContext('2d');
  for(let i=0;i<s*s;i++)if(T.px[i]){mk.fillStyle=T.px[i];mk.fillRect(i%s,Math.floor(i/s),1,1)}
  pv.imageSmoothingEnabled=false;pv.fillStyle='#08080b';pv.fillRect(0,0,256,256);
  for(let j=0;j<4;j++)for(let i=0;i<4;i++)pv.drawImage(m,i*64,j*64,64,64)
 };
 const load=id=>{
  const t=arr.find(x=>x.id===id);
  if(t){T.id=t.id;T.s=t.s||16;T.px=decode(t);$('tl-name').value=t.name||t.id;$('tl-size').value=T.s;$('tl-solid').checked=!!t.solid}
  else{T.id=null;T.s=sizeOf();T.px=blank(T.s);$('tl-name').value='New tile';$('tl-solid').checked=false}
  draw()
 };
 const marks=()=>$('tl-tools').querySelectorAll('button').forEach(b=>b.style.outline=b.dataset.tool===T.tool?'2px solid #ff0':'');
 refreshSel();load(T.id);marks();
 $('tl-sel').onchange=()=>load($('tl-sel').value);
 $('tl-new').onclick=()=>{T.id=null;refreshSel();load('')};
 $('tl-size').onchange=()=>{if(!T.id){T.s=sizeOf();T.px=blank(T.s);draw()}else{$('tl-size').value=T.s;say('tl-s','Size can only change on a new tile.',1)}};
 $('tl-tools').onclick=e=>{const b=e.target.closest('button');if(b){T.tool=b.dataset.tool;marks()}};
 $('tl-clear').onclick=()=>{T.px=blank(T.s);draw()};
 const at=e=>{const r=cv.getBoundingClientRect(),s=T.s;return[Math.floor((e.clientX-r.left)/r.width*s),Math.floor((e.clientY-r.top)/r.height*s)]};
 const flood=(x,y,to)=>{
  const s=T.s,from=T.px[y*s+x];if(from===to)return;
  const st=[[x,y]];
  while(st.length){const[a,b]=st.pop();if(a<0||b<0||a>=s||b>=s||T.px[b*s+a]!==from)continue;T.px[b*s+a]=to;st.push([a+1,b],[a-1,b],[a,b+1],[a,b-1])}
 };
 const paint=e=>{
  const[x,y]=at(e),s=T.s;if(x<0||y<0||x>=s||y>=s)return;
  const col=$('tl-color').value;
  if(T.tool==='draw')T.px[y*s+x]=col;
  else if(T.tool==='erase')T.px[y*s+x]=null;
  else if(T.tool==='pick'){const c=T.px[y*s+x];if(c)$('tl-color').value=c}
  else if(T.tool==='fill'&&e.type==='mousedown')flood(x,y,T.tool==='fill'?col:null);
  draw()
 };
 if(!cv._bound){
  cv._bound=1;let down=false;
  cv.addEventListener('mousedown',e=>{down=true;paint(e)});
  cv.addEventListener('mousemove',e=>{if(down&&(T.tool==='draw'||T.tool==='erase'))paint(e)});
  addEventListener('mouseup',()=>down=false)
 }
 $('tl-import').onchange=e=>{
  const f=e.target.files[0];if(!f)return;
  const im=new Image();
  im.onload=()=>{
   const s=T.s,c=document.createElement('canvas');c.width=c.height=s;const x=c.getContext('2d');x.imageSmoothingEnabled=false;x.drawImage(im,0,0,s,s);
   const d=x.getImageData(0,0,s,s).data;T.px=[];
   for(let i=0;i<s*s;i++)T.px.push(d[i*4+3]<128?null:'#'+[d[i*4],d[i*4+1],d[i*4+2]].map(v=>v.toString(16).padStart(2,'0')).join(''));
   URL.revokeObjectURL(im.src);draw();say('tl-s','Imported. Press Save tile to keep it.')
  };
  im.onerror=()=>say('tl-s','Could not read that image.',1);
  im.src=URL.createObjectURL(f);e.target.value=''
 };
 $('tl-save').onclick=()=>{
  const q=c=>'#'+[1,3,5].map(i=>Math.min(255,Math.round(parseInt(c.substr(i,2),16)/32)*32).toString(16).padStart(2,'0')).join('');
  let px=T.px.slice(),cols=[...new Set(px.filter(Boolean))];
  if(cols.length>52){px=px.map(c=>c&&q(c));cols=[...new Set(px.filter(Boolean))]}
  if(cols.length>52){say('tl-s','Too many colors ('+cols.length+'). Use fewer colors.',1);return}
  const L='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',pal={};cols.forEach((c,i)=>pal[L[i]]=c);
  const inv={};for(const l in pal)inv[pal[l]]=l;
  const name=$('tl-name').value.trim()||'Tile';
  let id=T.id;
  if(!id){const base=name.toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'')||'tile';id=base;for(let n=2;arr.some(t=>t.id===id);n++)id=base+'_'+n}
  const def={id,name,s:T.s,solid:$('tl-solid').checked,pal,px:px.map(c=>c?inv[c]:'.').join('')};
  const i=arr.findIndex(t=>t.id===id);if(i>=0)arr[i]=def;else arr.push(def);
  T.id=id;ov.tiles[id]=def;persist();BM.touch();refreshSel();
  say('tl-s','Saved "'+name+'" ('+id+'). Export to keep it in game-data.js.')
 };
 $('tl-del').onclick=()=>{
  if(!T.id||!confirm('Delete tile "'+T.id+'"? Rooms that use it will show nothing there.'))return;
  const i=arr.findIndex(t=>t.id===T.id);if(i>=0)arr.splice(i,1);ov.tiles[T.id]=null;persist();BM.touch();T.id=null;refreshSel();load('')
 }
});

/* ================= BIG MAPS ================= */
addTab('bigmap','Big maps',`
<aside class="devpanel"><h2>Big maps &amp; tile painting</h2>
<label>Room<select id="bm-room"></select></label>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
<label>Floor X<input id="bm-fx" type="number"></label><label>Floor Y<input id="bm-fy" type="number"></label>
<label>Width<input id="bm-fw" type="number"></label><label>Height<input id="bm-fh" type="number"></label></div>
<div class="toolbar"><button id="bm-size">Apply size</button><button id="bm-fit">Fit tile grid to floor</button></div>
<label>Layer<select id="bm-layer"><option value="b">Floor (under everything)</option><option value="a">Above (drawn over the player)</option></select></label>
<label>Tool<select id="bm-tool"><option value="paint">Paint</option><option value="erase">Erase</option><option value="rect">Fill rectangle</option></select></label>
<label>Zoom<select id="bm-zoom"><option value="0.25">25%</option><option value="0.5" selected>50%</option><option value="1">100%</option><option value="2">200%</option></select></label>
<label>Tiles <span class="hint">(click to pick)</span></label><div id="bm-pal" style="display:flex;flex-wrap:wrap;gap:4px"></div>
<div class="toolbar" style="margin-top:8px"><button id="bm-play">Play from this room</button><button id="bm-clear">Clear tiles</button></div>
<div id="bm-s" class="hint"></div></aside>
<div class="devpanel" style="overflow:auto"><canvas id="bm-canvas" width="640" height="480" style="width:auto;max-width:none;image-rendering:pixelated"></canvas>
<p class="hint">Blue frame = what the camera shows (640×480) around your cursor. Red = collision boxes, yellow = doors, cyan = objects. Move doors and objects in the Maps tab. Size limit: 4096×4096. Keep rooms under about 100×60 tiles for smooth loading. Each room can use up to 35 different tiles.</p></div>`,
function(){
 const BM=window.BIGMAP;if(!BM){say('bm-s','bigmap.js is not loaded.',1);return}
 const R=G('R')||[],cv=$('bm-canvas'),k=cv.getContext('2d');
 const S=PANELS._B||(PANELS._B={tile:null,hover:null,rect:null,down:false});
 const rs=$('bm-room'),keep=rs.value;
 rs.innerHTML=R.map((r,i)=>`<option value="${esc(roomId(r))}">${esc(r.n||i)} (${r.f?r.f[2]+'×'+r.f[3]:''})</option>`).join('');if(keep)rs.value=keep;
 const room=()=>R.find(x=>String(roomId(x))===rs.value);
 const zoom=()=>+$('bm-zoom').value;
 const commit=r=>{
  r.noRemodel=true;BM.touch(r);
  ov.layout[roomId(r)]={f:r.f.slice(),tm:r.tm?JSON.parse(JSON.stringify(r.tm,(kk,v)=>kk.startsWith('__')?undefined:v)):undefined,noRemodel:true};persist()
 };
 const pal=()=>{
  const el=$('bm-pal'),arr=BM.tiles();el.innerHTML='';
  if(!arr.length){el.innerHTML='<span class="hint">No tiles yet. Make some in the Tiles tab.</span>';return}
  if(!S.tile||!arr.some(t=>t.id===S.tile))S.tile=arr[0].id;
  for(const t of arr){
   const b=document.createElement('button'),c=document.createElement('canvas');c.width=c.height=32;c.style.cssText='width:32px;height:32px;image-rendering:pixelated;display:block';
   const x=c.getContext('2d');x.imageSmoothingEnabled=false;x.drawImage(BM.tileCanvas(t),0,0,32,32);
   b.appendChild(c);b.title=t.name||t.id;b.style.cssText='padding:2px;'+(t.id===S.tile?'outline:2px solid #ff0':'');
   b.onclick=()=>{S.tile=t.id;pal()};el.appendChild(b)
  }
 };
 const render=()=>{
  const r=room();if(!r||!r.f)return;
  const[W,H]=BM.worldSize(r),z=zoom();
  cv.width=Math.round(W*z);cv.height=Math.round(H*z);
  k.setTransform(z,0,0,z,0,0);k.imageSmoothingEnabled=false;
  k.fillStyle='#08080b';k.fillRect(0,0,W,H);
  k.fillStyle='#262633';k.fillRect(r.f[0],r.f[1],r.f[2],r.f[3]);
  if(z>=.5){k.strokeStyle='rgba(255,255,255,.07)';k.lineWidth=1/z;k.beginPath();for(let x=r.f[0];x<=r.f[0]+r.f[2];x+=32){k.moveTo(x,r.f[1]);k.lineTo(x,r.f[1]+r.f[3])}for(let y=r.f[1];y<=r.f[1]+r.f[3];y+=32){k.moveTo(r.f[0],y);k.lineTo(r.f[0]+r.f[2],y)}k.stroke()}
  BM.drawLayer(k,r,'b');k.globalAlpha=.8;BM.drawLayer(k,r,'a');k.globalAlpha=1;
  for(const c of r.c||[]){k.fillStyle='rgba(255,60,60,.35)';k.fillRect(c.x,c.y,c.w,c.h)}
  for(const d of r.d||[]){k.fillStyle='rgba(255,220,0,.45)';k.fillRect(d.x,d.y,d.w,d.h)}
  k.fillStyle='#4ff';k.font=(10/Math.max(z,.5))+'px monospace';
  for(const o of r.o||[]){if(typeof o.x!=='number')continue;k.fillRect(o.x-3,o.y-3,6,6);if(z>=.5)k.fillText(o.k||'',o.x+5,o.y-4)}
  if(S.rect){k.fillStyle='rgba(255,255,0,.25)';k.fillRect(S.rect.x0*32+(r.tm?r.tm.x:r.f[0]),S.rect.y0*32+(r.tm?r.tm.y:r.f[1]),(S.rect.x1-S.rect.x0+1)*32,(S.rect.y1-S.rect.y0+1)*32)}
  if(S.hover){k.strokeStyle='#39f';k.lineWidth=2/z;k.strokeRect(S.hover.x-320,S.hover.y-240,640,480)}
 };
 const load=()=>{const r=room();if(!r)return;$('bm-fx').value=r.f[0];$('bm-fy').value=r.f[1];$('bm-fw').value=r.f[2];$('bm-fh').value=r.f[3];S.rect=null;render()};
 rs.onchange=load;$('bm-zoom').onchange=render;pal();load();
 $('bm-size').onclick=()=>{
  const r=room();if(!r)return;
  const v=['bm-fx','bm-fy','bm-fw','bm-fh'].map(id=>Math.round(+$(id).value));
  if(v.some(isNaN)||v[2]<160||v[3]<160||v[0]<0||v[1]<0||v[0]+v[2]>BM.maxDim-40||v[1]+v[3]>BM.maxDim-60){say('bm-s','Size must be at least 160, and X+width / Y+height must stay within '+(BM.maxDim-60)+'.',1);return}
  r.f=v;commit(r);load();say('bm-s','Floor is now '+v[2]+'×'+v[3]+'. Doors and objects stay where they were; move them in the Maps tab.')
 };
 $('bm-fit').onclick=()=>{
  const r=room();if(!r)return;
  const tm=r.tm||(r.tm=BM.tmNew(r));tm.x=r.f[0];tm.y=r.f[1];BM.tmResize(tm,Math.ceil(r.f[2]/32),Math.ceil(r.f[3]/32));commit(r);render();say('bm-s','Tile grid is '+tm.w+'×'+tm.h+' cells.')
 };
 $('bm-clear').onclick=()=>{const r=room();if(!r||!r.tm||!confirm('Remove every tile from this room?'))return;delete r.tm;commit(r);render()};
 $('bm-play').onclick=()=>{
  const r=room(),i=R.indexOf(r);if(!r)return;
  const sp=(r.spawns||[]).find(s=>typeof s.x==='number'&&typeof s.y==='number');
  const x=sp?sp.x:Math.round(r.f[0]+r.f[2]/2),y=sp?sp.y:Math.round(r.f[1]+r.f[3]/2);
  try{(0,eval)('rm='+i+';pl={x:'+x+',y:'+y+'}');window.NPCLIFE&&NPCLIFE.suspend();$('dev-close').click()}catch(e){say('bm-s','Could not warp: '+e.message,1)}
 };
 /* painting */
 const pos=e=>{const b=cv.getBoundingClientRect(),z=zoom();return{x:(e.clientX-b.left)*(cv.width/b.width)/z,y:(e.clientY-b.top)*(cv.height/b.height)/z}};
 const cell=(r,p)=>{const tm=r.tm,ox=tm?tm.x:r.f[0],oy=tm?tm.y:r.f[1];return{x:Math.floor((p.x-ox)/32),y:Math.floor((p.y-oy)/32)}};
 const apply=(r,cx,cy)=>{
  const tm=r.tm||(r.tm=BM.tmNew(r)),layer=$('bm-layer').value,id=$('bm-tool').value==='erase'?null:S.tile;
  if(id===undefined||(id===null&&$('bm-tool').value!=='erase'))return false;
  const ok=BM.tmSet(tm,layer,cx,cy,id);
  if(!ok)say('bm-s',(cx<0||cy<0||cx>=tm.w||cy>=tm.h)?'Outside the tile grid. Press "Fit tile grid to floor".':'This room already uses 35 different tiles.',1);
  return ok
 };
 if(!cv._bound){
  cv._bound=1;
  cv.addEventListener('contextmenu',e=>e.preventDefault());
  cv.addEventListener('mousedown',e=>{
   const r=room();if(!r)return;S.down=true;const c=cell(r,pos(e));
   if($('bm-tool').value==='rect')S.rect={x0:c.x,y0:c.y,x1:c.x,y1:c.y,sx:c.x,sy:c.y};
   else{apply(r,c.x,c.y);render()}
  });
  cv.addEventListener('mousemove',e=>{
   const r=room();if(!r)return;const p=pos(e);S.hover=p;const c=cell(r,p);
   if(S.down){
    if(S.rect){S.rect.x0=Math.min(S.rect.sx,c.x);S.rect.x1=Math.max(S.rect.sx,c.x);S.rect.y0=Math.min(S.rect.sy,c.y);S.rect.y1=Math.max(S.rect.sy,c.y)}
    else apply(r,c.x,c.y)
   }
   render()
  });
  cv.addEventListener('mouseleave',()=>{S.hover=null;render()});
  addEventListener('mouseup',()=>{
   if(!S.down)return;S.down=false;const r=room();if(!r)return;
   if(S.rect){for(let y=S.rect.y0;y<=S.rect.y1;y++)for(let x=S.rect.x0;x<=S.rect.x1;x++)apply(r,x,y);S.rect=null}
   if(r.tm)commit(r);render()
  })
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
