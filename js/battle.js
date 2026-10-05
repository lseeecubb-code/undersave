
const cv=document.getElementById('c'),g=cv.getContext('2d');
const K={},P={};let au=null;
addEventListener('keydown',e=>{let k=e.key.toLowerCase();if(k==='enter')k='z';if(!K[k])P[k]=1;K[k]=1;
  if(!au){try{au=new AudioContext()}catch(_){}}
  if(['arrowup','arrowdown','arrowleft','arrowright',' ','escape'].includes(k))e.preventDefault()});
addEventListener('keyup',e=>{let k=e.key.toLowerCase();if(k==='enter')k='z';K[k]=0});
const down=(...a)=>a.some(k=>K[k]), hit=(...a)=>a.some(k=>P[k]);
function blip(f,d,v=.04,type='square'){if(!au)return;const o=au.createOscillator(),a=au.createGain();o.type=type;o.frequency.value=f;a.gain.value=v;
  o.connect(a);a.connect(au.destination);o.start();a.gain.exponentialRampToValueAtTime(.0001,au.currentTime+d);o.stop(au.currentTime+d)}

const TB={x:40,y:250,w:560,h:140},DB={x:190,y:215,w:260,h:180};
let box={...TB},st,hp,mhp=20,ehp,emax=60,turn,buns,graze,inv,mercy,acted,menu,sub,sel,text,shown,after,B,t,dur,atk,shake,flash,heal,hx,hy,fr=0;
let playerLevel=1,experience=0;
let rm,pl,beaten,spared,taken,wl,wi,wcb,et,resp,activeEnemy,defeated={},dialogueFont=16,bossPhaseTwo=false;
const heartMap=["0110110","1111111","1111111","0111110","0011100","0001000"];
const acts=['Check','Talk','Praise','Hum'];
const flavor=["* WICK flickers nervously.","* The candle smell gets stronger.","* WICK is trying to look big.","* Wax drips onto the floor.","* WICK's flame leans toward you."];

function newGame(fresh=false){playerLevel=1;experience=0;mhp=20;hp=mhp;buns=2;inventory=[];materials={};beaten=0;defeated={};spared=0;taken={};encounterDistance={};pendingEnemyId=null;roamingEncounter=false;st='world';rm=0;pl={x:320,y:280};resp={rm:0,x:320,y:280};
  if(fresh){try{localStorage.removeItem('wick-save-slot')}catch(_){}}
  else if(!window.wickStarted){try{const save=JSON.parse(localStorage.getItem('wick-save-slot')||'null');if(save){const room=R.findIndex(r=>r.id===save.roomId);if(room>=0){rm=room;pl={x:save.x,y:save.y};hp=save.hp;mhp=save.mhp;playerLevel=save.playerLevel;experience=save.experience;buns=save.buns;inventory=save.inventory||[];materials=save.materials||{};defeated=save.defeated||{};taken=save.taken||{};resp=save.resp||resp;const resumed=true;wsay(["* Your journey continues.","* (Press Escape to open the menu.)"]);return}}}catch(_){}}
  window.wickStarted=true;if(!window.wickStarted||!resumed)wsay(["* You wake in a quiet hall.","* The air smells like melted wax.","* (Arrows to move, Z to interact)"])}
function startBattle(){activeEnemy=ENEMIES.find(e=>e.id===(pendingEnemyId||R[rm].enemyId||'wick'))||ENEMIES[0];if(window.ensureEnemySprite)window.ensureEnemySprite(activeEnemy);setGameMusic(activeEnemy.audio,.25);ehp=emax=Math.max(1,+activeEnemy.hp||60);bossPhaseTwo=false;turn=0;acted=new Set();mercy=0;B=[];st='text';graze=0;
  const openers=activeEnemy.repoDialogue?.attack;const opener=openers?.length?openers[Math.floor(Math.random()*openers.length)]:activeEnemy.name+' blocks your way.';say('* '+opener,toMenu)}
function say(s,n){const layout=fitDialogueText(s);text=layout.lines.join('\n');dialogueFont=layout.size;shown=0;after=n;st='text'}
function sayPages(pages,done){let index=0;const next=()=>{if(index>=pages.length){if(done)done();return}say(pages[index++],next)};next()}
function toMenu(){st='menu';sub=null}
function startDodge(){st='dodge';t=0;turn_dur();B=[];hx=DB.x+DB.w/2;hy=DB.y+DB.h-30;inv=0}
function turn_dur(){dur=480+Math.min(turn,3)*80}
function endDodge(){B=[];turn++;
  const lines=activeEnemy.repoDialogue?.attack,moves=bossPhaseTwo?activeEnemy.phasePatternIds:activeEnemy.repoPatternIds,pattern=moves?.length?ATTACK_PATTERNS.find(p=>p.id===moves[(turn-1)%moves.length]):null,move=pattern?.name||'';const enemyLine=lines?.length?lines[Math.floor(Math.random()*lines.length)]:"* "+activeEnemy.name+" "+{ring:'spins.',fan:'strikes.',spiral:'spirals.',rain:'falls.',flower:'blooms.',tongue:'lashes.',seed:'sprays.',burrow:'digs.',ember:'burns.',feather:'flies.',bone:'strikes.',void:'fires.',star:'shines.',vine:'lashes.',wax:'melts.',web:'tangles.',burst:'explodes.',wave:'surges.',crossfire:'barrage.',aimed:'shoots.',lunge:'charges.',orbit:'orbits.',pincer:'clamps.',scatter:'scatters.',sweep:'sweeps.',flies:'buzzes.',chomp:'chomps.',waxfall:'drips.',waxsplash:'splashes.',wisp:'flickers.'}[pattern?.type||'acts']+'';
  say(mercy>=3?"* "+activeEnemy.name+" seems calmer.\n* You can SPARE it.":enemyLine,toMenu)}
function ratio(){return acted.size}
function experienceForLevel(level){return level*20}
function gainExperience(amount){amount=Math.max(0,Math.floor(amount||0));if(!amount)return{amount:0,levels:0};const old=playerLevel;experience+=amount;while(playerLevel<20&&experience>=experienceForLevel(playerLevel))playerLevel++;return{amount,levels:playerLevel-old}}
function win(spare){spared=spare;st='end';if(spare){sayPages(["* You spared "+activeEnemy.name+".","* EXP 0 · BUNS 0.","* Drops: none."],leave);return}const level=Math.max(1,+activeEnemy.level||1),earned=Math.round(emax/6+level*2),gain=gainExperience(earned);buns+=activeEnemy.bunsReward||0;if(activeEnemy.drops){for(const [item,spec] of Object.entries(activeEnemy.drops)){if(Math.random()*100<(spec.chance||0)){for(let i=0;i<Math.floor(Math.random()*(spec.max_drop-spec.min_drop+1))+spec.min_drop;i++)inventory.push(item)}}}const lines=["* You defeated "+activeEnemy.name+".","* EXP +"+earned+(gain.levels?" · LEVEL UP!":"")+" · BUNS +"+activeEnemy.bunsReward];if(Object.keys(activeEnemy.drops||{}).length)lines.push("* Obtained: "+Object.keys(activeEnemy.drops).join(", "));sayPages(lines,leave)}
function runAway(){const room=R[rm],bossEncounter=!roamingEncounter&&(room.enemyId===activeEnemy.id||(room.triggers||[]).some(t=>t.k==='enemy'&&t.enemyId===activeEnemy.id));if(bossEncounter){say("* This enemy blocks your way.\n* You can't escape."),toMenu;return}if(Math.random()<.4){B=[];say("* You ran away!",leave)}else say("* Couldn't escape!",startDodge)}

function spawn(patternIndex,k){const p=ATTACK_PATTERNS[((patternIndex%ATTACK_PATTERNS.length)+ATTACK_PATTERNS.length)%ATTACK_PATTERNS.length];const ex=320,ey=125;const addFrom=(x,y,a,s,c=0,r=4,shape=p.bulletStyle||'orb')=>{const vx=Math.cos(a)*s,vy=Math.sin(a)*s;B.push({x,y,vx,vy,r,c,shape,gz:0})};const n=+p.count||12,fan=+p.fan||3,speed=+p.speed||2.2,aim=Math.atan2(hy-ey,hx-ex),interval=+p.interval||40,spread=+p.spread||.2,add=(a,s,c=0,r=4)=>addFrom(ex,ey,a,s,c,r);
  if(p.type==='ring'&&k%Math.max(1,+p.interval||60)===0){const o=k*.013;for(let i=0;i<n;i++)add(o+i/n*6.283,speed,0)}
  if(p.type==='fan'&&k%interval===0){for(let i=0;i<fan;i++)add(aim+(i-(fan-1)/2)*spread,speed,1,3.5)}
  if(p.type==='spiral'&&k%Math.max(1,+p.interval||5)===0){const a=k*(+p.rotation||.075);add(a,speed,2);add(a+3.1416,speed,2)}
  if(p.type==='rain'&&k%Math.max(1,+p.interval||8)===0)B.push({x:DB.x+8+Math.random()*(DB.w-16),y:DB.y-10,vx:0,vy:speed+Math.random()*.5,r:4,c:0,gz:0});
  if(p.type==='flower'){if(k%Math.max(1,+p.interval||4)===0)add(-k*(+p.rotation||.11),speed,2);if(k%Math.max(1,+p.ringEvery||65)===0)for(let i=0;i<n;i++)add(k*.02+i/n*6.283,+p.ringSpeed||1.7,0,3.5)}
  if(p.type==='aimed'&&k%interval===0)for(let i=0;i<fan;i++)add(aim+(i-(fan-1)/2)*spread,speed+0.55,1,3.5);
  if(p.type==='web'&&k%interval===0){const phase=(p.seed||0)*.01+k*.007;for(let i=0;i<n;i++)if(i%4!==0)add(phase+i/n*6.283,speed*.8,2,3.5);for(let i=-1;i<=1;i++)add(aim+i*spread,speed+0.35,1,3.5)}
  if(p.type==='burst'&&k%interval===0){const phase=(p.seed||0)*.01+k*.01;for(let i=0;i<n;i++)add(phase+i/n*6.283,speed*(i%2?.78:1),i%2?0:2,3.5);for(let i=0;i<fan;i++)add(aim+(i-(fan-1)/2)*spread,speed,1,3.5)}
  if(p.type==='wave'&&k%interval===0){const rowCount=Math.min(9,fan+2),gap=DB.h/(rowCount+1),side=(Math.floor(k/interval)%2)?1:-1;for(let i=1;i<=rowCount;i++){const y=DB.y+gap*i;addFrom(side<0?DB.x-5:DB.x+DB.w+5,y,side<0?0:Math.PI,speed,0,4)}}
  if(p.type==='crossfire'&&k%interval===0){const rowCount=Math.min(7,fan+1),side=Math.floor(k/interval)%2?1:-1;for(let i=0;i<rowCount;i++){const y=DB.y+12+i*((DB.h-24)/Math.max(1,rowCount-1)),x=side<0?DB.x-5:DB.x+DB.w+5;addFrom(x,y,side<0?0:Math.PI,speed,0,4)}}
  if(p.type==='lunge'&&k%interval===0){const sweep=((Math.floor(k/interval)%3)-1)*spread;for(let i=0;i<fan;i++)add(aim+sweep+(i-(fan-1)/2)*spread*.65,speed+0.5,i%2,3.5);if(Math.floor(k/interval)%2===1)for(let i=0;i<fan;i++)add(aim+sweep-(i-(fan-1)/2)*spread*.65,speed+0.3,1,3.5)}
  if(p.type==='orbit'&&k%Math.max(2,Math.floor(interval/4))===0){const phase=(p.seed||0)*.01+k*(+p.rotation||.08),orbitCount=Math.max(2,Math.min(5,fan));for(let i=0;i<orbitCount;i++)add(phase+i*6.283/orbitCount,speed,0,3.5)}
  if(p.type==='pincer'&&k%interval===0){const rows=Math.max(3,Math.min(7,fan)),gap=DB.h/(rows+1);for(let i=1;i<=rows;i++){const y=DB.y+i*gap;addFrom(DB.x-8,y,Math.atan2(hy-y,DB.x+DB.w*.68-(DB.x-8)),speed,0,4);addFrom(DB.x+DB.w+8,y,Math.atan2(hy-y,DB.x+DB.w*.32-(DB.x+DB.w+8)),speed,1,4)}}
  if(p.type==='scatter'&&k%interval===0){const phase=(p.seed||0)*.01+k*.013;for(let i=0;i<n;i++){const a=phase+i*2.39996;add(a,speed*(.65+(i%4)*.12),i%3,3.5)}for(let i=0;i<fan;i++)add(aim+(i-(fan-1)/2)*spread,speed,1,3.5)}
  if(p.type==='sweep'&&k%interval===0){const direction=(Math.floor(k/interval)%2)?1:-1,rows=Math.min(9,fan+3),gap=DB.h/(rows+1),angle=aim+direction*spread;for(let i=1;i<=rows;i++){const y=DB.y+gap*i;addFrom(angle>0?DB.x-5:DB.x+DB.w+5,y,angle,speed,0,4)}}
  if(p.type==='flies'&&k%interval===0){for(let i=0;i<fan;i++){const x=DB.x+DB.w*(i+1)/(fan+1),y=DB.y-7-(i%2)*14,angle=Math.atan2(hy-y,hx-x)+(i-(fan-1)/2)*spread;addFrom(x,y,angle,speed*(.82+(i%2)*.18),1,3)}}
  if(p.type==='tongue'&&k%interval===0){const count=Math.max(4,Math.min(8,fan*2)),angle=aim;for(let i=0;i<count;i++)addFrom(ex-Math.cos(angle)*i*9,ey-Math.sin(angle)*i*9,angle,speed+.25,2,6,'tongue')}
  if(p.type==='chomp'&&k%interval===0){const teeth=Math.max(5,Math.min(9,fan+4)),gap=DB.w/(teeth+1),safe=Math.floor(teeth/2)+(Math.floor(k/interval)%2?1:0);for(let i=1;i<=teeth;i++)if(i!==safe){const x=DB.x+gap*i,y=DB.y+10+Math.sin(k*.02+i)*(DB.h-20);addFrom(x,y,Math.PI/2,speed,0,4,'tooth')}}
  if(p.type==='seedfall'&&k%interval===0){const spreadX=Math.max(32,DB.w*.42);for(let i=0;i<fan;i++){const x=Math.max(DB.x+8,Math.min(DB.x+DB.w-8,hx+(i-(fan-1)/2)*spreadX/fan));addFrom(x+(i%2?12:-12),DB.y-10,Math.PI/2,speed,0,4,'seed')}}
  if(p.type==='burrow'&&k%interval===0){const count=Math.max(3,Math.min(7,fan+2));for(let i=0;i<count;i++){const x=Math.max(DB.x+10,Math.min(DB.x+DB.w-10,hx+(i-(count-1)/2)*24));addFrom(x,DB.y+DB.h+10,-Math.PI/2,speed,0,4,'tooth')}}
  if(p.type==='ember'&&k%interval===0){const sweep=(Math.floor(k/interval)%2?1:-1)*spread;for(let i=0;i<fan;i++)add(aim+sweep+(i-(fan-1)/2)*spread*.7,speed+.2,0,5,'flame');if(Math.floor(k/interval)%3===0)for(let i=0;i<fan;i++)add(aim-sweep+(i-(fan-1)/2)*spread*.5,speed+.1,1,4)}
  if(p.type==='feather'&&k%interval===0){for(let i=0;i<fan+1;i++){const x=DB.x+DB.w*(i+1)/(fan+2),angle=Math.atan2(hy-(DB.y-8),hx-x)+(i-(fan/2))*.12;addFrom(x,DB.y-8,angle,speed,1,4.5,'feather')}}
  if(p.type==='waxfall'&&k%interval===0){const drops=Math.max(1,Math.min(3,+p.count||2));for(let i=0;i<drops;i++){const x=Math.max(DB.x+14,Math.min(DB.x+DB.w-14,hx+(i-(drops-1)/2)*54+(Math.floor(k/interval)%2?30:-30)));addFrom(x,DB.y-10,Math.PI/2,speed,0,5,'wax')}}
  if(p.type==='waxsplash'&&k%interval===0){const x=Math.max(DB.x+20,Math.min(DB.x+DB.w-20,hx+(Math.floor(k/interval)%2?50:-50)));B.push({x,y:DB.y-10,vx:0,vy:0,dropVY:speed,delay:28,r:11,c:2,gz:0,shape:'wax'})}
  if(p.aimEvery&&k%p.aimEvery===(p.aimAt||0))for(let i=0;i<fan;i++)add(aim+(i-(fan-1)/2)*spread,+p.aimSpeed||3,1,3.5)}
function update(){
  if(document.getElementById('devtools')?.classList.contains('visible')){for(const k in K)K[k]=0;for(const k in P)P[k]=0;return}
  fr++;if(inWorld()){updWorld();for(const k in P)P[k]=0;return}if(shake>0)shake--;if(flash>0)flash--;
  if(st==='text'){shown=Math.min(text.length,shown+.8);
   if(fr%3===0&&shown<text.length)blip(520,.03,.015);
   if(hit('z')){if(shown<text.length)shown=text.length;else after&&after()}}
  else if(st==='menu'){
   if(hit('arrowleft','a'))menu=(menu+3)%4;if(hit('arrowright','d'))menu=(menu+1)%4;
   if(hit('arrowleft','a','arrowright','d'))blip(300,.05);
   if(hit('z')){blip(600,.08);
    if(menu===0){st='atk';atk={x:0}}
    else{sub=menu;sel=0;st='sub'}}}
  else if(st==='sub'){
   const n=sub===1?acts.length:sub===2?1:sub===3?2:1;
   if(hit('arrowup','w'))sel=(sel+n-1)%n;if(hit('arrowdown','s'))sel=(sel+1)%n;
   if(hit('x'))st='menu';
   if(hit('z'))choose()}
  else if(st==='atk'){atk.x+=.011;
   if(hit('z')||atk.x>=1){const acc=atk.x>=1?0:1-Math.abs(atk.x-.5)*2;
    if(acc<.05){say("* You missed.",startDodge)}
    else{const d=Math.round(acc*18)+3+Math.min(12,Math.floor((playerLevel-1)*.65));ehp-=d;flash=20;blip(120,.2,.08,'sawtooth');
     if(ehp<=0){ehp=0;win(false)}else if(!bossPhaseTwo&&activeEnemy.phaseTwo&&ehp<=emax*.5){bossPhaseTwo=true;const phase=activeEnemy.phaseTwo;emax=Math.max(1,+phase.hp||emax);ehp=emax;const phaseAttack=(phase.repoDialogue?.attack||flavor)[Math.floor(Math.random()*(phase.repoDialogue?.attack||flavor).length)];say("* "+activeEnemy.name+" changes form!\n* "+phaseAttack,toMenu)}else say("* Hit! Damage: "+d,startDodge)}}}
  else if(st==='dodge'){t++;
   const sp=down('shift')?1.2:2.8;
   let dx=(down('arrowright','d')?1:0)-(down('arrowleft','a')?1:0),dy=(down('arrowdown','s')?1:0)-(down('arrowup','w')?1:0);
   if(dx&&dy){dx*=.707;dy*=.707}
   hx=Math.max(box.x+8,Math.min(box.x+box.w-8,hx+dx*sp));hy=Math.max(box.y+8,Math.min(box.y+box.h-8,hy+dy*sp));
   spawn(pat(),t);if(turn>=4&&!debugBattleSnapshot?.testPattern)spawn((pat()+1)%ATTACK_PATTERNS.length,t+7);
   if(inv>0)inv--;
   for(const b of B){b.x+=b.vx;b.y+=b.vy;
    const d=Math.hypot(b.x-hx,b.y-hy);
    if(d<b.r+2.5&&inv===0){hp-=4;inv=70;shake=10;blip(90,.25,.08,'sawtooth');b.dead=1;B.forEach(o=>{if(Math.hypot(o.x-hx,o.y-hy)<40)o.dead=1})}
    else if(d<b.r+13&&!b.gz){b.gz=1;graze++;blip(1300,.03,.02,'triangle');
     if(graze%25===0&&hp<mhp){hp++;heal=30}}}
   B=B.filter(b=>!b.dead&&b.x>-20&&b.x<660&&b.y>-20&&b.y<500);
   if(hp<=0){hp=0;st='end';B=[];say("* You fell in the dark...\n* But the wick hasn't burned out.",respawn)}
   else if(t>=dur)endDodge()}
  if(heal>0)heal--;
  const tgt=st==='dodge'?DB:TB;for(const k of['x','y','w','h'])box[k]+=(tgt[k]-box[k])*.2;
  for(const k in P)P[k]=0}
function pat(){if(debugBattleSnapshot?.testPattern){const testIndex=ATTACK_PATTERNS.findIndex(p=>p.id===debugBattleSnapshot.testPattern);if(testIndex>=0)return testIndex}const moves=bossPhaseTwo?activeEnemy.phasePatternIds:activeEnemy.repoPatternIds,index=moves?.length?(turn-1)%moves.length:0;return ATTACK_PATTERNS.findIndex(p=>p.id===(moves?.[index]||activeEnemy.pattern))}
function choose(){
  if(sub===1){const a=acts[sel];
   if(a==='Check'){const moves=bossPhaseTwo?activeEnemy?.phasePatternIds:activeEnemy?.repoPatternIds,pattern=moves?.length?ATTACK_PATTERNS.find(p=>p.id===moves[turn%moves.length]):null,move=pattern?.name||activeEnemy.pattern;say("* "+activeEnemy.name+"'s next move: "+move,startDodge)}
   else{const lines={Talk:"* You reassure "+activeEnemy.name+".\n* It seems less tense.",Praise:"* You praise "+activeEnemy.name+".\n* It looks pleased.",Hum:"* You hum a quiet tune.\n* "+activeEnemy.name+" pauses to listen."};
    acted.add(a);mercy=acted.size-(acted.has('Check')?1:0);mercy=[...acted].filter(x=>x!=='Check').length;
    say(lines[a],startDodge)}}
  else if(sub===2){if(buns>0){buns--;hp=Math.min(mhp,hp+10);heal=30;say("* You ate a Cinnamon Bun.\n* HP restored.",startDodge)}else{st='menu'}}
  else if(sub===3){if(sel===1)runAway();else if(mercy>=3)win(true);else say("* "+activeEnemy.name+" isn't ready to be spared.\n* (Try ACT: Talk, Praise, Hum)",startDodge)}}

function tx(s,x,y,c='#fff',sz=16){g.fillStyle=c;g.font=sz+"px 'Press Start 2P',monospace";g.textBaseline='top';g.fillText(s,x,y)}
function heart(x,y,c='#f00'){g.fillStyle=c;heartMap.forEach((r,j)=>{for(let i=0;i<7;i++)if(r[i]==='1')g.fillRect(Math.round(x-7+i*2),Math.round(y-6+j*2),2,2)})}
function drawBullet(b){const style=b.shape||'orb',palette={orb:['#ff4fa0','#ffd0e8'],tooth:['#d6cfe0','#fff8e9'],fly:['#a6d86b','#efffa5'],tongue:['#e75b9f','#ffb8ce'],seed:['#63a64b','#d6ef83'],feather:['#d99a5f','#f5d5a8'],flame:['#ff6b35','#ffa500'],bone:['#e8e0d0','#b8b0a0'],void:['#7356ff','#a78bfa'],star:['#ffe77a','#ffef99'],wisp:['#e8a0ff','#f8c8ff'],wax:['#f4e8d0','#e8dcc0']},colors=palette[style]||palette.orb;
  g.save();g.translate(Math.round(b.x),Math.round(b.y));g.fillStyle=colors[0];g.strokeStyle=colors[1];g.lineWidth=1;
  if(style==='fly'){g.beginPath();g.ellipse(-2,-3,3,2,0,0,6.283);g.ellipse(-2,3,3,2,0,0,6.283);g.fill();g.fillStyle=colors[1];g.fillRect(-2,-1,7,2);g.fillRect(4,-2,2,4)}
  else if(style==='tongue'){g.beginPath();g.ellipse(0,0,12,4,0,0,6.283);g.fill();g.fillStyle=colors[1];g.beginPath();g.ellipse(10,0,4,4,0,0,6.283);g.fill()}
  else if(style==='tooth'){g.beginPath();g.moveTo(7,0);g.lineTo(-5,-4);g.lineTo(-3,0);g.lineTo(-5,4);g.closePath();g.fill();g.stroke()}
  else if(style==='seed'){g.beginPath();g.ellipse(0,0,4,6,0,0,6.283);g.fill();g.stroke();g.beginPath();g.moveTo(0,-4);g.lineTo(0,4);g.stroke()}
  else if(style==='feather'){g.beginPath();g.moveTo(8,0);g.quadraticCurveTo(0,-2,-7,-5);g.quadraticCurveTo(-5,0,-7,5);g.quadraticCurveTo(0,2,8,0);g.fill();g.stroke();g.beginPath();g.moveTo(-6,0);g.lineTo(0,-2);g.lineTo(0,2);g.closePath();g.fill()}
  else if(style==='flame'){g.beginPath();g.moveTo(7,0);g.quadraticCurveTo(1,-2,2,-7);g.quadraticCurveTo(-7,-1,-5,4);g.quadraticCurveTo(-2,8,4,4);g.quadraticCurveTo(2,2,7,0);g.fill();g.fillStyle=colors[1];g.beginPath();g.moveTo(3,-2);g.quadraticCurveTo(-2,-4,-1,0);g.quadraticCurveTo(-2,3,2,2);g.closePath();g.fill()}
  else if(style==='bone'){g.fillRect(-6,-2,12,4);for(const x of[-6,6]){g.beginPath();g.arc(x,0,3,0,6.283);g.fill()} }
  else if(style==='gear'){g.beginPath();for(let i=0;i<12;i++){const a=i*Math.PI/6,r=i%3===0?7:5;g.lineTo(Math.cos(a)*r,Math.sin(a)*r)}g.closePath();g.fill();g.stroke();g.fillStyle=colors[1];g.beginPath();g.arc(0,0,3,0,6.283);g.fill()}
  else if(style==='web'){g.beginPath();g.moveTo(0,-7);g.lineTo(7,0);g.lineTo(0,7);g.lineTo(-7,0);g.closePath();g.stroke();g.beginPath();g.moveTo(-5,-5);g.lineTo(5,5);g.moveTo(-5,5);g.lineTo(5,-5);g.stroke()}
  else if(style==='page'){g.beginPath();g.moveTo(-5,-6);g.lineTo(5,-4);g.lineTo(5,6);g.lineTo(-5,4);g.closePath();g.fill();g.stroke();g.beginPath();g.moveTo(-3,-1);g.lineTo(3,0);g.stroke()}
  else if(style==='wisp'){g.beginPath();g.moveTo(0,-7);g.quadraticCurveTo(8,-3,4,5);g.lineTo(0,3);g.lineTo(-4,5);g.quadraticCurveTo(-8,-3,0,-7);g.fill();g.stroke()}
  else{g.beginPath();g.arc(0,0,b.r+1,0,6.283);g.fill();g.fillStyle=colors[1];g.beginPath();g.arc(-1,-1,Math.max(1,b.r-2),0,6.283);g.fill()}
  g.restore()}
function drawEnemySprite(){if(!activeEnemy||activeEnemy.id==='wick')return false;if(window.ensureEnemySprite)window.ensureEnemySprite(activeEnemy);const art=SPRITES.find(s=>s.id===activeEnemy.spriteId);if(!art)return false;const scale=3,left=320-art.width*scale/2,top=60;for(let i=0;i<art.pixels.length;i++){if(!art.pixels[i])continue;g.fillStyle=art.pixels[i];g.fillRect(left+(i%art.width)*scale,top+Math.floor(i/art.width)*scale,scale,scale)}return true}
function drawWick(){
  if(drawEnemySprite())return;
  const w=Math.sin(fr*.05)*3,fl=flash>0&&fr%4<2;
  g.save();g.translate(320+(fl?4:0),0);
  g.fillStyle=fl?'#fff':'#e8dcc0';g.fillRect(-26,60+w,52,70);g.fillRect(-30,125+w,60,8);
  g.fillStyle='#bfae88';g.fillRect(-26,70+w,8,60);
  g.fillStyle='#000';g.fillRect(-14,84+w,8,8);g.fillRect(6,84+w,8,8);
  g.fillRect(-8,104+w,16,3);if(mercy>=3)g.fillRect(-10,102+w,3,3),g.fillRect(7,102+w,3,3);
  g.fillStyle='#444';g.fillRect(-1,50+w,3,10);
  const fh=22+Math.sin(fr*.3)*4;
  g.fillStyle='#ff7a00';g.fillRect(-8,50+w-fh,16,fh);g.fillRect(-4,50+w-fh-6,8,6);
  g.fillStyle='#ffe066';g.fillRect(-4,50+w-fh+8,8,fh-8);
  g.restore();
  const m=Math.round(ehp/emax*100);g.fillStyle='#600';g.fillRect(250,12,140,8);g.fillStyle='#0f0';g.fillRect(250,12,140*ehp/emax,8)}
function draw(){
  if(inWorld()){drawWorld();return}
  g.save();g.fillStyle='#000';g.fillRect(0,0,640,480);
  if(shake>0)g.translate((Math.random()-.5)*8,(Math.random()-.5)*8);
  drawWick();
  // box
  g.fillStyle='#000';g.fillRect(box.x,box.y,box.w,box.h);
  g.strokeStyle='#fff';g.lineWidth=5;g.strokeRect(box.x-2,box.y-2,box.w+4,box.h+4);
  // bullets
  if(st==='dodge'||B.length){g.save();g.beginPath();g.rect(0,0,640,402);g.clip();
   for(const b of B)drawBullet(b);
   g.restore()}
  if(st==='dodge'){if(!(inv>0&&fr%6<3)){heart(hx,hy);if(down('shift')){g.fillStyle='#fff';g.beginPath();g.arc(hx,hy,2.5,0,6.283);g.fill()}}}
  // box content
  if(st==='text'||st==='end'){const s=text.slice(0,shown|0).split('\n');s.forEach((l,i)=>tx(l,TB.x+22,TB.y+22+i*28,'#fff',dialogueFont))}
  if(st==='menu'){const s=text.split('\n');s.forEach((l,i)=>tx(l,TB.x+22,TB.y+22+i*28,'#fff',dialogueFont))}
  if(st==='sub'){
   const list=sub===1?acts:sub===2?(buns>0?['Cinnamon Bun x'+buns]:['(empty)']):['Spare','Run Away'];
   list.forEach((l,i)=>{tx('* '+l,TB.x+60,TB.y+22+i*30,sel===i?'#ff0':'#fff',16)});
   heart(TB.x+36,TB.y+30+sel*30)}
  if(st==='atk'){const bx=TB.x+18,by=TB.y+52,bw=TB.w-36,bh=38;g.fillStyle='#171717';g.fillRect(bx,by,bw,bh);g.fillStyle='#30251a';g.fillRect(320-22,by+2,44,bh-4);g.strokeStyle='#fff';g.lineWidth=3;g.strokeRect(bx,by,bw,bh);
   for(let i=1;i<8;i++){const x=bx+bw*i/8;g.fillStyle='rgba(255,255,255,.34)';g.fillRect(x-1,by+9,2,bh-18)}
   g.fillStyle='#ff7a00';g.fillRect(320-3,by-5,6,bh+10);const mx=bx+atk.x*bw;g.fillStyle='#fff';g.fillRect(mx-4,by-8,8,bh+16);g.beginPath();g.moveTo(mx-8,by-12);g.lineTo(mx+8,by-12);g.lineTo(mx,by-8);g.closePath();g.fill()}
  // HUD
  tx('YOU  LV '+playerLevel,40,404,'#fff',14);
  tx('HP',236,406,'#fff',10);
  g.fillStyle='#c00';g.fillRect(266,402,mhp*1.8,20);g.fillStyle=heal>0?'#8f8':'#ff0';g.fillRect(266,402,hp*1.8,20);
  tx(hp+' / '+mhp,266+mhp*1.8+12,406,'#fff',12);
  tx('GRAZE '+graze,500,408,'#4fd8ff',10);
  // buttons
  const bn=['FIGHT','ACT','ITEM','OTHER'];
  bn.forEach((n,i)=>{const x=40+i*150,on=st==='menu'&&menu===i||(st==='sub'&&sub===i)||(st==='atk'&&i===0);
   g.strokeStyle=on?'#ff0':'#ff7a00';g.lineWidth=3;g.strokeRect(x,436,125,34);
   tx(n,x+(on?36:20),446,on?'#ff0':'#ff7a00',14);
   if(on&&st==='menu')heart(x+20,453)});
  if(st==='menu')for(let i=0;i<4;i++){} 
  g.restore()}
