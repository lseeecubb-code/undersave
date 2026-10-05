// look.js — Undertale-style rooms. Load AFTER world.js and BEFORE story.js.
// Draws themed floors, brick/shelf walls, raised pillars, doorways, ambient motes,
// and replaces the prop and player sprites. Room data (maps.js) is not touched.
// Themes are picked from the room NAME, so any room called e.g. "Cathedral of Ash" gets the ash look.

const LOOK_DEFAULT={floorA:'#3a2a4f',floorB:'#352647',line:'#2a1d3d',wallA:'#5a3d7a',wallB:'#4d3369',wallLine:'#2a1a3e',pillar:'#7a56a0',glow:'#ffd27a',pat:'ruins',wall:'brick',mote:'dust',vig:.6};
const LOOK_THEMES=[
 {m:/wax/,floorA:'#4b3426',floorB:'#46301f',line:'#33231a',wallA:'#6e4a32',wallB:'#5f3f2a',wallLine:'#2e1e14',pillar:'#8a5d3e',glow:'#ffcf7a',pat:'ruins',wall:'brick',mote:'spark',vig:.55},
 {m:/dark room/,floorA:'#15131f',floorB:'#12101a',line:'#0c0b13',wallA:'#201c30',wallB:'#1b1728',wallLine:'#0a0910',pillar:'#2c2640',glow:'#ffb04a',pat:'ruins',wall:'brick',mote:'dust',vig:.88},
 {m:/lantern|garden/,floorA:'#2f5a3a',floorB:'#295234',line:'#1f3f28',wallA:'#24472f',wallB:'#1f3d29',wallLine:'#12261a',pillar:'#3b6b45',glow:'#e6ff7a',pat:'grass',wall:'hedge',mote:'firefly',vig:.5},
 {m:/hollow hall/,...LOOK_DEFAULT},
 {m:/quiet road/,floorA:'#7a6842',floorB:'#726040',line:'#5a4a30',wallA:'#4f6b3a',wallB:'#45602f',wallLine:'#27381c',pillar:'#8a7a52',glow:'#fff0a0',pat:'dirt',wall:'hedge',mote:'leaf',vig:.4},
 {m:/frontier/,floorA:'#8a6a4a',floorB:'#826244',line:'#654a33',wallA:'#5e4632',wallB:'#503b29',wallLine:'#2a1d12',pillar:'#9a7a58',glow:'#ffe0a0',pat:'dirt',wall:'brick',mote:'dust',vig:.5,crack:true},
 {m:/cathedral/,floorA:'#4c4c55',floorB:'#46464e',line:'#33333b',wallA:'#3a3a44',wallB:'#32323b',wallLine:'#18181e',pillar:'#62626e',glow:'#ffb070',pat:'stone',wall:'brick',mote:'ash',vig:.7},
 {m:/null/,floorA:'#1d1d1d',floorB:'#232323',line:'#333',wallA:'#222',wallB:'#1a1a1a',wallLine:'#000',pillar:'#3a3a3a',glow:'#ffffff',pat:'void',walls:false,edge:'rgba(255,255,255,.25)',mote:'none',vig:.6},
 {m:/unfinished/,floorA:'#111',floorB:'#b000b0',line:'#000',wallA:'#555',wallB:'#444',wallLine:'#111',pillar:'#777',glow:'#00ffff',pat:'glitch',walls:false,edge:'#b000b0',mote:'glitch',vig:.3},
 {m:/outside/,floorA:'#000',floorB:'#050505',line:'#fff',wallA:'#000',wallB:'#000',wallLine:'#fff',pillar:'#222',glow:'#ffffff',pat:'blank',walls:false,edge:'rgba(255,255,255,.7)',mote:'spark',vig:0},
 {m:/archive/,floorA:'#6a4a2e',floorB:'#62442a',line:'#3e2a18',wallA:'#3a2514',wallB:'#2e1d10',wallLine:'#150c05',pillar:'#7a5636',glow:'#ffd48a',pat:'wood',wall:'books',mote:'dust',vig:.6},
 {m:/hollow kingdom/,floorA:'#55525c',floorB:'#4e4b56',line:'#37353f',wallA:'#3f3d48',wallB:'#35333d',wallLine:'#18171d',pillar:'#6c6a78',glow:'#d8d0ff',pat:'stone',wall:'brick',mote:'ash',vig:.65},
 {m:/margin/,floorA:'#e8e2cf',floorB:'#e2dcc8',line:'#c4bca2',wallA:'#cfc8b0',wallB:'#c4bca2',wallLine:'#9a927a',pillar:'#d8d0b8',glow:'#4a4a6a',pat:'paper',walls:false,edge:'#9a927a',mote:'ink',vig:.12},
 {m:/blank/,floorA:'#f4f1e6',floorB:'#f1eee2',line:'#e0dccb',wallA:'#eee',wallB:'#ddd',wallLine:'#bbb',pillar:'#e6e2d2',glow:'#4a4a6a',pat:'blank',walls:false,edge:'#cfcab8',mote:'ink',vig:.08},
 {m:/autosave|last save/,floorA:'#05060f',floorB:'#070813',line:'#0c0e22',wallA:'#0a0c1a',wallB:'#080a16',wallLine:'#000',pillar:'#16183a',glow:'#aaeaff',pat:'autosave',walls:false,edge:'rgba(170,234,255,.5)',mote:'spark',vig:.5}
];

const lookCache={};
const lookP={x:0,y:0,face:'down',moving:false};
function lookHash(a,b){let h=Math.imul(a|0,374761393)^Math.imul(b|0,668265263);h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296}
function lookWrap(v,n){return((v%n)+n)%n}
function lookCanvas(){const c=document.createElement('canvas');c.width=640;c.height=480;return c}
function roomTheme(r){const n=String(r.n||'').toLowerCase();return LOOK_THEMES.find(t=>t.m.test(n))||{...LOOK_DEFAULT,floorA:r.bg||LOOK_DEFAULT.floorA,floorB:r.bg||LOOK_DEFAULT.floorB}}

/* ---------- layer A: floor ---------- */
function lookFloor(k,f,th){
 const [fx,fy,fw,fh]=f;
 for(let iy=0;iy*32<fh;iy++)for(let ix=0;ix*32<fw;ix++){
  const x=fx+ix*32,y=fy+iy*32,w=Math.min(32,fx+fw-x),h=Math.min(32,fy+fh-y),n=lookHash(ix,iy);
  if(th.pat==='void'&&n<.08){k.fillStyle='#000';k.fillRect(x,y,w,h);continue}
  k.fillStyle=n<.5?th.floorA:th.floorB;k.fillRect(x,y,w,h);
  if(th.pat==='ruins'){k.fillStyle=th.line;k.fillRect(x+w-1,y,1,h);k.fillRect(x,y+h-1,w,1);k.fillStyle='rgba(255,255,255,.05)';k.fillRect(x,y,w,2);k.fillRect(x,y,2,h)}
  else if(th.pat==='grass'){for(let j=0;j<5;j++){const bx=x+Math.floor(lookHash(ix*7+j,iy)*28),by=y+Math.floor(lookHash(ix,iy*7+j)*24);k.fillStyle=j%2?'rgba(130,210,110,.45)':'rgba(10,40,20,.35)';k.fillRect(bx,by,2,5)}}
  else if(th.pat==='dirt'){for(let j=0;j<6;j++){const bx=x+Math.floor(lookHash(ix*5+j,iy)*29),by=y+Math.floor(lookHash(ix,iy*5+j)*29);k.fillStyle=j%2?'rgba(0,0,0,.18)':'rgba(255,230,180,.14)';k.fillRect(bx,by,2,2)}}
  else if(th.pat==='stone'){k.fillStyle=th.line;k.fillRect(x+w-1,y,1,h);k.fillRect(x,y+h-1,w,1);if(n>.8){k.fillRect(x+6,y+8,10,1);k.fillRect(x+15,y+8,1,8)}}
  else if(th.pat==='wood'){for(const o of [0,8,16,24]){if(o>=h)continue;k.fillStyle=th.line;k.fillRect(x,y+o,w,1);k.fillRect(x+Math.floor(lookHash(ix+o,iy)*30),y+o,1,Math.min(8,h-o))}}
  else if(th.pat==='void'){k.fillStyle='rgba(255,255,255,.05)';k.fillRect(x+w-1,y,1,h);k.fillRect(x,y+h-1,w,1)}
  else if(th.pat==='glitch'){k.fillStyle=th.floorA;k.fillRect(x,y,w,h);k.fillStyle=th.floorB;k.fillRect(x,y,Math.min(16,w),Math.min(16,h));if(w>16&&h>16)k.fillRect(x+16,y+16,w-16,h-16)}
  else if(th.pat==='paper'){k.fillStyle=th.line;k.fillRect(x,y+15,w,1);k.fillRect(x,y+h-1,w,1);if(n>.7){k.fillStyle='rgba(40,40,60,.25)';k.fillRect(x+4+Math.floor(n*10),y+6,8,1)}}
 }
 if(th.crack){
  k.strokeStyle='#07070b';k.lineWidth=3;k.beginPath();let cx=fx+fw*.25;k.moveTo(cx,fy);
  for(let y=fy+24;y<=fy+fh;y+=24){cx+=24*.45+(lookHash(y,7)-.5)*36;k.lineTo(Math.min(fx+fw,Math.max(fx,cx)),y)}
  k.stroke()
 }
}

/* ---------- layer B: walls, pillars, doorways, vignette ---------- */
function lookWalls(k,f,th){
 const [fx,fy,fw,fh]=f;
 if(th.walls===false){k.strokeStyle=th.edge||'rgba(255,255,255,.3)';k.lineWidth=2;k.strokeRect(fx-1,fy-1,fw+2,fh+2);return}
 const top=Math.max(0,fy-44),bh=fy-top;
 if(bh>0){
  k.save();k.beginPath();k.rect(fx,top,fw,bh);k.clip();k.fillStyle=th.wallLine;k.fillRect(fx,top,fw,bh);
  if(th.wall==='books'){
   const pal=['#8a3b3b','#3b5a8a','#3b8a5a','#8a7a3b','#6b3b8a'];k.fillStyle=th.wallB;k.fillRect(fx,top,fw,bh);
   for(let row=0;row*11<bh+11;row++){const y=fy-(row+1)*11;for(let x=fx;x<fx+fw;){const bw=3+Math.floor(lookHash(x,row)*3),bhh=7+Math.floor(lookHash(row,x)*4);k.fillStyle=pal[Math.floor(lookHash(x+3,row)*5)];k.fillRect(x,y+11-bhh-1,bw,bhh);x+=bw+1}k.fillStyle=th.wallLine;k.fillRect(fx,y+10,fw,1)}
  }else if(th.wall==='hedge'){
   k.fillStyle=th.wallB;k.fillRect(fx,top,fw,bh);
   for(let i=0;i<fw/3;i++){const x=fx+lookHash(i,1)*fw,y=top+lookHash(i,2)*bh;k.fillStyle=lookHash(i,3)>.5?th.wallA:th.wallLine;k.fillRect(x,y,4,3)}
  }else{
   let row=0;for(let y=fy-11;y>top-11;y-=11,row++){const off=row%2?11:0;for(let x=fx-off;x<fx+fw;x+=22){const n=lookHash(Math.floor(x/22),row);k.fillStyle=n<.5?th.wallA:th.wallB;k.fillRect(x,y,21,10)}}
  }
  k.fillStyle='rgba(0,0,0,.35)';k.fillRect(fx,fy-4,fw,4);k.restore()
 }
 k.fillStyle=th.wallB;k.fillRect(fx-8,top,8,bh+fh+4);k.fillRect(fx+fw,top,8,bh+fh+4);
 k.fillStyle=th.wallLine;k.fillRect(fx-8,top,2,bh+fh+4);k.fillRect(fx+fw+6,top,2,bh+fh+4);k.fillRect(fx-8,fy+fh,fw+16,4);
 k.fillStyle='rgba(0,0,0,.22)';k.fillRect(fx,fy,fw,6)
}
function lookPillars(k,r,th){
 for(const c of r.c||[]){
  k.fillStyle='rgba(0,0,0,.3)';k.fillRect(c.x+3,c.y+4,c.w,c.h);
  const fh=Math.min(c.h,Math.max(12,Math.round(c.h*.45))),topH=c.h-fh,front=r.obstacleColor||th.wallA;
  k.fillStyle=th.pillar;k.fillRect(c.x,c.y,c.w,Math.max(topH,2));
  k.fillStyle=front;k.fillRect(c.x,c.y+topH,c.w,fh);
  k.fillStyle=th.wallLine;for(let yy=c.y+topH+5;yy<c.y+c.h;yy+=6)k.fillRect(c.x,yy,c.w,1);
  for(let yy=c.y+topH,row=0;yy<c.y+c.h;yy+=6,row++)for(let xx=c.x+(row%2?5:0);xx<c.x+c.w;xx+=10)k.fillRect(xx,yy,1,6);
  k.fillStyle='rgba(255,255,255,.14)';k.fillRect(c.x,c.y,c.w,1);
  k.strokeStyle=th.wallLine;k.lineWidth=2;k.strokeRect(c.x+1,c.y+1,c.w-2,c.h-2)
 }
}
function lookDoors(k,r,th){
 const [fx,fy,fw]=r.f;
 for(const d of r.d||[]){
  if(d.to<0&&!beaten)continue;
  if(d.y<=fy+6){k.fillStyle='#000';k.fillRect(d.x,fy-40,d.w,40+Math.min(d.h,8))}
  if(d.x<=fx+6){k.fillStyle='#000';k.fillRect(fx-8,d.y,10,d.h)}
  if(d.x+d.w>=fx+fw-6){k.fillStyle='#000';k.fillRect(fx+fw-2,d.y,10,d.h)}
  k.fillStyle='rgba(0,0,0,.45)';k.fillRect(d.x,d.y,d.w,d.h)
 }
}
function lookVignette(k,f,th){
 if(!th.vig)return;
 const [fx,fy,fw,fh]=f,cx=fx+fw/2,cy=fy+fh/2,gr=k.createRadialGradient(cx,cy,Math.min(fw,fh)*.3,cx,cy,Math.hypot(fw,fh)*.55);
 gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,'+th.vig+')');
 k.save();k.beginPath();k.rect(fx,fy,fw,fh);k.clip();k.fillStyle=gr;k.fillRect(fx,fy,fw,fh);k.restore()
}

function lookScene(r){
 const key=r.id||rm,sig=JSON.stringify([r.n,r.bg,r.f,r.c,r.d,r.obstacleColor,!!beaten]);
 let s=lookCache[key];
 if(!s||s.sig!==sig){
  s={sig,th:roomTheme(r),a:lookCanvas(),b:lookCanvas()};
  const ka=s.a.getContext('2d'),kb=s.b.getContext('2d');
  lookFloor(ka,r.f,s.th);
  lookWalls(kb,r.f,s.th);lookPillars(kb,r,s.th);lookDoors(kb,r,s.th);lookVignette(kb,r.f,s.th);
  lookCache[key]=s
 }
 return s
}

/* ---------- per-frame atmosphere ---------- */
function lookAmbience(r,th){
 const [fx,fy,fw,fh]=r.f,m=th.mote;
 g.save();g.beginPath();g.rect(fx,fy,fw,fh);g.clip();
 if(m==='dust'||m==='ash'||m==='ink'||m==='leaf')for(let i=0;i<22;i++){
  const sp=.3+(i%4)*.18;let px,py;
  if(m==='dust'){px=fx+lookWrap(i*97+fr*.12*sp+Math.sin(fr*.01+i)*8,fw);py=fy+lookWrap(i*57+fr*.08*sp,fh);g.fillStyle='rgba(255,255,255,.10)';g.fillRect(px,py,2,2)}
  else if(m==='ash'){px=fx+lookWrap(i*83+Math.sin(fr*.02+i)*14,fw);py=fy+lookWrap(i*41+fr*sp,fh);g.fillStyle='rgba(210,210,220,.35)';g.fillRect(px,py,2,2)}
  else if(m==='leaf'){px=fx+lookWrap(i*89+fr*.7*sp,fw);py=fy+lookWrap(i*47+Math.sin(fr*.03+i)*10+fr*.1,fh);g.fillStyle=i%2?'rgba(150,210,90,.5)':'rgba(220,190,80,.5)';g.fillRect(px,py,3,2)}
  else{px=fx+lookWrap(i*71,fw);py=fy+lookWrap(i*53+fr*.2*sp,fh);g.fillStyle='rgba(30,30,50,.35)';g.fillRect(px,py,5,1)}
 }
 else if(m==='firefly')for(let i=0;i<12;i++){
  const px=fx+lookWrap(i*131+Math.sin(fr*.012+i*2)*25,fw),py=fy+lookWrap(i*79+Math.cos(fr*.01+i)*20,fh),a=.4+.4*Math.sin(fr*.05+i);
  g.fillStyle='rgba(230,255,120,'+a*.2+')';g.fillRect(px-3,py-3,7,7);g.fillStyle='rgba(240,255,150,'+a+')';g.fillRect(px,py,2,2)
 }
 else if(m==='spark')for(let i=0;i<14;i++){
  const px=fx+lookHash(i,11)*fw,py=fy+lookHash(i,13)*fh,tw=Math.max(0,Math.sin(fr*.06+i*1.7));
  g.fillStyle='rgba(255,240,200,'+tw*.8+')';g.fillRect(px,py,2,2);if(tw>.85){g.fillRect(px-2,py,6,2);g.fillRect(px,py-2,2,6)}
 }
 else if(m==='glitch'&&fr%9<3)for(let j=0;j<3;j++){
  const gw=30+lookHash(j,fr>>3)*100,gy=fy+lookHash(fr>>3,j)*fh,gx=fx+lookHash(j+5,fr>>3)*(fw-gw);
  g.fillStyle=j%2?'rgba(255,0,255,.25)':'rgba(0,255,255,.2)';g.fillRect(gx,gy,gw,3)
 }
 if(th.pat==='autosave'){const y=fy+fh/2,a=.5+.3*Math.sin(fr*.05);g.fillStyle='rgba(170,235,255,'+a*.12+')';g.fillRect(fx,y-7,fw,14);g.fillStyle='rgba(200,245,255,'+a+')';g.fillRect(fx,y-1,fw,2)}
 g.restore();
 for(const d of r.d||[])if(d.to>=0||beaten){g.strokeStyle=th.glow;g.globalAlpha=.25+.2*Math.sin(fr*.08);g.lineWidth=2;g.strokeRect(d.x+1,d.y+1,d.w-2,d.h-2);g.globalAlpha=1}
}

// Replaces the old background / grid / obstacle / border / door drawing in drawWorld.
function drawRoomScene(r){
 const s=lookScene(r),f=r.f;
 g.drawImage(s.a,0,0);
 if(r.backgroundData){let im=roomImages[r.id];if(!im){im=new Image();im.src=r.backgroundData;roomImages[r.id]=im}if(im.complete&&im.naturalWidth)g.drawImage(im,f[0],f[1],f[2],f[3])}
 g.drawImage(s.b,0,0);
 lookAmbience(r,s.th)
}

/* ---------- props ---------- */
function obj(o){const x=o.x,y=o.y;
 if(o.k==='sign'){g.fillStyle='#5b3b20';g.fillRect(x-2,y-14,4,14);g.fillStyle='#4a2f18';g.fillRect(x-14,y-29,28,17);g.fillStyle='#b98a5a';g.fillRect(x-12,y-27,24,13);g.fillStyle='#5b3b20';g.fillRect(x-9,y-23,18,2);g.fillRect(x-9,y-18,12,2)}
 else if(o.k==='npc'){const npc=NPCS.find(n=>n.id===o.npcId);g.fillStyle='rgba(0,0,0,.3)';g.beginPath();g.ellipse(x,y-1,13,4,0,0,7);g.fill();
  if(!sprite(o.spriteId||npc?.spriteId,x,y)){g.fillStyle='#c8b8ff';g.fillRect(x-18,y-22,10,14);g.fillRect(x+8,y-22,10,14);g.fillStyle='#8a6fd0';g.fillRect(x-8,y-24,16,24);g.fillStyle='#000';g.fillRect(x-5,y-18,3,3);g.fillRect(x+2,y-18,3,3)}}
 else if(o.k==='sprite')sprite(o.spriteId,x,y)
 else if(o.k==='shop'){for(let i=0;i<6;i++){g.fillStyle=i%2?'#c0392b':'#f2e6c8';g.fillRect(x-27+i*9,y-31,9,9)}g.fillStyle='#624425';g.fillRect(x-24,y-20,48,20);g.fillStyle='#8a6334';g.fillRect(x-24,y-20,48,3);g.fillStyle='#ffe28a';g.fillRect(x-3,y-14,6,11);g.fillStyle='#fff2c7';g.fillRect(x-1,y-19,2,5);g.fillStyle='#c9a13a';g.fillRect(x-18,y-12,6,6);g.fillRect(x+12,y-12,6,6)}
 else if(o.k==='save'){const p=1+Math.sin(fr*.1)*.12,R=11*p,cy=y-14;
  g.fillStyle='rgba(255,232,74,'+(.12+.06*Math.sin(fr*.1))+')';g.beginPath();g.arc(x,cy,18,0,7);g.fill();
  g.fillStyle='#ffe84a';g.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4-Math.PI/2,rad=i%2?3.2:R;g.lineTo(x+Math.cos(a)*rad,cy+Math.sin(a)*rad)}g.closePath();g.fill();
  g.fillStyle='#fff';g.beginPath();g.arc(x,cy,2,0,7);g.fill()}
 else if(o.k==='chest'){g.fillStyle='rgba(0,0,0,.3)';g.beginPath();g.ellipse(x,y,15,4,0,0,7);g.fill();g.fillStyle='#6b4423';g.fillRect(x-13,y-13,26,13);
  if(taken[o.id]){g.fillStyle='#2a180a';g.fillRect(x-12,y-14,24,4);g.fillStyle='#4a2d15';g.fillRect(x-13,y-20,26,6)}else{g.fillStyle='#7d5129';g.fillRect(x-13,y-18,26,6);g.fillStyle='#e8c85a';g.fillRect(x-3,y-14,6,5)}
  g.fillStyle='#c9a13a';g.fillRect(x-13,y-9,26,2)}
 else if(o.k==='wickmob'){if(!beaten){g.fillStyle='rgba(0,0,0,.3)';g.beginPath();g.ellipse(x,y,12,3,0,0,7);g.fill();candle(x,y,false)}}
 else if(o.k==='wick'){g.fillStyle='rgba(0,0,0,.3)';g.beginPath();g.ellipse(x,y,12,3,0,0,7);g.fill();candle(x,y,true)}}

/* ---------- player: stripe-sweater kid with 4-way facing and a walk cycle ---------- */
function player(){
 const x=pl.x,y=pl.y,dx=x-lookP.x,dy=y-lookP.y;
 if(Math.abs(dx)>.05||Math.abs(dy)>.05){lookP.moving=true;lookP.face=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up')}else lookP.moving=false;
 lookP.x=x;lookP.y=y;
 const step=lookP.moving?Math.floor(fr/7)%2:0,face=lookP.face,L1=step?2:4,L2=step?4:2;
 g.fillStyle='rgba(0,0,0,.3)';g.beginPath();g.ellipse(x,y-1,9,3,0,0,7);g.fill();
 g.fillStyle='#e8c08a';g.fillRect(x-5,y-4,4,L1);g.fillRect(x+1,y-4,4,L2);
 g.fillStyle='#5a3a24';g.fillRect(x-6,y-7,12,3);
 g.fillStyle='#4a7fd6';g.fillRect(x-6,y-15,12,8);g.fillStyle='#b44aa8';g.fillRect(x-6,y-12,12,3);
 g.fillStyle='#4a7fd6';g.fillRect(x-9,y-14,3,7);g.fillRect(x+6,y-14,3,7);
 g.fillStyle='#ffd9a8';g.fillRect(x-9,y-8,3,2);g.fillRect(x+6,y-8,3,2);
 g.fillRect(x-7,y-28,14,13);
 g.fillStyle='#5a3a1a';
 if(face==='up')g.fillRect(x-8,y-30,16,16);
 else{g.fillRect(x-8,y-30,16,7);
  if(face==='down'){g.fillRect(x-8,y-24,3,6);g.fillRect(x+5,y-24,3,6);g.fillStyle='#000';g.fillRect(x-4,y-22,2,3);g.fillRect(x+2,y-22,2,3)}
  else if(face==='left'){g.fillRect(x+1,y-24,7,9);g.fillStyle='#000';g.fillRect(x-4,y-22,2,3)}
  else{g.fillRect(x-8,y-24,7,9);g.fillStyle='#000';g.fillRect(x+2,y-22,2,3)}}
}
