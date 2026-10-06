// story.js — load AFTER world.js and BEFORE main.js.
// Adds: auto-playing chapter scenes, room title cards, boss-intro shake,
// a playable three-way ending, and a console check for route problems.
// It wraps existing functions, so world.js needs no edits.

const STORY_CFG={
 // Version Two (REWRITE) only unlocks if you spared Wick. Set false to always allow it.
 rewriteRequiresSpare:true,
 cardFrames:150
};
const ENDING_KEYS=['remember','release','rewrite'];
const ENDING_LABELS=['REMEMBER THE WORLD','RELEASE THE WORLD','REWRITE THE WORLD'];

let seenScenes={},sparedWick=false,endingChosen=null,endChoiceIndex=0,endT=0,endingsFound=0;
let roomCard=null,lastStoryRoom=-1;

function storyData(){return GAME_REPO_STORY_DATA.dialogue}
function resetStoryState(){seenScenes={};sparedWick=false;endingChosen=null;endChoiceIndex=0;endT=0;roomCard=null;lastStoryRoom=-1}
// Call this from your load-game code: restoreStoryState(saveObject)
function restoreStoryState(save){seenScenes=(save&&save.seenScenes)||{};sparedWick=!!(save&&save.sparedWick);lastStoryRoom=-1}

/* ---------- scenes ---------- */
// Finds the chapter scene attached to a room by matching its sign text
// against STORY_SCENES (a sign may also set sceneId directly).
// Room names from the story outline, used when no sign in the room carries the scene text.
const STORY_ROOM_SCENES=[[/quiet road/,'chapter_0_intro'],[/frontier/,'chapter_1_crack'],[/cathedral/,'chapter_2_cathedral'],[/null/,'chapter_3_null'],[/unfinished/,'chapter_4_unfinished'],[/outside/,'chapter_5_last_save'],[/archive/,'chapter_6_archive'],[/hollow kingdom/,'chapter_7_hollow'],[/margin/,'chapter_8_margin'],[/blank/,'chapter_9_blank'],[/autosave|last save/,'chapter_10_final']];
function storyNorm(v){return String(Array.isArray(v)?v.join(' '):v||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}
function sceneForRoom(room){
 const scenes=storyData().STORY_SCENES||{};
 for(const o of room.o||[]){
  if(o.sceneId&&scenes[o.sceneId])return o.sceneId;
  const text=storyNorm(o.t);if(!text)continue;
  for(const id in scenes){const probe=storyNorm(scenes[id].slice(0,2));if(probe&&text.includes(probe))return id}
 }
 const name=String(room.n||'').toLowerCase(),found=STORY_ROOM_SCENES.find(([re,id])=>re.test(name)&&scenes[id]);
 return found?found[1]:null
}
function chapterTitleForScene(id){
 const m=/chapter_(\d+)/.exec(id||'');if(!m)return '';
 const c=(storyData().STORY_CHAPTERS||[]).find(c=>c.id===+m[1]);return c?c.title:''
}

/* ---------- endgame ---------- */
function isFinalBoss(enemy){
 return [enemy.id,enemy.name].some(v=>/lastsave$/.test(String(v||'').toLowerCase().replace(/[^a-z]/g,'')))
}
function endingUnlocked(i){return !(ENDING_KEYS[i]==='rewrite'&&STORY_CFG.rewriteRequiresSpare&&!sparedWick)}
function beginEndgame(){
 const p=storyData().ENDGAME_PROMPT||[];
 let stop=p.findIndex(l=>/WORLD$/.test(l));if(stop<0)stop=p.length;
 const pages=['* The light turns to face you.',...p.slice(1,stop).filter(Boolean)];
 endChoiceIndex=0;endingChosen=null;
 blip(220,.5,.05,'sawtooth');
 wsay(pages,()=>{st='endchoice'})
}
function recordEnding(key){
 try{const s=new Set(JSON.parse(localStorage.getItem('wick-endings')||'[]'));s.add(key);localStorage.setItem('wick-endings',JSON.stringify([...s]));return s.size}catch(_){return 1}
}
function chooseEnding(key){endingChosen=key;endT=0;endingsFound=recordEnding(key);blip(660,.4,.05,'triangle');st='ending'}
function updEndChoice(){
 if(hit('arrowup','w'))endChoiceIndex=(endChoiceIndex+2)%3;
 if(hit('arrowdown','s'))endChoiceIndex=(endChoiceIndex+1)%3;
 if(hit('z')){
  if(!endingUnlocked(endChoiceIndex)){wsay(['* The option flickers and does not hold.','* Something you left behind on the road is needed.'],()=>{st='endchoice'});return}
  chooseEnding(ENDING_KEYS[endChoiceIndex])
 }
}
function updEnding(){
 endT++;
 const total=(storyData().ENDINGS[endingChosen]?.text||'').length;
 if(hit('z')){
  if(endT*.8<total)endT=Math.ceil(total/.8);
  else if(endT*.8>=total+40){endingChosen=null;resetStoryState();newGame(true)}
 }
}
function drawEndChoice(){
 g.fillStyle='#000';g.fillRect(40,316,560,152);g.strokeStyle='#fff';g.lineWidth=5;g.strokeRect(38,314,564,156);
 tx('THE LAST SAVE',60,330,'#ffe28a',11);
 ENDING_LABELS.forEach((label,i)=>{
  const ok=endingUnlocked(i),sel=i===endChoiceIndex;
  tx((sel?'> ':'  ')+(ok?label:'???'),66,364+i*30,sel?'#ff0':ok?'#fff':'#666',12)
 });
 tx('Arrows select · Z choose',62,446,'#888',9)
}
function drawEnding(){
 const e=storyData().ENDINGS[endingChosen]||{title:'THE END',text:''};
 g.fillStyle='#000';g.fillRect(0,0,640,480);
 const titleSize=18;tx(e.title,Math.max(20,320-dialogueTextWidth(e.title,titleSize)/2),90,'#ff7a00',titleSize);
 let remaining=Math.floor(endT*.8);
 wrapDialogueText(e.text,520,11).forEach((line,i)=>{
  const visible=Math.max(0,Math.min(line.length,remaining));
  tx(line.slice(0,visible),60,160+i*26,'#fff',11);remaining-=line.length
 });
 tx('Endings found: '+endingsFound+' / 3',210,400,'#888',10);
 if(endT*.8>=e.text.length+40&&fr%60<40)tx('Press Z to begin again',190,432,'#ff0',12)
}

/* ---------- room title card ---------- */
function drawRoomCard(){
 if(!roomCard)return;
 const t=roomCard.t,a=Math.max(0,Math.min(1,t/20,(STORY_CFG.cardFrames-t)/30));
 if(t>STORY_CFG.cardFrames){roomCard=null;return}
 g.save();g.globalAlpha=a*.85;g.fillStyle='#000';g.fillRect(0,40,640,roomCard.sub?54:36);
 g.globalAlpha=a;
 tx(roomCard.text,Math.max(10,320-dialogueTextWidth(roomCard.text,13)/2),48,'#ffe28a',13);
 if(roomCard.sub)tx(roomCard.sub,Math.max(10,320-dialogueTextWidth(roomCard.sub,9)/2),72,'#aaa',9);
 g.restore()
}

/* ---------- wrappers around world.js ---------- */

// world.js's inWorld() decides which states main.js routes to updWorld/drawWorld;
// the new ending states must be included or the game freezes at the ending choice.
const _inWorld=inWorld;
inWorld=function(){return _inWorld()||st==='endchoice'||st==='ending'};

let storyErr='';
function storyFail(e){if(!storyErr){storyErr=String(e&&e.message||e);console.error('[story.js]',e)}}
// Returns true when story logic took over this frame.
function storyStep(){
 if(roomCard)roomCard.t++;
 if(st==='fin'){beginEndgame();return true}               // exit door of the last room
 if(st==='endchoice'){updEndChoice();return true}
 if(st==='ending'){updEnding();return true}
 if(st==='world'&&rm!==lastStoryRoom){
  lastStoryRoom=rm;
  const id=sceneForRoom(R[rm]);
  roomCard={text:R[rm].n,sub:chapterTitleForScene(id),t:0};
  if(id&&!seenScenes[id]){seenScenes[id]=1;wsay(storyData().STORY_SCENES[id]);return true}
 }
 return false
}
const _updWorld=updWorld;
updWorld=function(){
 let done=false;
 try{done=storyStep()}catch(e){storyFail(e);if(st==='endchoice'||st==='ending')st='world'}
 if(!done)_updWorld()
};

const _drawWorld=drawWorld;
drawWorld=function(){
 if(st==='ending'){try{drawEnding();return}catch(e){storyFail(e);st='world'}}
 let bossIntro=false,shake=0;
 try{bossIntro=st==='enc'&&!roamingEncounter&&et<30;shake=bossIntro?(1-et/30)*5:0}catch(e){storyFail(e)}
 g.save();
 if(shake)g.translate((Math.random()-.5)*shake*2,(Math.random()-.5)*shake*2);
 try{_drawWorld()}finally{g.restore()}
 try{
  if(bossIntro&&et<8){g.fillStyle='rgba(255,255,255,'+(1-et/8)*.45+')';g.fillRect(0,0,640,480)}
  if(st==='endchoice')drawEndChoice();
  if(st==='world'||st==='wtext')drawRoomCard()
 }catch(e){storyFail(e)}
 if(storyErr){g.fillStyle='#f55';g.font='9px monospace';g.fillText('story.js: '+storyErr,8,474)}
};

const _leave=leave;
leave=function(){
 const enemy=ENEMIES.find(e=>e.id===pendingEnemyId),
  wasDark=R[rm]?.id==='dark-room',wasSpared=spared,skip=roamingEncounter||!!debugBattleSnapshot;
 _leave();
 if(skip)return;
 if(wasDark&&wasSpared)sparedWick=true;
 if(enemy&&isFinalBoss(enemy))beginEndgame()
};

const _saveProgress=saveProgress;
saveProgress=function(updateResp=true){
 _saveProgress(updateResp);
 try{const raw=JSON.parse(localStorage.getItem('wick-save-slot'));raw.seenScenes=seenScenes;raw.sparedWick=sparedWick;localStorage.setItem('wick-save-slot',JSON.stringify(raw))}catch(_){}
};


// Battle menu safety: battle.js never gives `menu` a starting value, so the first arrow key
// turns it into NaN and nothing can be selected. Make sure it is always a valid index.
try{
 const _startBattle=startBattle;
 startBattle=function(){menu=0;sub=null;sel=0;return _startBattle.apply(this,arguments)};
 const _toMenu=toMenu;
 toMenu=function(){if(!(menu>=0&&menu<4))menu=0;return _toMenu.apply(this,arguments)};
}catch(e){console.warn('[story.js] battle menu guard not installed',e)}

try{const _newGame=newGame;newGame=function(...a){resetStoryState();return _newGame.apply(this,a)}}catch(_){}

/* ---------- route sanity check (runs once; type checkStory() in the console any time) ---------- */
function checkStory(){
 const problems=[],scenes=storyData().STORY_SCENES||{},found={};
 R.forEach((room,i)=>{
  const id=sceneForRoom(room);if(id)(found[id]=found[id]||[]).push(room.n||i);
  for(const d of room.d||[]){
   if(d.to<0)continue;
   const dest=R[d.to];
   if(!dest){problems.push(room.n+': door leads to missing room index '+d.to);continue}
   if(d.arrivalSpawnId!=null&&d.arrivalSpawnId!==''&&!(dest.spawns||[]).some(s=>String(s.id)===String(d.arrivalSpawnId)))
    problems.push(room.n+' → '+dest.n+': spawn "'+d.arrivalSpawnId+'" not found')
  }
 });
 for(const id in scenes){
  if(!found[id])problems.push('Scene '+id+' is not attached to any room');
  else if(found[id].length>1)problems.push('Scene '+id+' appears in several rooms: '+found[id].join(', '))
 }
 if(problems.length)console.warn('[story check]\n'+problems.join('\n'));else console.log('[story check] route and scenes look consistent');
 return problems
}
setTimeout(()=>{try{checkStory()}catch(e){console.warn('[story check] failed',e)}},0);
