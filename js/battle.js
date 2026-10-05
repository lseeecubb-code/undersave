// Animation loop and game startup.
// menu text tweak: hide button label overlap by drawing heart left of selected
let acc=0,last=performance.now();
function loop(now){acc+=Math.min(100,now-last);last=now;while(acc>=16.67){update();acc-=16.67}draw();requestAnimationFrame(loop)}
newGame();requestAnimationFrame(loop);
cv.focus();

// Additional Undertale-inspired battle polish for map fights.
const UNDERTALE_TINTS={bone:'#f4f0e6',star:'#ffe77a',petal:'#ff8abf',lantern:'#ffd166',void:'#7356ff'};

const originalSpawn=window.spawn || null;
function applyUndertalePatterns(){
  const base=ATTACK_PATTERNS;
  if(!base.some(p=>p.id==='bone-wall'))base.push({id:'bone-wall',name:'Bone wall',type:'crossfire',interval:52,speed:2.3,fan:5,spread:.18,aimEvery:120,aimAt:60,aimSpeed:2.8,bulletStyle:'bone'});
  if(!base.some(p=>p.id==='gaster-blaster'))base.push({id:'gaster-blaster',name:'Gaster blaster',type:'aimed',interval:70,speed:2.8,fan:3,spread:.25,aimEvery:80,aimAt:40,aimSpeed:3.1,bulletStyle:'void'});
  if(!base.some(p=>p.id==='starlight'))base.push({id:'starlight',name:'Starlight cascade',type:'flower',interval:6,speed:1.9,rotation:.105,ringEvery:72,count:20,ringSpeed:1.6,aimEvery:100,aimAt:50,aimSpeed:2.9,bulletStyle:'star'});
  if(!base.some(p=>p.id==='vine-lash'))base.push({id:'vine-lash',name:'Vine lash',type:'sweep',interval:45,speed:2.5,fan:4,spread:.2,aimEvery:95,aimAt:45,aimSpeed:2.7,bulletStyle:'seed'});
  if(!base.some(p=>p.id==='lantern-spin'))base.push({id:'lantern-spin',name:'Lantern spin',type:'orbit',interval:8,speed:2.1,fan:4,aimEvery:100,aimAt:40,aimSpeed:3,bulletStyle:'wisp'});
  if(!base.some(p=>p.id==='wax-melting'))base.push({id:'wax-melting',name:'Wax melt',type:'waxsplash',interval:80,speed:2.4,count:3,fan:2,bulletStyle:'wax'});
}
applyUndertalePatterns();
