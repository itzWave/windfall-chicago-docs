const menu=document.querySelector('#menu'),sidebar=document.querySelector('#sidebar');
menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',open);sidebar.classList.toggle('open',open)});
document.querySelectorAll('nav a').forEach(a=>{if(new URL(a.href).pathname.split('/').pop()===document.body.dataset.page+'.html'){a.classList.add('active');a.setAttribute('aria-current','page')}});
const dialog=document.querySelector('#search'),query=document.querySelector('#query'),results=document.querySelector('#results'),status=document.querySelector('#search-status');
let lastFocus;
function openSearch(){lastFocus=document.activeElement;if(!dialog.open)dialog.showModal();query.focus()}
document.querySelector('.search-trigger').addEventListener('click',openSearch);
document.querySelector('#close-search').addEventListener('click',()=>dialog.close());
dialog.addEventListener('close',()=>lastFocus?.focus());
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}});
document.addEventListener('keydown',e=>{if(e.key==='/'&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)){e.preventDefault();openSearch()}});
query.addEventListener('input',()=>{results.replaceChildren();const term=query.value.trim().toLowerCase();if(!term){status.textContent='Type a word or phrase to find a rule.';return}const hits=[];for(const section of window.WINDFALL_SEARCH){section.blocks.forEach((b,i)=>{if(b.text.toLowerCase().includes(term)||section.title.toLowerCase().includes(term))hits.push({section,b,i})})}status.textContent=hits.length?`${hits.length} matching ${hits.length===1?"entry":"entries"}`:'No matching rules. Try a different word or phrase.';for(const {section,b,i} of hits){const a=document.createElement('a');a.href=section.slug+'.html?release='+document.body.dataset.release+'#rule-'+(i+1);const label=document.createElement('strong');label.textContent=section.title;const excerpt=document.createElement('span');excerpt.textContent=b.text;a.append(label,excerpt);results.append(a)}});

const themeButton=document.querySelector('#theme-toggle');
function setTheme(theme){document.documentElement.dataset.theme=theme;themeButton.textContent=theme==='dark'?'Light mode':'Dark mode';themeButton.setAttribute('aria-pressed',String(theme==='light'));document.querySelector('meta[name="theme-color"]').content=theme==='dark'?'#090a0c':'#f5f7fb'}
let storedTheme;try{storedTheme=localStorage.getItem('windfall-theme')}catch{}
setTheme(storedTheme==='light'?'light':'dark');
themeButton.addEventListener('click',()=>{const theme=document.documentElement.dataset.theme==='dark'?'light':'dark';setTheme(theme);try{localStorage.setItem('windfall-theme',theme)}catch{}});

// Native document transitions where available; a small fallback elsewhere.
const nativePageTransitions=typeof window.CSSViewTransitionRule==='function';
document.documentElement.dataset.nativeTransitions=String(nativePageTransitions);
const motionPreference=matchMedia('(prefers-reduced-motion: reduce)');
const chapterMain=document.querySelector('main');
let chapterNavigationPending=false;
if(!nativePageTransitions){
 document.addEventListener('click',event=>{
  const link=event.target.closest('a[href]');
  if(!link||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||link.hasAttribute('download')||(link.target&&link.target!=='_self')||motionPreference.matches)return;
  const destination=new URL(link.href);
  if(destination.origin!==location.origin||!destination.pathname.endsWith('.html')||(destination.pathname===location.pathname&&destination.search===location.search))return;
  event.preventDefault();
  if(chapterNavigationPending)return;
  chapterNavigationPending=true;
  const fade=chapterMain.animate([{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(-5px)'}],{duration:110,easing:'ease-out',fill:'forwards'});
  fade.finished.catch(()=>{}).then(()=>location.assign(destination.href));
 });
 window.addEventListener('pageshow',event=>{if(event.persisted){chapterNavigationPending=false;for(const animation of chapterMain.getAnimations())animation.cancel()}});
}
