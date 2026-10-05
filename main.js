// Animation loop and game startup.
// menu text tweak: hide button label overlap by drawing heart left of selected
let acc=0,last=performance.now();
function loop(now){acc+=Math.min(100,now-last);last=now;while(acc>=16.67){update();acc-=16.67}draw();requestAnimationFrame(loop)}
newGame();requestAnimationFrame(loop);
cv.focus();
