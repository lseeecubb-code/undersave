// Exploration, interactions, and world rendering.
let conversationNpc=null,choiceIndex=0,activeShop=null,shopIndex=0,shopReturn='world',checkpoint=null,checkpointChoice=0; 
let inventory=[],materials={},menuMode='main',menuIndex=0,menuNotice='',pauseReturnState='world';
let debugBattleSnapshot=null;
let encounterDistance={},pendingEnemyId=null,roamingEncounter=false;
let gameMusic=null,gameMusicKey='';
let worldTextLayouts=[],worldTextTotal=0;
const pauseChoices=['ITEM','SHOP','STATUS','SAVE','CLOSE'];
function inWorld(){return st==='world'||st==='wtext'||st==='dchoice'||st==='checkpoint'||st==='shop'||st==='pauseMenu'||st==='enc'||st==='fin'}
function setGameMusic(src,volume=.32){src=src||'';if(src!==gameMusicKey){if(gameMusic){gameMusic.pause();gameMusic=null}gameMusicKey=src;if(src){gameMusic=new Audio(src);gameMusic.loop=true;gameMusic.volume=volume}}if(gameMusic&&gameMusic.paused)gameMusic.play().catch(()=>{})}
function dialogueTextWidth(text,size){g.font=size+"px 'Press Start 2P',monospace";return Math.max(g.measureText(text).width,text.length*size)}
function wrapDialogueText(text,maxWidth,size){
 const lines=[];let line='';
 for(let word of text.split(' ')){
  const candidate=line?line+' '+word:word;
  if(dialogueTextWidth(candidate,size)<=maxWidth){line=candidate;continue}
  if(line){lines.push(line);line=''}
  while(word&&dialogueTextWidth(word,size)>maxWidth){let cut=word.length;while(cut>1&&dialogueTextWidth(word.slice(0,cut),size)>maxWidth)cut--;lines.push(word.slice(0,cut));word=word.slice(cut)}
  line=word
 }
 if(line||!lines.length)lines.push(line);return lines
}
function fitDialogueText(value){const text=String(value??'').replace(/[\r\n]+/g,' ').replace(/\s+/g,' ').trim(),maxWidth=510;for(let size=15;size>=7;size--){const lines=wrapDialogueText(text,maxWidth,size);if(lines.length<=4)return{lines,size,total:lines.reduce((n,line)=>n+line.length,0)}}const size=7,lines=wrapDialogueText(text,maxWidth,size).slice(0,4);if(lines.length===4){let last=lines[3];while(last&&dialogueTextWidth(last+'…',size)>maxWidth)last=last.slice(0,-1);lines[3]=last+'…'}return{lines,size,total:lines.reduce((n,line)=>n+line.length,0)}}
addEventListener('pointerdown',()=>{if(gameMusic?.paused)gameMusic.play().catch(()=>{})});
function wsay(p,cb){wl=p;wi=0;shown=0;worldTextLayouts=p.map(fitDialogueText);worldTextTotal=worldTextLayouts[0]?.total||0;wcb=cb||null;st='wtext'}
function beginNpcTalk(npc){if(npc?.options?.length){conversationNpc=npc;choiceIndex=0;wsay(npc.dialogue||["* "+npc.name+" greets you."],()=>{st='dchoice'})}else wsay(npc?.dialogue||["* "+(npc?.name||'Someone')+" greets you."])}
function openShop(id,returnTo='world'){activeShop=SHOPS.find(s=>s.id===id);if(!activeShop){wsay(["* The shop is closed."]);return}shopIndex=0;shopReturn=returnTo;wsay(activeShop.welcome||["* Welcome!"],()=>{st='shop'})}
function closeShop(){activeShop=null;st=shopReturn==='dchoice'?'dchoice':shopReturn==='pauseMenu'?'pauseMenu':'world'}
function buyShopItem(item){if(buns<item.price){wsay(["* You don't have enough BUNS."],()=>{st='shop'});return}if(inventory.length>=8){wsay(["* Your inventory is full."],()=>{st='shop'});return}buns-=item.price;inventory.push(item.id);blip(720,.18,.04,'triangle');wsay(["* You bought "+item.name+".","* Added to your inventory.","* BUNS left: "+buns+"."],()=>{st='shop'})}
function enterPauseMenu(){pauseReturnState=st;menuMode='main';menuIndex=0;menuNotice='';st='pauseMenu'}
function menuBack(){if(menuMode==='main'){st=pauseReturnState;return}menuMode='main';menuIndex=0}
function saveProgress(updateResp=true){if(updateResp)resp={rm,x:pl.x,y:pl.y};try{localStorage.setItem('wick-save-slot',JSON.stringify({version:3,roomId:R[rm].id,x:pl.x,y:pl.y,hp,mhp,playerLevel,experience,buns,inventory,materials,beaten,spared,defeated,taken,resp:{roomId:R[resp.rm]?.id,x:resp.x,y:resp.y}}));menuNotice='Progress saved at '+R[rm].n+'.'}catch(_){menuNotice='Save storage is unavailable in this browser.'}}
function openCheckpoint(o){checkpoint=o;checkpointChoice=0;st='checkpoint'}
function menuStep(delta,count){menuIndex=(menuIndex+delta+count)%count}
function inventoryEntries(){const counts={};for(const id of inventory)counts[id]=(counts[id]||0)+1;return Object.entries(counts)}
function materialEntries(){return Object.entries(materials||{}).filter(([,count])=>count>0).sort(([a],[b])=>a.localeCompare(b))}
function itemById(id){for(const shop of SHOPS){const found=shop.items.find(i=>i.id===id);if(found)return found}return null}
function useInventoryItem(index){const item=itemById(inventory[index]);if(!item){inventory.splice(index,1);st='pauseMenu';return}if((item.effect==='heal'||item.effect==='full-heal')&&hp>=mhp){wsay(["* Your HP is already full."],()=>{st='pauseMenu'});return}if(item.effect==='heal')hp=Math.min(mhp,hp+(item.amount||8));if(item.effect==='full-heal')hp=mhp;inventory.splice(index,1);blip(820,.2,.04,'triangle');wsay(["* You used "+item.name+".","* HP restored."],()=>{st='pauseMenu'})}
function updatePauseMenu(){if(hit('escape','x')){menuBack();return}if(menuMode==='main'){if(hit('arrowup','w'))menuStep(-1,pauseChoices.length);if(hit('arrowdown','s'))menuStep(1,pauseChoices.length);if(hit('z')){const choice=pauseChoices[menuIndex];if(choice==='ITEM'){menuMode='items';menuIndex=0}else if(choice==='SHOP'){menuMode='shops';menuIndex=0}else if(choice==='STATUS'){menuMode='status';menuIndex=0}else if(choice==='SAVE'){saveProgress();menuMode='status'}else st=pauseReturnState}}
 else if(menuMode==='items'){const entries=inventoryEntries(),loot=materialEntries(),back=entries.length+loot.length,count=back+1;if(hit('arrowup','w'))menuStep(-1,count);if(hit('arrowdown','s'))menuStep(1,count);if(hit('z')){if(menuIndex<entries.length){const id=entries[menuIndex][0];useInventoryItem(inventory.findIndex(itemId=>itemId===id))}else if(menuIndex<back){const [name,amount]=loot[menuIndex-entries.length];wsay(['* '+name+' × '+amount,'* A material collected on your journey.'],()=>{st='pauseMenu'})}else menuBack()}}
 else if(menuMode==='shops'){const count=SHOPS.length+1;if(hit('arrowup','w'))menuStep(-1,count);if(hit('arrowdown','s'))menuStep(1,count);if(hit('z')){if(menuIndex<SHOPS.length)openShop(SHOPS[menuIndex].id,'pauseMenu');else menuBack()}}}
function startDevBattleTest(enemyId,patternId=null){const enemy=ENEMIES.find(e=>e.id===enemyId);if(!enemy)return;debugBattleSnapshot={hp,mhp,playerLevel,experience,buns,inventory:inventory.slice(),materials:{...materials},rm,pl:{...pl},beaten,spared,defeated:{...defeated},enemyId,originalPattern:enemy.pattern,testPattern:patternId};if(patternId)enemy.pattern=patternId;pendingEnemyId=enemyId;roamingEncounter=false;startBattle()}
function finishDevBattleTest(){if(!debugBattleSnapshot)return false;const snap=debugBattleSnapshot;debugBattleSnapshot=null;const enemy=ENEMIES.find(e=>e.id===snap.enemyId);if(enemy&&snap.testPattern)enemy.pattern=snap.originalPattern;hp=snap.hp;mhp=snap.mhp;playerLevel=snap.playerLevel;experience=snap.experience;buns=snap.buns;inventory=snap.inventory;materials=snap.materials;rm=snap.rm;pl={...snap.pl};beaten=snap.beaten;spared=snap.spared;defeated=snap.defeated;pendingEnemyId=null;roamingEncounter=false;B=[];st='world';setGameMusic(R[rm]?.soundData||'',.3);return true}
function leave(){if(finishDevBattleTest())return;B=[];if(roamingEncounter){roamingEncounter=false;pendingEnemyId=null;st='world';wsay(['* The road falls quiet again.']);return}pendingEnemyId=null;beaten=1;defeated[R[rm].id||rm]=1;st='world';
 if(spared&&R[rm].id==='dark-room')R[2].o.push({k:'wick',x:140,y:250,t:["* WICK: Thanks for staying with me.","* The dark is less scary with company.","* Go on. The way out is east."]});
 else wsay(["* Wax cools on the floor where WICK stood.","* The way east is open."])}
function respawn(){if(finishDevBattleTest())return;hp=mhp;rm=resp.rm;pl={x:resp.x,y:resp.y};B=[];roamingEncounter=false;pendingEnemyId=null;st='world';wsay(["* You wake beside the warm light.","* (HP restored.)"])}
function roomSpawn(room,id,door){const point=(room.spawns||[]).find(p=>String(p.id)===String(id));return point?{x:+point.x||0,y:+point.y||0}:{x:+door.px||room.f[0]+32,y:+door.py||room.f[1]+room.f[3]/2}}
function updWorld(){
  const r=R[rm],f=r.f,naturalPool=(r.encounters||[]).filter(id=>ENEMIES.find(e=>e.id===id)?.natural===true);
 const oldX=pl.x,oldY=pl.y,roomAtStart=rm;
 if(['world','wtext','dchoice'].includes(st)&&hit('escape'))enterPauseMenu();
 else if(st==='pauseMenu')updatePauseMenu();
 else if(st==='checkpoint'){if(hit('arrowup','w','arrowdown','s'))checkpointChoice=1-checkpointChoice;if(hit('x','escape')){checkpoint=null;st='world'}else if(hit('z')){const o=checkpoint;checkpoint=null;if(checkpointChoice===0){hp=mhp;resp={rm,x:(o?.x||pl.x)+14,y:(o?.y||pl.y)+34};saveProgress(false);blip(880,.3,.05,'triangle');wsay(['* Your journey is saved.','* (HP fully restored.)'])}else st='world'}}
 else if(st==='wtext'){const q=wl[wi],total=worldTextLayouts[wi]?.total||q.length;shown=Math.min(total,shown+.8);
  if(fr%3===0&&shown<total)blip(480,.03,.012);
  if(hit('z')){if(shown<total)shown=total;else if(++wi>=wl.length){const c=wcb;wcb=null;st='world';c&&c()}else{shown=0;worldTextTotal=worldTextLayouts[wi]?.total||0}}}
 else if(st==='dchoice'){const count=conversationNpc?.options?.length||0;if(hit('arrowup','w'))choiceIndex=(choiceIndex+count-1)%count;if(hit('arrowdown','s'))choiceIndex=(choiceIndex+1)%count;if(hit('x'))st='world';if(hit('z')&&count){const option=conversationNpc.options[choiceIndex];if(option.shopId)openShop(option.shopId,'dchoice');else wsay(option.lines||["* "+conversationNpc.name+" has nothing else to say."],()=>{st='dchoice'})}}
 else if(st==='shop'){if(!activeShop){st=shopReturn;return}const exitIndex=activeShop.items.length;if(hit('arrowup','w'))shopIndex=(shopIndex+exitIndex)%(exitIndex+1);if(hit('arrowdown','s'))shopIndex=(shopIndex+1)%(exitIndex+1);if(hit('x','escape'))closeShop();if(hit('z')){if(shopIndex===exitIndex)closeShop();else buyShopItem(activeShop.items[shopIndex])}}
 else if(st==='enc'){et++;if(et>60)startBattle()}
 else if(st==='fin'){if(hit('z'))newGame(true)}
 else{
  let dx=(down('arrowright','d')?1:0)-(down('arrowleft','a')?1:0),dy=(down('arrowdown','s')?1:0)-(down('arrowup','w')?1:0);
  if(dx&&dy){dx*=.707;dy*=.707}
  // Signs, save points, and decorative sprites are not physical obstacles.
  // Treating every object as solid could trap the player when a checkpoint
  // spawn overlaps its save marker.
  const solid=(x,y)=>r.o.some(o=>['npc','shop','chest','wickmob'].includes(o.k)&&!(o.k==='wickmob'&&beaten)&&Math.abs(x-o.x)<20&&Math.abs(y-o.y)<12)||(r.c||[]).some(c=>x+6>c.x&&x-6<c.x+c.w&&y+8>c.y&&y-4<c.y+c.h)||(typeof tileSolidAt==='function'&&tileSolidAt(r,x,y));
  const nx=Math.max(f[0]+7,Math.min(f[0]+f[2]-7,pl.x+dx*2.2));if(!solid(nx,pl.y))pl.x=nx;
  const ny=Math.max(f[1]+10,Math.min(f[1]+f[3],pl.y+dy*2.2));if(!solid(pl.x,ny))pl.y=ny;
  for(const d of r.d)if(pl.x+7>d.x&&pl.x-7<d.x+d.w&&pl.y>d.y&&pl.y-8<d.y+d.h){
   if(d.to<0){if(defeated[r.id||rm]){st='fin'}}else{const destination=R[d.to];rm=d.to;pl=roomSpawn(destination,d.arrivalSpawnId,d);break}}
  if(hit('z')){const area=(r.triggers||[]).find(a=>a.k==='dialogue'&&pl.x>=a.x&&pl.x<=a.x+a.w&&pl.y>=a.y&&pl.y<=a.y+a.h);const o=r.o.find(o=>(o.t||o.k==='npc'||o.k==='shop'||o.k==='save')&&Math.abs(pl.x-o.x)<36&&Math.abs(pl.y-o.y)<32);
   if(area)wsay(area.t||["* ..."]);else if(o){if(o.k==='save')openCheckpoint(o);
    else if(o.k==='chest'){if(taken[o.id])wsay(["* The chest is empty."]);else{taken[o.id]=1;buns++;blip(700,.2,.05);wsay(o.t)}}
    else if(o.k==='shop')openShop(o.shopId);
    else if(o.k==='npc'){const npc=NPCS.find(n=>n.id===o.npcId);if(npc)beginNpcTalk(npc);else wsay(o.t||["* "+(o.npcId||'Someone')+" is here."])}
    else wsay(o.t)}}
  const trigger=(r.triggers||[]).find(a=>a.k==='enemy'&&pl.x>=a.x&&pl.x<=a.x+a.w&&pl.y>=a.y&&pl.y<=a.y+a.h),hasEnemyArea=(r.triggers||[]).some(a=>a.k==='enemy');
  if(trigger&&!defeated[r.id||rm]){const enemy=ENEMIES.find(e=>e.id===trigger.enemyId)||ENEMIES[0];pendingEnemyId=enemy.id;roamingEncounter=false;wsay(["* The air gets warm.","* "+enemy.name+" appears!"],()=>{r.enemyId=enemy.id;st='enc';et=0})}
  else if(!hasEnemyArea&&r.enemyId&&!defeated[r.id||rm]&&pl.x>260){pendingEnemyId=r.enemyId;roamingEncounter=false;wsay(["* The air gets warm.","* "+((ENEMIES.find(e=>e.id===r.enemyId)||ENEMIES[0]).name)+" appears!"],()=>{st='enc';et=0})}
  else if(st==='world'&&roomAtStart===rm&&naturalPool.length){const walked=Math.hypot(pl.x-oldX,pl.y-oldY);if(walked){const key=r.id||rm;encounterDistance[key]=(encounterDistance[key]||0)+walked;const spacing=r.encounterSpacing||150;if(encounterDistance[key]>=spacing){encounterDistance[key]-=spacing;if(Math.random()<(r.encounterChance??.55)){const id=naturalPool[Math.floor(Math.random()*naturalPool.length)],enemy=ENEMIES.find(e=>e.id===id);if(enemy){pendingEnemyId=id;roamingEncounter=true;wsay(["* You hear movement nearby.","* "+enemy.name+" approaches!"],()=>{st='enc';et=0})}}}}}}
}
function wrap(s,n){const o=[];let l='';for(const w of s.split(' ')){if(l&&(l+' '+w).length>n){o.push(l);l=w}else l=l?l+' '+w:w}o.push(l);return o.map((x,i)=>i?'  '+x:x)}
function candle(x,y,happy){const w=Math.sin(fr*.05)*2;g.fillStyle='#e8dcc0';g.fillRect(x-10,y-28+w,20,28-w);g.fillStyle='#000';g.fillRect(x-6,y-20+w,3,3);g.fillRect(x+3,y-20+w,3,3);
 if(happy){g.fillRect(x-4,y-13+w,8,2)}
 const fh=9+Math.sin(fr*.3)*2;g.fillStyle='#ff7a00';g.fillRect(x-4,y-28+w-fh,8,fh);g.fillStyle='#ffe066';g.fillRect(x-2,y-28+w-fh+3,4,fh-3)}
function sprite(id,x,y){const s=SPRITES.find(v=>v.id===id);if(!s||!s.pixels)return false;const scale=2,left=Math.round(x-s.width*scale/2),top=Math.round(y-s.height*scale);for(let i=0;i<s.pixels.length;i++){const c=s.pixels[i];if(c){g.fillStyle=c;g.fillRect(left+(i%s.width)*scale,top+Math.floor(i/s.width)*scale,scale,scale)}}return true}
function obj(o){const x=o.x,y=o.y;
 if(o.k==='sign'){g.fillStyle='#6b4a2b';g.fillRect(x-3,y-14,6,16);g.fillStyle='#9a6b3a';g.fillRect(x-12,y-26,24,14)}
 else if(o.k==='npc'){const npc=NPCS.find(n=>n.id===o.npcId);if(!sprite(o.spriteId||npc?.spriteId,x,y)){g.fillStyle='#c8b8ff';g.fillRect(x-18,y-22,10,14);g.fillRect(x+8,y-22,10,14);g.fillStyle='#8a6fd0';g.fillRect(x-8,y-24,16,24);g.fillStyle='#000';g.fillRect(x-5,y-18,3,3);g.fillRect(x+2,y-18,3,3)}}
 else if(o.k==='sprite')sprite(o.spriteId,x,y)
 else if(o.k==='shop'){g.fillStyle='#624425';g.fillRect(x-24,y-17,48,18);g.fillStyle='#bd8b45';g.fillRect(x-27,y-21,54,7);g.fillStyle='#ffe28a';g.fillRect(x-3,y-14,6,11);g.fillStyle='#fff2c7';g.fillRect(x-1,y-19,2,5)}
 else if(o.k==='save'){const z=6+Math.sin(fr*.1)*2;g.fillStyle='#ffe066';g.beginPath();g.moveTo(x,y-22-z);g.lineTo(x+z,y-12);g.lineTo(x,y-2+z);g.lineTo(x-z,y-12);g.fill()}
 else if(o.k==='chest'){g.fillStyle='#7a4a1a';g.fillRect(x-12,y-14,24,14);g.fillStyle=taken[o.id]?'#222':'#e0b040';g.fillRect(x-12,y-14,24,5)}
 else if(o.k==='wickmob'){if(!beaten)candle(x,y,false)}
 else if(o.k==='wick')candle(x,y,true)}
function player(){const x=pl.x,y=pl.y;g.fillStyle='#2b2b55';g.fillRect(x-5,y-4,4,4);g.fillRect(x+1,y-4,4,4);
 g.fillStyle='#3a5fd0';g.fillRect(x-6,y-14,12,10);g.fillStyle='#c0392b';g.fillRect(x-6,y-10,12,3);
 g.fillStyle='#ffd27a';g.fillRect(x-6,y-26,12,12);g.fillStyle='#5a3a1a';g.fillRect(x-7,y-28,14,6);g.fillStyle='#000';g.fillRect(x-3,y-20,2,2);g.fillRect(x+1,y-20,2,2)}
const roomImages={};
function drawWorld(){
 const r=R[rm],f=r.f;
 setGameMusic(r.soundData||'',.3);
 g.fillStyle='#000';g.fillRect(0,0,640,480);
 if(typeof camBegin==='function')camBegin(r);
 try{drawRoomScene(r)}catch(e){g.fillStyle=r.bg;g.fillRect(f[0],f[1],f[2],f[3]);g.strokeStyle='#6b5a8a';g.lineWidth=4;g.strokeRect(f[0]-2,f[1]-2,f[2]+4,f[3]+4);for(const c of r.c||[]){g.fillStyle='rgba(10,9,16,.82)';g.fillRect(c.x,c.y,c.w,c.h)}for(const d of r.d)if(d.to>=0||beaten){g.fillStyle='rgba(255,210,122,.22)';g.fillRect(d.x,d.y,d.w,d.h)}g.fillStyle='#f55';g.font='9px monospace';g.fillText('look.js: '+String(e&&e.message||e),8,462)}
 const L=r.o.map(o=>({y:o.y,d:()=>obj(o)}));L.push({y:pl.y,d:player});L.sort((a,b)=>a.y-b.y).forEach(e=>e.d());
 if(typeof camEnd==='function')camEnd(r);
 tx(r.n,20,16,'#777',10);tx('LV '+playerLevel+'  HP '+hp+'/'+mhp+'   BUNS '+buns,340,16,'#aaa',9);
 if(st==='wtext'){g.fillStyle='#000';g.fillRect(40,336,560,128);g.strokeStyle='#fff';g.lineWidth=5;g.strokeRect(38,334,564,132);
  const layout=worldTextLayouts[wi]||fitDialogueText(wl[wi]);let remaining=shown;layout.lines.forEach((line,i)=>{const visible=Math.max(0,Math.min(line.length,remaining));tx(line.slice(0,visible),62,354+i*27,'#fff',layout.size);remaining-=line.length})}
 if(st==='dchoice'){g.fillStyle='#000';g.fillRect(40,326,560,140);g.strokeStyle='#fff';g.lineWidth=5;g.strokeRect(38,324,564,144);const options=conversationNpc?.options||[],step=Math.min(26,Math.floor(76/Math.max(1,options.length-1)));tx(conversationNpc?.name||'Choose',60,338,'#ffe28a',11);options.forEach((o,i)=>{const y=358+i*step;tx((i===choiceIndex?'> ':'  ')+o.label,66,y,i===choiceIndex?'#ff0':'#fff',11)});tx('Arrows select · Z choose · X back',62,438,'#888',9)}
 if(st==='checkpoint'){g.fillStyle='#000';g.fillRect(40,326,560,140);g.strokeStyle='#fff';g.lineWidth=5;g.strokeRect(38,324,564,144);const note=fitDialogueText('* The thought of the rat coming for the cheese soon fills you with determination.');note.lines.forEach((line,i)=>tx(line,60,342+i*23,'#fff',note.size));tx((checkpointChoice===0?'> ':'  ')+'SAVE',92,402,checkpointChoice===0?'#ff0':'#fff',12);tx((checkpointChoice===1?'> ':'  ')+'RETURN',260,402,checkpointChoice===1?'#ff0':'#fff',12);tx('Arrows select · Z confirm',62,438,'#888',9)}
 if(st==='shop'&&activeShop){g.fillStyle='#000';g.fillRect(40,316,560,152);g.strokeStyle='#fff';g.lineWidth=5;g.strokeRect(38,314,564,156);tx(activeShop.name,60,326,'#ffe28a',12);tx('BUNS '+buns,450,326,'#ffd27a',11);activeShop.items.forEach((item,i)=>tx((i===shopIndex?'> ':'  ')+item.name+'  - '+item.price+' BUNS',62,353+i*27,i===shopIndex?'#ff0':'#fff',10));const exit=activeShop.items.length;tx((shopIndex===exit?'> ':'  ')+'Leave shop',62,353+exit*27,shopIndex===exit?'#ff0':'#fff',10);tx('Arrows select · Z buy · X back',62,438,'#888',9)}
 if(st==='pauseMenu'){g.fillStyle='rgba(0,0,0,.96)';g.fillRect(0,0,640,480);g.strokeStyle='#fff';g.lineWidth=4;g.strokeRect(24,30,592,420);tx(menuMode==='main'?'WICK MENU':menuMode==='items'?'ITEMS':menuMode==='shops'?'SHOPS':'STATUS',52,48,'#fff',18);
  if(menuMode==='main'){pauseChoices.forEach((label,i)=>tx((i===menuIndex?'> ':'  ')+label,64,102+i*40,i===menuIndex?'#ff0':'#fff',14));tx('WICK',350,105,'#fff',14);tx('LV '+playerLevel,350,140,'#fff',12);tx('EXP '+experience+' / '+(playerLevel>=20?'MAX':experienceForLevel(playerLevel)),350,160,'#aaa',9);tx('HP',350,184,'#fff',12);g.fillStyle='#600';g.fillRect(395,181,150,16);g.fillStyle='#ff0';g.fillRect(395,181,150*Math.max(0,hp/mhp),16);tx(hp+' / '+mhp,395,207,'#fff',10);tx('BUNS  '+buns,350,246,'#ffd27a',12);tx('ROOM  '+R[rm].n,350,280,'#aaa',10);tx('ITEMS  '+inventory.length+' / 8',350,310,'#aaa',10);tx('Arrows select · Z open · Esc close',52,412,'#888',10)}
  else if(menuMode==='items'){const entries=inventoryEntries(),loot=materialEntries(),items=[...entries.map(([id,count])=>({label:(itemById(id)?.name||id)+(count>1?'  x'+count:''),kind:'item'})),...loot.map(([name,count])=>({label:name+'  x'+count+'  (material)',kind:'material'}))],back=items.length;if(!items.length)tx('(No items)',68,120,'#aaa',12);const start=Math.max(0,Math.min(menuIndex-4,items.length-6));items.slice(start,start+6).forEach((item,i)=>{const index=start+i;tx((index===menuIndex?'> ':'  ')+item.label,68,105+i*34,index===menuIndex?'#ff0':item.kind==='material'?'#aaa':'#fff',9)});if(items.length>6)tx((start+1)+'–'+Math.min(start+6,items.length)+' / '+items.length,430,340,'#888',9);tx((menuIndex===back?'> ':'  ')+'Back',68,374,menuIndex===back?'#ff0':'#aaa',12);tx('Z use / view · X return',52,412,'#888',10)}
  else if(menuMode==='shops'){SHOPS.forEach((shop,i)=>tx((i===menuIndex?'> ':'  ')+shop.name,68,105+i*38,i===menuIndex?'#ff0':'#fff',12));const back=SHOPS.length;tx((menuIndex===back?'> ':'  ')+'Back',68,105+back*38,menuIndex===back?'#ff0':'#aaa',12);tx('Choose a shop · Z enter',52,412,'#888',10)}
  else {tx('LV  '+playerLevel+'     EXP  '+experience+' / '+(playerLevel>=20?'MAX':experienceForLevel(playerLevel)),68,112,'#fff',12);tx('HP  '+hp+' / '+mhp,68,150,'#fff',12);tx('BUNS  '+buns,68,188,'#ffd27a',12);tx('ITEMS  '+inventory.length+' / 8',68,226,'#fff',12);tx(menuNotice||'Progress is saved at the current position.',68,286,'#aaa',10);tx('X return',52,412,'#888',10)}}
 if(st==='enc'){if(et<30&&fr%8<4){g.fillStyle='#fff';const cx=window.CAM?CAM.x:0,cy=window.CAM?CAM.y:0;g.fillRect(pl.x-2-cx,pl.y-52-cy,4,12);g.fillRect(pl.x-2-cx,pl.y-36-cy,4,4)}
  if(et>=30){heart(pl.x-(window.CAM?CAM.x:0),pl.y-14-(window.CAM?CAM.y:0))}
  g.fillStyle='rgba(0,0,0,'+Math.min(1,Math.max(0,(et-25)/35))+')';g.fillRect(0,0,640,480)}
 if(st==='fin'){g.fillStyle='#000';g.fillRect(0,0,640,480);tx('THE END?',220,150,'#ff7a00',24);
  (spared?["You and WICK light the way","out of the dark, together."]:["The dark feels a little","heavier than before."]).forEach((l,i)=>tx(l,100,230+i*30,'#fff',15));
  tx('To be continued.',210,330,'#888',12);tx('Press Z to play again',190,400,'#ff0',12)}}
