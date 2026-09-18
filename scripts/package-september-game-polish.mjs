import { readFile, writeFile, cp, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
const base='0.3.0-4830749c';
const root=path.resolve('public/games/lonely-sea-chapter-one');
// Exact Gemini 3.7 Flash High output, 2026-09-17. Add one attribution line only.
const attribution={text_zh:'我现在的这身打扮，出自《爱丽丝2010》的封面。',text_ja:'今の私のこの姿は、『アリス2010』のパッケージのものなんですよ。',text_en:'My current appearance is from the cover of Alice 2010.'};
let html=await readFile(path.join(root,base,'index.html'),'utf8');
const pattern=/<script type="application\/json" id="story-data">([\s\S]*?)<\/script>/;
const bundle=JSON.parse(html.match(pattern)[1]);
const scene=bundle.project.scenes.find(s=>s.id==='scene_alice_1');
const after=scene.blocks.findIndex(b=>b.id==='line_l002');
const line=structuredClone(scene.blocks[after]);line.id='line_l002_cover';delete line.voiceAssetId;delete line.tts;
line.text=attribution.text_zh;line.localizedText={'zh-CN':attribution.text_zh,'ja-JP':attribution.text_ja,'en-US':attribution.text_en};line.figureAnimation.mouthSync='off';line.source='ai';
scene.blocks.splice(after+1,0,line);
html=html.replace('border: 0;\n  background: linear-gradient(90deg, transparent 0, rgb(7 22 29 / 72%) 12%, rgb(8 25 33 / 88%) 50%, rgb(7 22 29 / 72%) 88%, transparent 100%);','border: 1px solid rgb(195 208 207 / 28%);\n  border-left: 2px solid rgb(216 181 120 / 68%);\n  background: rgb(8 25 33 / 92%);');
html=html.replace('  -webkit-mask-image: linear-gradient(90deg, transparent, #000 11%, #000 89%, transparent);\n  mask-image: linear-gradient(90deg, transparent, #000 11%, #000 89%, transparent);\n','');
html=html.replace('background: linear-gradient(90deg, transparent 0, rgb(73 116 127 / 58%) 13%, rgb(13 38 47 / 94%) 50%, rgb(73 116 127 / 58%) 87%, transparent 100%);','background: rgb(24 53 63 / 96%);\n  border-color: rgb(216 181 120 / 74%);');
html=html.replace('event.stopPropagation();void manualSave()','event.stopPropagation();playChoiceSound("confirm");void manualSave()').replace('event.stopPropagation();void loadFromBlog()','event.stopPropagation();playChoiceSound("confirm");void loadFromBlog()');
html=html.replace('var oscillator=choiceAudioContext.createOscillator()', 'if(choiceAudioContext.state==="suspended")void choiceAudioContext.resume();var oscillator=choiceAudioContext.createOscillator()');
const revision=createHash('sha256').update(html).update(JSON.stringify(bundle.project)).digest('hex').slice(0,8);
const release='0.3.0-'+revision;
const destination=path.join(root,release);
try{await access(destination);throw new Error('Release exists; refusing overwrite: '+release)}catch(e){if(e.code!=='ENOENT')throw e;}
await cp(path.join(root,base),destination,{recursive:true});
bundle.manifest.game.releaseId=release;
html=html.replace(pattern,()=>'<script type="application/json" id="story-data">'+JSON.stringify(bundle)+'</script>');
await writeFile(path.join(destination,'index.html'),html);
await writeFile(path.join(destination,'story-ir.json'),JSON.stringify(bundle.project,null,2)+'\n');
for(const name of ['manifest.json','gal-blog.embed.json']){const m=JSON.parse(await readFile(path.join(destination,name),'utf8'));m.game.releaseId=release;await writeFile(path.join(destination,name),JSON.stringify(m,null,2)+'\n');}
const integrity=JSON.parse(await readFile(path.join(destination,'integrity.json'),'utf8'));
for(const entry of integrity.files){const data=await readFile(path.join(destination,entry.path));entry.bytes=data.length;entry.sha256=createHash('sha256').update(data).digest('hex');}
await writeFile(path.join(destination,'integrity.json'),JSON.stringify(integrity,null,2)+'\n');
const registry='src/lib/gal-blog/release-registry.ts';let code=await readFile(registry,'utf8');code=code.replace('currentReleaseId: "'+base+'"','currentReleaseId: "'+release+'"');code=code.replace('    releases: [','    releases: [\n      { releaseId: "'+release+'", directory: "'+release+'" },');await writeFile(registry,code);
console.log(JSON.stringify({base,release,destination}));
