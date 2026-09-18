import assert from 'node:assert/strict';
import { normalizePreferences, runtimePreferenceValue } from '../src/scripts/experience/preferences.js';

const prefs = normalizePreferences({ masterVolume: 25, gameBgmVolume: 80, ambientVolume: 60, interfaceVolume: 40, voiceVolume: 100 });
assert.equal(prefs.masterVolume, 25, '总音量必须被保存');
for (const [key, expected] of Object.entries({ 'audio.bgm': 20, 'audio.ambient': 15, 'audio.effects': 10, 'audio.voice': 25 })) {
  assert.equal(runtimePreferenceValue(key, prefs), expected, `${key} 必须经过总音量`);
  assert.equal(runtimePreferenceValue(key, { ...prefs, masterVolume: 0 }), 0, `${key} 总音量为零必须静音`);
  assert.equal(runtimePreferenceValue(key, { ...prefs, masterMuted: true }), 0, `${key} 总静音必须生效`);
}
assert.equal(normalizePreferences({}).masterVolume, 80, '默认总音量保留足够响度');
assert.equal(normalizePreferences({ masterVolume: 150 }).masterVolume, 100);
assert.equal(normalizePreferences({ masterVolume: -2 }).masterVolume, 0);
console.log('Master volume: persistence, defaults, four runtime channels, zero and mute passed.');
