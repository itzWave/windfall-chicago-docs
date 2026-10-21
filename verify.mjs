import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const dist=path.join(root,'dist');
const {release}=JSON.parse(fs.readFileSync(path.join(dist,'release.json'),'utf8'));
const sections=JSON.parse(fs.readFileSync(path.join(root,'content/rules.json'),'utf8'));
const pages=['index.html',...sections.map(s=>s.slug+'.html')];
const styles=new Set(),scripts=new Set();
const escape=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
for(const page of pages){
 const html=fs.readFileSync(path.join(dist,page),'utf8');
 assert.ok(html.includes(`data-release="${release}"`),`${page}: wrong release`);
 for(const match of html.matchAll(/(?:href|src)="([^"]+)"/g)){
  const value=match[1];if(value.startsWith('#')||value.startsWith('http'))continue;
  const url=new URL(value,'https://example.test/');
  assert.ok(fs.existsSync(path.join(dist,url.pathname.slice(1))),`${page}: missing ${value}`);
  if(url.pathname.endsWith('.html'))assert.equal(url.searchParams.get('release'),release,`${page}: unversioned category link`);
 }
 const style=html.match(/rel="stylesheet" href="([^"]+)"/)[1];styles.add(style);
 assert.ok(style.startsWith('windfall.css?v='),`${page}: legacy theme`);
 scripts.add(html.match(/src="(app.js[^\"]+)"/)[1]);
 const section=sections.find(s=>page===s.slug+'.html');
 if(section)for(const block of section.blocks)assert.ok(html.includes(escape(block.text)),`${page}: policy text missing`);
}
assert.equal(styles.size,1,'Categories use different styles');
assert.equal(scripts.size,1,'Categories use different scripts');
assert.ok(fs.readFileSync(path.join(dist,'app.js'),'utf8').includes("'.html?release='+document.body.dataset.release"),'Search links must retain release');
console.log(`Verified ${pages.length} pages: consistent release, styles, scripts, category links and complete policy content.`);
