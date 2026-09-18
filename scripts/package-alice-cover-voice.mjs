// Uses the existing studio's MiniMax delivery and mouth-animation implementation.
// Node 24+. Credentials are read only from the environment; never persisted.
import { readFile, writeFile, mkdir, cp, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
const base = '0.3.0-19dbb930';
const root = resolve('public/games/lonely-sea-chapter-one');
const studio = process.env.VIBEGAL_STUDIO || 'C:/Users/Hey/Downloads/vibegal-studio';
const cache = resolve('tmp/alice-cover-voice');
await mkdir(cache, { recursive: true });
let html = await readFile(join(root, base, 'index.html'), 'utf8');
const pattern = /<script type="application\/json" id="story-data">([\s\S]*?)<\/script>/;
const bundle = JSON.parse(html.match(pattern)[1]);
const scene = bundle.project.scenes.find(s => s.id === 'scene_alice_1');
const line = scene.blocks.find(b => b.id === 'line_l002_cover');
const previous = scene.blocks.find(b => b.id === 'line_l002');
const text = line.localizedText['ja-JP'];
const audioFile = join(cache, 'l002-cover.mp3');
try { await access(audioFile); } catch {
  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) throw new Error('MINIMAX_API_KEY is missing');
  const response = await fetch('https://api.minimaxi.com/v1/t2a_v2', {
    method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ model: 'speech-2.8-hd', text, stream: false, language_boost: 'Japanese',
      voice_setting: { voice_id: process.env.MINIMAX_VOICE_ID_MAI || 'MaiClone', speed: 0.94, vol: 1, pitch: 0 },
      audio_setting: { sample_rate: 32000, bitrate: 128000, format: 'mp3', channel: 1 } }),
    signal: AbortSignal.timeout(120000),
  });
  if (!response.ok) throw new Error(`MiniMax HTTP ${response.status}`);
  const value = await response.json();
  if (value.base_resp?.status_code !== 0 || !value.data?.audio) throw new Error(`MiniMax status ${value.base_resp?.status_code}`);
  await writeFile(audioFile, Buffer.from(value.data.audio, 'hex'));
}
// Node's TS loader needs explicit extensions; copy only the four existing pure modules.
for (const name of ['schema', 'audioEnvelope', 'japaneseArticulation', 'mouthTimeline']) {
  const source = await readFile(join(studio, 'lib/figure-motion', name + '.ts'), 'utf8');
  await writeFile(join(cache, name + '.ts'), source.replace(/from "(\.\/[^".]+)"/g, 'from "$1.ts"'));
}
const { analyseAudioSamples } = await import(pathToFileURL(join(cache, 'audioEnvelope.ts')));
const { buildMouthTimeline } = await import(pathToFileURL(join(cache, 'mouthTimeline.ts')));
const { DEFAULT_MOUTH_PROFILE } = await import(pathToFileURL(join(cache, 'schema.ts')));
const pcm = execFileSync('ffmpeg', ['-v', 'error', '-i', audioFile, '-f', 'f32le', '-ac', '1', '-ar', '32000', 'pipe:1']);
const samples = new Float32Array(pcm.length / 4);
for (let i = 0; i < samples.length; i++) samples[i] = pcm.readFloatLE(i * 4);
const timeline = buildMouthTimeline(analyseAudioSamples(samples, 32000, DEFAULT_MOUTH_PROFILE), DEFAULT_MOUTH_PROFILE, { mode: 'japanese', japaneseReading: text });
const asset = structuredClone(bundle.project.assets.find(a => a.id === previous.voiceAssetId));
asset.id = 'voice_l002_cover'; asset.name = 'Alice · L002 cover'; asset.aliases = ['L002_COVER'];
asset.path = 'project-assets/lonely-sea/voice/l002-cover.mp3';
asset.metadata.speechText = text;
asset.metadata.mouthTimelinePath = 'project-assets/lonely-sea/voice/l002-cover.mouth.json';
bundle.project.assets.push(asset);
bundle.assets[asset.id] = 'assets/voice-l002-cover.mp3';
bundle.timelines[asset.metadata.mouthTimelinePath] = timeline;
line.voiceAssetId = asset.id;
line.tts = { language: 'ja-JP', text, delivery: 'gentle', takeId: 'L002_COVER' };
line.figureAnimation.mouthSync = 'on';
html = html.replace(/\.choices button \{[\s\S]*?(?=\n\.controls \{)/, `.choices button {
  min-height: 5.6cqh;
  padding: .42em 3em;
  border: 0;
  background: rgb(8 25 33 / 92%);
  color: rgb(244 244 239 / 78%);
  font-size: clamp(15px, 2.05cqh, 22px);
  font-weight: 400;
  text-align: left;
  letter-spacing: .055em;
  text-shadow: 0 .12em .45em rgb(0 0 0 / 88%);
  cursor: pointer;
  transition: color 100ms ease;
}
.choices.center button { text-align: center; }
.choices button:hover, .choices button.hovered, .choices button:focus-visible, .choices button.active, .choices button.confirmed {
  outline: none;
  color: #fff;
  font-weight: 700;
}
.choices button:disabled { opacity: .34; cursor: default; }
`);
const audio = await readFile(audioFile);
const release = '0.3.0-' + createHash('sha256').update(html).update(JSON.stringify(bundle)).update(audio).digest('hex').slice(0, 8);
const destination = join(root, release);
try { await access(destination); throw new Error('Immutable release already exists: ' + release); } catch(e) { if (e.code !== 'ENOENT') throw e; }
await cp(join(root, base), destination, { recursive: true });
bundle.manifest.game.releaseId = release;
html = html.replace(pattern, () => '<script type="application/json" id="story-data">' + JSON.stringify(bundle) + '</script>');
await writeFile(join(destination, 'index.html'), html);
await writeFile(join(destination, 'story-ir.json'), JSON.stringify(bundle.project, null, 2) + '\n');
await writeFile(join(destination, bundle.assets[asset.id]), audio);
for (const name of ['manifest.json', 'gal-blog.embed.json']) {
  const manifest = JSON.parse(await readFile(join(destination, name), 'utf8'));
  manifest.game.releaseId = release;
  await writeFile(join(destination, name), JSON.stringify(manifest, null, 2) + '\n');
}
const integrity = JSON.parse(await readFile(join(destination, 'integrity.json'), 'utf8'));
integrity.files.push({ path: bundle.assets[asset.id] });
for (const entry of integrity.files) {
  const bytes = await readFile(join(destination, entry.path));
  entry.bytes = bytes.length; entry.sha256 = createHash('sha256').update(bytes).digest('hex');
}
await writeFile(join(destination, 'integrity.json'), JSON.stringify(integrity, null, 2) + '\n');
const registry = 'src/lib/gal-blog/release-registry.ts';
let code = await readFile(registry, 'utf8');
code = code.replace('currentReleaseId: "' + base + '"', 'currentReleaseId: "' + release + '"');
code = code.replace('    releases: [', '    releases: [\n      { releaseId: "' + release + '", directory: "' + release + '" },');
await writeFile(registry, code);
console.log(JSON.stringify({ release, durationMs: timeline.durationMs, audioBytes: audio.length, language: 'ja-JP' }));
