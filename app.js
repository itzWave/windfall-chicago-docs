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

// Keep the shell mounted and transition only the chapter content.
const chapterMain=document.querySelector('main');
const motionPreference=matchMedia('(prefers-reduced-motion: reduce)');
const chapterCache=new Map();
let chapterRequest=0;
let chapterAnimation;
history.replaceState({...history.state,windfall:true,scrollX:window.scrollX,scrollY:window.scrollY},'',location.href);
if('scrollRestoration' in history)history.scrollRestoration='manual';
function chapterDestination(link){
 if(!link||link.hasAttribute('download')||(link.target&&link.target!=='_self'))return null;
 const url=new URL(link.href);
 return url.origin===location.origin&&url.pathname.endsWith('.html')&&url.searchParams.get('release')===document.body.dataset.release?url:null;
}
function fetchChapter(url){
 const key=url.origin+url.pathname+url.search;
 if(!chapterCache.has(key))chapterCache.set(key,fetch(key).then(response=>{
  if(!response.ok)throw Error('Chapter unavailable');return response.text();
 }).then(html=>{
  const page=new DOMParser().parseFromString(html,'text/html');
  if(!page.querySelector('main')||page.body.dataset.release!==document.body.dataset.release)throw Error('Chapter release mismatch');
  return page;
 }).catch(error=>{chapterCache.delete(key);throw error}));
 return chapterCache.get(key);
}
function updateChapterSelection(){
 document.querySelectorAll('#sidebar nav a').forEach(link=>{
  const selected=new URL(link.href).pathname.split('/').pop()===document.body.dataset.page+'.html';
  link.classList.toggle('active',selected);
  if(selected)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');
 });
}
async function changeChapter(url,{push=true,restore=null}={}){
 const request=++chapterRequest;
 chapterAnimation?.cancel();
 chapterMain.setAttribute('aria-busy','true');
 try{
  const page=await fetchChapter(url);
  if(request!==chapterRequest)return;
  if(dialog.open)dialog.close();
  if(!motionPreference.matches){
   chapterAnimation=chapterMain.animate([{opacity:1},{opacity:0}],{duration:90,easing:'ease-out',fill:'forwards'});
   await chapterAnimation.finished.catch(()=>{});
  }
  if(request!==chapterRequest)return;
  if(push){
   history.replaceState({...history.state,windfall:true,scrollX:window.scrollX,scrollY:window.scrollY},'',location.href);
   history.pushState({windfall:true,scrollX:0,scrollY:0},'',url.href);
  }
  chapterMain.replaceChildren(...[...page.querySelector('main').childNodes].map(node=>node.cloneNode(true)));
  document.title=page.title;
  document.body.dataset.page=page.body.dataset.page;
  updateChapterSelection();
  sidebar.classList.remove('open');menu.setAttribute('aria-expanded','false');
  chapterAnimation?.cancel();
  const heading=chapterMain.querySelector('h1');
  if(heading){heading.setAttribute('tabindex','-1');heading.focus({preventScroll:true})}
  if(restore)window.scrollTo(restore.scrollX||0,restore.scrollY||0);
  else if(url.hash){
   let target;try{target=document.getElementById(decodeURIComponent(url.hash.slice(1)))}catch{}
   if(target)target.scrollIntoView({block:'start'});else window.scrollTo(0,0);
  }else window.scrollTo(0,0);
  if(!motionPreference.matches){
   chapterAnimation=chapterMain.animate([{opacity:0,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:200,easing:'cubic-bezier(.22,.61,.36,1)'});
   await chapterAnimation.finished.catch(()=>{});
  }
 }catch{
  if(request===chapterRequest)location.assign(url.href);
 }finally{
  if(request===chapterRequest){chapterAnimation?.cancel();chapterMain.removeAttribute('aria-busy')}
 }
}
document.addEventListener('click',event=>{
 if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
 const url=chapterDestination(event.target.closest('a[href]'));
 if(!url)return;
 if(url.pathname===location.pathname&&url.search===location.search&&url.hash)return;
 event.preventDefault();
 if(url.href===location.href){sidebar.classList.remove('open');menu.setAttribute('aria-expanded','false');return}
 changeChapter(url);
});
for(const eventName of ['pointerover','focusin'])document.addEventListener(eventName,event=>{
 const url=chapterDestination(event.target.closest('a[href]'));
 if(url)fetchChapter(url).catch(()=>{});
});
window.addEventListener('popstate',event=>{
 if(event.state?.windfall)changeChapter(new URL(location.href),{push:false,restore:event.state});
 else location.reload();
});
