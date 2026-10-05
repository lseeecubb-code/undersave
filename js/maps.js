// Map and room data. Add room objects and door connections here.
const R=[
 {id:'hollow-hall',n:'HOLLOW HALL',f:[40,100,560,340],bg:'#1b1426',soundData:'audio/remastered/ambient/the-quiet-road.wav',encounters:['rat','mossling','moth','froggo'],encounterSpacing:500,encounterChance:.2,o:[
  {k:'sign',x:200,y:190,t:["* A wax-streaked sign: 'The dark is only unlit candles.'"]},
  {k:'npc',x:420,y:260,t:["* Moth: ...Oh! A visitor.","* I eat light, but it is so dim here.","* Careful in the east room. Wick is jumpy.","* It isn't mean. Just scared."]},
  {k:'save',x:140,y:320},
  {k:'chest',id:'c1',x:500,y:170,t:["* You found a Cinnamon Bun!"]}],
  d:[{x:588,y:230,w:12,h:70,to:1,targetId:'wax-corridor',px:80,py:265}]},
 {id:'wax-corridor',n:'WAX CORRIDOR',f:[40,100,560,340],bg:'#14202a',soundData:'audio/remastered/ambient/the-ashen-wilds.wav',encounters:['rat','burrow-rat','lantern-thief'],encounterSpacing:500,encounterChance:.2,c:[{x:178,y:180,w:54,h:82},{x:386,y:290,w:82,h:38}],o:[
  {k:'sign',x:300,y:250,t:["* Footprints in cold wax lead east.","* A warm light flickers to the north."]}],
  d:[{x:40,y:230,w:12,h:70,to:0,targetId:'hollow-hall',px:550,py:265},{x:588,y:230,w:12,h:70,to:2,targetId:'dark-room',px:80,py:265},{x:305,y:100,w:70,h:12,to:3,targetId:'lantern-garden',px:320,py:408}]},
 {id:'dark-room',n:'THE DARK ROOM',enemyId:'wick',f:[40,100,560,340],bg:'#0c0c14',soundData:'audio/remastered/ambient/the-starlit-archive.wav',encounters:['mossling','burrow-rat'],encounterSpacing:500,encounterChance:.2,c:[{x:245,y:115,w:32,h:72},{x:367,y:344,w:32,h:64}],o:[{k:'sign',x:135,y:180,t:['* A warm light waits beyond this room.','* The candle blocks the way east.']}],d:[{x:40,y:230,w:12,h:70,to:1,targetId:'wax-corridor',px:550,py:265},{x:588,y:230,w:12,h:70,to:-1,targetId:'$ending'}]},
 {id:'lantern-garden',n:'LANTERN GARDEN',f:[40,100,560,340],bg:'#14251f',soundData:'audio/remastered/ambient/the-quiet-road.wav',encounters:['rat','mossling','lantern-thief'],encounterSpacing:520,encounterChance:.2,
  o:[
   {k:'sign',x:140,y:225,t:["* LANTERN GARDEN","* Leave a little light for whoever comes next."]},
   {k:'npc',npcId:'firefly',x:330,y:255},
   {k:'shop',shopId:'lantern-stand',x:455,y:265},
   {k:'save',x:105,y:370},
   {k:'chest',id:'garden-bun',x:515,y:365,t:["* You found a Cinnamon Bun tucked beneath the leaves!"]}
  ],
  c:[{x:145,y:145,w:105,h:48},{x:390,y:145,w:105,h:48},{x:235,y:325,w:170,h:34}],obstacleColor:'#315343',
  d:[{x:305,y:428,w:70,h:12,to:1,targetId:'wax-corridor',px:340,py:118}]}
];


// Repository content is merged into WICK's existing game registries.
const REPO_SOURCE_CONTENT={source:"https://github.com/lseeecubb-code/b",monsters:GAME_REPO_MONSTER_DATA,items:GAME_REPO_ITEM_DATA,playerGear:GAME_REPO_GEAR_DATA,rpgSystems:GAME_REPO_STORY_DATA.rpgSystems,dialogue:GAME_REPO_STORY_DATA.dialogue,scenes:GAME_REPO_SCENE_DATA};
const REPO_SOURCE_AUDIO=GAME_REPO_AUDIO;
// Adapted campaign content from THE LAST SAVE repository.
// Kept as data so the original story, enemy and shop modules stay easy to extend.
const REPO_CAMPAIGN_CHAPTERS = [
 {title:'THE ROAD THAT SHOULD EXIST',area:'The Quiet Road',summary:'A normal journey. Almost.'},
 {title:'THE SKY HAS A CRACK',area:'The Broken Frontier',summary:'The world begins producing impossible signs.'},
 {title:'THE GODS ARE AFRAID',area:'The Cathedral of Ash',summary:'Ancient powers notice something watching from outside.'},
 {title:'THE WORLD FORGETS ITSELF',area:'The Null Expanse',summary:'Places, enemies, and even rules start to disappear.'},
 {title:'THERE IS NO BOSS HERE',area:'The Unfinished Room',summary:'The world stops pretending its boundaries are walls.'},
 {title:'THE LAST SAVE',area:'Outside the World',summary:'The Witness is only the one who watched.'},
 {title:'THE ARCHIVE OF ATTEMPTS',area:'The Archive of Attempts',summary:'Every life is filed as a record.'},
 {title:'THE HERO WHO CAME BEFORE',area:'The Hollow Kingdom',summary:'Earlier heroes still wait where their journeys ended.'},
 {title:'THE WORLD IS EDITED',area:'The Margin',summary:'Someone corrects the world one deleted word at a time.'},
 {title:'THE AUTHOR IS TIRED',area:'The Blank Page',summary:'Behind the editor, the author no longer knows how it ends.'},
 {title:'THE FINAL SAVE FILE',area:'The Last Autosave',summary:'Every road and choice waits inside the final file.'}
];

const repoChapterLines = (from,to) => REPO_CAMPAIGN_CHAPTERS.slice(from,to).map(c=>'* '+c.title+' — '+c.area+'. '+c.summary);

ATTACK_PATTERNS.push(
 {id:'moss-burst',name:'Mossling seed burst',type:'fan',interval:52,speed:1.8,fan:5,spread:.18,aimEvery:100,aimAt:55,aimSpeed:2.5},
 {id:'thief-dash',name:'Lantern thief crossfire',type:'spiral',interval:7,speed:2.5,rotation:.095,aimEvery:82,aimAt:30,fan:3,aimSpeed:3.3},
 {id:'ash-bell',name:'Ashbound bellfall',type:'rain',interval:6,speed:2.3,aimEvery:68,aimAt:28,fan:5,aimSpeed:2.8},
 {id:'index-flower',name:'Index hound blossom',type:'flower',interval:4,speed:2.2,rotation:.09,ringEvery:76,count:20,ringSpeed:1.8,aimEvery:112,aimAt:45,fan:5,aimSpeed:3.1},
 {id:'frontier-volley',name:'Frontier volley',type:'fan',interval:40,speed:2.6,fan:7,spread:.23,aimEvery:86,aimAt:48,aimSpeed:3.1},
 {id:'wyvern-dive',name:'Wyvern dive rain',type:'rain',interval:5,speed:2.8,aimEvery:70,aimAt:25,fan:5,aimSpeed:3.2},
 {id:'king-ring',name:'King’s burning crown',type:'ring',interval:44,count:24,speed:2.4,aimEvery:86,aimAt:42,fan:5,aimSpeed:3.4},
 {id:'witness-spiral',name:'Witness spiral',type:'spiral',interval:4,speed:2.4,rotation:.082,aimEvery:94,aimAt:35,fan:5,aimSpeed:3.5},
 {id:'last-page',name:'Last page bloom',type:'flower',interval:4,speed:2.35,rotation:.105,ringEvery:62,count:26,ringSpeed:1.95,aimEvery:96,aimAt:34,fan:5,aimSpeed:3.6}
);
ATTACK_PATTERNS.push(
 {id:'froggo-flies',name:'Fly snack',type:'flies',interval:34,speed:1.35,fan:3,count:4,spread:.42,bulletStyle:'fly',repoMove:{name:'Fly snack',damage:[2,3]}},
 {id:'froggo-tongue',name:'Tongue lash',type:'tongue',interval:86,speed:2.1,fan:2,count:2,spread:.14,bulletStyle:'tongue',repoMove:{name:'Tongue lash',damage:[3,4]}},
 {id:'wick-wax-fall',name:'Wick’s falling wax',type:'waxfall',interval:66,speed:3.1,count:2,fan:2,bulletStyle:'wax',repoMove:{name:'Wax drip',damage:[3,4]}},
 {id:'wick-wax-splash',name:'Wick’s hot wax splatter',type:'waxsplash',interval:104,speed:2.6,count:1,fan:1,bulletStyle:'wax',repoMove:{name:'Hot wax',damage:[4,5]}}
);
ENEMIES.push(
 {id:'rat',name:'Road Rat',hp:26,pattern:'wide-fan',natural:true,audio:'audio/remastered/enemies/rat.wav'},
 {id:'mossling',name:'Mossling',hp:34,pattern:'moss-burst',natural:true,audio:'audio/remastered/enemies/mossling.wav'},
 {id:'burrow-rat',name:'Burrow Rat',hp:30,pattern:'spiral',natural:true,audio:'audio/remastered/enemies/burrow-rat.wav'},
 {id:'lantern-thief',name:'Lantern Thief',hp:46,pattern:'thief-dash',natural:true,audio:'audio/remastered/enemies/lantern-thief.wav'},
 {id:'goblin',name:'Goblin',hp:40,pattern:'wide-fan',natural:true,audio:'audio/remastered/enemies/goblin.wav'},
 {id:'wolf',name:'Wolf',hp:48,pattern:'thief-dash',natural:true,audio:'audio/remastered/enemies/wolf.wav'},
 {id:'bandit',name:'Bandit',hp:48,pattern:'frontier-volley',natural:true,audio:'audio/remastered/enemies/bandit.wav'},
 {id:'frontier-marksman',name:'Frontier Marksman',hp:54,pattern:'frontier-volley',natural:true,audio:'audio/remastered/enemies/frontier-marksman.wav'},
 {id:'frontier-outrider',name:'Frontier Outrider',hp:62,pattern:'thief-dash',natural:true,audio:'audio/remastered/enemies/frontier-outrider.wav'},
 {id:'wyvern',name:'Wyvern',hp:76,pattern:'wyvern-dive',natural:false,audio:'audio/remastered/enemies/wyvern.wav'},
 {id:'bellbound-acolyte',name:'Bellbound Acolyte',hp:44,pattern:'ash-bell',natural:true,audio:'audio/remastered/enemies/bellbound-acolyte.wav'},
 {id:'ashbound-sentinel',name:'Ashbound Sentinel',hp:68,pattern:'ash-bell',natural:true,audio:'audio/remastered/enemies/ashbound-sentinel.wav'},
 {id:'bellbound-cantor',name:'Bellbound Cantor',hp:62,pattern:'king-ring',natural:true,audio:'audio/remastered/enemies/bellbound-cantor.wav'},
 {id:'null-leech',name:'Null Leech',hp:58,pattern:'witness-spiral',natural:true,audio:'audio/remastered/enemies/null-leech.wav'},
 {id:'glasswing-moth',name:'Glasswing Moth',hp:64,pattern:'index-flower',natural:true,audio:'audio/remastered/enemies/glasswing-moth.wav'},
 {id:'the-unnamed-king',name:'The Unnamed King',hp:92,pattern:'king-ring',natural:false,audio:'audio/remastered/enemies/the-unnamed-king.wav'},
 {id:'the-leftover',name:'The Leftover',hp:94,pattern:'witness-spiral',natural:false,audio:'audio/remastered/enemies/the-leftover.wav'},
 {id:'the-watcher',name:'The Watcher',hp:100,pattern:'frontier-volley',natural:false,audio:'audio/remastered/enemies/the-watcher.wav'},
 {id:'the-witness',name:'The Witness',hp:108,pattern:'witness-spiral',natural:false,audio:'audio/remastered/enemies/the-witness.wav'},
 {id:'archive-stalker',name:'Archive Stalker',hp:78,pattern:'moss-burst',natural:true,audio:'audio/remastered/enemies/archive-stalker.wav'},
 {id:'index-hound',name:'Index Hound',hp:82,pattern:'index-flower',natural:true,audio:'audio/remastered/enemies/index-hound.wav'},
 {id:'the-archivist',name:'The Archivist',hp:114,pattern:'ash-bell',natural:false,audio:'audio/remastered/enemies/the-archivist.wav'},
 {id:'hollow-sentinel',name:'Hollow Sentinel',hp:94,pattern:'wyvern-dive',natural:true,audio:'audio/remastered/enemies/hollow-sentinel.wav'},
 {id:'the-first-hero',name:'The First Hero',hp:112,pattern:'king-ring',natural:false,audio:'audio/remastered/enemies/the-first-hero.wav'},
 {id:'margin-warden',name:'Margin Warden',hp:102,pattern:'index-flower',natural:true,audio:'audio/remastered/enemies/margin-warden.wav'},
 {id:'the-editor',name:'The Editor',hp:118,pattern:'last-page',natural:false,audio:'audio/remastered/enemies/the-editor.wav'},
 {id:'the-author',name:'The Author',hp:124,pattern:'witness-spiral',natural:false,audio:'audio/remastered/enemies/the-author.wav'},
 {id:'the-last-save',name:'The Last Save',hp:140,pattern:'last-page',natural:false,audio:'audio/remastered/enemies/the-last-save.wav'}
);
ENEMIES.push({id:'froggo',name:'Froggo',hp:28,level:1,natural:true,pattern:'froggo-flies',repoPatternIds:['froggo-flies','froggo-tongue'],phasePatternIds:[],bunsReward:1,
 attacks:[{name:'Fly snack',patternId:'froggo-flies',damage:[2,3]},{name:'Tongue lash',patternId:'froggo-tongue',damage:[3,4]}],
 drops:{'Frog Leg':{chance:100,min_drop:1,max_drop:1},'Pondweed':{chance:40,min_drop:1,max_drop:2}},
 repoDialogue:{attack:['Froggo hops up and watches you.'],attacks:{'Fly snack':['Froggo calls a few flies over.'],'Tongue lash':['Froggo flicks out its tongue.']}}});
const importedMoth=ENEMIES.find(e=>e.id==='moth');if(importedMoth&&!importedMoth.audio)importedMoth.audio='audio/remastered/enemies/glasswing-moth.wav';

NPCS.push({id:'mira',name:'Mira',spriteId:'moth',dialogue:[
 '* Mira walks beside you, writing in her journal.',
 '* “Did you hear that?”',
 '* There is no sound. “Exactly.”'
],options:[
 {label:'The first roads',lines:[
  '* The road is quiet. A page in my journal describes a crack in tomorrow’s sky.',
  ...repoChapterLines(0,3)
 ]},
 {label:'Places that vanish',lines:[
  '* The Null Expanse forgets mountains. The Unfinished Room was never meant to be playable.',
  ...repoChapterLines(3,6)
 ]},
 {label:'Lives in the archive',lines:[
  '* Every journal has your handwriting. Every helmet faces the road.',
  ...repoChapterLines(6,8)
 ]},
 {label:'The last pages',lines:[
  '* The Margin loses words. The Blank Page waits. The final save holds every choice.',
  ...repoChapterLines(8,11)
 ]},
 {label:'The endings',lines:[
  '* Remember what happened, release it, or rewrite the page.',
  '* After the ending, the names left outside the story can still be carried forward.'
 ]}
]});

SHOPS.push({id:'archive-supplies',name:'Mira’s Roadside Pack',welcome:[
 '* Mira: I packed a few things for the road.',
 '* Take what you need. The quiet gets colder ahead.'
],items:[
 {id:'trail-bread',name:'Trail Bread · restore 12 HP',price:3,effect:'heal',amount:12},
 {id:'star-glass',name:'Star Glass · restore all HP',price:5,effect:'full-heal'},
 {id:'archive-tonic',name:'Archive Tonic · restore 18 HP',price:4,effect:'heal',amount:18}
]});

const REPO_REGION_ROOMS=[
 {id:'quiet-road',n:'THE QUIET ROAD',bg:'#20281d',obstacleColor:'#526046',sound:'the-quiet-road.wav',encounters:['rat','mossling','burrow-rat','froggo','lantern-thief','goblin','wolf'],boss:'goblin',sign:'* WAYREST ROAD\n* Follow the open path east. A save point is near the western door.',c:[{x:172,y:116,w:76,h:82},{x:316,y:318,w:110,h:58},{x:470,y:142,w:58,h:74}]},
 {id:'broken-frontier',n:'THE BROKEN FRONTIER',bg:'#30231f',obstacleColor:'#665044',sound:'the-ashen-wilds.wav',encounters:['bandit','frontier-marksman','frontier-outrider'],boss:'wyvern',sign:'* THE BROKEN FRONTIER\n* Cross between the fallen stones. Keep heading east.',c:[{x:150,y:112,w:104,h:52},{x:296,y:318,w:116,h:54},{x:446,y:126,w:94,h:56}]},
 {id:'cathedral-ash',n:'CATHEDRAL OF ASH',bg:'#25202b',obstacleColor:'#554757',sound:'the-ruined-sanctuary.wav',encounters:['bellbound-acolyte','ashbound-sentinel','bellbound-cantor'],boss:'the-unnamed-king',sign:'* CATHEDRAL OF ASH\n* The central aisle leads to the bell and the eastern door.',c:[{x:170,y:132,w:34,h:90},{x:280,y:300,w:34,h:90},{x:390,y:132,w:34,h:90},{x:500,y:300,w:34,h:90}]},
 {id:'null-expanse',n:'THE NULL EXPANSE',bg:'#161821',obstacleColor:'#383a48',sound:'the-starlit-archive.wav',encounters:['null-leech','glasswing-moth'],boss:'the-leftover',sign:'* THE NULL EXPANSE\n* The fragments leave one clear path through the dark.',c:[{x:145,y:128,w:86,h:42},{x:272,y:322,w:88,h:42},{x:402,y:134,w:94,h:42}]},
 {id:'unfinished-room',n:'THE UNFINISHED ROOM',bg:'#292a2c',obstacleColor:'#55565a',sound:'the-starlit-archive.wav',encounters:['archive-stalker','null-leech'],boss:'the-watcher',sign:'* THE UNFINISHED ROOM\n* The missing walls are not doors. Continue east.',c:[{x:120,y:122,w:118,h:26},{x:238,y:122,w:26,h:78},{x:382,y:332,w:122,h:26},{x:356,y:278,w:26,h:80}]},
 {id:'outside-world',n:'OUTSIDE THE WORLD',bg:'#101015',obstacleColor:'#33323a',sound:'the-starlit-archive.wav',encounters:['glasswing-moth','archive-stalker'],boss:'the-witness',sign:'* OUTSIDE THE WORLD\n* There is no sky here. The only road is east.',c:[{x:180,y:136,w:64,h:28},{x:386,y:316,w:72,h:26}]},
 {id:'last-save-archive',n:'ARCHIVE OF ATTEMPTS',bg:'#201b28',obstacleColor:'#574b62',sound:'the-starlit-archive.wav',encounters:['archive-stalker','index-hound'],boss:'the-archivist',sign:'* ARCHIVE OF ATTEMPTS\n* Follow the gaps between the shelves.',c:[{x:172,y:128,w:34,h:226},{x:290,y:100,w:34,h:206},{x:408,y:166,w:34,h:210}]},
 {id:'hollow-kingdom',n:'THE HOLLOW KINGDOM',bg:'#25232a',obstacleColor:'#514d56',sound:'the-ashen-wilds.wav',encounters:['hollow-sentinel','archive-stalker'],boss:'the-first-hero',sign:'* THE HOLLOW KINGDOM\n* Pass between the old pillars. The throne is east.',c:[{x:158,y:124,w:42,h:76},{x:260,y:300,w:42,h:76},{x:366,y:124,w:42,h:76},{x:468,y:300,w:42,h:76}]},
 {id:'the-margin',n:'THE MARGIN',bg:'#292730',obstacleColor:'#5c5665',sound:'the-starlit-archive.wav',encounters:['margin-warden','index-hound'],boss:'the-editor',sign:'* THE MARGIN\n* Stay on the marked line and head east.',c:[{x:150,y:130,w:105,h:18},{x:300,y:332,w:110,h:18},{x:452,y:136,w:88,h:18}]},
 {id:'blank-page',n:'THE BLANK PAGE',bg:'#24252b',obstacleColor:'#494a52',sound:'the-starlit-archive.wav',encounters:['margin-warden','glasswing-moth'],boss:'the-author',sign:'* THE BLANK PAGE\n* The path is almost empty. Keep moving east.',c:[{x:198,y:148,w:50,h:50},{x:396,y:286,w:50,h:50}]},
 {id:'last-autosave',n:'THE LAST AUTOSAVE',bg:'#161720',obstacleColor:'#46414f',sound:'the-starlit-archive.wav',encounters:['archive-stalker','index-hound'],boss:'the-last-save',sign:'* THE LAST AUTOSAVE\n* The final light waits beyond the eastern door.',c:[{x:152,y:136,w:54,h:54},{x:430,y:300,w:54,h:54}]}
];
const repoRegionMaps=REPO_REGION_ROOMS.map((area,i)=>{
 const mapId=id=>id==='last-save-archive'?'last-save-archive':`repo-${id}`;
 const previous=i?mapId(REPO_REGION_ROOMS[i-1].id):'dark-room',next=REPO_REGION_ROOMS[i+1]?mapId(REPO_REGION_ROOMS[i+1].id):'$ending';
 return {id:mapId(area.id),n:area.n,f:[40,100,560,340],bg:area.bg,obstacleColor:area.obstacleColor,soundData:`audio/remastered/ambient/${area.sound}`,
  encounters:area.encounters,encounterSpacing:650,encounterChance:.16,
  o:[{k:'sign',x:116,y:171,t:area.sign.split('\n')},{k:'save',x:86,y:374},...(i===0?[{k:'npc',npcId:'mira',x:292,y:260}]:[]),...(i===6?[{k:'shop',shopId:'archive-supplies',x:506,y:278},{k:'npc',npcId:'mira',x:294,y:260}]:[])],
  c:area.c.map(c=>({...c})),
  triggers:[{k:'enemy',enemyId:area.boss,x:540,y:145,w:60,h:250}],
  d:[{x:40,y:225,w:12,h:70,to:-1,targetId:previous,px:550,py:260},{x:588,y:225,w:12,h:70,to:-1,targetId:next,px:82,py:260}]
 };
});
R.push(...repoRegionMaps);
const garden=R.find(r=>r.id==='lantern-garden');
if(garden)garden.d=garden.d.filter(d=>d.targetId!=='repo-quiet-road');
const darkRoom=R.find(r=>r.id==='dark-room');
if(darkRoom){const east=darkRoom.d.find(d=>d.x>500);if(east)east.targetId='repo-quiet-road'}
for(const room of R)for(const door of room.d||[])if(door.targetId){const target=R.findIndex(r=>r.id===door.targetId);if(target>=0)door.to=target;}
// Doors point to named spawn points in the destination room. Legacy px/py
// values are converted once into named points so old maps keep their entries.
for(const room of R)room.spawns=Array.isArray(room.spawns)?room.spawns:[];
for(const room of R)for(let i=0;i<(room.d||[]).length;i++){
 const door=room.d[i],target=R[door.to];if(!target||door.to<0)continue;
 const spawnId=door.arrivalSpawnId||`entry-${room.id||'room'}-${i+1}`;
 door.arrivalSpawnId=spawnId;
 if(!target.spawns.some(point=>String(point.id)===String(spawnId)))target.spawns.push({id:spawnId,x:Number.isFinite(+door.px)?+door.px:target.f[0]+32,y:Number.isFinite(+door.py)?+door.py:target.f[1]+target.f[3]/2});
}


// Adapts THE LAST SAVE's portable catalogs to WICK while retaining the full
// original records in REPO_SOURCE_CONTENT for the hidden developer library.
(()=>{
 const source=REPO_SOURCE_CONTENT,roster=source.monsters.monsters;
 const slug=s=>String(s).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
 const title=s=>String(s).replace(/\b\w/g,c=>c.toUpperCase());
 const wickHp=(hp,level)=>Math.max(35,Math.min(150,Math.round(24+(+level||1)*4.2+Math.sqrt(Math.max(1,+hp||1))*2.5)));
 const spriteColors=['#8d65d8','#b45c45','#4d9b86','#d49a42','#648acb','#b95e9c','#6d9f4d','#bd7651','#8c879e','#4ba8ad','#d06358','#b0a04e'];
 const hashText=s=>{let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0};
 const makeEnemySprite=(enemy)=>{
  const id='enemy-'+slug(enemy.id),width=20,height=24,key=enemy.id.toLowerCase(),hash=hashText(key),base=spriteColors[hash%spriteColors.length],shade='#30283e',light='#f5d78a',eye='#171522',mask=new Set(),details=new Map();
  const put=(x,y,c=base)=>{if(x>=0&&x<width&&y>=0&&y<height){mask.add(y*width+x);details.set(y*width+x,c)}};
  const row=(y,a,b,c=base)=>{for(let x=a;x<=b;x++)put(x,y,c)};
  const ellipse=(cx,cy,rx,ry,c=base)=>{for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(((x-cx)/rx)**2+((y-cy)/ry)**2<=1)put(x,y,c)};
  const frog=/frog/.test(key),beast=/wolf|rat|boar|jackal|hound|moth|spider|crab|harpy|bird|wyvern|dragon|bat|insect|beetle|snake|serpent|mimic/.test(key);
  const slime=/slime|ooze|blob/.test(key),ghost=/ghost|wraith|spirit|specter|phantom|soul|leftover|witness|leech|echo/.test(key);
  const plant=/moss|flower|vine|root|thorn|mushroom|fungus/.test(key),construct=/golem|sentinel|armor|automaton|clockwork|construct|warden|guardian/.test(key);
  const undead=/skeleton|zombie|lich|reaper|undead|bone/.test(key),winged=/moth|harpy|bird|wyvern|dragon|bat|wing/.test(key);
  if(frog){ellipse(10,14,8,6);ellipse(10,8,7,5);ellipse(5,4,2.5,3,'#8fd47b');ellipse(15,4,2.5,3,'#8fd47b');put(5,4,eye);put(15,4,eye);row(18,4,7,shade);row(18,12,16,shade);row(19,2,8,base);row(19,11,17,base);row(12,15,16,'#b9ef86')}
  else if(slime){for(let y=9;y<22;y++){const q=(y-9)/13,w=Math.round(3+Math.sin(q*Math.PI)*6);row(y,10-w,9+w)}row(21,4,15,shade)}
  else if(ghost){for(let y=4;y<22;y++){const q=(y-4)/18,w=Math.round(3+Math.sin(q*Math.PI*.72)*6);row(y,10-w,9+w)}for(let x=4;x<16;x+=4)put(x,22,base)}
  else if(plant){for(let y=8;y<22;y++)row(y,8,11);ellipse(9.5,7,6,5,base);for(let x=2;x<7;x++)put(x,13,'#62b95e');for(let x=13;x<18;x++)put(x,11,'#62b95e');row(21,6,13,shade)}
  else if(construct){for(let y=5;y<18;y++)row(y,5+(y<8?1:0),14-(y<8?1:0));row(18,6,8);row(18,11,13);row(19,5,8);row(19,11,14);row(20,4,8,shade);row(20,11,15,shade)}
  else if(undead){ellipse(9.5,6,4,4);for(let y=10;y<18;y++)row(y,6,13);row(11,7,12,light);row(13,7,12,shade);row(15,7,12,light);row(18,6,8);row(18,11,13);row(19,5,8,shade);row(19,11,14,shade)}
  else if(beast){ellipse(10,14,6,4.5);ellipse(6,9,4.2,3.6);ellipse(4,6,1.5,3,base);ellipse(8,6,1.5,3,base);row(18,6,8);row(18,12,14);row(19,5,8,shade);row(19,12,15,shade);for(let x=14;x<19;x++)put(x,13+Math.floor((x-14)/2),base);if(winged){for(let y=7;y<14;y++){const w=Math.max(1,7-Math.abs(y-10));row(y,9-w,8,shade);row(y,11,10+w,shade);row(y,9-w+1,8,base);row(y,11,10+w-1,base)}}}
  else {ellipse(9.5,5.5,3.7,3.8);row(9,6,13);for(let y=10;y<17;y++)row(y,6,13);row(10,4,5);row(11,3,5);row(10,14,15);row(11,15,16);for(let y=17;y<21;y++){row(y,6,8);row(y,11,13)}row(21,5,8,shade);row(21,11,14,shade)}
  if(/dragon|wyvern|demon|devil|horn|king|crown/.test(key)){for(let y=2;y<6;y++){put(5-y%2,y,'#e0c66e');put(14+y%2,y,'#e0c66e')}row(4,7,12,'#e0c66e')}
  if(/spider|crab|scorpion|insect/.test(key)){for(let y=10;y<16;y++){put(3,y,shade);put(16,y,shade)}for(let x=1;x<5;x++){put(x,9+x%2,base);put(18-x,14-x%2,base)}}
  if(/armor|knight|captain|warlord|soldier|bandit|goblin|orc|hero/.test(key)){row(8,6,13,light);put(9,5,light);put(10,5,light)}
  if(/fire|flame|ash|ember|phoenix/.test(key)){for(let y=1;y<6;y++)put(9+(y%2),y,y<3?'#fff1a3':'#ffb347');put(7,4,'#ff713c');put(12,3,'#ff713c')}
  if(/ice|frost|snow|winter/.test(key)){put(3,10,'#c5f6ff');put(16,13,'#c5f6ff');put(10,3,'#c5f6ff')}
  if(/clock|machine|golem|automaton|construct/.test(key)){put(8,12,'#e9c55c');put(11,12,'#e9c55c');put(9,15,'#e9c55c');put(10,15,'#e9c55c')}
  if(/king|queen|crown|royal/.test(key)){row(1,6,13,'#f3cd56');put(6,0,'#f3cd56');put(9,0,'#fff0a0');put(13,0,'#f3cd56')}
  if(/mimic|chest/.test(key)){row(12,4,15,'#8c542e');row(13,3,16,'#c58b43');row(18,4,15,'#8c542e');row(15,9,10,light)}
  const pixels=Array(width*height).fill(null);
  for(const i of mask){const x=i%width,y=Math.floor(i/width),edge=[[-1,0],[1,0],[0,-1],[0,1]].some(([dx,dy])=>!mask.has((y+dy)*width+x+dx));pixels[i]=edge?shade:(details.get(i)||base)}
  const eyeY=slime?15:ghost?10:beast?10:8;put(7,eyeY,eye);put(12,eyeY,eye);put(8,eyeY-1,light);put(13,eyeY-1,light);
  pixels.splice(0,pixels.length,...Array(width*height).fill(null));for(const i of mask){const x=i%width,y=Math.floor(i/width),edge=[[-1,0],[1,0],[0,-1],[0,1]].some(([dx,dy])=>!mask.has((y+dy)*width+x+dx));pixels[i]=edge?shade:(details.get(i)||base)}
  for(const [x,y,c] of [[7,eyeY,eye],[12,eyeY,eye],[8,eyeY-1,light],[13,eyeY-1,light]])if(x>=0&&x<width&&y>=0&&y<height)pixels[y*width+x]=c;
  return{id,width,height,pixels};
 };
 window.ensureEnemySprite=enemy=>{if(!enemy)return null;let id=enemy.spriteId||'enemy-'+slug(enemy.id),found=SPRITES.find(s=>s.id===id);if(found)return found;id='enemy-'+slug(enemy.id);enemy.spriteId=id;found=SPRITES.find(s=>s.id===id);if(found)return found;const made=makeEnemySprite(enemy);SPRITES.push(made);return made};
 const patternIds=ATTACK_PATTERNS.map(p=>p.id);
 const makeMovePattern=(enemyId,name,move)=>{
  const id='repoattack-'+slug(enemyId+'-'+name),text=(name+' '+(move.type||'')).toLowerCase();
  let hash=0;for(const ch of id)hash=(hash*31+ch.charCodeAt(0))>>>0;
  const known=[
   [/wax|drip|melt/,'waxfall'],[/splat|splash/,'waxsplash'],[/tongue|lick/,'tongue'],[/fly|flies|buzz/,'flies'],[/seed|spore|thorn|pollen/,'seedfall'],[/burrow|tunnel|underground/,'burrow'],
   [/ember|flame|fireball|burning/,'ember'],[/feather|wing|plume/,'feather'],[/bite|chomp|snap|jaw/,'chomp'],
   [/rain|shower|hail|fall|meteor|shards|rock|stone/,'rain'],
   [/web|net|trap|snare/,'web'],[/nova|burst|explod|bloom|aura|detonate|bomb/,'burst'],
   [/orbit|gravity|planet|satellite/,'orbit'],[/pincer|clamp|crush|vice/,'pincer'],
   [/scatter|shatter|crystal|fragment/,'scatter'],[/sweep|cleave|wide slash/,'sweep'],
   [/wave|tide|surge|roar|howl|screech|shout/,'wave'],[/cross|barrage|volley|spray|flurry|rapid|swarm/,'crossfire'],
   [/bolt|throw|shot|beam|curse|shadow|void|dark|arcane|magic/,'aimed'],[/spin|whirl|dance|drain|soul/,'spiral'],
   [/charge|lunge|pounce|slash|claw|strike/,'lunge']
  ];
  let type=known.find(([re])=>re.test(text))?.[1];
  if(!type){const styles=['fan','web','burst','wave','crossfire','aimed','spiral','lunge','rain','orbit','pincer','scatter','sweep','flies','tongue','chomp','seedfall','burrow','ember','feather'];type=styles[hash%styles.length]}
  const range=move.damage,peak=Array.isArray(range)?Math.max(...range.map(Number)):Number(range)||8,level=source.monsters.ENEMY_LEVELS[String(enemyId).replace(/-phase-two$/,'').replace(/-/g,' ')]||1,easy=level<=2;
  const speed=Math.max(easy?1.25:1.6,Math.min(easy?2.15:4.1,(easy?1.35:1.8)+peak*(easy?.025:.035)));
  const identity=enemyId.toLowerCase(),bulletStyle=/frog/.test(identity)?'tongue':/rat|wolf|boar|hound|jackal|goblin|orc/.test(identity)?'tooth':/moth|bird|harpy|wyvern|dragon/.test(identity)?'feather':/spider|crab|scorpion|insect/.test(identity)?'web':/fire|flame|ash|ember|phoenix|demon/.test(identity)?'flame':/skeleton|zombie|lich|bone/.test(identity)?'bone':/golem|armor|knight|machine|clockwork|automaton/.test(identity)?'gear':/ghost|wraith|spirit|specter|phantom|soul|leech|echo|watcher/.test(identity)?'wisp':/moss|flower|vine|root|thorn|fungus/.test(identity)?'seed':/page|editor|author|archive|index|book|paper/.test(identity)?'page':'orb';
  const interval=(type==='rain'?30:type==='spiral'?24:type==='flower'?22:type==='flies'?36:type==='tongue'?70:42)*(easy?1.35:1);
  const pattern={id,name:`${title(name)} — ${title(enemyId)}`,type,interval,speed,bulletStyle,
   fan:Math.max(2,Math.min(easy?4:6,2+Math.round(peak/14)+(hash%2))),count:Math.max(easy?5:8,Math.min(easy?9:15,7+Math.round(peak/5)+(hash%3))),spread:.16+(hash%7)*.025+(easy?.1:0),rotation:.055+(hash%8)*.012,seed:hash%628,
   ringEvery:65,ringSpeed:Math.max(1.3,speed*.78),aimEvery:88,aimAt:35,aimSpeed:Math.min(4,speed+0.6),repoMove:{name,...move}};
  if(!ATTACK_PATTERNS.some(p=>p.id===id))ATTACK_PATTERNS.push(pattern);return id;
 };
 const moveSet=(id,enemy)=>[
  {name:'basic attack',...enemy.basic_attack},
  ...Object.entries(enemy.abilities||{}).map(([name,move])=>({name,...move}))
 ].map(move=>({name:move.name,patternId:makeMovePattern(id,move.name,move),...move}));
 for(const [key,data] of Object.entries(roster)){
  const id=slug(key),old=ENEMIES.find(e=>e.id===id),audio=`audio/remastered/enemies/${id}.wav`,phaseAudio=`audio/remastered/enemies/${id}-phase-two.wav`,moves=moveSet(id,data),phase=source.monsters.BOSS_PHASE_TWO[key]||null,phaseMoves=phase?moveSet(id+'-phase-two',phase):[];
  const level=source.monsters.ENEMY_LEVELS[key]||1,phaseAdapted=phase?{...phase,sourceHP:phase.hp,hp:wickHp(phase.hp,level)}:null;
  const entry={id,name:title(key),hp:wickHp(data.hp,level),repoHP:Math.max(1,+data.hp||30),pattern:moves[0]?.patternId||patternIds[0],natural:+data.chance>0,bunsReward:Math.max(1,Math.min(12,Math.ceil(level/2))),
   repoSource:'THE LAST SAVE',repoKey:key,level,icon:data.icon||'?',
   basicAttack:data.basic_attack||{},attacks:moves,repoPatternIds:moves.map(m=>m.patternId),phasePatternIds:phaseMoves.map(m=>m.patternId),
   drops:data.drops||{},weaknesses:source.monsters.ELEMENT_WEAKNESSES[key]||null,
   repoDialogue:source.monsters.ENEMY_DIALOGUE[key]||null,battleDialogue:source.monsters.ENEMY_DIALOGUE[key]||null,phaseTwo:phaseAdapted,phaseTwoSource:phase};
  if(REPO_SOURCE_AUDIO.includes(audio))entry.audio=audio;
  if(REPO_SOURCE_AUDIO.includes(phaseAudio))entry.phaseAudio=phaseAudio;
  if(old){Object.assign(old,{repoSource:entry.repoSource,repoKey:key,repoHP:entry.repoHP,level:entry.level,bunsReward:entry.bunsReward,icon:entry.icon,
   basicAttack:entry.basicAttack,attacks:entry.attacks,repoPatternIds:entry.repoPatternIds,phasePatternIds:entry.phasePatternIds,drops:entry.drops,weaknesses:entry.weaknesses,
   repoDialogue:entry.repoDialogue,battleDialogue:entry.battleDialogue,phaseTwo:entry.phaseTwo,phaseTwoSource:entry.phaseTwoSource,phaseAudio:entry.phaseAudio});if(!old.audio&&entry.audio)old.audio=entry.audio}
  else ENEMIES.push(entry);
 }
 ENEMIES.forEach(window.ensureEnemySprite);
 const regionBands=[[1,3],[2,4],[3,7],[4,12],[6,14],[7,14],[8,14],[10,16],[12,18],[14,20],[14,20]];
 const routeIds=['repo-quiet-road','repo-broken-frontier','repo-cathedral-ash','repo-null-expanse','repo-unfinished-room','repo-outside-world','last-save-archive','repo-hollow-kingdom','repo-the-margin','repo-blank-page','repo-last-autosave'];
 routeIds.forEach((roomId,index)=>{const room=R.find(r=>r.id===roomId);if(!room)return;const [min,max]=regionBands[index];room.encounters=room.encounters||[];for(const enemy of ENEMIES)if(enemy.repoSource&&enemy.natural&&enemy.level>=min&&enemy.level<=max&&!room.encounters.includes(enemy.id))room.encounters.push(enemy.id)});
 routeIds.forEach((roomId,index)=>{const room=R.find(r=>r.id===roomId),chapter=source.dialogue.STORY_CHAPTERS[index];if(!room||!chapter)return;const sceneId=source.dialogue.STORY_SCENE_BY_CHAPTER[chapter.id],scene=source.dialogue.STORY_SCENES[sceneId];if(!scene?.length)return;room.o=room.o||[];if(!room.o.some(o=>o.repoScene===sceneId))room.o.push({k:'sign',repoScene:sceneId,x:350,y:350,t:scene.map(line=>'* '+line)})});
 const regionByCharacter={'Mira':'quiet-road','The Bellkeeper':'cathedral-ash','The Unnamed King':'cathedral-ash','The Witness':'outside-world','The Archivist':'last-save-archive','The First Hero':'hollow-kingdom','The Editor':'the-margin','The Author':'blank-page'};
 const mapFor=id=>R.find(r=>r.id===id||r.id==='repo-'+id);
 for(const [name,data] of Object.entries(source.dialogue.STORY_CHARACTERS||{})){
  const prior=NPCS.find(n=>n.name?.toLowerCase()===name.toLowerCase()),id=prior?.id||'repo-story-'+slug(name),existing=NPCS.find(n=>n.id===id),entry={id,name,
   dialogue:[`* ${name}: ${data.intro||data.role||'A traveler watches the road.'}`],
   options:[{label:'Ask about their role',lines:[`* ${data.role||name}.`]},{label:'Ask what happens later',lines:[`* ${data.late||data.intro||name+' remembers.'}`]}]};
  if(!prior){if(existing)Object.assign(existing,entry);else NPCS.push(entry)}
  const room=mapFor(regionByCharacter[name]);if(room){room.o=room.o||[];if(!room.o.some(o=>o.npcId===id))room.o.push({k:'npc',npcId:id,x:name==='Mira'?292:300,y:278})}
 }
 const defs=source.rpgSystems;
 window.REPO_CONTENT_COUNTS={enemies:Object.keys(roster).length,items:Object.keys(source.items.ITEMS).length,skills:Object.keys(source.items.SKILLS).length,
  recipes:Object.keys(source.items.recipes).length,quests:Object.keys(defs.SIDE_QUESTS).length+Object.keys(source.dialogue.STORY_QUESTS).length,
  chapters:source.dialogue.STORY_CHAPTERS.length,companions:Object.keys(defs.COMPANION_DEFS).length,audio:REPO_SOURCE_AUDIO.filter(x=>x.endsWith('.wav')).length};
})();
