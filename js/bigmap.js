// bigmap.js — scrolling camera, rooms bigger than the screen, and custom tile layers. 
// Load AFTER npclife.js and BEFORE main.js. Needs the small edits already made in the supplied world.js.
//
// ROOMS: a room's floor f:[x,y,w,h] may now be larger than 640x480. The camera follows the player and
//        stops at the room edges. Rooms that fit on screen keep the old fixed view.
// TILES: GAME_TILES = [{id,name,s:16|32,pal:{a:'#rrggbb'},px:'....aab...',solid:false}]   (px: s*s chars, '.' = clear)
// TILEMAP (optional, per room): r.tm = {x,y,w,h,pal:['tileId',...],b:['0012..',...],a:[...]}
//        32px cells starting at x,y. Each row is a string, one character per cell: '0' empty, '1'-'9','a'-'z' = pal[0..34].
//        b = drawn on the floor (under everything), a = drawn above the player (tree tops, arches).
//        A tile with solid:true on the b layer blocks the player and walking NPCs.
(function(){
const BM=window.BIGMAP={version:1,tileV:0,size:[640,480],room:null,errors:0,maxDim:4096};
const CELL=32,CH='0123456789abcdefghijklmnopqrstuvwxyz';
const CAM=window.CAM={x:0,y:0,fx:0,fy:0,room:-1,smooth:1};   // smooth<1 eases the camera (1 = rigid, like Undertale)
function fail(e){if(!BM.errors++)console.error('[bigmap]',e)}
const tiles=()=>typeof GAME_TILES!=='undefined'?GAME_TILES:(window.GAME_TILES=window.GAME_TILES||[]);
const tileById=id=>tiles().find(t=>t.id===id);
tiles();

/* ---------- tile images ---------- */
const img={};
function tileCanvas(t){
 const e=img[t.id];if(e&&e.v===BM.tileV&&e.t===t)return e.c;
 const s=t.s||16,c=document.createElement('canvas');c.width=c.height=s;
 const k=c.getContext('2d'),d=k.createImageData(s,s);
 for(let i=0;i<s*s;i++){
  const ch=t.px&&t.px[i],col=ch&&ch!=='.'&&t.pal?t.pal[ch]:null;
  if(!col||col[0]!=='#'||col.length<7)continue;
  const n=parseInt(col.slice(1,7),16);d.data[i*4]=n>>16&255;d.data[i*4+1]=n>>8&255;d.data[i*4+2]=n&255;d.data[i*4+3]=255
 }
 k.putImageData(d,0,0);img[t.id]={v:BM.tileV,t,c};return c
}

/* ---------- tilemap helpers ---------- */
function tmNew(r){const f=r.f;return{x:f[0],y:f[1],w:Math.ceil(f[2]/CELL),h:Math.ceil(f[3]/CELL),pal:[],b:[],a:[]}}
function rowsFix(tm,layer){
 const rows=tm[layer]=tm[layer]||[];
 for(let y=0;y<tm.h;y++){let s=rows[y]||'';if(s.length<tm.w)s+='0'.repeat(tm.w-s.length);else if(s.length>tm.w)s=s.slice(0,tm.w);rows[y]=s}
 rows.length=tm.h;return rows
}
function tmResize(tm,w,h){tm.w=w;tm.h=h;rowsFix(tm,'b');rowsFix(tm,'a')}
function tmGet(tm,layer,cx,cy){
 const row=tm[layer]&&tm[layer][cy];
 if(!row||cx<0||cx>=tm.w||cy<0||cy>=tm.h)return 0;
 const i=CH.indexOf(row[cx]);return i<0?0:i
}
function tmSet(tm,layer,cx,cy,id){   // id null erases; returns false if outside the map or the room already uses 35 tiles
 if(cx<0||cy<0||cx>=tm.w||cy>=tm.h)return false;
 let idx=0;
 if(id){idx=tm.pal.indexOf(id)+1;if(!idx){if(tm.pal.length>=35)return false;tm.pal.push(id);idx=tm.pal.length}}
 let rows=tm[layer];
 if(!rows||rows.length!==tm.h||rows[cy]===undefined||rows[cy].length!==tm.w)rows=rowsFix(tm,layer);
 const row=rows[cy];rows[cy]=row.slice(0,cx)+CH[idx]+row.slice(cx+1);return true
}
function solidMask(tm){
 const k=BM.tileV+'|'+tm.pal.join(',');
 if(tm.__sk===k)return tm.__sm;
 tm.__sk=k;tm.__sm=tm.pal.map(id=>{const t=tileById(id);return !!(t&&t.solid)});return tm.__sm
}
function tmBlocks(r,x0,y0,x1,y1){
 const tm=r&&r.tm;if(!tm||!tm.pal.length)return false;
 const m=solidMask(tm);if(!m.some(Boolean))return false;
 const c0=Math.floor((x0-tm.x)/CELL),c1=Math.floor((x1-tm.x)/CELL),r0=Math.floor((y0-tm.y)/CELL),r1=Math.floor((y1-tm.y)/CELL);
 for(let cy=r0;cy<=r1;cy++)for(let cx=c0;cx<=c1;cx++){const i=tmGet(tm,'b',cx,cy);if(i&&m[i-1])return true}
 return false
}
window.tileBlocks=tmBlocks;
window.tileSolidAt=(r,x,y)=>tmBlocks(r,x-6,y-4,x+5.99,y+7.99);   // same probe box world.js uses for the player

function drawLayer(k,r,layer,v){
 const tm=r&&r.tm;if(!tm||!tm[layer])return;
 const lk=tm.pal.map(tileById);
 const c0=v?Math.max(0,Math.floor((v.x-tm.x)/CELL)):0,c1=v?Math.min(tm.w-1,Math.floor((v.x+640-tm.x)/CELL)):tm.w-1;
 const r0=v?Math.max(0,Math.floor((v.y-tm.y)/CELL)):0,r1=v?Math.min(tm.h-1,Math.floor((v.y+480-tm.y)/CELL)):tm.h-1;
 k.imageSmoothingEnabled=false;
 for(let cy=r0;cy<=r1;cy++)for(let cx=c0;cx<=c1;cx++){
  const i=tmGet(tm,layer,cx,cy);if(!i)continue;
  const t=lk[i-1];if(t)k.drawImage(tileCanvas(t),tm.x+cx*CELL,tm.y+cy*CELL,CELL,CELL)
 }
}

/* ---------- room size and camera ---------- */
function worldSize(r){
 const f=r.f;let W=Math.max(640,f[0]+f[2]+40),H=Math.max(480,f[1]+f[3]+60);
 if(r.tm){W=Math.max(W,r.tm.x+r.tm.w*CELL);H=Math.max(H,r.tm.y+r.tm.h*CELL)}
 return[Math.min(W,BM.maxDim),Math.min(H,BM.maxDim)]
}
function camCalc(r){
 const[W,H]=worldSize(r);let tx=0,ty=0;
 if(W>640)tx=Math.max(0,Math.min(W-640,pl.x-320));
 if(H>480)ty=Math.max(0,Math.min(H-480,pl.y-14-240));
 if(CAM.room!==rm||CAM.smooth>=1||Math.abs(tx-CAM.fx)>640||Math.abs(ty-CAM.fy)>480){CAM.fx=tx;CAM.fy=ty}
 else{CAM.fx+=(tx-CAM.fx)*CAM.smooth;CAM.fy+=(ty-CAM.fy)*CAM.smooth}
 CAM.room=rm;CAM.x=Math.round(CAM.fx);CAM.y=Math.round(CAM.fy)
}
window.camBegin=function(r){try{camCalc(r)}catch(e){fail(e)}g.save();g.translate(-CAM.x,-CAM.y)};
window.camEnd=function(r){try{drawLayer(g,r,'a',CAM)}catch(e){fail(e)}finally{g.restore()}};

/* ---------- bigger cached floor/wall layers + tiles baked into the floor ---------- */
if(typeof lookScene==='function'&&typeof lookFloor==='function'&&typeof lookCanvas==='function'){
 lookCanvas=function(){const c=document.createElement('canvas');c.width=BM.size[0];c.height=BM.size[1];return c};
 const _lookFloor=lookFloor;
 lookFloor=function(k,f,th){_lookFloor(k,f,th);try{drawLayer(k,BM.room,'b')}catch(e){fail(e)}};
 const _lookScene=lookScene;
 lookScene=function(r){
  const key=r.id||rm,sz=worldSize(r),sig=(r.__tmv||0)+':'+BM.tileV+':'+sz;
  const old=lookCache[key];if(old&&old.bsig!==sig)delete lookCache[key];
  if(!lookCache[key])for(const k in lookCache)if(k!==String(key)&&lookCache[k].a&&lookCache[k].a.width*lookCache[k].a.height>1e6)delete lookCache[k];   // free memory from big rooms we left
  BM.size=sz;BM.room=r;
  const s=_lookScene(r);s.bsig=sig;return s
 }
}else console.warn('[bigmap] look.js functions not found; load bigmap.js after look.js');

/* ---------- keep remodel.js away from big or tiled rooms ---------- */
function protect(){for(const r of(typeof R!=='undefined'?R:[]))if(r&&Array.isArray(r.f)&&(r.tm||r.f[2]>560||r.f[3]>320)&&r.remodelV==null&&!r.noRemodel)r.noRemodel=true}
protect();
const _updWorld=updWorld;
updWorld=function(){protect();return _updWorld.apply(this,arguments)};

/* ---------- saved Studio edits (tiles + room layouts) ---------- */
function applyStored(){
 let s=null;try{s=JSON.parse(localStorage.getItem('wick-studio-v1')||'null')}catch(_){}
 if(!s)return;
 const a=tiles();
 for(const id in s.tiles||{}){const v=s.tiles[id],i=a.findIndex(t=>t.id===id);if(v==null){if(i>=0)a.splice(i,1)}else if(i>=0)a[i]=v;else a.push(v)}
 for(const rid in s.layout||{}){
  const v=s.layout[rid],r=(typeof R!=='undefined'?R:[]).find((x,i)=>String(x.id||i)===rid);
  if(!r||!v)continue;
  if(v.f)r.f=v.f.slice();
  if(v.tm)r.tm=JSON.parse(JSON.stringify(v.tm));
  if(v.noRemodel)r.noRemodel=true;
  r.__tmv=(r.__tmv||0)+1
 }
 BM.tileV++
}
try{applyStored()}catch(e){console.warn('[bigmap] could not apply saved edits',e)}

Object.assign(BM,{CELL,CH,tiles,tileById,tileCanvas,tmNew,tmResize,tmGet,tmSet,tmBlocks,drawLayer,worldSize,applyStored,protect,
 touch(r){if(r)r.__tmv=(r.__tmv||0)+1;BM.tileV++}});
})();
