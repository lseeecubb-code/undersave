// remodel.js — rebuilds every room as an Undertale-style map. Load after props.js, before story.js.
// It runs once at startup on whatever is in R (so room ids, enemies, NPCs, signs, chests and
// door links from maps.js are kept), and checks every new layout with a walkability test.
// A room that fails the test keeps its old layout. Add ?oldmaps to the URL to turn it off.
// Per room: set noRemodel:true to leave it alone. Rooms with a backgroundData image are skipped.

const REMODEL={version:1,enabled:!/[?&]oldmaps\b/.test(typeof location!=='undefined'?location.search:''),report:[],meta:[]};
const RM_F=[40,92,560,320];
const RM_SLOTS={1:[.5],2:[.3,.7],3:[.2,.5,.8],4:[.15,.38,.62,.85]};
const RM_KINDS=[['hall',/hollow hall/],['corridor',/wax/],['dark',/dark room/],['garden',/lantern|garden/],['road',/quiet road/],['frontier',/frontier/],['cathedral',/cathedral/],['null',/null/],['unfinished',/unfinished/],['outside',/outside/],['archive',/archive/],['hollowk',/hollow kingdom/],['margin',/margin/],['blank',/blank/],['autosave',/autosave|last save/]];

/* ---------- flavor text and roaming NPCs ---------- */
const RM_TEXT={
 tree:[["* It's a tree.","* It seems to be having a better day than you."],["* Tally marks are scratched into the bark.","* You decide not to count them."]],
 deadtree:[["* A dead tree.","* It looks like it gave up halfway through a thought."]],
 rock:[["* A rock.","* It has opinions about being stepped on."],["* A rock.","* You consider licking it. You don't."]],
 bush:[["* A bush.","* Something rustles. It's just the bush, being a bush."]],
 flowers:[["* Flowers.","* They smell like someone else's good memory."]],
 mushroom:[["* A little mushroom.","* It glows when you aren't looking."]],
 lantern:[["* A lantern.","* The flame leans toward you, politely."]],
 candelabra:[["* Candles burn in a neat row.","* One isn't lit. It's just pretending."]],
 candle:[["* A small candle.","* It's doing its best."]],
 statue:[["* A statue of someone important.","* Their name has been worn off.","* Their expression says: 'don't ask.'"]],
 armor:[["* Empty armor, polished to a shine.","* Someone keeps it clean."],["* The helmet is turned toward you.","* You wave. It does not wave back. Rude."]],
 banner:[["* A faded banner.","* The emblem is a candle. Or a very small ghost."]],
 table:[["* A table set for no one.","* The tea is still warm."]],
 crate:[["* A crate.","* Inside: more crate."]],
 barrel:[["* A barrel.","* It sloshes. You don't ask."]],
 cart:[["* A broken cart. The wheel is missing.","* Someone wrote 'sorry' on the side."]],
 waystone:[["* A waystone.","* 'MIRA WAS HERE' is scratched into it.","* The date is tomorrow."]],
 tent:[["* A tent. Nobody's home.","* The sign says: BACK IN 5 MINUTES.","* The ink has faded. It's been a while."]],
 bell:[["* A bell with no clapper.","* You decide not to touch it."]],
 sword:[["* A sword planted in the road. It's still warm.","* The nameplate reads: HERO. ATTEMPT 1."]],
 fountain:[["* A dry fountain.","* Someone threw in a single coin. It's the only thing in there."]],
 glitchcube:[["* [MISSING TEXTURE]","* It looks at you politely."]],
 journal:[["* A journal. The handwriting is yours.","* ATTEMPT 14: The sky was green. I liked that one."],["* ATTEMPT 22: I tried not fighting anyone.","* The Goblin gave me a sandwich."],["* ATTEMPT 31: Mira asked why I keep coming back.","* I said: 'Because it's unfinished.' She wrote that down."],["* ATTEMPT 40: Nothing happened.","* It was lovely."],["* The last page says:","* 'You can stop reading now.'","* You keep reading."],["* ATTEMPT 7: I forgot why I came here.","* I wrote it down so I'd remember.","* I forgot where I put it."]],
 pagepile:[["* A pile of loose pages.","* They're all blank. The top one is slightly less blank."]],
 inkpot:[["* An ink pot.","* It's been empty longer than you've been here."]],
 cursor:[["* A cursor blinks.","* It's waiting for you."]],
 strike:[["* A word, struck out.","* You can still read it if you squint.","* You decide not to."]]
};
const RM_ROAMERS={
 road:{id:'rm-pebble',name:'Short Mountain',dialogue:["* Pebble: ...","* I'm not a pebble. I'm a very short mountain.","* Please don't tell the others."]},
 frontier:{id:'rm-cook',name:'Cinder the Cook',dialogue:["* Cinder: Soup's on!","* It's mostly sky. Don't ask.","* ...It's good, though."]},
 cathedral:{id:'rm-warden',name:'Candlewarden',dialogue:["* Candlewarden: Shh.","* The bells are thinking."]},
 null:{id:'rm-echo',name:'Echo',dialogue:["* ...","* (Their lips move. You hear nothing.)","* (You nod anyway. They look relieved.)"]},
 unfinished:{id:'rm-placeholder',name:'Placeholder',dialogue:["* PLACEHOLDER: HELLO, [NAME]. WELCOME TO [ROOM].","* I was supposed to say something better.","* It's on my list."]},
 archive:{id:'rm-index',name:'Lost Index',dialogue:["* Lost Index: I'm looking for the page about me.","* It isn't there. I checked.","* I checked again."]},
 hollowk:{id:'rm-rusty',name:'Rusty',dialogue:["* Rusty: Hi! Ignore the clanking.","* We're all hollow here.","* It's not sad. It's just echoey."]},
 margin:{id:'rm-footnote',name:'Footnote',dialogue:["* Footnote: I used to live at the bottom of a page.","* Now I'm free.","* The view is much worse."]},
 blank:{id:'rm-page',name:'Little Page',dialogue:["* A little page flutters.","* There's nothing written on it.","* It looks relieved."]},
 autosave:{id:'rm-dot',name:'Loading Dot',dialogue:["* Loading...","* (It's been loading for a while.)","* (It seems fine with that.)"]}
};

/* ---------- small helpers ---------- */
function rmRng(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}}
function rmHashStr(s){let h=2166136261;for(const ch of String(s)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function rmKind(r){const n=String(r.n||'').toLowerCase(),k=RM_KINDS.find(([,re])=>re.test(n));return k?k[0]:'generic'}
const rmHit=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
function rmSub(b,z){
 if(!rmHit(b,z))return[b];
 const out=[],y0=Math.max(b.y,z.y),y1=Math.min(b.y+b.h,z.y+z.h);
 if(z.y>b.y)out.push({...b,h:z.y-b.y});
 if(z.y+z.h<b.y+b.h)out.push({...b,y:z.y+z.h,h:b.y+b.h-(z.y+z.h)});
 if(z.x>b.x)out.push({...b,y:y0,h:y1-y0,w:z.x-b.x});
 if(z.x+z.w<b.x+b.w)out.push({...b,x:z.x+z.w,y:y0,h:y1-y0,w:b.x+b.w-(z.x+z.w)});
 return out
}
const rmSolidKinds=['npc','shop','chest','wickmob'];
const rmBlocked=(c,x,y)=>c.some(b=>x+6>b.x&&x-6<b.x+b.w&&y+8>b.y&&y-4<b.y+b.h);
function rmDoorRect(side,cx,cy){const F=RM_F;return side==='left'?{x:F[0]-4,y:cy-36,w:18,h:72}:side==='right'?{x:F[0]+F[2]-14,y:cy-36,w:18,h:72}:side==='top'?{x:cx-36,y:F[1]-6,w:72,h:20}:{x:cx-36,y:F[1]+F[3]-14,w:72,h:24}}
function rmEntry(side,cx,cy){const F=RM_F;return side==='left'?{x:F[0]+38,y:cy}:side==='right'?{x:F[0]+F[2]-38,y:cy}:side==='top'?{x:cx,y:F[1]+44}:{x:cx,y:F[1]+F[3]-44}}
function rmDoorZone(d){const F=RM_F;return d.side==='left'?{x:F[0],y:d.cy-48,w:120,h:96}:d.side==='right'?{x:F[0]+F[2]-120,y:d.cy-48,w:120,h:96}:d.side==='top'?{x:d.cx-48,y:F[1],w:96,h:120}:{x:d.cx-48,y:F[1]+F[3]-120,w:96,h:120}}
const rmOpposite={left:'right',right:'left',top:'bottom',bottom:'top'};

/* ---------- templates (absolute coords inside floor [40,92,560,320]) ---------- */
const RM_TPL={
 hall({B,P}){for(const x of [150,250,350,450]){B(x-12,124,24,40);B(x-12,340,24,40)}P('rug',70,236,{w:490,h:32,col:'#6a2a3a'});P('candelabra',72,130);P('candelabra',568,130);P('statue',320,132);P('banner',190,92);P('banner',450,92);P('flowers',92,396);P('flowers',552,396);P('bush',250,398)},
 corridor({B,P}){B(40,92,560,92);B(40,320,560,92);P('rug',50,236,{w:500,h:32,col:'#6e4a2a'});for(const x of [110,250,390,520])P('candelabra',x,200);for(const x of [180,320,460])P('candelabra',x,312);P('crate',572,206)},
 dark({B,P}){B(130,128,30,44);B(480,128,30,44);B(130,330,30,44);B(480,330,30,44);for(const [x,y] of [[260,170],[390,170],[260,350],[390,350],[90,252],[560,252]])P('candle',x,y);P('rock',70,392);P('rock',568,118)},
 garden({B,P}){B(40,170,430,26,'hedge');B(170,262,430,26,'hedge');B(330,330,120,56,'water');for(const [x,y] of [[110,166],[260,166],[400,166],[250,258],[400,258],[540,258]])P('lantern',x,y);P('flowers',80,140);P('flowers',520,140);P('flowers',100,240);P('flowers',300,232);P('mushroom',70,392);P('flowers',250,392);P('statue',560,398)},
 road({B,P}){for(const [x,y] of [[70,138],[150,126],[260,142],[380,130],[490,140],[570,126],[70,402],[170,410],[300,398],[420,408],[520,396],[250,236],[390,300],[480,214]])P('tree',x,y);P('rock',200,306);P('rock',330,196);P('waystone',310,258);P('cart',140,334);P('flowers',450,250);P('bush',560,300);P('bush',100,200)},
 frontier({B,P}){B(300,92,44,138,'void');B(300,290,44,122,'void');P('rug',296,230,{w:52,h:60,planks:true});P('tent',130,150);P('tent',150,372);P('crate',210,206);P('barrel',236,206);P('deadtree',470,132);P('deadtree',548,386);P('rock',450,306);P('crate',510,232);P('barrel',536,212)},
 cathedral({B,P}){for(let i=0;i<5;i++){const x=90+i*108;B(x,126,76,20,'pew');B(x,160,76,20,'pew');B(x,346,76,20,'pew');B(x,380,76,20,'pew')}P('rug',60,238,{w:500,h:30,col:'#5a1a2a'});for(const x of [150,330,510]){P('candelabra',x,194);P('candelabra',x,342)}P('bell',330,266)},
 null({B}){for(const [x,y] of [[150,150],[260,330],[380,170],[480,300],[220,230],[540,160],[110,330]])B(x-11,y-34,22,40,'monolith')},
 unfinished({B,P}){B(130,130,70,30,'glitch');B(130,130,30,90,'glitch');B(400,330,90,30,'glitch');B(460,260,30,100,'glitch');B(260,200,40,40,'glitch');P('glitchcube',350,150);P('glitchcube',220,350);P('glitchcube',520,200)},
 outside({B}){for(const [x,y] of [[100,140],[516,140],[100,360],[516,360]])B(x,y,24,30,'monolith')},
 archive({B,P}){B(40,170,480,34,'shelf');B(120,290,480,34,'shelf');for(const [x,y] of [[260,152],[540,262],[160,262],[540,402],[100,402],[420,402]])P('journal',x,y);P('pagepile',420,262);P('pagepile',80,152);P('inkpot',560,152);P('candelabra',330,402)},
 hollowk({B,P}){for(let i=0;i<6;i++){P('armor',100+i*90,150);P('armor',100+i*90,376)}P('sword',320,256);P('statue',70,398);P('banner',160,92);P('banner',480,92);P('rock',560,120)},
 margin({B,P}){B(150,140,90,56,'erased');B(330,290,110,70,'erased');B(470,130,60,100,'erased');B(80,300,70,60,'erased');P('strike',270,230);P('strike',420,200);P('strike',170,380);P('strike',520,340);P('inkpot',300,142)},
 blank({P}){P('cursor',400,262);P('inkpot',150,350);P('pagepile',470,150);P('pagepile',180,160)},
 autosave({B}){for(let i=0;i<5;i++){B(110+i*110,120,22,34,'monolith');B(110+i*110,350,22,34,'monolith')}},
 generic({B,P}){B(150,140,30,44);B(450,140,30,44);B(150,320,30,44);B(450,320,30,44);P('candle',300,160);P('flowers',100,380);P('rock',560,390)}
};
function rmContext(seed){const blocks=[],props=[],rnd=rmRng(seed);return{rnd,blocks,props,B:(x,y,w,h,s)=>blocks.push(s?{x,y,w,h,style:s}:{x,y,w,h}),P:(k,x,y,o)=>props.push({k,x,y,...(o||{})})}}

/* ---------- metadata: which side each door is on, and where you arrive ---------- */
function rmMeta(){
 const meta=R.map(r=>{
  const oldF=Array.isArray(r.f)&&r.f.length>=4?r.f.slice(0,4).map(Number):RM_F.slice(),F=RM_F,groups={left:[],right:[],top:[],bottom:[]};
  (r.d||[]).forEach((d,k)=>{
   const cx=d.x+d.w/2,cy=d.y+d.h/2,dist={left:Math.abs(cx-oldF[0]),right:Math.abs(cx-oldF[0]-oldF[2]),top:Math.abs(cy-oldF[1]),bottom:Math.abs(cy-oldF[1]-oldF[3])},
    side=Object.keys(dist).sort((a,b)=>dist[a]-dist[b])[0];
   groups[side].push({k,key:(side==='left'||side==='right')?cy:cx})
  });
  const doors=[];
  for(const side in groups){
   const list=groups[side].sort((a,b)=>a.key-b.key),n=list.length;
   list.forEach((e,j)=>{
    const frac=(RM_SLOTS[n]||[])[j]??((j+1)/(n+1)),horiz=side==='left'||side==='right',
     cx=horiz?(side==='left'?F[0]:F[0]+F[2]):F[0]+F[2]*frac,cy=horiz?F[1]+F[3]*frac:(side==='top'?F[1]:F[1]+F[3]);
    doors[e.k]={k:e.k,side,cx,cy,rect:rmDoorRect(side,cx,cy),entry:rmEntry(side,cx,cy),to:r.d[e.k].to}
   })
  }
  return{kind:rmKind(r),oldF,doors,incoming:[]}
 });
 meta.forEach((m,x)=>{
  const used={};
  m.doors.forEach(d=>{
   if(!d||d.to<0||d.to>=R.length)return;
   const y=d.to,back=meta[y].doors.filter(b=>b&&b.to===x),b=back[used[y]||0]||back[0];used[y]=(used[y]||0)+1;
   const o=rmOpposite[d.side];d.arrive=b?{x:b.entry.x,y:b.entry.y}:rmEntry(o,RM_F[0]+RM_F[2]/2,RM_F[1]+RM_F[3]/2);
   meta[y].incoming.push(d.arrive)
  })
 });
 return meta
}

/* ---------- object placement and verification ---------- */
function rmFree(F,x,y,c,zones,placed,needBelow){
 const ok=(px,py)=>{
  if(px<F[0]+26||px>F[0]+F[2]-26||py<F[1]+36||py>F[1]+F[3]-14)return false;
  const box={x:px-16,y:py-18,w:32,h:26};
  if(c.some(b=>rmHit(box,b))||zones.some(z=>rmHit(box,z)))return false;
  if(placed.some(q=>Math.abs(q.x-px)<36&&Math.abs(q.y-py)<26))return false;
  if(needBelow){const bx=px+14,by=py+34;if(bx>F[0]+F[2]-10||by>F[1]+F[3]-2||rmBlocked(c,bx,by))return false}
  return true
 };
 for(let r=0;r<=300;r+=8){const n=r?Math.max(8,Math.round(r/5)):1;for(let k=0;k<n;k++){const a=k/n*Math.PI*2,px=Math.round(x+Math.cos(a)*r),py=Math.round(y+Math.sin(a)*r);if(ok(px,py))return{x:px,y:py}}}
 return{x:Math.round(Math.min(F[0]+F[2]-30,Math.max(F[0]+30,x))),y:Math.round(Math.min(F[1]+F[3]-20,Math.max(F[1]+40,y)))}
}
function rmVerify(F,c,objs,trig,starts){
 const S=4,x0=F[0]+7,x1=F[0]+F[2]-7,y0=F[1]+10,y1=F[1]+F[3],nx=Math.floor((x1-x0)/S)+1,ny=Math.floor((y1-y0)/S)+1,
  solids=objs.filter(o=>rmSolidKinds.includes(o.k)),blk=new Uint8Array(nx*ny);
 for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const x=x0+i*S,y=y0+j*S;blk[j*nx+i]=(rmBlocked(c,x,y)||solids.some(o=>Math.abs(x-o.x)<20&&Math.abs(y-o.y)<12))?1:0}
 const idx=(x,y)=>{const i=Math.round((x-x0)/S),j=Math.round((y-y0)/S);return i<0||j<0||i>=nx||j>=ny?-1:j*nx+i};
 const seen=new Uint8Array(nx*ny),q=[],s0=idx(starts[0].x,starts[0].y);
 if(s0<0||blk[s0])return[{what:'start blocked'}];
 seen[s0]=1;q.push(s0);
 for(let h=0;h<q.length;h++){const k=q[h],i=k%nx,j=(k-i)/nx;for(const[di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]){const a=i+di,b=j+dj;if(a<0||b<0||a>=nx||b>=ny)continue;const n=b*nx+a;if(!seen[n]&&!blk[n]){seen[n]=1;q.push(n)}}}
 const reach=(x,y)=>{const k=idx(x,y);return k>=0&&seen[k]===1},
  box=(x,y,w,h)=>{for(let yy=y;yy<=y+h;yy+=S)for(let xx=x;xx<=x+w;xx+=S)if(reach(xx,yy))return true;return false},
  bad=[];
 for(const p of starts)if(!reach(p.x,p.y))bad.push({what:'door/arrival unreachable'});
 for(const o of objs){
  if(o.k==='save'){if(!reach(o.x+14,o.y+34))bad.push({obj:o,what:'save respawn blocked'})}
  else if((o.t||['npc','shop','chest'].includes(o.k))&&!box(o.x-30,o.y-26,60,52))bad.push({obj:o,what:o.k+' unreachable'})
 }
 for(const t of trig)if(!box(t.x,t.y,t.w,t.h))bad.push({trig:t,what:'trigger unreachable'});
 return bad
}
function rmBand(m){
 const F=RM_F,ds=m.doors.filter(Boolean);if(!ds.length)return null;
 const rank=d=>d.to<0?1e9:d.to,ex=ds.slice().sort((a,b)=>rank(b)-rank(a))[0],side=ds.length===1?rmOpposite[ex.side]:ex.side;
 if(side==='right')return{x:F[0]+F[2]*.62-14,y:F[1],w:28,h:F[3],side};
 if(side==='left')return{x:F[0]+F[2]*.38-14,y:F[1],w:28,h:F[3],side};
 if(side==='top')return{x:F[0],y:F[1]+F[3]*.38-14,w:F[2],h:28,side};
 return{x:F[0],y:F[1]+F[3]*.62-14,w:F[2],h:28,side}
}
function rmSavePos(band){
 const F=RM_F,cx=F[0]+F[2]/2,cy=F[1]+F[3]/2;
 return band.side==='right'?{x:F[0]+F[2]*.3,y:cy-50}:band.side==='left'?{x:F[0]+F[2]*.7,y:cy-50}:band.side==='top'?{x:cx-50,y:F[1]+F[3]*.7}:{x:cx-50,y:F[1]+F[3]*.3}
}

/* ---------- build a plan for one room ---------- */
function rmPlan(i,tier){
 const r=R[i],m=REMODEL.meta[i],F=RM_F,oldF=m.oldF,seed=rmHashStr((r.id||'')+'|'+(r.n||'')+'|'+i),zones=[];
 m.doors.forEach(d=>zones.push(rmDoorZone(d)));m.incoming.forEach(p=>zones.push({x:p.x-34,y:p.y-34,w:68,h:68}));
 const cx=rmContext(seed);(RM_TPL[m.kind]||RM_TPL.generic)(cx);
 const c=[],propList=[];
 if(tier<2)for(const b of cx.blocks){let pieces=[b];for(const z of zones)pieces=pieces.flatMap(p=>rmSub(p,z));for(const p of pieces)if(p.w>=10&&p.h>=10)c.push(p)}
 for(const p of cx.props){
  const foot=PROP_SOLID[p.k],special=p.k==='rug'||p.k==='banner';
  if(!special&&zones.some(z=>rmHit({x:p.x-6,y:p.y-10,w:12,h:12},z)))continue;
  if(foot&&tier>=1)continue;
  if(!special&&c.some(b=>rmHit({x:p.x-8,y:p.y-12,w:16,h:14},b)))continue;
  if(foot){const fp={x:p.x-foot[0]/2,y:p.y-foot[1],w:foot[0],h:foot[1],inv:true};if(c.some(b=>rmHit(fp,b)))continue;c.push(fp)}
  const t=RM_TEXT[p.k];propList.push({...p,...(t?{t:t[Math.floor(cx.rnd()*t.length)]}:{}),_ok:true})
 }
 const placed=propList.filter(p=>p.t).map(p=>({x:p.x,y:p.y})),objs=[];
 for(const o of r.o||[]){
  const ox=Number.isFinite(+o.x)?+o.x:oldF[0]+oldF[2]/2,oy=Number.isFinite(+o.y)?+o.y:oldF[1]+oldF[3]/2,
   mx=oldF[2]?(ox-oldF[0])/oldF[2]:.5,my=oldF[3]?(oy-oldF[1])/oldF[3]:.5,
   p=rmFree(F,F[0]+mx*F[2],F[1]+my*F[3],c,zones,placed,o.k==='save');
  objs.push({...o,x:p.x,y:p.y,_ok:true});placed.push(p)
 }
 const trig=[];let band=null;
 for(const t of r.triggers||[]){
  if(t.k==='enemy'&&!band){band=rmBand(m);if(band){const{side,...rect}=band;trig.push({...t,...rect});continue}}
  const w=Math.max(8,(+t.w||40)*F[2]/(oldF[2]||F[2])),h=Math.max(8,(+t.h||40)*F[3]/(oldF[3]||F[3]));
  trig.push({...t,x:Math.round(Math.min(F[0]+F[2]-w,Math.max(F[0],F[0]+((+t.x||0)-oldF[0])/(oldF[2]||F[2])*F[2]))),y:Math.round(Math.min(F[1]+F[3]-h,Math.max(F[1],F[1]+((+t.y||0)-oldF[1])/(oldF[3]||F[3])*F[3]))),w:Math.round(w),h:Math.round(h)})
 }
 if(band&&!objs.some(o=>o.k==='save')){const sp=rmSavePos(band),p=rmFree(F,sp.x,sp.y,c,zones,placed,true);objs.push({k:'save',x:p.x,y:p.y,_ok:true});placed.push(p)}
 if(tier<3&&!['dark','outside','autosave','blank'].includes(m.kind)){
  for(const [fx,fy] of [[.07,.2],[.93,.88],[.5,.9],[.5,.15]]){
   const tx0=F[0]+fx*F[2],ty0=F[1]+fy*F[3],p=rmFree(F,tx0,ty0,c,zones,placed,false);
   if(Math.hypot(p.x-tx0,p.y-ty0)<70){objs.push({k:'chest',id:'rm-'+(r.id||i)+'-chest',x:p.x,y:p.y,t:['* You found 1 BUN.','* It was tucked away like a secret.'],_ok:true,_opt:true});placed.push(p);break}
  }
 }
 const roamer=RM_ROAMERS[m.kind];
 if(roamer&&tier<3){const p=rmFree(F,F[0]+F[2]*.3,F[1]+F[3]*.3,c,zones,placed,false);objs.push({k:'npc',npcId:roamer.id,x:p.x,y:p.y,_ok:true,_opt:true});placed.push(p)}
 const starts=[...m.incoming,...m.doors.filter(Boolean).map(d=>d.entry)];if(!starts.length)starts.push({x:F[0]+60,y:F[1]+F[3]/2});
 let bad=rmVerify(F,c,objs,trig,starts),pass=0;
 while(bad.length&&pass++<3){
  // extras (chest, roaming NPC) and non-boss triggers may be dropped; anything else fails the layout
  const dropO=bad.filter(b=>b.obj&&b.obj._opt).map(b=>b.obj),dropT=bad.filter(b=>b.trig&&b.trig.k!=='enemy').map(b=>b.trig);
  if(!dropO.length&&!dropT.length)break;
  for(const o of dropO)objs.splice(objs.indexOf(o),1);
  for(const t of dropT)trig.splice(trig.indexOf(t),1);
  bad=rmVerify(F,c,objs,trig,starts)
 }
 if(bad.length)return{ok:false,bad};
 for(const o of objs)delete o._opt;
 return{ok:true,F,c,o:[...objs,...propList],trig,doors:(r.d||[]).map((d,k)=>({...d,...m.doors[k].rect})),roamer}
}

/* ---------- apply everything ---------- */
function rmEligible(r){return r&&Array.isArray(r.f)&&r.f.length>=4&&!r.noRemodel&&!r.backgroundData&&r.remodelV==null&&r.remodelSkip==null}
function remodelAll(){
 if(!REMODEL.enabled||typeof R==='undefined'||!Array.isArray(R))return;
 REMODEL.meta=rmMeta();REMODEL.report=[];
 const plans=R.map((r,i)=>{
  if(!rmEligible(r))return null;
  for(let tier=0;tier<=2;tier++){const p=rmPlan(i,tier);if(p.ok){p.tier=tier;return p}}
  return null
 });
 plans.forEach((p,i)=>{
  const r=R[i];
  if(!rmEligible(r)){REMODEL.report.push({room:i,name:r&&r.n,result:'skipped'});return}
  if(!p){r.remodelSkip=REMODEL.version;REMODEL.report.push({room:i,name:r.n,result:'kept old layout (new one failed the walk test)'});return}
  r.f=p.F.slice();r.c=p.c;r.o=p.o;r.d=p.doors;r.triggers=p.trig;r.remodelV=REMODEL.version;
  if(p.roamer&&typeof NPCS!=='undefined'&&!NPCS.some(n=>n.id===p.roamer.id))NPCS.push({...p.roamer});
  REMODEL.report.push({room:i,name:r.n,result:'remodeled',detail:'layout tier '+p.tier+(p.tier?' (simplified to stay walkable)':'')})
 });
 // keep door arrivals and spawn points in sync with the new layouts
 R.forEach((r,x)=>(r.d||[]).forEach((d,k)=>{
  const dm=REMODEL.meta[x]&&REMODEL.meta[x].doors[k];
  if(!dm||!dm.arrive||d.to<0||!R[d.to]||R[d.to].remodelV!==REMODEL.version)return;
  d.px=dm.arrive.x;d.py=dm.arrive.y;
  if(d.arrivalSpawnId!=null&&d.arrivalSpawnId!==''){const sp=(R[d.to].spawns||[]).find(s=>String(s.id)===String(d.arrivalSpawnId));if(sp){sp.x=dm.arrive.x;sp.y=dm.arrive.y}}
 }));
 rmFixPlayer();
 const kept=REMODEL.report.filter(e=>/kept/.test(e.result));
 console.log('[remodel] '+REMODEL.report.filter(e=>e.result==='remodeled').length+' rooms remodeled'+(kept.length?', '+kept.length+' kept old layout: '+kept.map(e=>e.name).join(', '):''))
}

/* ---------- keep the player and new objects from getting stuck ---------- */
function rmSolidLive(r,x,y){return rmBlocked(r.c||[],x,y)||(r.o||[]).some(o=>rmSolidKinds.includes(o.k)&&!(o.k==='wickmob'&&beaten)&&Math.abs(x-o.x)<20&&Math.abs(y-o.y)<12)}
function rmInside(r,x,y){const f=r.f;return x>=f[0]+7&&x<=f[0]+f[2]-7&&y>=f[1]+10&&y<=f[1]+f[3]}
function rmSafePoint(r,x,y){
 const f=r.f,doors=r.d||[];
 for(let rad=0;rad<=400;rad+=8){const n=rad?Math.max(8,Math.round(rad/4)):1;for(let k=0;k<n;k++){const a=k/n*Math.PI*2,px=Math.round(x+Math.cos(a)*rad),py=Math.round(y+Math.sin(a)*rad);
  if(rmInside(r,px,py)&&!rmSolidLive(r,px,py)&&!doors.some(d=>px+14>d.x&&px-14<d.x+d.w&&py+4>d.y&&py-14<d.y+d.h))return{x:px,y:py}}}
 return{x:f[0]+f[2]/2,y:f[1]+f[3]/2}
}
function rmFixPlayer(){
 try{
  const r=R[rm];
  if(r&&r.remodelV===REMODEL.version&&(!rmInside(r,pl.x,pl.y)||rmSolidLive(r,pl.x,pl.y)))pl=rmSafePoint(r,pl.x,pl.y);
  if(typeof resp!=='undefined'&&resp&&R[resp.rm]&&R[resp.rm].remodelV===REMODEL.version){const q=R[resp.rm];if(!rmInside(q,resp.x,resp.y)||rmSolidLive(q,resp.x,resp.y)){const p=rmSafePoint(q,resp.x,resp.y);resp={rm:resp.rm,x:p.x,y:p.y}}}
 }catch(e){console.warn('[remodel] could not fix player position',e)}
}
function rmGuard(){
 const r=R[rm];if(!r||!REMODEL.enabled)return;
 for(const o of r.o||[])if(!o._ok){
  o._ok=true;
  if(o.t||o.k==='npc'||o.k==='wick'){
   const box={x:o.x-16,y:o.y-18,w:32,h:26};
   if((r.c||[]).some(b=>rmHit(box,b))){const p=rmFree(r.f,o.x,o.y,r.c||[],[],r.o.filter(q=>q!==o&&q._ok),false);o.x=p.x;o.y=p.y}
  }
 }
 if(st==='world'&&r.remodelV===REMODEL.version&&rmSolidLive(r,pl.x,pl.y))pl=rmSafePoint(r,pl.x,pl.y)
}
function rmEnsure(){
 if(!REMODEL.enabled||typeof R==='undefined'||!Array.isArray(R))return;
 if(R.some(rmEligible)){try{remodelAll()}catch(e){console.error('[remodel] failed',e);for(const r of R)if(rmEligible(r))r.remodelSkip=REMODEL.version}}
}

const _rmUpd=updWorld;
updWorld=function(){rmEnsure();try{rmGuard()}catch(e){console.warn('[remodel] guard',e)}_rmUpd()};
const _rmDraw=drawWorld;
drawWorld=function(){rmEnsure();_rmDraw()};
setTimeout(rmEnsure,0);
