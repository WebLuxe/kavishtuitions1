// Builds the site. Run: npm install, then npm run build
// Sections live in src/sections/, styles in src/css/, scripts in src/js/.
// Day-to-day edits (details, credentials, lessons) only need js/content.js.
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const SITE = 'https://webluxe.github.io/kavishtuitions1/';
const WA = 'https://wa.me/23059238436';

const ICONS = {
  home: '<path d="M4 11l8-6.5L20 11v8.5a.8.8 0 0 1-.8.8H15v-6H9v6H4.8a.8.8 0 0 1-.8-.8z"/>',
  cap: '<path d="M2.5 9.5L12 5l9.5 4.5L12 14z"/><path d="M6.5 11.8V16c1.6 1.5 3.4 2.2 5.5 2.2s3.900-.7 5.500-2.200v-4.200"/><path d="M21.500 9.500V15"/>',
  book: '<path d="M4 5.500C6.500 4.500 9.500 4.700 12 6.500c2.500-1.800 5.500-2 8-1v13.500c-2.500-1-5.500-.8-8 1-2.500-1.800-5.500-2-8-1z"/><path d="M12 6.500V20"/>',
  lab: '<path d="M4 4v16h16"/><path d="M6.500 6c1.500 8 4 11 6 11s4.500-3 6-11"/>',
  menu: '<path d="M4 8h16M4 16h16"/>',
  spark: '<path d="M12 3.500l2 6.500 6.500 2-6.500 2-2 6.500-2-6.500-6.500-2 6.500-2z"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  check: '<path d="M4.500 12.500l5 5 10-11"/>',
  lock: '<rect x="5" y="11" width="14" height="9.500" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  play: '<path d="M7 4.500l13 7.500-13 7.500z" fill="currentColor"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  phone: '<path d="M6 3.500h3l1.500 5-2 1.500c1 2.200 2.800 4 5 5l1.500-2 5 1.500v3c0 1-.8 1.800-1.800 1.700C10.500 19.100 4.900 13.500 4.300 5.300 4.200 4.300 5 3.500 6 3.500z"/>',
  wa: '<path d="M12 3.200a8.800 8.800 0 0 0-7.600 13.200L3.200 20.800l4.500-1.200A8.800 8.800 0 1 0 12 3.200z"/><path d="M8.800 8c.3-.6.900-.5 1.100 0l.6 1.400c.1.300 0 .6-.2.800l-.5.600c.7 1.300 1.700 2.300 3 3l.6-.5c.2-.2.500-.3.800-.2l1.400.6c.5.200.6.800 0 1.100-1 .7-2.100.8-3.200.3-2.300-1-4-2.700-4.900-4.900-.5-1-.3-1.800.3-2.200z" fill="currentColor" stroke="none"/>',
  mail: '<rect x="3.500" y="5.500" width="17" height="13" rx="2"/><path d="M4 7l8 6 8-6"/>',
  pin: '<path d="M12 21s7-6.200 7-11.500a7 7 0 0 0-14 0C5 14.800 12 21 12 21z"/><circle cx="12" cy="9.500" r="2.500"/>',
  flame: '<path d="M12 3c.5 3.500 5.500 5.500 5.500 11a5.500 5.500 0 0 1-11 0c0-2.200 1-3.800 2.200-5 .2 1.500.9 2.400 1.800 2.900C10.300 9 10.700 5.500 12 3z"/>',
  sound: '<path d="M4.500 9.500v5h3.500l4.500 4v-13l-4.500 4z"/><path d="M16 9a4.500 4.500 0 0 1 0 6"/>',
  bolt: '<path d="M13 3L6 13.500h5L10 21l8-11h-5.500z"/>',
  medal: '<circle cx="12" cy="9" r="5.500"/><path d="M8.500 13.500L7 21l5-2.500L17 21l-1.500-7.500"/>',
  video: '<rect x="3.500" y="6" width="17" height="12" rx="2.500"/><path d="M10.500 9.500l4.500 2.500-4.500 2.500z"/>',
  note: '<path d="M7 3.500h7.500L19 8v11.500a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1z"/><path d="M14 3.500V8.500h5M9 13h6M9 16.500h6"/>',
  pencil: '<path d="M15 4.500l4.500 4.500L8 20.500H3.500V16z"/><path d="M13 6.500l4.500 4.500"/>',
  paper: '<path d="M6 3.500h12v17l-3-2-3 2-3-2-3 2z"/><path d="M9 8.500h6M9 12.500h6"/>',
  device: '<rect x="7" y="3" width="10" height="18" rx="2.200"/><path d="M11 18h2"/>',
  chat: '<path d="M4 5.500h16v11H10l-4.500 3.500v-3.500H4z"/>',
  grid: '<rect x="4" y="4" width="7" height="7" rx="1.500"/><rect x="13" y="4" width="7" height="7" rx="1.500"/><rect x="4" y="13" width="7" height="7" rx="1.500"/><rect x="13" y="13" width="7" height="7" rx="1.500"/>',
  swipe: '<path d="M7 12h10M13 8l4 4-4 4M11 8l-4 4 4 4"/>',
  tag: '<path d="M4 4.500h8l8 8-7.500 7.500-8.500-8z"/><circle cx="8.500" cy="9" r="1.300"/>',
  key: '<circle cx="8" cy="15.500" r="4"/><path d="M11 12.500L20 4M16 8l3 3"/>',
  back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  card: '<rect x="3.500" y="5.500" width="17" height="13" rx="2"/><path d="M3.500 10h17"/>'
};
const GRAD = '<defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#8b6cff"/><stop offset=".55" stop-color="#22d3ee"/><stop offset="1" stop-color="#f472b6"/></linearGradient></defs>';
const sprite = '<svg width="0" height="0" style="position:absolute" aria-hidden="true">' + GRAD +
  Object.entries(ICONS).map(([k, v]) => `<symbol id="i-${k}" viewBox="0 0 24 24">${v}</symbol>`).join('') + '</svg>';
const ic = (n, cls = 'ic') => `<svg class="${cls}" aria-hidden="true"><use href="#i-${n}"/></svg>`;
const LOGO = '<svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="url(#lg)"/><path d="M7 9.500q9 26 18 0" fill="none" stroke="#0b0720" stroke-width="3.200" stroke-linecap="round"/></svg>';

const NAV = [['index.html', 'Home', 'home'], ['tuition.html', 'Tuition', 'cap'], ['courses.html', 'Courses', 'book'], ['lab.html', 'Maths Lab', 'lab'], ['pricing.html', 'Pricing', 'tag'], ['contact.html', 'Contact', 'chat']];


/* All the colours of the site. Change them here and the 3D follows. */
const T = (o) => Object.entries(o).map(([k, v]) => `--${k}:${v}`).join(';');
const TOKENS = {
  night: '#0b0720', 'night-2': '#120b30', panel: '#17103a', 'panel-2': '#1e1548', card: 'rgb(30 21 72/.72)', well: 'rgb(11 7 32/.72)', glass: 'rgb(18 11 48/.82)', dockbg: 'rgb(20 13 52/.95)',
  line: 'rgb(226 220 255/.14)', 'line-2': 'rgb(226 220 255/.26)', ink: '#f5f2ff', mute: '#b8b2da', sun: '#ffcf7a', 'on-sun': '#1b1038', tint: 'rgb(255 207 122/.12)',
  violet: '#a48dff', cyan: '#67e8f9', pink: '#f9a8d4', good: '#5eead4', 'good-line': 'rgb(94 234 212/.4)', 'good-bg': 'rgb(12 34 44/.92)', bad: '#fb7185',
  ring: 'conic-gradient(from 210deg,#a48dff,#67e8f9,#f9a8d4,#ffcf7a,#a48dff)',
  sky1: 'radial-gradient(ellipse 90% 70% at 62% 30%,#3a1a8a 0%,#1d0f52 40%,transparent 76%)', sky2: 'radial-gradient(ellipse 80% 70% at 30% 62%,#1e3a8a 0%,#10174f 42%,transparent 76%)', sky3: 'radial-gradient(ellipse 80% 70% at 70% 66%,#6d1a7a 0%,#330f4f 42%,transparent 76%)',
  cardx: 'radial-gradient(120% 90% at 50% 0%,#2c2070,#1e1548 62%)', flash: 'radial-gradient(circle at 50% 50%,#f3e8ff,#a78bfa 26%,rgb(124 92 255/.34) 50%,transparent 74%)',
  shim: 'linear-gradient(90deg,#fff 0%,#c4b5fd 22%,#8b6cff 42%,#22d3ee 62%,#f472b6 82%,#fff 100%)',
  p0: '#6f5ccf', g0: '#0f0833', g1: '#5c33eb', g2: '#33d1f2',
  ldbg: 'radial-gradient(ellipse 85% 75% at 50% 42%,#3a1a8a 0%,#1d0f52 38%,#0c0828 72%,#070914 100%)',
  logo: 'linear-gradient(90deg,#fff 0%,#c4b5fd 20%,#7c5cff 40%,#22d3ee 60%,#f472b6 80%,#fff 100%)', bar: 'linear-gradient(90deg,#7c5cff,#22d3ee,#f472b6)', ldink: '#c4b5fd'
};

const CRITICAL = `
@font-face{font-family:"Mona Sans";src:url(fonts/mona.woff2) format("woff2");font-weight:200 900;font-stretch:75% 125%;font-display:swap}
:root{--pad:clamp(18px,5vw,72px);--safe-t:env(safe-area-inset-top,0px);--safe-b:env(safe-area-inset-bottom,0px);--dockh:76px;--ease:cubic-bezier(.2,.7,.2,1);--spring:cubic-bezier(.3,1.5,.5,1);--text:"Mona Sans",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;--serif:"Instrument Serif",Georgia,"Times New Roman",serif;--math:"Cambria Math","STIX Two Math","Noto Sans Math","Times New Roman",serif}
@media(min-width:1040px){:root{--dockh:0px}}
@media(max-height:500px) and (orientation:landscape){:root{--dockh:0px}}
:root{${T(TOKENS)}}
html,body{margin:0;height:100%;overflow:hidden;overscroll-behavior:none;background:var(--night)}
.no-js,.no-js body{height:auto;overflow:auto}
#deck{position:fixed;inset:0;overflow:hidden auto;overscroll-behavior:none;scroll-snap-type:y mandatory}
.loading #deck{overflow:hidden}
#ld{position:fixed;inset:0;z-index:100;overflow:hidden;background:var(--ldbg);color:var(--ldink);font-family:var(--text);-webkit-user-select:none;user-select:none;cursor:pointer;touch-action:none}
.no-js #ld{display:none}
.ld-p{position:absolute;inset:0;display:flex}.ld-p i{flex:1;border-right:1px solid rgba(255,255,255,.035)}
.ld-a{position:absolute;inset:0;overflow:hidden}
.ld-a i{position:absolute;display:block;border-radius:50%;opacity:.6;animation:ld-au 12s ease-in-out infinite alternate}
.ld-a i:nth-child(1){width:90vmax;height:90vmax;left:-34vmax;top:-44vmax;background:radial-gradient(circle,#7c3aed 0,transparent 66%)}
.ld-a i:nth-child(2){width:80vmax;height:80vmax;right:-32vmax;bottom:-42vmax;background:radial-gradient(circle,#22d3ee 0,transparent 66%);opacity:.34;animation-delay:-4s}
.ld-a i:nth-child(3){width:64vmax;height:64vmax;left:18%;top:8%;background:radial-gradient(circle,#c026d3 0,transparent 66%);opacity:.3;animation-delay:-8s}
@keyframes ld-au{to{transform:translate3d(8vw,-6vh,0) scale(1.2)}}
#ldc{position:absolute;inset:0;width:100%;height:100%}
.ld-o{position:absolute;left:50%;top:50%;width:min(94vw,1100px);transform:translate(-50%,-50%);overflow:visible;pointer-events:none}
.ld-o ellipse{fill:none;stroke-width:1.2;stroke-dasharray:4 12;animation:ld-od 6s linear infinite}
@keyframes ld-od{to{stroke-dashoffset:-160}}
.ld-f{position:absolute;inset:0;opacity:0;pointer-events:none;background:var(--flash)}
.ld-c{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1.3rem;perspective:900px;padding:0 12px}
.ld-l{font-size:clamp(2rem,8.4vw,7rem);font-weight:800;font-stretch:112%;letter-spacing:-.035em;line-height:1.1;white-space:nowrap;opacity:0}
.ld-l.go{opacity:1}
.ld-l .l{display:inline-block;animation:ld-in 1.25s cubic-bezier(.3,1.5,.5,1) both;animation-delay:calc(var(--i)*.055s + .1s)}
.ld-l b{display:inline-block;font-weight:800;background:var(--logo);background-size:300% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent;animation:ld-sh 4s linear infinite;animation-delay:calc(var(--i)*-.28s)}
@keyframes ld-in{from{transform:translateY(-220px) rotate(var(--r)) scale(.4);opacity:0}to{transform:none;opacity:1}}
@keyframes ld-sh{to{background-position:-300% 0}}
.ld-t{font-size:clamp(.72rem,2.2vw,1.05rem);font-weight:600;letter-spacing:.32em;text-transform:uppercase;margin-top:-.5rem;text-align:center;opacity:0;animation:ld-fd .9s .9s ease forwards}
.ld-b{width:min(320px,62vw);height:2px;background:rgba(255,255,255,.12);overflow:hidden}
.ld-b i{display:block;height:100%;background:var(--bar);transform:scaleX(0);transform-origin:0 50%}
.ld-m,.ld-n{font-size:.78rem;font-weight:600;letter-spacing:.26em;text-transform:uppercase;text-align:center;min-height:1.2em}
.ld-m{margin-top:-.5rem}
.ld-s{position:absolute;left:0;right:0;bottom:calc(26px + var(--safe-b));text-align:center;font-size:.7rem;font-weight:600;letter-spacing:.26em;text-transform:uppercase;opacity:0;animation:ld-fd2 .8s 1.3s ease forwards}
@keyframes ld-fd{to{opacity:1}}@keyframes ld-fd2{to{opacity:.62}}
#ld.ld-out{opacity:0;transition:opacity .5s ease;pointer-events:none}
@media(prefers-reduced-motion:reduce){.ld-a i,.ld-o ellipse,.ld-l b{animation:none}.ld-l .l{animation-duration:.01s;animation-delay:0s}.ld-o{display:none}}`.replace(/\n/g, '');

const LOADER = `<div id="ld" role="status" aria-label="Loading KavishTuitions">
<div class="ld-p" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
<div class="ld-a" aria-hidden="true"><i></i><i></i><i></i></div>
<canvas id="ldc" aria-hidden="true"></canvas>
<svg class="ld-o" viewBox="-500 -170 1000 340" aria-hidden="true"><g transform="rotate(-9)"><ellipse rx="470" ry="120" stroke="rgba(196,181,253,.55)"/><circle r="5" fill="#22d3ee"><animateMotion dur="7s" repeatCount="indefinite" path="M-470 0a470 120 0 1 0 940 0a470 120 0 1 0 -940 0"/></circle></g><g transform="rotate(11)"><ellipse rx="430" ry="95" stroke="rgba(34,211,238,.45)"/><circle r="4" fill="#f472b6"><animateMotion dur="9s" repeatCount="indefinite" path="M430 0a430 95 0 1 1 -860 0a430 95 0 1 1 860 0"/></circle></g></svg>
<div class="ld-f"></div>
<div class="ld-c"><div class="ld-l" id="ldLogo"></div><div class="ld-t">with Kavish Sunassee</div><div class="ld-b"><i id="ldB"></i></div><div class="ld-m" id="ldM"></div><div class="ld-n"><span id="ldN">0</span>%</div></div>
<div class="ld-s">tap anywhere to skip ›</div>
</div>`;

/* Runs before anything else and loads the site itself. The number on screen is real:
   it counts actual bytes arriving, so it's honest on a slow connection. */
const boot = (siteBytes) => `(function(){
var d=document,H=d.documentElement,W=window;H.classList.remove('no-js');H.classList.add('js');
var ld=d.getElementById('ld'),calm=matchMedia('(prefers-reduced-motion: reduce)').matches,full=H.dataset.intro==='full'&&!calm;
var B=W.KTB={wp:{s:0,on:1},skip:false,full:full,calm:calm};
var logo=d.getElementById('ldLogo');
logo.innerHTML='KavishTuitions'.split('').map(function(c,i){return '<span class="l" style="--i:'+i+';--r:'+((i*37)%80-40)+'deg"><b>'+c+'</b></span>'}).join('');
var cv=d.getElementById('ldc'),x=cv.getContext('2d'),dp=Math.min(W.devicePixelRatio||1,2),w,h;
function sz(){w=innerWidth;h=innerHeight;cv.width=w*dp;cv.height=h*dp;x.setTransform(dp,0,0,dp,0,0)}sz();addEventListener('resize',sz);
var wp=B.wp,R=Math.random,st=[],sm=[],sy='π √ θ x² ∑ ∫ ± ÷ × % ∞ Δ sin cos'.split(' '),i,n=w<768?90:190;
for(i=0;i<n;i++)st.push({a:R()*6.283,r:R(),h:R()});
for(i=0;i<(w<768?20:32);i++)sm.push({x:R(),y:R(),s:14+R()*26,v:.00025+R()*.0006,t:sy[R()*sy.length|0],a:.12+R()*.24,r:R()*6,h:R()});
function dr(){if(!wp.on)return;x.clearRect(0,0,w,h);var s=wp.s,k,o;
if(s<.98)for(k=0;k<sm.length;k++){o=sm[k];o.y-=o.v;o.r+=.004;if(o.y<-.06){o.y=1.06;o.x=R()}x.save();x.globalAlpha=o.a*(1-s);x.translate(o.x*w+Math.sin(o.r*1.5)*20,o.y*h);x.rotate(Math.sin(o.r)*.4);x.fillStyle=o.h>.5?'#c4b5fd':'#67e8f9';x.font=o.s+"px 'Mona Sans',system-ui,sans-serif";x.fillText(o.t,0,0);x.restore()}
var x0=w/2,y0=h/2,m=Math.hypot(x0,y0);x.lineCap='round';x.globalAlpha=.25+.75*s;
for(k=0;k<st.length;k++){o=st[k];o.r+=.0015+s*.05;if(o.r>1.05){o.r=R()*.15;o.a=R()*6.283}
var ro=o.r*m,t=Math.max(0,ro-(8+s*340)*o.r),c=Math.cos(o.a),q=Math.sin(o.a);
x.strokeStyle='hsl('+(190+o.h*120)+',100%,'+(70+o.h*20)+'%)';x.lineWidth=.6+o.r*2.2;x.beginPath();x.moveTo(x0+c*t,y0+q*t);x.lineTo(x0+c*ro,y0+q*ro);x.stroke()}
requestAnimationFrame(dr)}
if(!calm)dr();
var real=0,shown=0,t0=performance.now(),waiting=[],bar=d.getElementById('ldB'),num=d.getElementById('ldN'),msg=d.getElementById('ldM'),MS=['Sharpening pencils…','Loading formulas…','Solving for x…','Almost there…','Ready!'],pace=full?2700:420;
var parts={css:0,font:0,data:0,site:0},wt={css:.08,font:.08,data:.04,site:.8};
function up(k,v){parts[k]=v;real=0;for(var p in parts)real+=parts[p]*wt[p]}
function tick(){var now=performance.now(),cap=B.skip?1:Math.min(1,(now-t0)/pace),tg=Math.min(real,cap);shown+=(tg-shown)*.14;if(tg>=.999&&shown>.99)shown=1;
bar.style.transform='scaleX('+shown+')';num.textContent=Math.round(shown*100);msg.textContent=MS[Math.min(4,shown*4.2|0)];
if(shown>=1&&B.failed&&!W.KTAPP){B.kill();return}if(shown>=1&&waiting.length){var q=waiting.slice();waiting.length=0;q.forEach(function(f){f()})}
if(shown<1||waiting.length)requestAnimationFrame(tick);else B.done=true}
B.whenDone=function(f){if(B.done)f();else waiting.push(f)};
var l=d.getElementById('kcss');function cdone(){l.media='all';up('css',1)}if(l.sheet)cdone();else{l.onload=cdone;l.onerror=function(){up('css',1)}}
function fg(){logo.classList.add('go');up('font',1)}
if(d.fonts&&d.fonts.load){var ft=setTimeout(fg,2200);d.fonts.load('800 40px "Mona Sans"').then(function(){clearTimeout(ft);fg()},fg)}else fg();
function tag(u,k,done){var s=d.createElement('script');s.src=u;s.onload=function(){up(k,1);done&&done()};s.onerror=function(){B.failed=true;up(k,1);done&&done()};d.head.appendChild(s)}
function stream(u,size,k,done){if(!W.fetch||!W.ReadableStream||location.protocol==='file:')return tag(u,k,done);
fetch(u).then(function(r){if(!r.ok||!r.body)throw 0;var rd=r.body.getReader(),c=[],got=0;return(function pump(){return rd.read().then(function(p){if(p.done)return new Blob(c,{type:'text/javascript'});c.push(p.value);got+=p.value.length;up(k,Math.min(.98,got/size));return pump()})})()}).then(function(b){var s=d.createElement('script'),u2=URL.createObjectURL(b);s.src=u2;s.onload=function(){URL.revokeObjectURL(u2);up(k,1);done&&done()};s.onerror=function(){B.failed=true;up(k,1);done&&done()};d.head.appendChild(s)}).catch(function(){tag(u,k,done)})}
tag('js/content.js','data',function(){stream('js/site.min.js',${siteBytes},'site')});
ld.addEventListener('pointerdown',function(){B.skip=true;if(B.onSkip)B.onSkip()});
requestAnimationFrame(tick);
B.kill=function(){wp.on=0;removeEventListener('resize',sz);H.classList.remove('loading');if(!W.KTAPP){H.classList.remove('js');H.classList.add('no-js')}if(ld.parentNode){ld.classList.add('ld-out');setTimeout(function(){ld.remove()},600)}};
setTimeout(function(){if(!W.KTAPP)B.kill()},15000);
})();`.replace(/\n/g, '');

function html(p, siteBytes) {
  const cur = h => (h === p.file ? ' aria-current="page"' : '');
  const nav = NAV.slice(0, 5).map(([h, n]) => `<a href="${h}"${cur(h)}>${n}</a>`).join('');
  const dockItem = (h, label, icon) => `<a href="${h}"${cur(h)}>${ic(icon)}<span>${label}</span></a>`;
  const links = NAV.map(([h, n]) => `<li><a href="${h}">${n}</a></li>`).join('');
  const body = fs.readFileSync(path.join(__dirname, 'sections', p.src), 'utf8').replace(/\r\n/g, '\n').replace(/\{\{i:([a-z]+)\}\}/g, (_, n) => ic(n)).replace(/\{\{wa\}\}/g, WA);
  const url = SITE + (p.file === 'index.html' ? '' : p.file);
  const next = p.next ? `<a class="btn btn--sun" href="${p.next[0]}" data-a>${p.next[1]}${ic('arrow')}</a>` : '';
  const foot = `<section class="s s--full s--foot" id="end" data-fig="none" data-dim="0" data-sky="0" aria-label="Site links"><div class="s__in" style="flex-direction:column;align-items:stretch">
  <div class="txt foot"><div class="foot__grid">
    <div data-a><a class="logo" href="index.html">${LOGO}<span>KavishTuitions</span></a><p class="foot__fine opt">Maths &amp; Add Maths tuition with Kavish Sunassee, proudly based in Moka, Mauritius.</p>${next ? `<p class="foot__cta">${next}</p>` : ''}</div>
    <nav aria-label="Pages" data-a><h2>Pages</h2><ul>${links}</ul></nav>
    <div data-a><h2>Talk to Kavish</h2><a href="${WA}" target="_blank" rel="noopener">WhatsApp +230 5923 8436</a><br><a href="tel:+23059238436">Call +230 5923 8436</a></div>
  </div>
  <p class="foot__fine" data-a>Independent tuition resource, not affiliated with any exam board or ministry. Built by Sungkur Doorgesh.</p></div>
  <div class="fw" aria-hidden="true">KAVISH</div>
</div></section>`;
  return `<!DOCTYPE html>
<html lang="en" class="no-js loading" data-intro="${p.file === 'index.html' ? 'full' : 'short'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#0b0720">
<title>${p.title}</title>
<meta name="description" content="${p.desc}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website"><meta property="og:site_name" content="KavishTuitions">
<meta property="og:title" content="${p.title}"><meta property="og:description" content="${p.desc}">
<meta property="og:url" content="${url}"><meta property="og:image" content="${SITE}images/og.jpg">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="images/icon-180.png">
<link rel="manifest" href="site.webmanifest">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<link rel="preload" href="fonts/mona.woff2" as="font" type="font/woff2" crossorigin>
<style>${CRITICAL}</style>
<link rel="stylesheet" id="kcss" href="css/site.css" media="print">
<noscript><link rel="stylesheet" href="css/site.css"></noscript>
</head>
<body data-page="${p.name}">
${sprite}
${LOADER}
<script>${boot(siteBytes)}</script>
<div class="sky" aria-hidden="true"><i></i><i></i><i></i></div>
<canvas id="cosmos" aria-hidden="true"></canvas>
<div class="kcur" aria-hidden="true"></div>
<header class="top"><div class="top__in">
  <a class="logo" href="index.html" aria-label="KavishTuitions home">${LOGO}<span>KavishTuitions</span></a>
  <nav class="nav" aria-label="Main">${nav}</nav>
  <div class="top__end"><a class="streak" href="lab.html" id="topStreak" hidden aria-label="Your streak">${ic('flame', '')}<span></span></a><button type="button" class="btn btn--sun btn--sm top__join" data-join>Join</button></div>
</div></header>
<main id="deck">
${body}
${foot}
</main>
<div class="pips" aria-hidden="true"></div>
<nav class="dock" aria-label="Quick menu">
  ${dockItem('index.html', 'Home', 'home')}
  ${dockItem('tuition.html', 'Tuition', 'cap')}
  <button type="button" class="dock__main" data-join><span class="orb">${ic('spark')}</span><b data-main-label>Join</b></button>
  ${dockItem('lab.html', 'Lab', 'lab')}
  <button type="button" data-menu>${ic('menu')}<span>Menu</span></button>
</nav>
<noscript><p style="position:fixed;left:0;right:0;bottom:0;margin:0;padding:12px;background:#17103a;color:#fff;text-align:center;z-index:50">The lessons and games need JavaScript, but you can still <a style="color:#ffcf7a" href="${WA}">message Kavish on WhatsApp</a>.</p></noscript>
</body>
</html>
`;
}

const pages = [
  { name: 'home', file: 'index.html', src: 'home.html', next: ['tuition.html', 'See the tuition'], title: 'Kavish Sunassee: Maths & Add Maths tutor in Moka, Mauritius', desc: "Hi, I'm Kavish, a Maths and Add Maths tutor from Moka, Mauritius. Meet me, then explore video lessons, notes and worked solutions from NCE to HSC / A-Level." },
  { name: 'tuition', file: 'tuition.html', src: 'tuition.html', next: ['courses.html', 'See the courses'], title: 'Tuition: Maths & Add Maths, NCE to HSC | KavishTuitions', desc: 'Video lessons, downloadable notes and fully worked solutions for Mauritian secondary students, from Grade 9 NCE to HSC / A-Level.' },
  { name: 'courses', file: 'courses.html', src: 'courses.html', next: ['lab.html', 'Try the Maths Lab'], title: 'Courses: your lesson path | KavishTuitions', desc: 'Follow your lesson path by grade. Notes, videos and worked solutions for NCE, SC / IGCSE and HSC / A-Level, with free preview lessons.' },
  { name: 'lab', file: 'lab.html', src: 'lab.html', next: ['pricing.html', 'See pricing'], title: 'Maths Lab: Swipe Maths and the parabola explorer | KavishTuitions', desc: 'Swipe through true or false maths, keep your streak alive, and drag a live parabola with your finger.' },
  { name: 'pricing', file: 'pricing.html', src: 'pricing.html', next: ['contact.html', 'Talk to Kavish'], title: 'Pricing: from Rs 500 a month | KavishTuitions', desc: 'Monthly, term and full-year access to Maths and Add Maths lessons, paid via MCB Juice. No card needed.' },
  { name: 'contact', file: 'contact.html', src: 'contact.html', title: 'Contact Kavish | KavishTuitions', desc: 'Message Kavish Sunassee on WhatsApp or by phone about Maths and Add Maths tuition in Moka, Mauritius.' }
];

(async () => {
  const esbuild = require(process.env.ESBUILD || 'esbuild');
  const read = f => fs.readFileSync(path.join(__dirname, f), 'utf8').replace(/\r\n/g, '\n');
  /* one bundle: motion library, figures, 3D engine, app */
  const min = code => esbuild.transform(code, { minify: true, target: 'es2017', legalComments: 'none' }).then(r => r.code);
  const gsapCode = read('vendor/gsap.min.js');
  const own = await min([read('js/figs.js'), read('js/cosmos.js'), read('js/app.js')].join('\n;\n'));
  const bundle = gsapCode + '\n;' + own;
  fs.mkdirSync(path.join(ROOT, 'js'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'js/site.min.js'), bundle);
  const css = (await esbuild.transform(read('css/site.css'), { loader: 'css', minify: true })).code;
  fs.mkdirSync(path.join(ROOT, 'css'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'css/site.css'), css);
  const siteBytes = Buffer.byteLength(bundle);
  for (const p of pages) fs.writeFileSync(path.join(ROOT, p.file), html(p, siteBytes));
  fs.writeFileSync(path.join(ROOT, 'favicon.svg'), LOGO.replace('aria-hidden="true">', 'xmlns="http://www.w3.org/2000/svg">' + GRAD));
  fs.writeFileSync(path.join(ROOT, 'site.webmanifest'), JSON.stringify({ name: 'KavishTuitions', short_name: 'Kavish', start_url: './index.html', display: 'standalone', background_color: '#0b0720', theme_color: '#0b0720', icons: [{ src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml' }, { src: 'images/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: 'images/icon-512.png', sizes: '512x512', type: 'image/png' }] }));
  /* the cache engine gets a new name whenever anything changes */
  const core = ['css/site.css', 'js/site.min.js', 'js/content.js', 'fonts/mona.woff2', 'fonts/serif-i.woff2', 'favicon.svg', 'index.html'];
  const hash = require('crypto').createHash('sha1');
  [...core, ...pages.map(p => p.file)].forEach(f => {
    const b = fs.readFileSync(path.join(ROOT, f));
    hash.update(/woff2$/.test(f) ? b : b.toString().replace(/\r\n/g, '\n'));
  });
  const ver = hash.digest('hex').slice(0, 10);
  fs.writeFileSync(path.join(ROOT, 'sw.js'), (await min(read('sw.js').replace('@@VERSION@@', ver).replace('@@CORE@@', JSON.stringify(core)))));
  const gz = f => require('zlib').gzipSync(fs.readFileSync(path.join(ROOT, f)), { level: 9 }).length;
  console.log('built', pages.length, 'pages, cache', ver, '| gzip: site', Math.round(gz('js/site.min.js') / 1024) + 'KB, css', Math.round(gz('css/site.css') / 1024) + 'KB, home', Math.round(gz('index.html') / 1024) + 'KB');
})().catch(e => { console.error(e); process.exit(1); });
