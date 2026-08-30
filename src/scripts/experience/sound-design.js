export const SOUND_SELECTION_STORAGE_KEY = "lonely-sea-sound-selection-v1";
export const SOUND_SELECTION_CHANGE_EVENT = "lonely-sea:sound-selection-change";

export const SOUND_CUE_LABELS = Object.freeze({
  hover: "悬停",
  select: "移动焦点",
  press: "按下",
  confirm: "确认",
  start: "开始",
  back: "返回",
  close: "关闭",
  open: "展开",
  page: "翻页",
  toggleOn: "开启",
  toggleOff: "关闭开关",
  tick: "滑杆刻度",
  success: "完成提示",
  achievement: "获得成就",
  error: "错误提示",
});

export const SOUND_CATEGORIES = Object.freeze([
  { id: "all", label: "全部标本", latin: "ALL" },
  { id: "interface", label: "界面与光标", latin: "UI" },
  { id: "motion", label: "开合与转场", latin: "MOTION" },
  { id: "paper", label: "纸张与卷轴", latin: "PAPER" },
  { id: "keys", label: "琴键与长尾", latin: "KEYS" },
  { id: "signal", label: "提示与记忆", latin: "SIGNAL" },
]);

function preset(id, title, latin, category, cue, duration, description, tags, recipe) {
  return Object.freeze({ id, title, latin, category, cue, duration, description, tags, recipe: Object.freeze(recipe) });
}

const P = preset;

export const SOUND_PRESETS = Object.freeze([
  P("foam-cursor", "浪沫掠过", "FOAM CURSOR", "interface", "hover", .34, "极轻的水面擦音，适合频繁经过按钮。", ["轻", "水感", "短"], { family: "water", midi: 88, direction: 1, brightness: .82, wet: .18 }),
  P("shell-glint", "贝壳微光", "SHELL GLINT", "interface", "hover", .62, "一粒偏暖的高频闪光，比电子提示更柔软。", ["清亮", "微尾音"], { family: "chime", notes: [[91, 0, .72]], material: "shell", wet: .34 }),
  P("rain-pin", "雨针定位", "RAIN PIN", "interface", "select", .42, "像雨点落在细金属边缘，方向键移动时很清楚。", ["清脆", "定位"], { family: "chime", notes: [[86, 0, .7], [98, .035, .22]], material: "glass", wet: .18 }),
  P("ink-drop", "墨滴落纸", "INK DROP", "interface", "press", .48, "低沉水滴与纸面触感叠合，按下时有重量。", ["柔和", "触感"], { family: "water", midi: 67, direction: -1, brightness: .38, impact: .75, wet: .15 }),
  P("soft-key", "软键落下", "SOFT KEY", "interface", "press", .38, "包覆毡面的短促键击，不抢对白。", ["毡面", "短"], { family: "piano", notes: [[74, 0, .68]], material: "felt", tail: .25, wet: .08 }),
  P("ivory-confirm", "象牙确认", "IVORY CONFIRM", "interface", "confirm", 1.7, "一枚干净的钢琴音，尾端留下一点房间感。", ["钢琴", "温润"], { family: "piano", notes: [[79, 0, .8], [86, .045, .22]], material: "felt", wet: .28 }),
  P("glass-confirm", "玻璃回信", "GLASS REPLY", "interface", "confirm", 1.35, "两层玻璃泛音回应确认动作，明亮但不尖锐。", ["玻璃", "清亮"], { family: "chime", notes: [[83, 0, .72], [90, .07, .38]], material: "glass", wet: .42 }),
  P("wood-confirm", "木匣轻扣", "WOODEN ACK", "interface", "confirm", .72, "旧木抽屉合到卡榫上的两段触感。", ["木质", "干"], { family: "wood", midi: 62, pattern: [0, .085], weight: .52, wet: .06 }),
  P("pearl-rise", "珍珠上浮", "PEARL RISE", "interface", "toggleOn", .9, "一颗圆润音粒向上浮起，适合作为开启反馈。", ["上行", "圆润"], { family: "chime", notes: [[76, 0, .58], [83, .09, .48]], material: "shell", wet: .3 }),
  P("pearl-fall", "珍珠沉落", "PEARL FALL", "interface", "toggleOff", .82, "同一音色向下归位，开关的正反关系明确。", ["下行", "圆润"], { family: "chime", notes: [[83, 0, .52], [76, .09, .45]], material: "shell", wet: .24 }),
  P("rain-tick", "雨尺刻度", "RAIN SCALE", "interface", "tick", .28, "像指尖拨过一滴雨，只保留最短的刻度感。", ["极短", "刻度"], { family: "water", midi: 93, direction: 0, brightness: .92, impact: .25, wet: .06 }),

  P("mist-drawer", "雾中抽出", "MIST DRAWER", "motion", "open", 1.05, "抽屉从潮湿木柜中滑出，末端有一枚轻止挡。", ["抽出", "木质"], { family: "drawer", direction: 1, weight: .58, brightness: .45, wet: .2 }),
  P("tide-gate", "潮门展开", "TIDE GATE", "motion", "open", 1.46, "低处潮声向两侧打开，适合进入大页面。", ["展开", "宽阔"], { family: "wave", direction: 1, midi: 52, weight: .75, wet: .34 }),
  P("ribbon-reveal", "缎带揭幕", "RIBBON REVEAL", "motion", "open", 1.18, "一条细长缎带从画面中央迅速抽开。", ["轻盈", "转场"], { family: "whoosh", direction: 1, brightness: .72, weight: .25, wet: .2 }),
  P("first-light-piano", "第一束光", "FIRST LIGHT", "motion", "start", 3.8, "由近及远的三枚钢琴音，开始后仍留有海雾般尾奏。", ["钢琴", "开场", "长尾"], { family: "piano", notes: [[62, 0, .72], [69, .18, .58], [74, .42, .76]], material: "felt", wet: .56 }),
  P("undertow-back", "退潮返回", "UNDERTOW", "motion", "back", .96, "宽频潮水向后收回，返回动作不显生硬。", ["退场", "水感"], { family: "wave", direction: -1, midi: 48, weight: .62, wet: .22 }),
  P("soft-retreat", "雾帘退后", "SOFT RETREAT", "motion", "back", .78, "一层雾帘快速后撤，轻而有明确方向。", ["轻", "退场"], { family: "whoosh", direction: -1, brightness: .48, weight: .18, wet: .16 }),
  P("paper-shut", "册页合拢", "FOLIO SHUT", "motion", "close", .66, "两侧厚纸相碰后安静落定。", ["合拢", "纸张"], { family: "paper", gesture: "shut", direction: -1, weight: .72, brightness: .42, grains: 9, wet: .08 }),
  P("archive-lock", "档案落锁", "ARCHIVE LOCK", "motion", "close", .94, "木扣、金属簧片与箱体共鸣组成的关闭声。", ["机械", "沉稳"], { family: "wood", midi: 48, pattern: [0, .11, .2], weight: .8, metal: .32, wet: .18 }),

  P("vellum-turn", "羊皮纸翻页", "VELLUM TURN", "paper", "page", .88, "偏厚的纸从右侧掀起、越过书脊再平落。", ["翻进去", "厚纸"], { family: "paper", gesture: "turn", direction: 1, weight: .58, brightness: .52, grains: 14, wet: .08 }),
  P("thin-page", "薄页掠过", "THIN LEAF", "paper", "page", .56, "轻薄纸张快速翻动，适合连续阅读。", ["翻页", "轻快"], { family: "paper", gesture: "turn", direction: 1, weight: .22, brightness: .84, grains: 11, wet: .04 }),
  P("heavy-page", "海图翻面", "CHART TURN", "paper", "page", 1.16, "覆膜海图缓慢弯折，落下时带一点桌面低响。", ["海图", "厚重"], { family: "paper", gesture: "turn", direction: 1, weight: .9, brightness: .34, grains: 18, wet: .1 }),
  P("page-back", "逆风翻回", "PAGE RETURN", "paper", "page", .82, "声音运动方向与前翻相反，适合作为上一页。", ["翻出来", "反向"], { family: "paper", gesture: "turn", direction: -1, weight: .46, brightness: .62, grains: 13, wet: .06 }),
  P("scroll-unfurl", "卷轴铺开", "SCROLL UNFURL", "paper", "open", 1.72, "卷轴连续滚动、纸面展开并在末端轻拍桌面。", ["卷轴", "展开"], { family: "paper", gesture: "unfurl", direction: 1, weight: .66, brightness: .46, grains: 28, wet: .12 }),
  P("scroll-rollup", "卷轴收束", "SCROLL ROLL-UP", "paper", "close", 1.52, "纸面被滚轴逐圈收回，节奏逐渐加快。", ["卷轴", "收起"], { family: "paper", gesture: "rollup", direction: -1, weight: .62, brightness: .5, grains: 25, wet: .1 }),
  P("letter-unfold", "信纸展平", "LETTER UNFOLD", "paper", "open", 1.34, "三道折痕依次松开，最后用手指压平。", ["信纸", "三段"], { family: "paper", gesture: "unfold", direction: 1, weight: .34, brightness: .7, grains: 18, wet: .05 }),
  P("photo-draw", "相片抽出", "PHOTO DRAW", "paper", "open", 1.08, "相纸从档案袋中抽出，带有光滑表面的摩擦。", ["抽出来", "相纸"], { family: "drawer", direction: 1, weight: .26, brightness: .8, paper: true, wet: .08 }),
  P("bookmark-pull", "书签抽离", "BOOKMARK PULL", "paper", "select", .74, "织物书签滑过纸缘，末端是一小段纤维弹动。", ["抽出", "织物"], { family: "whoosh", direction: 1, brightness: .34, weight: .12, fiber: true, wet: .06 }),
  P("silk-scroll", "绢本舒展", "SILK SCROLL", "paper", "open", 1.9, "布帛与木轴共同滚动，声音比纸卷更柔和。", ["卷轴", "丝绢"], { family: "paper", gesture: "unfurl", direction: 1, weight: .48, brightness: .25, grains: 24, fiber: true, wet: .18 }),
  P("seal-release", "封蜡启开", "SEAL RELEASE", "paper", "confirm", 1.02, "封蜡出现细裂，随后信封边缘被轻轻挑开。", ["封印", "细节"], { family: "wood", midi: 56, pattern: [0, .055, .12, .32], weight: .34, paper: true, metal: .12, wet: .1 }),
  P("archive-slip", "档案入槽", "ARCHIVE SLIP", "paper", "close", 1.12, "纸袋滑入狭窄档案格，最后停在木制挡板上。", ["滑入", "归档"], { family: "drawer", direction: -1, weight: .48, brightness: .5, paper: true, wet: .08 }),

  P("lone-key-long", "孤键余响", "LONE KEY", "keys", "confirm", 6.8, "单枚毡音钢琴键，主体很短，尾奏在远处停留。", ["钢琴", "6.8 秒", "长尾"], { family: "piano", notes: [[65, 0, .88]], material: "felt", wet: .72 }),
  P("felt-c-minor", "雾港小三度", "FOG MINOR THIRD", "keys", "open", 7.2, "低音与小三度先后进入，留下一种未说完的情绪。", ["钢琴", "忧郁", "长尾"], { family: "piano", notes: [[48, 0, .7], [63, .22, .64], [67, .5, .42]], material: "felt", wet: .68 }),
  P("moonlit-three-note", "月下三音", "MOONLIT PHRASE", "keys", "start", 8.2, "三枚高音缓慢落下，最后一音拥有最长的呼吸。", ["钢琴", "旋律", "8.2 秒"], { family: "piano", notes: [[76, 0, .58], [72, .42, .52], [79, .92, .74]], material: "felt", wet: .76 }),
  P("ocean-ninth", "海面九和弦", "OCEAN NINTH", "keys", "achievement", 8.8, "开放和弦从低处发亮，适合重要抵达而不是普通按钮。", ["钢琴", "和弦", "宽阔"], { family: "piano", notes: [[45, 0, .62], [52, .05, .5], [59, .1, .46], [62, .17, .4], [66, .24, .48]], material: "open", wet: .8 }),
  P("distant-piano", "远岸钢琴", "DISTANT PIANO", "keys", "success", 9.4, "经过低通与长混响的钢琴，好像来自雾中的另一座房间。", ["钢琴", "远景", "9.4 秒"], { family: "piano", notes: [[57, 0, .7], [64, .34, .54], [69, .72, .46]], material: "distant", wet: .88 }),
  P("glass-harmonica", "玻璃潮汐", "GLASS TIDE", "keys", "open", 7.5, "玻璃泛音缓慢升起又退去，没有明显敲击起点。", ["玻璃琴", "漂浮", "长尾"], { family: "string", notes: [[69, 0, .42], [76, .18, .34], [81, .42, .3]], material: "glass", wet: .84 }),
  P("celesta-memory", "旧日钢片琴", "CELESTA MEMORY", "keys", "success", 5.4, "四枚钢片音像记忆片段依次亮起。", ["钢片琴", "旋律"], { family: "chime", notes: [[72, 0, .58], [79, .19, .46], [76, .43, .4], [84, .72, .54]], material: "celesta", wet: .64 }),
  P("music-box-phrase", "发条海歌", "CLOCKWORK SEA", "keys", "success", 5.8, "微小机械噪声托着一段四音音乐盒旋律。", ["音乐盒", "机械"], { family: "musicbox", notes: [[76, 0, .58], [81, .28, .5], [79, .58, .46], [74, .9, .56]], wet: .56 }),
  P("harp-breath", "竖琴呼吸", "HARP BREATH", "keys", "open", 6.1, "由低至高的柔软拨弦，尾端像一口缓慢呼吸。", ["竖琴", "上行"], { family: "pluck", notes: [[52, 0, .5], [59, .1, .48], [64, .22, .44], [71, .36, .4], [76, .54, .36]], material: "harp", wet: .7 }),
  P("cello-harmonic", "大提琴泛音", "CELLO HARMONIC", "keys", "back", 7.6, "低弦的泛音缓慢下沉，适合章节退场。", ["弦乐", "低沉", "长尾"], { family: "string", notes: [[50, 0, .58], [57, .38, .32]], material: "cello", wet: .68 }),
  P("lighthouse-bell", "灯塔钟声", "LIGHTHOUSE BELL", "keys", "achievement", 8.6, "厚重钟体与海上回声，响一次就足以建立场景。", ["钟声", "辽阔", "8.6 秒"], { family: "gong", midi: 45, brightness: .7, weight: .78, wet: .82 }),
  P("drowned-gong", "沉海铜锣", "DROWNED GONG", "keys", "error", 9.8, "被海水滤去锐度的低频铜锣，适合不可逆的重大提示。", ["铜锣", "深水", "9.8 秒"], { family: "gong", midi: 35, brightness: .28, weight: 1, wet: .88 }),

  P("harbor-arrival", "抵达港湾", "HARBOR ARRIVAL", "signal", "success", 2.9, "由木质低音到明亮高音的短句，完成感清楚。", ["完成", "温暖"], { family: "piano", notes: [[60, 0, .54], [67, .13, .5], [72, .3, .68]], material: "felt", wet: .48 }),
  P("save-drop", "存档水滴", "SAVE DROP", "signal", "success", 1.58, "水滴落下后分成两层泛音，适合频繁保存。", ["保存", "水滴"], { family: "water", midi: 76, direction: 1, brightness: .7, impact: .55, second: true, wet: .42 }),
  P("constellation-piano", "星图完成", "CONSTELLATION", "signal", "achievement", 7.8, "五音逐点连成星图，最后以宽阔和声音收束。", ["钢琴", "成就", "长尾"], { family: "piano", notes: [[67, 0, .5], [72, .18, .48], [76, .36, .46], [79, .58, .52], [84, .86, .7], [60, .92, .36]], material: "open", wet: .78 }),
  P("star-map", "星图闪烁", "STAR MAP", "signal", "achievement", 4.5, "清亮音粒从左右交替出现，成就感更轻盈。", ["星光", "成就"], { family: "chime", notes: [[79, 0, .42], [86, .12, .45], [83, .28, .38], [91, .48, .58]], material: "glass", wet: .7 }),
  P("low-tide-warning", "低潮警示", "LOW TIDE", "signal", "error", 1.18, "两个向下的低音，明确但不使用刺耳蜂鸣。", ["错误", "低沉"], { family: "piano", notes: [[52, 0, .62], [47, .16, .66]], material: "felt", wet: .2 }),
  P("fog-warning", "雾笛警示", "FOG WARNING", "signal", "error", 1.92, "远处雾笛般的双音，适合网络或读取失败。", ["错误", "雾笛"], { family: "string", notes: [[43, 0, .62], [41, .42, .46]], material: "cello", wet: .46 }),
  P("message-arrival", "漂流信抵达", "DRIFT LETTER", "signal", "success", 1.72, "纸封擦过桌面后，响起一枚柔和提示音。", ["消息", "纸张"], { family: "letter", midi: 81, weight: .3, wet: .36 }),
  P("memory-unlocked", "记忆解封", "MEMORY UNLOCKED", "signal", "achievement", 5.6, "封印松开、呼吸展开，再由一枚钢琴和弦完成。", ["解锁", "复合音效"], { family: "memory", notes: [[55, .42, .42], [62, .5, .38], [67, .62, .55]], wet: .7 }),
]);

export const DEFAULT_SOUND_SELECTION = Object.freeze({
  hover: "foam-cursor",
  select: "rain-pin",
  press: "soft-key",
  confirm: "ivory-confirm",
  start: "first-light-piano",
  back: "undertow-back",
  close: "paper-shut",
  open: "mist-drawer",
  page: "vellum-turn",
  toggleOn: "pearl-rise",
  toggleOff: "pearl-fall",
  tick: "rain-tick",
  success: "harbor-arrival",
  achievement: "constellation-piano",
  error: "low-tide-warning",
});

const PRESET_BY_ID = new Map(SOUND_PRESETS.map((item) => [item.id, item]));

export function getSoundPreset(id) {
  return PRESET_BY_ID.get(id) || null;
}

export function normalizeSoundSelection(value = {}) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return Object.fromEntries(Object.entries(DEFAULT_SOUND_SELECTION).map(([cue, fallback]) => {
    const candidate = PRESET_BY_ID.has(source[cue]) ? source[cue] : fallback;
    return [cue, candidate];
  }));
}

export function readSoundSelection() {
  try {
    return normalizeSoundSelection(JSON.parse(localStorage.getItem(SOUND_SELECTION_STORAGE_KEY) || "{}"));
  } catch {
    return { ...DEFAULT_SOUND_SELECTION };
  }
}

export function writeSoundSelection(selection) {
  const normalized = normalizeSoundSelection(selection);
  try { localStorage.setItem(SOUND_SELECTION_STORAGE_KEY, JSON.stringify(normalized)); } catch {}
  window.dispatchEvent(new CustomEvent(SOUND_SELECTION_CHANGE_EVENT, { detail: { selection: normalized } }));
  return normalized;
}

function midiFrequency(midi) {
  return 440 * Math.pow(2, (Number(midi) - 69) / 12);
}

function seededNoise(seed) {
  let value = seed || 0x9e3779b9;
  return () => {
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    return ((value >>> 0) / 4294967295) * 2 - 1;
  };
}

function createImpulse(context, seconds = 5.8) {
  const length = Math.floor(context.sampleRate * seconds);
  const impulse = context.createBuffer(2, length, context.sampleRate);
  const random = seededNoise(0x516ea31d);
  for (let channel = 0; channel < 2; channel += 1) {
    const data = impulse.getChannelData(channel);
    let drift = 0;
    for (let index = 0; index < length; index += 1) {
      const position = index / length;
      drift = drift * .72 + random() * .28;
      data[index] = (random() * .74 + drift * .26) * Math.pow(1 - position, 3.15) * (index < 240 ? index / 240 : 1);
    }
  }
  return impulse;
}

function createNoiseBuffer(context, seconds = 12) {
  const buffer = context.createBuffer(1, Math.floor(context.sampleRate * seconds), context.sampleRate);
  const data = buffer.getChannelData(0);
  const random = seededNoise(0x27d4eb2d);
  let brown = 0;
  for (let index = 0; index < data.length; index += 1) {
    const white = random();
    brown = brown * .965 + white * .035;
    data[index] = white * .76 + brown * 2.4;
  }
  return buffer;
}

export function createSoundDesignPlayer({ volume = .34 } = {}) {
  let context = null;
  let master = null;
  let analyser = null;
  let reverb = null;
  let noiseBuffer = null;
  let outputVolume = Math.max(0, Number(volume) || 0);
  let previewBus = null;
  const activeBuses = new Set();

  function ensureContext() {
    if (context && context.state !== "closed") return context;
    const AudioContextConstructor = window.AudioContext;
    if (!AudioContextConstructor) return null;
    context = new AudioContextConstructor({ latencyHint: "interactive" });
    master = context.createGain();
    const lowpass = context.createBiquadFilter();
    const compressor = context.createDynamicsCompressor();
    analyser = context.createAnalyser();
    reverb = context.createConvolver();
    const reverbTone = context.createBiquadFilter();
    master.gain.value = outputVolume;
    lowpass.type = "lowpass";
    lowpass.frequency.value = 11800;
    lowpass.Q.value = .28;
    compressor.threshold.value = -17;
    compressor.knee.value = 18;
    compressor.ratio.value = 3.2;
    compressor.attack.value = .004;
    compressor.release.value = .24;
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = .74;
    reverb.buffer = createImpulse(context);
    reverbTone.type = "lowpass";
    reverbTone.frequency.value = 6400;
    reverb.connect(reverbTone);
    reverbTone.connect(master);
    master.connect(lowpass);
    lowpass.connect(compressor);
    compressor.connect(analyser);
    analyser.connect(context.destination);
    noiseBuffer = createNoiseBuffer(context);
    return context;
  }

  function panNode(owner, pan = 0) {
    if (!context || typeof context.createStereoPanner !== "function") return owner;
    const panner = context.createStereoPanner();
    panner.pan.value = Math.max(-.82, Math.min(.82, Number(pan) || 0));
    owner.connect(panner);
    return panner;
  }

  function createBus(preset, preview) {
    const input = context.createGain();
    const dry = context.createGain();
    const wet = context.createGain();
    const wetAmount = Math.max(0, Math.min(.94, preset.recipe.wet ?? .24));
    input.gain.value = 1;
    dry.gain.value = Math.max(.32, 1 - wetAmount * .52);
    wet.gain.value = wetAmount;
    input.connect(dry);
    input.connect(wet);
    dry.connect(master);
    wet.connect(reverb);
    const bus = { input, dry, wet, sources: [], preview, stopped: false, timer: 0 };
    activeBuses.add(bus);
    if (preview) previewBus = bus;
    bus.timer = window.setTimeout(() => stopBus(bus, false), Math.ceil((preset.duration + 1.2) * 1000));
    return bus;
  }

  function stopBus(bus, fade = true) {
    if (!bus || bus.stopped || !context) return;
    bus.stopped = true;
    window.clearTimeout(bus.timer);
    const now = context.currentTime;
    if (fade) {
      bus.input.gain.cancelScheduledValues(now);
      bus.input.gain.setTargetAtTime(.0001, now, .035);
    }
    window.setTimeout(() => {
      bus.sources.forEach((source) => {
        try { source.stop(); } catch {}
        try { source.disconnect(); } catch {}
      });
      try { bus.input.disconnect(); } catch {}
      try { bus.dry.disconnect(); } catch {}
      try { bus.wet.disconnect(); } catch {}
      activeBuses.delete(bus);
      if (previewBus === bus) previewBus = null;
    }, fade ? 180 : 0);
  }

  function noiseGrain(bus, at, duration, options = {}) {
    if (!noiseBuffer || duration <= 0) return;
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    const start = at;
    const end = start + duration;
    const attack = Math.min(options.attack ?? .008, duration * .35);
    const release = Math.min(options.release ?? duration * .55, duration * .72);
    source.buffer = noiseBuffer;
    source.playbackRate.value = options.rate ?? 1;
    filter.type = options.type || "bandpass";
    filter.Q.value = options.q ?? .9;
    filter.frequency.setValueAtTime(Math.max(40, options.frequency || 2400), start);
    if (options.endFrequency) filter.frequency.exponentialRampToValueAtTime(Math.max(40, options.endFrequency), end);
    gain.gain.setValueAtTime(.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(.0001, options.gain ?? .12), start + attack);
    gain.gain.setValueAtTime(Math.max(.0001, (options.gain ?? .12) * .72), Math.max(start + attack, end - release));
    gain.gain.exponentialRampToValueAtTime(.0001, end);
    source.connect(filter);
    filter.connect(gain);
    const output = panNode(gain, options.pan);
    output.connect(bus.input);
    bus.sources.push(source);
    source.start(start, Math.max(0, Math.random() * (noiseBuffer.duration - duration - .1)), duration + .01);
    source.stop(end + .02);
  }

  function oscillatorVoice(bus, at, frequency, duration, options = {}) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = at;
    const end = start + duration;
    const attack = Math.min(options.attack ?? .006, duration * .28);
    const peak = Math.max(.0001, options.gain ?? .1);
    oscillator.type = options.type || "sine";
    oscillator.frequency.setValueAtTime(Math.max(22, frequency), start);
    if (options.endFrequency) oscillator.frequency.exponentialRampToValueAtTime(Math.max(22, options.endFrequency), end);
    oscillator.detune.value = options.detune || 0;
    gain.gain.setValueAtTime(.0001, start);
    gain.gain.exponentialRampToValueAtTime(peak, start + attack);
    if (options.hold) gain.gain.setValueAtTime(peak * .76, Math.min(end - .02, start + options.hold));
    gain.gain.exponentialRampToValueAtTime(.0001, end);
    oscillator.connect(gain);
    const output = panNode(gain, options.pan);
    output.connect(bus.input);
    bus.sources.push(oscillator);
    oscillator.start(start);
    oscillator.stop(end + .03);
  }

  function pianoNote(bus, start, midi, gain, duration, material = "felt", pan = 0) {
    const frequency = midiFrequency(midi);
    const bright = material === "open" ? 1 : material === "distant" ? .32 : .58;
    const ratios = [1, 2.006, 3.014, 4.03, 5.07, 6.11];
    const levels = [1, .34 * bright, .17 * bright, .09 * bright, .052 * bright, .028 * bright];
    ratios.forEach((ratio, index) => {
      oscillatorVoice(bus, start, frequency * ratio, Math.max(.28, duration * (1 - index * .075)), {
        gain: gain * levels[index] * .27,
        attack: index ? .0025 : .004,
        detune: (index - 2) * .7,
        pan: pan + (index % 2 ? .045 : -.045),
      });
    });
    noiseGrain(bus, start, .026 + bright * .016, {
      frequency: 1350 + frequency * 1.8,
      endFrequency: 620,
      q: .78,
      gain: gain * (.055 + bright * .035),
      attack: .001,
      release: .028,
      pan,
    });
    oscillatorVoice(bus, start, Math.max(46, frequency / 2), Math.min(.42, duration), {
      type: "triangle",
      gain: gain * .035,
      attack: .002,
      pan,
    });
  }

  function chimeNote(bus, start, midi, gain, duration, material = "glass", pan = 0) {
    const frequency = midiFrequency(midi);
    const ratios = material === "shell" ? [1, 2.02, 3.06, 4.44] : material === "celesta" ? [1, 2.01, 3.92, 5.18] : [1, 2.32, 3.87, 5.26];
    const levels = material === "shell" ? [1, .22, .11, .04] : [1, .31, .13, .06];
    ratios.forEach((ratio, index) => oscillatorVoice(bus, start, frequency * ratio, duration * (1 - index * .09), {
      gain: gain * levels[index] * .2,
      attack: .002,
      detune: index * 1.2,
      pan: pan + (index % 2 ? .07 : -.07),
    }));
    noiseGrain(bus, start, .018, { frequency: frequency * 2.4, q: 2.2, gain: gain * .028, attack: .001, pan });
  }

  function playPiano(preset, bus, start) {
    const notes = preset.recipe.notes || [[69, 0, .7]];
    notes.forEach(([midi, delay, gain], index) => {
      const at = start + delay;
      const remaining = Math.max(.32, preset.duration - delay);
      pianoNote(bus, at, midi, gain, remaining, preset.recipe.material, (index / Math.max(1, notes.length - 1) - .5) * .34);
    });
  }

  function playChime(preset, bus, start) {
    const notes = preset.recipe.notes || [[84, 0, .7]];
    notes.forEach(([midi, delay, gain], index) => chimeNote(
      bus,
      start + delay,
      midi,
      gain,
      Math.max(.22, preset.duration - delay),
      preset.recipe.material,
      (index % 2 ? .18 : -.18),
    ));
  }

  function playWater(preset, bus, start) {
    const recipe = preset.recipe;
    const frequency = midiFrequency(recipe.midi || 78);
    const direction = recipe.direction || 0;
    const length = Math.min(preset.duration, .72);
    oscillatorVoice(bus, start, frequency * (direction < 0 ? 1.18 : .82), length, {
      type: "sine",
      endFrequency: frequency * (direction > 0 ? 1.16 : direction < 0 ? .78 : .985),
      gain: .085 + (recipe.impact || .3) * .075,
      attack: .004,
    });
    noiseGrain(bus, start, Math.min(.13, length), {
      type: "highpass",
      frequency: 2200 + recipe.brightness * 3400,
      endFrequency: 900,
      q: .4,
      gain: .035 + recipe.brightness * .04,
      attack: .001,
    });
    if (recipe.second) chimeNote(bus, start + .16, recipe.midi + 12, .32, Math.max(.4, preset.duration - .16), "shell", .16);
  }

  function playWhoosh(preset, bus, start) {
    const recipe = preset.recipe;
    const direction = recipe.direction >= 0 ? 1 : -1;
    const low = 280 + recipe.brightness * 620;
    const high = 2600 + recipe.brightness * 3800;
    noiseGrain(bus, start, preset.duration * .86, {
      type: "bandpass",
      frequency: direction > 0 ? low : high,
      endFrequency: direction > 0 ? high : low,
      q: .54 + recipe.weight * .5,
      gain: .06 + recipe.weight * .12,
      attack: preset.duration * .23,
      release: preset.duration * .48,
      pan: direction * -.24,
    });
    if (recipe.fiber) {
      for (let index = 0; index < 5; index += 1) noiseGrain(bus, start + .08 + index * .075, .035, {
        frequency: 1200 + index * 430,
        q: 1.8,
        gain: .026,
        attack: .002,
        pan: direction * (index / 5 - .5),
      });
    }
  }

  function playWave(preset, bus, start) {
    const recipe = preset.recipe;
    playWhoosh({ ...preset, recipe: { ...recipe, brightness: .18 + recipe.weight * .24 } }, bus, start);
    const frequency = midiFrequency(recipe.midi || 48);
    oscillatorVoice(bus, start + .04, frequency * (recipe.direction > 0 ? .78 : 1.18), preset.duration * .82, {
      type: "triangle",
      endFrequency: frequency * (recipe.direction > 0 ? 1.08 : .74),
      gain: .04 + recipe.weight * .055,
      attack: preset.duration * .22,
      pan: recipe.direction * .12,
    });
  }

  function playWood(preset, bus, start) {
    const recipe = preset.recipe;
    (recipe.pattern || [0]).forEach((delay, index) => {
      const at = start + delay;
      const gain = (.09 + recipe.weight * .12) * (1 - index * .12);
      oscillatorVoice(bus, at, midiFrequency((recipe.midi || 56) + index * 1.5), .11 + recipe.weight * .16, {
        type: "triangle",
        endFrequency: midiFrequency((recipe.midi || 56) - 4),
        gain,
        attack: .0015,
        pan: (index % 2 ? .12 : -.12),
      });
      noiseGrain(bus, at, .035 + recipe.weight * .045, { frequency: 680 + recipe.weight * 520, q: .7, gain: gain * .55, attack: .001 });
      if (recipe.metal) chimeNote(bus, at + .012, (recipe.midi || 56) + 24, recipe.metal * .24, Math.max(.25, preset.duration - delay), "glass", .14);
    });
    if (recipe.paper) playWhoosh({ ...preset, duration: Math.min(.7, preset.duration), recipe: { direction: 1, brightness: .55, weight: .12, wet: 0 } }, bus, start + .18);
  }

  function playPaper(preset, bus, start) {
    const recipe = preset.recipe;
    const count = recipe.grains || 14;
    const gesture = recipe.gesture || "turn";
    const span = gesture === "unfold" ? preset.duration * .74 : preset.duration * .84;
    for (let index = 0; index < count; index += 1) {
      let position = index / Math.max(1, count - 1);
      if (gesture === "rollup") position = Math.pow(position, .72);
      if (gesture === "unfold") position = Math.floor(position * 3) / 3 + (position % (1 / 3)) * .2;
      const at = start + .025 + position * span;
      const crest = Math.sin(position * Math.PI);
      const frequency = 720 + recipe.brightness * 3100 + crest * 1350;
      noiseGrain(bus, at, .028 + recipe.weight * .07 + crest * .04, {
        frequency,
        endFrequency: frequency * (.72 + Math.random() * .34),
        q: .52 + recipe.weight * .72,
        gain: (.018 + recipe.weight * .025) * (.62 + crest),
        attack: .002,
        pan: recipe.direction * (position - .5) * .72,
      });
    }
    noiseGrain(bus, start, Math.max(.18, span), {
      type: "highpass",
      frequency: 350 + recipe.brightness * 900,
      endFrequency: 1800 + recipe.brightness * 1800,
      q: .38,
      gain: .035 + recipe.weight * .035,
      attack: span * .3,
      release: span * .42,
      pan: recipe.direction * -.18,
    });
    if (["turn", "shut", "unfurl"].includes(gesture)) {
      const impactAt = start + Math.min(preset.duration * .86, span + .04);
      oscillatorVoice(bus, impactAt, 72 + recipe.weight * 54, .16 + recipe.weight * .18, {
        type: "triangle",
        endFrequency: 48,
        gain: .02 + recipe.weight * .055,
        attack: .002,
      });
      noiseGrain(bus, impactAt, .07 + recipe.weight * .08, { frequency: 420 + recipe.brightness * 720, q: .52, gain: .045 + recipe.weight * .04, attack: .001 });
    }
  }

  function playDrawer(preset, bus, start) {
    const recipe = preset.recipe;
    playWhoosh({ ...preset, duration: preset.duration * .78, recipe: { ...recipe, brightness: recipe.brightness * .7, weight: recipe.weight * .65 } }, bus, start);
    const ticks = recipe.paper ? 12 : 8;
    for (let index = 0; index < ticks; index += 1) {
      const position = index / ticks;
      noiseGrain(bus, start + .07 + position * preset.duration * .62, .026 + recipe.weight * .02, {
        frequency: 620 + recipe.brightness * 2100 + index * 38,
        q: .76,
        gain: .018 + recipe.weight * .012,
        attack: .001,
        pan: recipe.direction * (position - .5) * .62,
      });
    }
    playWood({ ...preset, recipe: { midi: recipe.direction > 0 ? 55 : 50, pattern: [preset.duration * .7], weight: recipe.weight, wet: 0 } }, bus, start);
  }

  function playString(preset, bus, start) {
    const recipe = preset.recipe;
    const notes = recipe.notes || [[57, 0, .5]];
    notes.forEach(([midi, delay, gain], noteIndex) => {
      const base = midiFrequency(midi);
      const length = Math.max(.6, preset.duration - delay);
      const ratios = recipe.material === "glass" ? [1, 2.01, 3.03, 4.12] : [1, 2, 3.01, 4.01];
      ratios.forEach((ratio, index) => oscillatorVoice(bus, start + delay, base * ratio, length * (1 - index * .08), {
        type: index === 0 && recipe.material === "cello" ? "triangle" : "sine",
        gain: gain * [.15, .06, .028, .014][index],
        attack: recipe.material === "glass" ? .18 + index * .05 : .08 + index * .025,
        detune: (noteIndex - 1) * 2 + index * .8,
        pan: (noteIndex % 2 ? .16 : -.16),
      }));
    });
  }

  function playPluck(preset, bus, start) {
    (preset.recipe.notes || []).forEach(([midi, delay, gain], index) => {
      const frequency = midiFrequency(midi);
      [1, 2.01, 3.02].forEach((ratio, partial) => oscillatorVoice(bus, start + delay, frequency * ratio, Math.max(.45, preset.duration - delay) * (1 - partial * .18), {
        type: partial ? "sine" : "triangle",
        gain: gain * [.14, .042, .018][partial],
        attack: .002,
        pan: (index / Math.max(1, preset.recipe.notes.length - 1) - .5) * .55,
      }));
      noiseGrain(bus, start + delay, .022, { frequency: frequency * 2, q: 1.4, gain: .025, attack: .001 });
    });
  }

  function playMusicBox(preset, bus, start) {
    playChime({ ...preset, recipe: { ...preset.recipe, material: "celesta" } }, bus, start);
    for (let index = 0; index < 9; index += 1) {
      const at = start + index * .128;
      noiseGrain(bus, at, .018, { frequency: 1200 + (index % 3) * 480, q: 2, gain: .013, attack: .001, pan: index % 2 ? .22 : -.22 });
    }
    playWood({ ...preset, recipe: { midi: 44, pattern: [0, .52, 1.04], weight: .12, wet: 0 } }, bus, start);
  }

  function playGong(preset, bus, start) {
    const recipe = preset.recipe;
    const base = midiFrequency(recipe.midi || 40);
    const ratios = [1, 1.48, 2.09, 2.71, 3.82, 5.14];
    ratios.forEach((ratio, index) => oscillatorVoice(bus, start, base * ratio, preset.duration * (1 - index * .055), {
      gain: recipe.weight * [.13, .09, .065, .04, .025, .014][index] * (.72 + recipe.brightness * .28),
      attack: .009 + index * .006,
      detune: index * 2.4,
      pan: index % 2 ? .12 : -.12,
    }));
    noiseGrain(bus, start, .12, { frequency: 340 + recipe.brightness * 1500, q: .66, gain: .06 * recipe.weight, attack: .002 });
  }

  function playLetter(preset, bus, start) {
    playWhoosh({ ...preset, duration: .72, recipe: { direction: 1, brightness: .58, weight: .2, wet: 0 } }, bus, start);
    noiseGrain(bus, start + .36, .11, { frequency: 860, q: .68, gain: .048, attack: .002 });
    chimeNote(bus, start + .45, preset.recipe.midi || 81, .58, preset.duration - .45, "shell", .14);
  }

  function playMemory(preset, bus, start) {
    playPaper({ ...preset, duration: .7, recipe: { gesture: "unfold", direction: 1, weight: .24, brightness: .62, grains: 12, wet: 0 } }, bus, start);
    playWhoosh({ ...preset, duration: 1.1, recipe: { direction: 1, brightness: .34, weight: .24, wet: 0 } }, bus, start + .16);
    playPiano({ ...preset, duration: preset.duration - .42, recipe: { ...preset.recipe, material: "felt" } }, bus, start);
  }

  const players = {
    piano: playPiano,
    chime: playChime,
    water: playWater,
    whoosh: playWhoosh,
    wave: playWave,
    wood: playWood,
    paper: playPaper,
    drawer: playDrawer,
    string: playString,
    pluck: playPluck,
    musicbox: playMusicBox,
    gong: playGong,
    letter: playLetter,
    memory: playMemory,
  };

  function play(presetOrId, { preview = false, unlock = false, volumeScale = 1 } = {}) {
    const preset = typeof presetOrId === "string" ? getSoundPreset(presetOrId) : presetOrId;
    if (!preset) return false;
    const audioContext = ensureContext();
    if (!audioContext || !master) return false;
    if (preview) stopBus(previewBus, true);
    if (audioContext.state !== "running") {
      if (!unlock) return false;
      audioContext.resume().then(() => play(preset, { preview, unlock: false, volumeScale })).catch(() => {});
      return { preset, duration: preset.duration, pending: true };
    }
    const bus = createBus(preset, preview);
    bus.input.gain.value = Math.max(.05, Math.min(1.5, Number(volumeScale) || 1));
    const start = audioContext.currentTime + .012;
    (players[preset.recipe.family] || playChime)(preset, bus, start);
    return { preset, duration: preset.duration, pending: false };
  }

  return {
    play,
    resume() {
      const audioContext = ensureContext();
      return audioContext?.state === "suspended" ? audioContext.resume().catch(() => {}) : Promise.resolve();
    },
    setVolume(nextVolume) {
      outputVolume = Math.max(0, Number(nextVolume) || 0);
      if (!context || !master) return;
      const now = context.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setTargetAtTime(outputVolume, now, .018);
    },
    stopPreview() {
      stopBus(previewBus, true);
    },
    stopAll() {
      [...activeBuses].forEach((bus) => stopBus(bus, true));
    },
    meter(target) {
      if (!analyser || !(target instanceof Uint8Array)) return false;
      analyser.getByteFrequencyData(target);
      return true;
    },
    isPreviewing() {
      return Boolean(previewBus && !previewBus.stopped);
    },
  };
}
