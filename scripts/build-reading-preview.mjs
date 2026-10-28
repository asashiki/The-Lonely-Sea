// Portable design review built from the production HTML, CSS and controllers.
// Run after pnpm build. Reading text and covers are included; inline article
// illustrations, live comments, music and game runtimes stay on the real site.
import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import ts from 'typescript';
import { JSDOM, VirtualConsole } from 'jsdom';

const parse = html => new JSDOM(html, { virtualConsole: new VirtualConsole() }).window.document;
const home = parse(await readFile('dist/index.html', 'utf8'));
const cssFiles = new Set([...home.querySelectorAll('link[rel="stylesheet"]')].map(node => node.getAttribute('href')));
const title = ['.scene-stack', '.stage-wash', '.identity', '.title-menu', '.title-discovery'].map(selector => home.querySelector(selector)?.outerHTML || '').join('');
const load = home.querySelector('[data-screen="load"]').cloneNode(true);
load.setAttribute('aria-hidden', 'false');
load.querySelectorAll('[data-xiii-panel]:not([data-xiii-panel="articles"]), [data-xiii-index-group]:not([data-xiii-index-group="articles"]), [data-xiii-reference-switcher], [data-xiii-story-confirm]').forEach(node => node.remove());
const articles = {};
for (const file of (await readdir('dist/posts', { recursive: true })).filter(file => file.endsWith('index.html'))) {
  const page = parse(await readFile(path.join('dist/posts', file), 'utf8'));
  page.querySelectorAll('link[rel="stylesheet"]').forEach(node => cssFiles.add(node.getAttribute('href')));
  const article = page.querySelector('.reading-main article');
  article.querySelectorAll('.reading-comment-anchor, .prose img, .prose iframe, .prose video, script').forEach(node => node.remove());
  articles[article.dataset.articlePath] = article.outerHTML;
}
let css = (await Promise.all([...cssFiles].map(file => readFile(`dist${file}`, 'utf8')))).join('\n');
css = css.replace(/@import\s*(?:url\([^;]+\)|["'][^"']+["'])\s*;/g, '');

// Keep one copy of each image in the outer document; expand when a scene opens.
const allMarkup = [title, load.outerHTML, ...Object.values(articles)].join('');
const localPaths = new Set([...allMarkup.matchAll(/(?:src|data-cover|data-cg)="(\/[^"<>]+)"/g)].map(match => match[1]));
for (const match of css.matchAll(/url\(["']?(\/[^)'"\s]+)/g)) localPaths.add(match[1]);
const assets = {};
for (const url of localPaths) {
  const filename = `dist${decodeURI(url)}`;
  if (!/\.(webp|png|jpe?g|svg)$/i.test(filename)) continue;
  try {
    const bytes = await readFile(filename);
    assets[url] = filename.endsWith('.svg')
      ? `data:image/svg+xml;base64,${bytes.toString('base64')}`
      : `data:image/webp;base64,${(await sharp(bytes).resize({ width: 1100, withoutEnlargement: true }).webp({ quality: 70 }).toBuffer()).toString('base64')}`;
  } catch { /* A remote article image is intentionally outside this preview. */ }
}
const sources = await Promise.all(['src/scripts/experience/article-selection.js', 'src/scripts/reading-chapter.js', 'src/scripts/experience/title-discovery.js'].map(file => readFile(file, 'utf8')));
const activity = ts.transpileModule(await readFile('src/lib/blog-activity.ts', 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
const controllers = [activity, ...sources].map(source => source.replace(/^import .*;\s*$/gm, '').replace(/\bexport (?=(?:async )?function|const)/g, '')).join('\n');
const payload = JSON.stringify({ title, load: load.outerHTML, articles, css, assets, controllers }).replaceAll('<', '\\u003c');

const html = String.raw`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>孤独之海 · 阅读路线预览</title><style>
*{box-sizing:border-box}html,body{height:100%;margin:0;background:#101820;color:#dfe8ed;font-family:"Yu Gothic","PingFang SC",sans-serif}.review-bar{height:58px;display:flex;gap:22px;align-items:center;padding:0 22px;border-bottom:1px solid #ffffff18}.review-bar strong{font-size:12px;letter-spacing:.12em;font-weight:500}.review-bar nav{display:flex;gap:6px}.review-bar button{min-height:36px;padding:8px 14px;border:0;background:none;color:#9eafb9;font:inherit;font-size:12px;cursor:pointer}.review-bar button[aria-pressed=true]{background:#dce8ed;color:#15212a}.review-bar label{margin-left:auto;font-size:11px;color:#9eafb9}.review-bar select{color:#dfe8ed;background:#18252e;border:0;padding:8px;font:inherit}.review-stage{display:block;width:100%;height:calc(100% - 90px);border:0;background:#c5ccd0}.review-note{height:32px;margin:0;padding:8px 22px;font-size:10px;color:#9eafb9;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}.review-bar button:focus-visible,.review-bar select:focus-visible{outline:2px solid #b8d4e2;outline-offset:2px}@media(max-width:620px){.review-bar{height:62px;gap:4px;padding:0 8px;flex-wrap:wrap}.review-bar strong{display:none}.review-bar button{padding:8px 10px}.review-note{padding:8px}.review-stage{height:calc(100% - 94px)}}
</style></head><body><header class="review-bar"><strong>孤独之海 / 阅读路线</strong><nav aria-label="预览页面"><button data-view="title" aria-pressed="true">01 首页</button><button data-view="load" aria-pressed="false">02 LOAD</button><button data-view="article" aria-pressed="false">03 阅读</button></nav><label>画面 <select id="theme"><option value="mist">雾</option><option value="day">昼</option><option value="night">夜</option><option value="crimson">绯</option></select></label></header><iframe class="review-stage" title="孤独之海页面预览"></iframe><p class="review-note">点击最新文章或 LOAD 条目进入阅读。包含公开文章文字与封面；正文配图、评论和音乐请在正式站查看。</p><script>
const data=${payload};
const frame=document.querySelector('iframe');
let view='title',articlePath=Object.keys(data.articles).find(path=>path.includes('mcp-switch'))||Object.keys(data.articles)[0];
function embed(source){for(const [url,image]of Object.entries(data.assets).sort((a,b)=>b[0].length-a[0].length))source=source.split(url).join(image);return source;}
const styles=embed(data.css);
function sceneRuntime(){
  const send=(type,value)=>parent.postMessage({type,value},'*');
  const root=document.querySelector('.reading-system');
  if(root){
    initReadingChapter(root,{reducedMotion:()=>matchMedia('(prefers-reduced-motion:reduce)').matches});
    addEventListener('scroll',()=>root.classList.toggle('is-reading-body',root.querySelector('[data-reading-content]').getBoundingClientRect().top<190),{passive:true});
    document.querySelectorAll('[data-reading-toc]').forEach(link=>link.addEventListener('click',event=>{event.preventDefault();const details=link.closest('details');if(details)details.open=false;document.getElementById(link.dataset.readingToc)?.scrollIntoView({block:'start',behavior:'smooth'});}));
    document.querySelector('[data-cg]')?.addEventListener('click',()=>{const dialog=document.createElement('dialog');dialog.style.cssText='padding:0;border:0;background:#101820;max-width:94vw;max-height:92vh';dialog.innerHTML='<img style="max-width:92vw;max-height:88vh;display:block" src="'+document.querySelector('[data-cg]').dataset.cg+'"><button style="position:absolute;right:10px;top:10px;background:#101820;color:white;border:0;padding:10px;cursor:pointer">关闭 ×</button>';document.body.append(dialog);dialog.addEventListener('click',()=>{dialog.close();dialog.remove();});dialog.showModal();});
  }
  if(document.querySelector('[data-title-discovery]'))initTitleDiscovery({onArticle:href=>send('article',new URL(href).pathname),onArchive:()=>send('view','load')}).sync(false,'ZH-CN');
  document.querySelectorAll('[data-command]').forEach(button=>button.addEventListener('click',()=>{if(button.dataset.command==='LOAD')send('view','load');else send('live','/?screen='+({EXTRA:'extra',OPTION:'option',START:'start'}[button.dataset.command]||''));}));
  const canvas=document.querySelector('.tracks-xiii-canvas');
  if(canvas){
    const slots=[...canvas.querySelectorAll('[data-xiii-article-slot]')];
    let filter='all',page=0;
    const selection=initArticleSelection(canvas,{language:()=> 'ZH-CN',reducedMotion:()=>matchMedia('(prefers-reduced-motion:reduce)').matches,onOpen:slot=>send('article',slot.dataset.href)});
    const pageNav=canvas.querySelector('.tracks-xiii-page-nav');
    const refresh=()=>{const matches=slots.filter(slot=>filter==='all'||slot.dataset.category===filter);const pages=Math.max(1,Math.ceil(matches.length/6));page=Math.max(0,Math.min(pages-1,page));const visible=new Set(matches.slice(page*6,page*6+6));slots.forEach(slot=>{slot.classList.toggle('is-page-hidden',!visible.has(slot));slot.tabIndex=visible.has(slot)?0:-1;});selection.refresh();if(pageNav){pageNav.innerHTML='<span class="tracks-xiii-page-markers">'+Array.from({length:pages},(_,i)=>'<button data-review-page="'+i+'" aria-pressed="'+(i===page)+'">'+String(i+1).padStart(2,'0')+'</button>').join('')+'</span>';pageNav.querySelectorAll('button').forEach(button=>button.onclick=()=>{page=Number(button.dataset.reviewPage);refresh();});}};
    canvas.querySelectorAll('[data-xiii-index-group="articles"] [data-xiii-filter]').forEach(button=>button.onclick=()=>{filter=button.dataset.xiiiFilter;page=0;canvas.querySelectorAll('[data-xiii-filter]').forEach(node=>node.setAttribute('aria-selected',String(node===button)));refresh();});
    slots.forEach(slot=>slot.onclick=()=>send('article',slot.dataset.href));
    canvas.querySelectorAll('[data-xiii-page-entry]').forEach(button=>button.onclick=()=>{if(button.dataset.xiiiPageEntry!=='articles')send('live','/?screen=load&loadPage='+button.dataset.xiiiPageEntry);});
    canvas.querySelectorAll('[data-xiii-page-direction]').forEach(button=>button.onclick=()=>{page+=Number(button.dataset.xiiiPageDirection);refresh();});
    canvas.querySelector('[data-back]')?.addEventListener('click',()=>send('view','title'));
    canvas.addEventListener('keydown',event=>{if(!['ArrowUp','ArrowDown'].includes(event.key)||!event.target.matches('[data-xiii-article-slot]'))return;event.preventDefault();const visible=slots.filter(slot=>!slot.classList.contains('is-page-hidden'));visible[Math.max(0,Math.min(visible.length-1,visible.indexOf(event.target)+(event.key==='ArrowDown'?1:-1)))].focus();});
    refresh();
  }
  document.addEventListener('click',event=>{const link=event.target.closest('a');if(!link||event.defaultPrevented||link.getAttribute('href')?.startsWith('#'))return;event.preventDefault();const href=link.getAttribute('href');if(href.startsWith('/posts/'))send('article',href);else if(href.startsWith('/?screen=load'))send('view','load');else if(href==='/')send('view','title');else send('live',href);});
}
function render(){
  const theme=document.querySelector('#theme').value;
  document.querySelectorAll('[data-view]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.view===view)));
  const content=view==='title'?'<main class="stage">'+data.title+'</main>':view==='load'?'<main class="stage">'+data.load+'</main>':'<div class="reading-system is-ready" data-reading-scene="'+theme+'" style="--reading-scene-art:url('+data.assets['/assets/lonely-sea/'+theme+'.webp']+')"><div class="reading-horizon"></div><div class="reading-ledger"><main class="reading-main">'+data.articles[articlePath]+'</main></div></div>';
  frame.srcdoc='<!doctype html><html lang="zh-CN" class="'+(view==='article'?'is-reading-page':'')+'"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base href="https://asashiki.com/"><style>'+styles+'\nhtml,body{cursor:auto!important}button,a{cursor:pointer!important}.stage{animation:none!important}.reading-cover-open{cursor:zoom-in!important}[hidden]{display:none!important}.record-neighbours .is-empty{align-self:center}.reading-system .prose figure:empty{display:none}</style></head><body class="is-ready" data-route="'+view+'" data-scene="'+theme+'">'+embed(content)+'<script>'+data.controllers+'\n('+sceneRuntime.toString()+')();<'+ '/script></body></html>';
}
document.querySelectorAll('[data-view]').forEach(button=>button.onclick=()=>{view=button.dataset.view;render();});
document.querySelector('#theme').onchange=render;
addEventListener('message',event=>{if(event.source!==frame.contentWindow)return;const{type,value}=event.data||{};if(type==='view'&&['title','load'].includes(value)){view=value;render();}else if(type==='article'&&data.articles[value]){articlePath=value;view='article';render();}else if(type==='live'&&typeof value==='string'){const url=new URL(value,'https://asashiki.com');if(['https:','http:'].includes(url.protocol))window.open(url.href,'_blank','noopener,noreferrer');}});
render();
</script></body></html>`;
const output = 'prototypes/reading-journey-preview.html';
await writeFile(output, html);
console.log(`${output}: ${Buffer.byteLength(html)} bytes; ${Object.keys(articles).length} public articles; ${Object.keys(assets).length} embedded images.`);
