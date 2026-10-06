// props.js — Undertale-style props used by remodel.js. Load AFTER look.js, BEFORE remodel.js.
// PROP_SOLID lists props that block the player: kind -> [footprint width, footprint depth].
const PROP_SOLID={tree:[26,10],deadtree:[18,8],rock:[20,8],lantern:[12,8],candelabra:[14,8],statue:[22,10],armor:[18,8],table:[40,12],crate:[22,10],barrel:[18,10],cart:[44,12],waystone:[16,8],tent:[48,12],bell:[22,10],sword:[10,6],fountain:[50,14],glitchcube:[20,10]};

function pShadow(x,y,rx){g.fillStyle='rgba(0,0,0,.3)';g.beginPath();g.ellipse(x,y,rx,3,0,0,7);g.fill()}
function pGlow(x,y,r,a,col){g.fillStyle='rgba('+col+','+a+')';g.beginPath();g.arc(x,y,r,0,7);g.fill()}
function pFlame(x,y,h){g.fillStyle='#ff7a00';g.fillRect(x-2,y-h,4,h);g.fillStyle='#ffe066';g.fillRect(x-1,y-h+2,2,Math.max(1,h-3))}

const PROP_DRAW={
 tree(x,y){pShadow(x,y,14);g.fillStyle='#5a3a1f';g.fillRect(x-3,y-16,6,16);g.fillStyle='#285a31';g.fillRect(x-15,y-26,30,10);g.fillStyle='#2f6b3a';g.fillRect(x-14,y-40,28,16);g.fillStyle='#3c8a4a';g.fillRect(x-9,y-48,18,10);g.fillStyle='#4aa05a';g.fillRect(x-6,y-44,6,3)},
 deadtree(x,y){pShadow(x,y,9);g.fillStyle='#4a4038';g.fillRect(x-3,y-36,6,36);g.fillRect(x-12,y-30,10,2);g.fillRect(x+3,y-24,12,2);g.fillRect(x-10,y-38,2,8);g.fillRect(x+12,y-32,2,8)},
 rock(x,y){pShadow(x,y,11);g.fillStyle='#55555e';g.fillRect(x-10,y-4,20,4);g.fillStyle='#7a7a84';g.fillRect(x-10,y-9,20,6);g.fillStyle='#9a9aa6';g.fillRect(x-7,y-12,12,4)},
 bush(x,y){g.fillStyle='#24502d';g.fillRect(x-11,y-7,22,7);g.fillStyle='#2f6b3a';g.fillRect(x-9,y-12,18,7);g.fillStyle='#4aa05a';g.fillRect(x-4,y-11,4,2)},
 flowers(x,y){for(let i=0;i<5;i++){const fx=x-10+i*5,fy=y-2-(i%2)*3;g.fillStyle='#2f6b3a';g.fillRect(fx,fy-5,1,5);g.fillStyle=i%2?'#ffd84a':'#ff7ab8';g.fillRect(fx-1,fy-8,3,3)}},
 mushroom(x,y){g.fillStyle='#eee';g.fillRect(x-2,y-4,4,4);g.fillStyle='#c04a6a';g.fillRect(x-5,y-8,10,4);g.fillStyle='#fff';g.fillRect(x-3,y-7,2,2);pGlow(x,y-5,9,.07+.04*Math.sin(fr*.08+x),'255,120,160')},
 lantern(x,y){pShadow(x,y,6);g.fillStyle='#333';g.fillRect(x-1,y-30,2,30);g.fillStyle='#ffd27a';g.fillRect(x-5,y-38,10,9);g.fillStyle='#fff2c7';g.fillRect(x-2,y-36,4,5);pGlow(x,y-33,24,.1+.04*Math.sin(fr*.2+x),'255,210,120')},
 candelabra(x,y){pShadow(x,y,8);g.fillStyle='#8a6a2a';g.fillRect(x-6,y-4,12,4);g.fillRect(x-1,y-20,2,16);g.fillRect(x-8,y-20,16,2);for(const dx of [-8,0,8])pFlame(x+dx,y-22,5+Math.sin(fr*.3+dx+x)*1.5);pGlow(x,y-26,22,.08+.03*Math.sin(fr*.2+x),'255,190,100')},
 candle(x,y){g.fillStyle='#e8dcc0';g.fillRect(x-3,y-8,6,8);pFlame(x,y-8,5+Math.sin(fr*.3+x)*1.5);pGlow(x,y-12,16,.08,'255,190,100')},
 statue(x,y){pShadow(x,y,12);g.fillStyle='#6a6a74';g.fillRect(x-10,y-8,20,8);g.fillStyle='#8a8a96';g.fillRect(x-6,y-30,12,22);g.fillRect(x-5,y-38,10,8);g.fillStyle='#6a6a76';g.fillRect(x+1,y-30,5,22)},
 armor(x,y){pShadow(x,y,9);g.fillStyle='#7a8094';g.fillRect(x-6,y-10,4,10);g.fillRect(x+2,y-10,4,10);g.fillStyle='#9aa0b4';g.fillRect(x-8,y-24,16,14);g.fillRect(x-6,y-34,12,10);g.fillStyle='#222';g.fillRect(x-4,y-30,8,2);if(fr%240<6){g.fillStyle='#fff';g.fillRect(x-5,y-33,2,2)}},
 banner(x,y){g.fillStyle='#5b3b20';g.fillRect(x-9,y-46,18,2);g.fillStyle='#7a2a4a';g.fillRect(x-7,y-44,14,28);g.fillRect(x-7,y-16,4,4);g.fillRect(x+3,y-16,4,4);g.fillStyle='#ffd27a';g.fillRect(x-1,y-36,2,8);pFlame(x,y-36,4)},
 table(x,y){pShadow(x,y,22);g.fillStyle='#5b3b20';g.fillRect(x-18,y-10,3,10);g.fillRect(x+15,y-10,3,10);g.fillStyle='#7a5636';g.fillRect(x-20,y-16,40,6);g.fillStyle='#e8dcc0';g.fillRect(x-4,y-21,6,5)},
 crate(x,y){pShadow(x,y,12);g.fillStyle='#8a6334';g.fillRect(x-10,y-16,20,16);g.fillStyle='#5b3b20';g.fillRect(x-10,y-16,20,2);g.fillRect(x-10,y-2,20,2);g.fillRect(x-1,y-16,2,16)},
 barrel(x,y){pShadow(x,y,10);g.fillStyle='#7a5030';g.fillRect(x-8,y-18,16,18);g.fillStyle='#444';g.fillRect(x-8,y-14,16,2);g.fillRect(x-8,y-6,16,2)},
 cart(x,y){pShadow(x,y,24);g.fillStyle='#7a5636';g.fillRect(x-20,y-18,40,10);g.fillStyle='#5b3b20';g.fillRect(x-20,y-18,40,2);g.fillStyle='#3a2a18';g.fillRect(x-16,y-8,8,8);g.fillStyle='#333';g.fillRect(x+10,y-4,12,2)},
 waystone(x,y){pShadow(x,y,9);g.fillStyle='#8a8a98';g.fillRect(x-7,y-26,14,26);g.fillStyle='#a8a8b8';g.fillRect(x-5,y-30,10,4);g.fillStyle='#cfd0ff';g.fillRect(x-2,y-18,4,2);g.fillRect(x-1,y-14,2,5);pGlow(x,y-16,18,.06+.03*Math.sin(fr*.07),'180,190,255')},
 tent(x,y){pShadow(x,y,26);g.fillStyle='#b0804a';g.beginPath();g.moveTo(x-26,y);g.lineTo(x,y-38);g.lineTo(x+26,y);g.fill();g.fillStyle='#8a5e32';g.beginPath();g.moveTo(x,y-38);g.lineTo(x+26,y);g.lineTo(x+4,y);g.fill();g.fillStyle='#2a1a0e';g.beginPath();g.moveTo(x-6,y);g.lineTo(x,y-16);g.lineTo(x+6,y);g.fill()},
 bell(x,y){pShadow(x,y,12);g.fillStyle='#5a4a3a';g.fillRect(x-14,y-34,3,34);g.fillRect(x+11,y-34,3,34);g.fillRect(x-14,y-36,28,3);g.fillStyle='#c9a13a';g.fillRect(x-8,y-30,16,16);g.fillRect(x-11,y-16,22,5);g.fillStyle='#1a1408';g.fillRect(x-5,y-11,10,3)},
 sword(x,y){g.fillStyle='#6a6a74';g.fillRect(x-8,y-3,16,3);g.fillStyle='#cfd6e6';g.fillRect(x-1,y-32,2,28);g.fillStyle='#9aa0b4';g.fillRect(x-6,y-28,12,2);g.fillStyle='#5b3b20';g.fillRect(x-1,y-34,2,6);pGlow(x,y-18,18,.07+.03*Math.sin(fr*.06),'255,200,120')},
 fountain(x,y){pShadow(x,y,26);g.fillStyle='#6a6a78';g.fillRect(x-24,y-10,48,10);g.fillStyle='#2a2a32';g.fillRect(x-20,y-9,40,5);g.fillStyle='#8a8a98';g.fillRect(x-3,y-26,6,16);g.fillRect(x-8,y-28,16,3);g.fillStyle='#e0b040';g.fillRect(x+8,y-8,3,2)},
 glitchcube(x,y){for(let i=0;i<4;i++){g.fillStyle=(i+(fr>>5))%2?'#d000d0':'#111';g.fillRect(x-10+(i%2)*10,y-20+Math.floor(i/2)*10,10,10)}},
 journal(x,y){g.fillStyle='#8a3b3b';g.fillRect(x-6,y-6,12,6);g.fillStyle='#e8dcc0';g.fillRect(x-5,y-8,10,3);g.fillStyle='#ffe066';g.fillRect(x-1,y-13+Math.sin(fr*.1)*1.5,2,2)},
 pagepile(x,y){g.fillStyle='#e8dcc0';g.fillRect(x-8,y-4,16,4);g.fillStyle='#fff8e0';g.fillRect(x-6,y-7,13,3);g.fillStyle='#d8ccae';g.fillRect(x-3,y-9,9,2)},
 inkpot(x,y){g.fillStyle='#222';g.fillRect(x-4,y-7,8,7);g.fillStyle='#555';g.fillRect(x-3,y-8,6,2);g.fillStyle='#eee';g.fillRect(x+3,y-16,2,10)},
 cursor(x,y){if(fr%60<40){g.fillStyle='#333';g.fillRect(x-1,y-22,3,22)}},
 strike(x,y){g.fillStyle='#777';for(let i=0;i<5;i++)g.fillRect(x-14+i*6,y-8,4,6);g.fillStyle='#b33';g.fillRect(x-16,y-5,32,2)},
 rug(x,y,o){const w=o.w||60,h=o.h||30;
  if(o.planks){g.fillStyle='#6a4a2a';g.fillRect(x,y,w,h);g.fillStyle='#4a3018';for(let i=6;i<w;i+=8)g.fillRect(x+i,y,1,h)}
  else{g.fillStyle=o.col||'#7a2a3a';g.fillRect(x,y,w,h);g.fillStyle='#c9a13a';g.fillRect(x,y,w,2);g.fillRect(x,y+h-2,w,2);g.fillStyle='rgba(0,0,0,.18)';for(let i=8;i<w-4;i+=16)g.fillRect(x+i,y+6,6,h-12)}}
};

const _propObjBase=obj;
obj=function(o){const f=PROP_DRAW[o.k];if(f)f(o.x,o.y,o);else _propObjBase(o)};
