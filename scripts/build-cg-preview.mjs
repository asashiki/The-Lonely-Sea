// A portable review artifact using the production viewer markup/controller/styles.
import { readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import { JSDOM } from 'jsdom';

const source = await readFile('src/components/experience/ExtraScreen.astro', 'utf8');
const viewer = source.slice(source.indexOf('    <section class="cg-viewer"'), source.lastIndexOf('    </section>') + '    </section>'.length);
const dom = new JSDOM(viewer);
const cleanViewer = dom.window.document.body.innerHTML;
const gallery = (await readFile('src/scripts/experience/cg-gallery.js', 'utf8')).replace('export function', 'function');
const css = await readFile('src/styles/cg-theater.css', 'utf8');
const selection = [
  { number: 1, title: '雪中神社' },
  { number: 3, title: '月下石阶' },
  { number: 4, title: '赤色海岸' },
];
const items = await Promise.all(selection.map(async ({ number, title }) => ({
  title, unlocked: true,
  art: `data:image/webp;base64,${(await sharp(`public/assets/cg/generated/scene-${String(number).padStart(2, '0')}.webp`).resize(1100).webp({ quality: 75 }).toBuffer()).toString('base64')}`,
})));
const html = `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>孤独之海 · CG 鉴赏预览</title>
<style>
*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;background:#090d12;color:#e8edf0;font-family:"Yu Mincho","Songti SC",serif}button{font:inherit}button:focus-visible{outline:2px solid #d4e2ed;outline-offset:3px}.extra-canvas{position:relative;width:100%;height:100%;container-type:size;overflow:hidden}.cg-viewer{opacity:0;visibility:hidden;pointer-events:none}.cg-viewer[aria-hidden="false"]{opacity:1;visibility:visible;pointer-events:auto}.cg-viewer-caption{display:flex;align-items:baseline;margin:0}.cg-viewer-caption small{font-family:sans-serif}.cg-viewer-caption strong{font-weight:400}.preview-cover{max-width:1100px;padding:8vh 5vw;margin:auto}.preview-cover p{color:#a5b3c2;line-height:1.8}.preview-cover h1{font-weight:400;font-size:clamp(26px,4vw,48px);letter-spacing:.12em}.preview-choices{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px;margin-top:40px}.preview-choices button{padding:0;border:0;background:none;color:inherit;cursor:pointer;text-align:left}.preview-choices img{width:100%;aspect-ratio:16/9;object-fit:cover}.preview-choices span{display:block;margin-top:12px;font-size:14px}@media(max-width:600px){.preview-choices{grid-template-columns:1fr;gap:16px}.preview-cover{height:100%;overflow:auto}}
${css}</style><body><main class="extra-canvas"><section class="preview-cover"><p>THE LONELY SEA / EXTRA</p><h1>CG 鉴赏预览</h1><p>三张现有画面的交互预览。正式版包含全部 20 张已开放 CG。<br>打开「画面索引」选图；点击画面或按 H 隐藏操作，Esc 返回。</p><div class="preview-choices">${items.map((item, i) => `<button data-open="${i}"><img src="${item.art}" alt="${item.title}"><span>0${i + 1} / ${item.title}</span></button>`).join('')}</div></section>${cleanViewer}</main><script>
${gallery}
const items = ${JSON.stringify(items)};
const viewer = createCgGallery({root:document.querySelector('#cg-viewer'),items,reduceMotion:()=>matchMedia('(prefers-reduced-motion:reduce)').matches,language:()=>'ZH-CN'});
document.querySelectorAll('[data-open]').forEach(button=>button.addEventListener('click',()=>viewer.open(Number(button.dataset.open),button)));
viewer.open(0,document.querySelector('[data-open="0"]'));
</script></body></html>`;
const output = 'prototypes/cg-theater-preview.html';
await writeFile(output, html);
console.log(`${output}: ${Buffer.byteLength(html)} bytes`);
