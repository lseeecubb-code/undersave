// npclife.js — living NPCs, dialogue variants, story flags.
// Load AFTER story.js and BEFORE main.js. Needs no edits to world.js.
//
// DATA (put on an NPCS record to apply everywhere, or on a placed room object {k:'npc',npcId,...} to override):
//   move:     {mode:'wander'|'pace'|'path'|'follow'|'watch'|'stand', radius:48, speed:.45, pause:[60,180],
//              axis:'x'|'y' (pace), path:[[dx,dy],...] (path, offsets from home), gap:56 (follow), range:110 (watch),
//              flipLeft:true (mirror the sprite when facing left)}
//   variants: [{talk:1 | talks:2 | maxTalks:3, flag:'name'|['a','b'], notFlag:'x', spared:true, beaten:true, hasItem:'id',
//               lines:[...], options:[...], setFlag:'name'|['a']|{name:value}, after:[steps]}]   first match wins
//   after:    [steps]  or  {first:[steps], every:[steps], byTalk:{3:[steps]}}     runs when the conversation ends
//   options[] entries may also carry setFlag and after.
// STEPS (run in order, one at a time):
//   {a:'move',x,y,speed,stay}   {a:'step',dx,dy,speed,stay}   {a:'wait',f:30}   {a:'face',dir:'left|right|up|down|player'}
//   {a:'say',lines:[...]}       {a:'scene',id:'chapter_0_intro'}   {a:'mode',mode:'follow',...move settings}
//   {a:'setFlag',flag:'x',value:true}   {a:'hide'}   {a:'blip',f:520}   {a:'lock',on:true}   {a:'give',n:5}   {a:'heal'}
//   stay defaults to true: the NPC keeps the new spot (saved with the game). stay:false = temporary.
// ROOM: room.sceneId = 'scene_id' plays that story scene the first time the room is entered.
(function(){
const NL=window.NPCLIFE={version:1,enabled:true,state:{},flags:{},seqs:[],talk:null,suspended:false,errors:0};
const NS=NL.state,FL=NL.flags;
const SOLID=['npc','shop','chest','wickmob'];
let warned={};
function fail(e){if(!NL.errors++)console.error('[npclife]',e)}
function devOpen(){const e=document.getElementById('devtools');return !!e&&e.classList.contains('visible')}
function roomKey(r){return r.id||R.indexOf(r)}
function okey(r,o){return o.id?String(o.id):roomKey(r)+':'+r.o.indexOf(o)}
function npcRec(o){return o&&o.npcId?NPCS.find(n=>n.id===o.npcId):null}
function moveCfg(o){const rt=o._rt;return (rt&&rt.mv)||o.move||(npcRec(o)||{}).move||null}
function fl(x){return Array.isArray(x)?x:x==null?[]:[x]}
function applyFlags(x){if(!x)return;if(typeof x==='string')FL[x]=true;else if(Array.isArray(x))x.forEach(n=>FL[n]=true);else Object.assign(FL,x)}

/* ---------- per-object runtime (never exported: dev mode restores x/y and drops it) ---------- */
function ensure(r,o){
 if(o._rt)return o._rt;
 const key=okey(r,o),sv=NS[key]||{};
 const rt=o._rt={key,ox:o.x,oy:o.y,hx:o.x,hy:o.y,wait:30+Math.floor(Math.random()*90),face:'down',moving:false,gone:false,tx:null,ty:null,pi:0,mv:sv.mv||null};
 if(sv.x!=null){rt.hx=sv.x;rt.hy=sv.y;o.x=sv.x;o.y=sv.y}
 if(sv.gone){rt.gone=true;o.x=o.y=-999}
 return rt
}
function suspend(){
 for(const r of (typeof R!=='undefined'?R:[]))for(const o of r.o||[])if(o._rt){o.x=o._rt.ox;o.y=o._rt.oy;delete o._rt}
 NL.seqs.length=0;NL.talk=null
}
function persist(rt,extra){const v=NS[rt.key]=NS[rt.key]||{};v.x=Math.round(rt.hx);v.y=Math.round(rt.hy);if(extra)Object.assign(v,extra)}
NL.suspend=suspend;NL.ensure=ensure;NL.setFlag=applyFlags;NL.flag=n=>FL[n];

/* ---------- movement ---------- */
function free(r,o,x,y){
 const f=r.f;
 if(x<f[0]+10||x>f[0]+f[2]-10||y<f[1]+14||y>f[1]+f[3])return false;
 for(const c of r.c||[])if(x+10>c.x&&x-10<c.x+c.w&&y+6>c.y&&y-4<c.y+c.h)return false;
 if(Math.abs(x-pl.x)<28&&Math.abs(y-pl.y)<20)return false;      // never walk into the player
 if(typeof tileBlocks==='function'&&tileBlocks(r,x-10,y-4,x+10,y+6))return false;   // solid custom tiles
 for(const q of r.o){
  if(q===o)continue;
  if(SOLID.includes(q.k)&&!(q.k==='wickmob'&&beaten)&&!(q._rt&&q._rt.gone)&&Math.abs(x-q.x)<26&&Math.abs(y-q.y)<16)return false;
  const ps=typeof PROP_SOLID!=='undefined'&&PROP_SOLID[q.k];
  if(ps&&Math.abs(x-q.x)<ps[0]/2+10&&y>q.y-ps[1]-6&&y<q.y+8)return false
 }
 for(const d of r.d||[])if(x+18>d.x&&x-18<d.x+d.w&&y+14>d.y&&y-18<d.y+d.h)return false;
 return true
}
function faceTo(rt,dx,dy){rt.face=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up')}
function walk(r,o,rt,tx,ty,sp){
 const dx=tx-o.x,dy=ty-o.y,d=Math.hypot(dx,dy);
 if(d<=Math.max(1.2,sp)){if(free(r,o,tx,ty)){o.x=tx;o.y=ty}rt.moving=false;return 'arrived'}
 let moved=false;
 if(Math.abs(dx)>.01&&free(r,o,o.x+dx/d*sp,o.y)){o.x+=dx/d*sp;moved=true}
 if(Math.abs(dy)>.01&&free(r,o,o.x,o.y+dy/d*sp)){o.y+=dy/d*sp;moved=true}
 rt.moving=moved;
 if(moved)faceTo(rt,dx,dy);
 return moved?'moving':'blocked'
}
function pause(rt,mv){const p=mv.pause||[60,180];rt.wait=p[0]+Math.random()*(p[1]-p[0]);rt.tx=null;rt.moving=false}
function ai(r,o,rt,mv){
 const mode=mv.mode||'wander',sp=mv.speed||.45;
 if(mode==='stand'){rt.moving=false;return}
 if(mode==='watch'){rt.moving=false;const dx=pl.x-o.x,dy=pl.y-o.y;if(Math.hypot(dx,dy)<(mv.range||110))faceTo(rt,dx,dy);return}
 if(mode==='follow'){
  const gap=mv.gap||56,dx=pl.x-o.x,dy=pl.y-o.y,d=Math.hypot(dx,dy)||1;
  if(d>gap+6)walk(r,o,rt,pl.x-dx/d*gap,pl.y-dy/d*gap,mv.speed||1.5);else{rt.moving=false;faceTo(rt,dx,dy)}
  return
 }
 if(rt.wait>0){rt.wait--;rt.moving=false;return}
 if(mode==='pace'){
  const rad=mv.radius??40,s=rt.pi%2?1:-1,x=mv.axis==='y'?rt.hx:rt.hx+s*rad,y=mv.axis==='y'?rt.hy+s*rad:rt.hy;
  if(walk(r,o,rt,x,y,sp)!=='moving'){rt.pi++;pause(rt,mv)}
  return
 }
 if(mode==='path'&&mv.path&&mv.path.length){
  const p=mv.path[rt.pi%mv.path.length];
  if(walk(r,o,rt,rt.hx+p[0],rt.hy+p[1],sp)!=='moving'){rt.pi++;pause(rt,mv)}
  return
 }
 // wander
 if(rt.tx==null){const rad=mv.radius??48,a=Math.random()*6.283,dd=Math.random()*rad;rt.tx=rt.hx+Math.cos(a)*dd;rt.ty=rt.hy+Math.sin(a)*dd}
 if(walk(r,o,rt,rt.tx,rt.ty,sp)!=='moving')pause(rt,mv)
}

/* ---------- sequences (what an NPC does after you talk to it) ---------- */
function startSeq(r,o,steps){if(steps&&steps.length)NL.seqs.push({r,o,steps:steps.slice(),i:0,cur:{},age:0,lock:false})}
NL.startSeq=startSeq;
function instant(q,s,rt,o){   // effects that need no animation
 switch(s.a){
  case 'mode':{const {a,...cfg}=s;rt.mv={...(o.move||(npcRec(o)||{}).move||{}),...cfg};rt.tx=null;persist(rt,{mv:rt.mv});break}
  case 'setFlag':FL[s.flag]=s.value===undefined?true:s.value;break;
  case 'hide':rt.gone=true;o.x=o.y=-999;persist(rt,{gone:true});break;
  case 'blip':try{blip(s.f||520,s.d||.1,s.v||.04,s.type||'square')}catch(_){}break;
  case 'lock':q.lock=!!s.on;break;
  case 'give':buns+=s.n||1;break;
  case 'heal':hp=mhp;break;
  case 'face':if(s.dir==='player')faceTo(rt,pl.x-o.x,pl.y-o.y);else rt.face=s.dir||rt.face;break;
  case 'move':if(typeof s.x==='number'){o.x=s.x;o.y=s.y;if(s.stay!==false){rt.hx=o.x;rt.hy=o.y;persist(rt)}}break;
  case 'step':o.x+=s.dx||0;o.y+=s.dy||0;if(s.stay!==false){rt.hx=o.x;rt.hy=o.y;persist(rt)}break;
 }
}
function dropSeq(q){
 const rt=ensure(q.r,q.o);
 for(let k=q.i;k<q.steps.length;k++)try{instant(q,q.steps[k],rt,q.o)}catch(e){fail(e)}
 q.i=q.steps.length
}
function stepDone(q,s,rt,o,r){
 const c=q.cur;
 switch(s.a){
  case 'move':case 'step':{
   if(!c.init){c.init=1;c.n=0;c.tx=s.a==='step'?o.x+(s.dx||0):s.x;c.ty=s.a==='step'?o.y+(s.dy||0):s.y}
   const res=walk(r,o,rt,c.tx,c.ty,s.speed||1.1);
   if(res==='moving'){c.n=0;return false}
   if(res==='blocked'&&++c.n<=20)return false;
   rt.moving=false;if(s.stay!==false){rt.hx=o.x;rt.hy=o.y;persist(rt)}
   return true
  }
  case 'wait':c.n=(c.n||0)+1;return c.n>=(s.f||30);
  case 'say':case 'scene':{
   if(c.said)return true;
   const lines=s.a==='scene'?((((GAME_REPO_STORY_DATA||{}).dialogue||{}).STORY_SCENES||{})[s.id]):s.lines;
   c.said=1;if(lines&&lines.length){wsay(lines);q.said=true}
   return !(lines&&lines.length)
  }
  default:
   if(!/^(mode|setFlag|hide|blip|lock|give|heal|face)$/.test(s.a)&&!warned[s.a]){warned[s.a]=1;console.warn('[npclife] unknown step "'+s.a+'"')}
   instant(q,s,rt,o);return true
 }
}
function runSeqs(){
 let hold=false;
 for(const q of NL.seqs.slice()){
  if(q.r!==R[rm]){dropSeq(q)}
  else if(++q.age>1800)dropSeq(q);
  if(q.i>=q.steps.length){NL.seqs.splice(NL.seqs.indexOf(q),1);continue}
  const rt=ensure(q.r,q.o);
  try{if(stepDone(q,q.steps[q.i],rt,q.o,q.r)){q.i++;q.cur={}}}catch(e){fail(e);q.i++;q.cur={}}
  if(q.lock)hold=true;
  if(q.said){q.said=false;hold=true}
 }
 return hold
}

/* ---------- talking: variants, talk counts, after-talk sequences ---------- */
function condOK(c,talks){
 if(c.talk!=null&&talks!==c.talk)return false;
 if(c.talks!=null&&talks<c.talks)return false;
 if(c.maxTalks!=null&&talks>c.maxTalks)return false;
 if(!fl(c.flag).every(n=>FL[n]))return false;
 if(!fl(c.notFlag).every(n=>!FL[n]))return false;
 if(c.spared!=null&&!!spared!==!!c.spared)return false;
 if(c.beaten!=null&&!!beaten!==!!c.beaten)return false;
 if(c.hasItem&&!inventory.includes(c.hasItem))return false;
 return true
}
function afterSteps(a,talks){
 if(!a)return [];
 if(Array.isArray(a))return a;
 return [...(talks===1?(a.first||[]):[]),...((a.byTalk&&a.byTalk[talks])||[]),...(a.every||[])]
}
const _beginNpcTalk=beginNpcTalk;
beginNpcTalk=function(npc){
 let use=npc;
 try{
  const r=R[rm],o=r.o.find(q=>q.k==='npc'&&q.npcId===(npc&&npc.id)&&Math.abs(pl.x-q.x)<36&&Math.abs(pl.y-q.y)<32);
  if(o&&NL.enabled){
   const rt=ensure(r,o),sv=NS[rt.key]=NS[rt.key]||{},talks=sv.talks=(sv.talks||0)+1;
   faceTo(rt,pl.x-o.x,pl.y-o.y);rt.moving=false;
   const v=[...(o.variants||[]),...(npc.variants||[])].find(x=>condOK(x,talks));
   applyFlags(npc.setFlag);applyFlags(o.setFlag);
   if(v){applyFlags(v.setFlag);use={...npc,dialogue:v.lines||npc.dialogue,options:v.options||npc.options}}
   const steps=v&&v.after?afterSteps(v.after,talks):[...afterSteps(npc.after,talks),...afterSteps(o.after,talks)];
   NL.talk={r,o,steps,extra:[],seen:false}
  }
 }catch(e){fail(e)}
 return _beginNpcTalk.call(this,use)
};
const _wsay=wsay;
wsay=function(p){
 try{
  if(st==='dchoice'&&conversationNpc&&NL.talk){
   const op=(conversationNpc.options||[]).find(x=>x.lines===p);
   if(op){applyFlags(op.setFlag);if(op.after)NL.talk.extra.push(...afterSteps(op.after,0))}
  }
 }catch(e){fail(e)}
 return _wsay.apply(this,arguments)
};

/* ---------- hooks into the game loop ---------- */
const _updWorld=updWorld;
updWorld=function(){
 let hold=false;
 try{
  if(devOpen()){if(!NL.suspended){suspend();NL.suspended=true}}
  else if(NL.enabled){
   NL.suspended=false;
   const r=R[rm];
   if(NL.talk){
    if(NL.talk.r!==r)NL.talk=null;
    else if(st!=='world')NL.talk.seen=true;
    else if(NL.talk.seen){const T=NL.talk;NL.talk=null;startSeq(T.r,T.o,[...T.steps,...T.extra])}
   }
   if(st==='world'){
    for(const o of r.o)if(o.k==='npc')ensure(r,o);
    hold=runSeqs();
    if(!hold)for(const o of r.o){
     if(o.k!=='npc'||o._rt.gone)continue;
     const mv=moveCfg(o);
     if(mv&&!NL.seqs.some(q=>q.o===o))ai(r,o,o._rt,mv);else o._rt.moving=false
    }
   }else for(const o of r.o)if(o._rt)o._rt.moving=false
  }
 }catch(e){fail(e)}
 if(hold&&st==='world')return;
 return _updWorld.apply(this,arguments)
};

const _obj=obj;
obj=function(o){
 if(o.k!=='npc')return _obj(o);
 if(!o._rt&&!NL.suspended&&NL.enabled){try{const r=R[rm];if(r.o.includes(o))ensure(r,o)}catch(e){fail(e)}}
 const rt=o._rt;
 if(!rt)return _obj(o);
 if(rt.gone)return;
 const mv=moveCfg(o)||{},bob=rt.moving?Math.round(Math.abs(Math.sin(fr*.28))*2):0;
 g.save();
 if(mv.flipLeft&&rt.face==='left'){g.translate(o.x,0);g.scale(-1,1);g.translate(-o.x,0)}
 if(bob)g.translate(0,-bob);
 try{_obj(o)}finally{g.restore()}
};

if(typeof sceneForRoom==='function'){
 const _scene=sceneForRoom;
 sceneForRoom=function(room){
  try{const id=room&&room.sceneId;if(id&&GAME_REPO_STORY_DATA.dialogue.STORY_SCENES[id])return id}catch(_){}
  return _scene.apply(this,arguments)
 }
}

/* ---------- saving and new games ---------- */
function resetLife(){for(const k in NS)delete NS[k];for(const k in FL)delete FL[k];suspend()}
function restoreLife(save){Object.assign(NS,(save&&save.npcState)||{});Object.assign(FL,(save&&save.npcFlags)||{});suspend()}
try{
 const _save=saveProgress;
 saveProgress=function(){
  _save.apply(this,arguments);
  try{const raw=JSON.parse(localStorage.getItem('wick-save-slot'));raw.npcState=NS;raw.npcFlags=FL;localStorage.setItem('wick-save-slot',JSON.stringify(raw))}catch(_){}
 }
}catch(e){console.warn('[npclife] save hook not installed',e)}
try{
 const _newGame=newGame;
 newGame=function(...a){
  const fresh=a[0],willLoad=!fresh&&!window.wickStarted;
  resetLife();
  const result=_newGame.apply(this,a);
  if(willLoad){try{const s=JSON.parse(localStorage.getItem('wick-save-slot')||'null');if(s)restoreLife(s)}catch(_){}}
  return result
 }
}catch(e){console.warn('[npclife] newGame hook not installed',e)}
})();
