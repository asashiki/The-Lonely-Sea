(() => {
  "use strict";
  const config = {"protocol":"gal-blog-bridge/v1","channel":"gal-blog-game","gameId":"project_lonely_sea_chapter_one","gameKey":"lonely-sea-chapter-one","startSceneId":"scene_root","releaseId":"0.2.0-9a7ed8a4","origins":["http://127.0.0.1:4321","http://localhost:4321"],"timeoutMs":20000,"messageLimit":65536,"launchFiles":{"start:start":"game/scene/start.txt","scene:scene_site_system_menu":"game/scene/__launch_scene_scene-site-system-menu.txt","scene:scene_alice_about":"game/scene/__launch_scene_scene-alice-about.txt","save-point:save_root":"game/scene/__launch_save_save-root.txt","save-point:save_site":"game/scene/__launch_save_save-site.txt","save-point:save_master":"game/scene/__launch_save_save-master.txt","save-point:save_alice":"game/scene/__launch_save_save-alice.txt","save-point:save_system":"game/scene/__launch_save_save-system.txt","save-point:save_site_more":"game/scene/__launch_save_save-site-more.txt","save-point:save_interest":"game/scene/__launch_save_save-interest.txt","save-point:save_master_more":"game/scene/__launch_save_save-master-more.txt"},"sceneFiles":{"scene_root":"scene_root.txt","scene_site_menu":"scene_site-menu.txt","scene_site_system_menu":"scene_site-system.txt","scene_site_more_menu":"scene_site-more.txt","scene_master_menu":"scene_master-menu.txt","scene_master_interest_menu":"scene_master-interests.txt","scene_master_more_menu":"scene_master-more.txt","scene_alice_about":"scene_alice-about.txt"},"variables":{"player_name":{"name":"player_name","defaultValue":"客人"},"galblog_resume_point":{"name":"__galblog_resume_point","defaultValue":0}},"records":{},"stateContract":{"saveMode":"checkpoint-v1","launchVariables":[],"persistVariables":["galblog_resume_point","player_name"],"records":[]},"settingsContract":{"schema":"gal-blog-settings/v1","accepts":["audio.muted","audio.bgm","audio.effects","audio.voice","text.scale","text.speed","accessibility.reducedMotion","interface.cursor","interface.language"]},"cursorAssets":{"normal":"game/template/project-assets/ui/cursor-default.svg","active":"game/template/project-assets/ui/cursor-select.svg"},"figurePreloads":["project-assets/alice-v2/maid_princess_normal_welcome.png","project-assets/alice-v2/maid_princess_normal_guide.png","project-assets/alice-v2/maid_princess_normal_casual_side.png","project-assets/alice-v2/maid_princess_normal_note.png","project-assets/alice-v2/maid_princess_normal_reserved.png","project-assets/alice-v2/maid_princess_thinking.png","project-assets/alice-v2/maid_princess_shy.png","project-assets/alice-v2/maid_princess_laugh.png","project-assets/alice-v2/maid_princess_angry.png","project-assets/alice-v2/maid_princess_sad.png","project-assets/alice-v2/maid_princess_surprised.png"],"blinkHalfFrames":{"project-assets/alice-v2/maid_princess_normal_welcome__eyes_close.png":"project-assets/alice-v2/maid_princess_normal_welcome__eyes_half.png","project-assets/alice-v2/maid_princess_normal_guide__eyes_close.png":"project-assets/alice-v2/maid_princess_normal_guide__eyes_half.png","project-assets/alice-v2/maid_princess_normal_casual_side__eyes_close.png":"project-assets/alice-v2/maid_princess_normal_casual_side__eyes_half.png","project-assets/alice-v2/maid_princess_normal_note__eyes_close.png":"project-assets/alice-v2/maid_princess_normal_note__eyes_half.png","project-assets/alice-v2/maid_princess_normal_reserved__eyes_close.png":"project-assets/alice-v2/maid_princess_normal_reserved__eyes_half.png","project-assets/alice-v2/maid_princess_shy__eyes_close.png":"project-assets/alice-v2/maid_princess_shy__eyes_half.png","project-assets/alice-v2/maid_princess_angry__eyes_close.png":"project-assets/alice-v2/maid_princess_angry__eyes_half.png","project-assets/alice-v2/maid_princess_sad__eyes_close.png":"project-assets/alice-v2/maid_princess_sad__eyes_half.png","project-assets/alice-v2/maid_princess_surprised__eyes_close.png":"project-assets/alice-v2/maid_princess_surprised__eyes_half.png"},"actions":{"inline_scene-site-menu_site-load-d1_inline-site-load":{"kind":"inline-action","action":"open-load","input":{"operation":"load","__story":{"projectId":"project_lonely_sea_chapter_one","sceneId":"scene_site_menu","blockId":"site_load_d1","inlineActionId":"inline_site_load"}}},"inline_scene-site-menu_site-option-d1_inline-site-option":{"kind":"inline-action","action":"open-settings","input":{"__story":{"projectId":"project_lonely_sea_chapter_one","sceneId":"scene_site_menu","blockId":"site_option_d1","inlineActionId":"inline_site_option"}}},"inline_scene-site-system-menu_system-comment-d_inline-system-comment":{"kind":"inline-action","action":"open-comment-form","input":{"mode":"comment","title":"给灯塔留下一句话","prompt":"这段内容会回到当前游戏，并保存在这台设备。","__story":{"projectId":"project_lonely_sea_chapter_one","sceneId":"scene_site_system_menu","blockId":"system_comment_d","inlineActionId":"inline_system_comment"}}},"inline_scene-site-system-menu_system-links-d_inline-system-links":{"kind":"inline-action","action":"open-comment-form","input":{"mode":"friends","title":"灯塔友链","prompt":"查看友链，或在本机保存一条待审核申请。","__story":{"projectId":"project_lonely_sea_chapter_one","sceneId":"scene_site_system_menu","blockId":"system_links_d","inlineActionId":"inline_system_links"}}},"save_scene-root_save-root-block":{"kind":"save-point","action":"save-progress","input":{"target":{"kind":"save-point","id":"save_root"},"title":"灯塔的来客","scene":"START · 灯塔的来客","sceneId":"scene_root","mode":"auto"}},"save_scene-site-menu_save-site-block":{"kind":"save-point","action":"save-progress","input":{"target":{"kind":"save-point","id":"save_site"},"title":"关于孤独之海","scene":"关于本站","sceneId":"scene_site_menu","mode":"auto"}},"save_scene-site-system-menu_save-system-block":{"kind":"save-point","action":"save-progress","input":{"target":{"kind":"save-point","id":"save_system"},"title":"系统功能","scene":"系统功能","sceneId":"scene_site_system_menu","mode":"auto"}},"save_scene-site-more-menu_save-site-more-block":{"kind":"save-point","action":"save-progress","input":{"target":{"kind":"save-point","id":"save_site_more"},"title":"更多关于本站","scene":"更多关于本站","sceneId":"scene_site_more_menu","mode":"auto"}},"save_scene-master-menu_save-master-block":{"kind":"save-point","action":"save-progress","input":{"target":{"kind":"save-point","id":"save_master"},"title":"关于浅仪式","scene":"关于站长","sceneId":"scene_master_menu","mode":"auto"}},"save_scene-master-interest-menu_save-interest-block":{"kind":"save-point","action":"save-progress","input":{"target":{"kind":"save-point","id":"save_interest"},"title":"主要兴趣","scene":"主要兴趣","sceneId":"scene_master_interest_menu","mode":"auto"}},"save_scene-master-more-menu_save-master-more-block":{"kind":"save-point","action":"save-progress","input":{"target":{"kind":"save-point","id":"save_master_more"},"title":"更多关于站长","scene":"更多关于站长","sceneId":"scene_master_more_menu","mode":"auto"}},"save_scene-alice-about_save-alice-block":{"kind":"save-point","action":"save-progress","input":{"target":{"kind":"save-point","id":"save_alice"},"title":"关于爱丽丝","scene":"关于 Alice","sceneId":"scene_alice_about","mode":"auto"}},"action_replay_exit_scene-site-system-menu":{"kind":"replay-exit","action":"return-menu","input":{"screen":"load","loadPage":"game","loadFilter":"story"}},"action_replay_exit_scene-alice-about":{"kind":"replay-exit","action":"return-menu","input":{"screen":"load","loadPage":"game","loadFilter":"story"}}},"inlineDialogues":{"1":{"sceneId":"scene_site_menu","blockId":"site_load_d1","actions":[{"actionId":"inline_scene-site-menu_site-load-d1_inline-site-load","phrase":"LOAD","hint":"打开 LOAD"}]},"2":{"sceneId":"scene_site_menu","blockId":"site_option_d1","actions":[{"actionId":"inline_scene-site-menu_site-option-d1_inline-site-option","phrase":"OPTION","hint":"打开 OPTION"}]},"3":{"sceneId":"scene_site_system_menu","blockId":"system_comment_d","actions":[{"actionId":"inline_scene-site-system-menu_system-comment-d_inline-system-comment","phrase":"留言","hint":"打开留言"}]},"4":{"sceneId":"scene_site_system_menu","blockId":"system_links_d","actions":[{"actionId":"inline_scene-site-system-menu_system-links-d_inline-system-links","phrase":"友链","hint":"打开友链"}]}}};
  let sequence = 0;
  let sessionId = "";
  let hostOrigin = "";
  let launch = null;
  let core = null;
  let unsubscribe = null;
  let nativeUiObserver = null;
  let nativeUiClickListener = null;
  let inlineActionKeyListener = null;
  let runtimeMenu = null;
  let disposed = false;
  let activeToken = "";
  let lastCheckpointInput = null;
  let checkpointTimer = 0;
  let idleBlinkTimer = 0;
  let idleBlinkHalfTimer = 0;
  let idleBlinkOpenTimer = 0;
  let escapeToggleListener = null;
  let idleBlinkSignature = "";
  let idleBlinkTarget = null;
  let originalBlinkAnimation = null;
  let allowManagedBlink = false;
  let lastResumePoint = 0;
  let lastAutoSavedResumePoint = 0;
  let readyEmitted = false;
  let inlineDialogueCode = 0;
  let inlineActionBusy = false;
  let nvlRoot = null;
  let nvlBacklog = null;
  let nvlPage = 0;
  let nvlLines = [];
  let nvlLogPages = [];
  let nvlTypeTimer = 0;
  let nvlTyping = false;
  let nvlTurnTimer = 0;
  let nvlPause = null;
  let nvlPauseLock = 0;
  const preloadedFigures = new Set();
  const pending = new Map();
  const lifecycle = (name, detail = {}) => window.dispatchEvent(new CustomEvent(name, { detail: { gameId: config.gameId, releaseId: config.releaseId, ...detail } }));
  const nextId = (prefix) => prefix + "-" + Date.now() + "-" + (++sequence);
  const sizeOf = (value) => { try { return new TextEncoder().encode(JSON.stringify(value)).byteLength; } catch { return Infinity; } };
  const scalar = (value) => typeof value === "boolean" || typeof value === "string" || (typeof value === "number" && Number.isFinite(value));
  const storedScalar = (value) => {
    if (typeof value !== "string") return value;
    try {
      const parsed = JSON.parse(value);
      return scalar(parsed) ? parsed : value;
    } catch {
      return value;
    }
  };
  const clamp = (value, minimum, maximum, fallback) => {
    const number = Number(value);
    return Number.isFinite(number) ? Math.min(maximum, Math.max(minimum, number)) : fallback;
  };
  const validSettings = (value) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    const allowed = new Set(config.settingsContract.accepts);
    return Object.fromEntries(Object.entries(value).filter(([key, setting]) => allowed.has(key) && scalar(setting)));
  };
  const languageCode = (value) => value === "EN-US" ? "1" : value === "JA-JP" ? "2" : "0";
  const engineOptionPatch = (settings) => ({
    textSpeed: Math.round(clamp(settings["text.speed"], 1, 10, 6) * 10),
    bgmVolume: Math.round(clamp(settings["audio.bgm"], 0, 100, 60)),
    vocalVolume: Math.round(clamp(settings["audio.voice"], 0, 100, 80)),
    seVolume: Math.round(clamp(settings["audio.effects"], 0, 100, 70)),
    uiSeVolume: Math.round(clamp(settings["audio.effects"], 0, 100, 70)),
  });
  const mergeEnginePreferences = (settings) => new Promise((resolve) => {
    if (!globalThis.indexedDB) { resolve(); return; }
    let settled = false;
    const finish = () => { if (!settled) { settled = true; resolve(); } };
    const timer = setTimeout(finish, 1200);
    try {
      const request = indexedDB.open("localforage");
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains("keyvaluepairs")) database.createObjectStore("keyvaluepairs");
      };
      request.onerror = finish;
      request.onsuccess = () => {
        const database = request.result;
        try {
          const transaction = database.transaction("keyvaluepairs", "readwrite");
          const store = transaction.objectStore("keyvaluepairs");
          const read = store.get(config.gameKey);
          read.onerror = finish;
          read.onsuccess = () => {
            const current = read.result && typeof read.result === "object" ? read.result : {};
            store.put({ ...current, optionData: { ...(current.optionData || {}), ...engineOptionPatch(settings) } }, config.gameKey);
          };
          transaction.oncomplete = () => { clearTimeout(timer); database.close(); finish(); };
          transaction.onerror = finish;
        } catch { database.close(); finish(); }
      };
    } catch { finish(); }
  });
  const applySettingsToRuntime = (settings) => {
    const root = document.documentElement;
    if (!root) return;
    root.style.setProperty("--galblog-text-scale", String(clamp(settings["text.scale"], 80, 120, 100) / 100));
    root.dataset.galblogMotion = settings["accessibility.reducedMotion"] === true ? "reduced" : "full";
    root.dataset.galblogCursor = settings["interface.cursor"] === true ? "special" : "system";
    if (settings["interface.language"]) {
      localStorage.setItem("lang", languageCode(settings["interface.language"]));
      root.lang = settings["interface.language"] === "ZH-CN" ? "zh-CN" : String(settings["interface.language"]);
    }
    let style = document.getElementById("galblog-runtime-preferences");
    if (!style && document.head) {
      style = document.createElement("style");
      style.id = "galblog-runtime-preferences";
      const normalCursor = config.cursorAssets.normal ? "url('./" + config.cursorAssets.normal + "') 4 2, auto" : "auto";
      const activeCursor = config.cursorAssets.active ? "url('./" + config.cursorAssets.active + "') 7 3, pointer" : "pointer";
      style.textContent = "[class*='_TextBox_textElement_']{font-size:calc(1em * var(--galblog-text-scale,1))!important}"
        + "html[data-galblog-cursor='special'],html[data-galblog-cursor='special'] body,html[data-galblog-cursor='special'] #root{cursor:" + normalCursor + "!important}"
        + "html[data-galblog-cursor='special'] button,html[data-galblog-cursor='special'] [role='button'],html[data-galblog-cursor='special'] [class*='_button_'],html[data-galblog-cursor='special'] [class*='_Choose_item_']{cursor:" + activeCursor + "!important}"
        + "html[data-galblog-motion='reduced'] *,html[data-galblog-motion='reduced'] *::before,html[data-galblog-motion='reduced'] *::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important;scroll-behavior:auto!important}";
      document.head.appendChild(style);
    }
    const muted = settings["audio.muted"] === true;
    const volumeFor = (audio) => {
      const id = String(audio.id || "").toLowerCase();
      if (id.includes("vocal")) return clamp(settings["audio.voice"], 0, 100, 80);
      if (id.includes("bgm")) return clamp(settings["audio.bgm"], 0, 100, 60);
      return clamp(settings["audio.effects"], 0, 100, 70);
    };
    document.querySelectorAll("audio").forEach((audio) => {
      const scale = volumeFor(audio) / 100;
      if (!audio.dataset.galBlogUnscaledVolume) {
        const current = clamp(audio.volume, 0, 1, 1);
        audio.dataset.galBlogUnscaledVolume = String(scale > 0 ? current / scale : (current || 1));
      }
      const base = clamp(audio.dataset.galBlogUnscaledVolume, 0, 2, 1);
      audio.muted = muted;
      audio.volume = Math.max(0, Math.min(1, base * scale));
    });
  };
  const applySettings = (value, source = "host") => {
    const settings = validSettings(value);
    window.__GAL_BLOG_SETTINGS__ = Object.freeze({ ...settings });
    if (launch) launch.settings = settings;
    applySettingsToRuntime(settings);
    lifecycle("galblog:settings-change", { settings, source });
    return settings;
  };
  const envelope = (type, extra = {}) => ({ protocol: config.protocol, channel: config.channel, source: "galgame", gameId: config.gameId, releaseId: config.releaseId, sessionId, type, ...extra });
  const validEnvelope = (value, source = "gal-blog") => Boolean(value) && typeof value === "object" && sizeOf(value) <= config.messageLimit
    && value.protocol === config.protocol && value.channel === config.channel && value.source === source
    && value.gameId === config.gameId && value.releaseId === config.releaseId && value.sessionId === sessionId;
  const emitHost = (message) => {
    if (!hostOrigin || !window.parent || window.parent === window) return false;
    window.parent.postMessage(message, hostOrigin);
    return true;
  };
  const targetKey = (target) => target && target.kind + ":" + target.id;
  const webgalValue = (value) => {
    if (typeof value !== "string") return String(value);
    const unsafe = new Set(["+", "-", "*", "/", "(", ")"]);
    const literal = Array.from(JSON.stringify(value), (character) => unsafe.has(character)
      ? "\\u" + character.charCodeAt(0).toString(16).padStart(4, "0")
      : character).join("");
    return "(" + literal + ")";
  };
  const launchPrelude = () => {
    const lines = [];
    for (const item of Object.values(config.variables)) lines.push("setVar:" + item.name + "=" + webgalValue(item.defaultValue) + " -next;");
    for (const name of Object.values(config.records)) lines.push("setVar:" + name + "=false -next;");
    for (const [id, value] of Object.entries(launch.state.variables)) lines.push("setVar:" + config.variables[id].name + "=" + webgalValue(value) + " -next;");
    for (const id of launch.state.records) lines.push("setVar:" + config.records[id] + "=true -next;");
    lines.push("setVar:__galblog_resume=" + String(launch.mode === "hosted") + " -next;");
    lines.push("setVar:__galblog_replay_target=" + webgalValue(launch.mode === "hosted" && launch.target.kind === "scene" ? launch.target.id : "") + " -next;");
    return lines.join("\n") + "\n";
  };
  const validLaunch = (payload) => {
    if (!payload || typeof payload !== "object" || !payload.target || !config.launchFiles[targetKey(payload.target)]) return null;
    const state = payload.state && typeof payload.state === "object" ? payload.state : { variables: {}, records: [] };
    const values = state.variables && typeof state.variables === "object" && !Array.isArray(state.variables) ? state.variables : {};
    const allowed = new Set([...config.stateContract.launchVariables, ...config.stateContract.persistVariables]);
    if (Object.entries(values).some(([key, value]) => !allowed.has(key) || !scalar(value))) return null;
    const facts = Array.isArray(state.records) ? state.records : [];
    if (facts.some((id) => !config.stateContract.records.includes(id))) return null;
    return { target: payload.target, state: { variables: values, records: facts }, settings: validSettings(payload.settings) };
  };
  const prepare = async () => {
    sessionId = new URL(location.href).searchParams.get("session") || (crypto.randomUUID ? crypto.randomUUID() : nextId("session"));
    const standalone = window.parent === window;
    let referrerOrigin = "";
    try { referrerOrigin = document.referrer ? new URL(document.referrer).origin : ""; } catch {}
    const sameOriginHost = Boolean(referrerOrigin) && referrerOrigin === new URL(location.href).origin;
    lifecycle("galblog:bridge-ready", { sessionId, mode: standalone ? "standalone" : "embedded" });
    if (standalone || (!sameOriginHost && !config.origins.includes(referrerOrigin))) {
      launch = { target: { kind: "start", id: "start" }, state: { variables: {}, records: [] }, settings: {}, mode: standalone ? "standalone" : "rejected-host" };
    } else {
      hostOrigin = referrerOrigin;
      const helloId = nextId("hello");
      emitHost(envelope("hello", { id: helloId, payload: { engine: "WebGAL", engineVersion: "4.6.2" } }));
      launch = await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("Blog launch timeout")), config.timeoutMs);
        const accept = (event) => {
          if (event.source !== window.parent || event.origin !== hostOrigin || !validEnvelope(event.data) || event.data.type !== "launch" || !event.data.id) return;
          const value = validLaunch(event.data.payload);
          if (!value) return;
          clearTimeout(timer);
          window.removeEventListener("message", accept);
          resolve({ ...value, mode: "hosted" });
        };
        window.addEventListener("message", accept);
      });
    }
    const settings = applySettings(launch.settings, launch.mode === "hosted" ? "launch" : "standalone");
    await mergeEnginePreferences(settings);
    lifecycle("galblog:launch-applied", { sessionId, target: launch.target, mode: launch.mode });
    return { scenePath: config.launchFiles[targetKey(launch.target)], mode: launch.mode, prelude: launchPrelude() };
  };
  const setVar = (key, value) => core.stageManager.setStageVar({ key, value });
  const commit = () => core.stageManager.commit();
  const applyLaunchState = () => {
    for (const item of Object.values(config.variables)) setVar(item.name, item.defaultValue);
    for (const name of Object.values(config.records)) setVar(name, false);
    for (const [id, value] of Object.entries(launch.state.variables)) setVar(config.variables[id].name, value);
    for (const id of launch.state.records) setVar(config.records[id], true);
    setVar("__galblog_resume", launch.mode === "hosted");
    setVar("__galblog_replay_target", launch.mode === "hosted" && launch.target.kind === "scene" ? launch.target.id : "");
    commit();
  };
  // The calculation stage is the authoritative current sentence. The view
  // stage intentionally trails while WebGAL renders text, which previously
  // saved the preceding choice marker instead of the dialogue on screen.
  const runtimeState = () => core?.stageManager?.getCalculationStageState?.() || core?.stageManager?.getViewStageState?.();
  const gameVariables = (state) => {
    const fromGameVar = state?.GameVar && typeof state.GameVar === "object" ? state.GameVar : {};
    const fromGlobal = state?.globalGameVar && typeof state.globalGameVar === "object" ? state.globalGameVar : {};
    // WebGAL exposes script global values through globalGameVar in current
    // releases, while older adapters mirrored them into GameVar. Read both so
    // authored resume markers survive SAVE/LOAD across engine versions.
    return { ...fromGameVar, ...fromGlobal };
  };
  const postRequest = (action, input) => {
    if (!hostOrigin) return Promise.resolve({ status: "unsupported", action });
    const id = nextId("request");
    const message = envelope("request", { id, payload: { action, input } });
    if (sizeOf(message) > config.messageLimit) return Promise.resolve({ status: "failure", code: "MESSAGE_TOO_LARGE" });
    return new Promise((resolve) => {
      const timer = setTimeout(() => { pending.delete(id); resolve({ status: "failure", code: "TIMEOUT" }); }, config.timeoutMs);
      pending.set(id, { resolve, timer });
      emitHost(message);
    });
  };
  const captureThumbnail = () => {
    const source = Array.from(document.querySelectorAll("canvas")).sort((a, b) => b.width * b.height - a.width * a.height)[0];
    if (!source || source.width < 2 || source.height < 2) return undefined;
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 480; canvas.height = 270;
      const context = canvas.getContext("2d", { alpha: false });
      if (!context) return undefined;
      context.drawImage(source, 0, 0, canvas.width, canvas.height);
      for (const quality of [0.62, 0.52, 0.42, 0.32]) {
        const value = canvas.toDataURL("image/webp", quality);
        if (value.length <= 42000) return value;
      }
    } catch {}
    return undefined;
  };
  const saveInput = (input, state) => {
    const gameVar = gameVariables(state);
    const values = {};
    for (const id of config.stateContract.persistVariables) values[id] = storedScalar(gameVar[config.variables[id].name]);
    const facts = config.stateContract.records.filter((id) => gameVar[config.records[id]] === true);
    const thumbnail = captureThumbnail();
    return { ...input, ...(thumbnail ? { thumbnail } : {}), variables: values, records: facts };
  };
  const unlock = () => {
    document.getElementById("galblog-runtime-lock")?.remove();
    setTimeout(() => document.getElementById("FullScreenClick")?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true })), 80);
  };
  const handleToken = async (token, action, state) => {
    let lock = document.getElementById("galblog-runtime-lock");
    if (!lock) {
      lock = document.createElement("div"); lock.id = "galblog-runtime-lock"; lock.textContent = "GAL-BLOG · WAITING";
      Object.assign(lock.style, { position: "fixed", inset: 0, zIndex: 2147483646, display: "grid", placeItems: "end center", paddingBottom: "8vh", background: "linear-gradient(transparent 60%,rgba(4,7,16,.68))", color: "white", font: "500 14px system-ui" });
      document.body.appendChild(lock);
    }
    const input = action.kind === "save-point" ? saveInput(action.input, state) : action.input;
    if (action.kind === "save-point") lastCheckpointInput = action.input;
    let response;
    try { response = await postRequest(action.action, input); }
    catch (error) { response = { status: "failure", message: String(error) }; }
    const status = response && ["success", "failure", "cancel", "unsupported"].includes(response.status) ? response.status : "failure";
    setVar("__galblog_status", status);
    setVar("__galblog_request", "");
    if (action.resultVariable) setVar(action.resultVariable, scalar(response.value) ? response.value : status);
    commit();
    lifecycle("galblog:action-result", { token, action: action.action, status, response });
    unlock();
  };
  const clearInlineDialogue = () => {
    document.querySelectorAll("[data-galblog-inline-action]").forEach((token) => {
      token.classList.remove("galblog-inline-token", "galblog-inline-token-start");
      token.removeAttribute("data-galblog-inline-action");
      token.removeAttribute("data-galblog-inline-group");
      token.removeAttribute("role");
      token.removeAttribute("tabindex");
      token.removeAttribute("aria-label");
      token.removeAttribute("title");
    });
  };
  const dialogueTokenText = (token) => {
    const holder = token.querySelector("[class*='_zhanwei_']");
    if (!holder) return "";
    return Array.from(holder.childNodes)
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .map((node) => node.textContent || "")
      .join("");
  };
  const decorateInlineDialogue = () => {
    clearInlineDialogue();
    const tokens = Array.from(document.querySelectorAll("#textBoxMain .Textelement_start"));
    const chunks = [];
    let text = "";
    for (const token of tokens) {
      const value = dialogueTokenText(token);
      const start = text.length;
      text += value;
      chunks.push({ token, start, end: start + value.length });
    }
    const runtimeCode = Number(gameVariables(runtimeState()).__galblog_inline_dialogue || 0);
    if (runtimeCode) inlineDialogueCode = runtimeCode;
    const preferred = config.inlineDialogues?.[String(inlineDialogueCode)];
    const definitions = preferred?.actions?.some((inline) => text.includes(inline.phrase))
      ? [preferred]
      : Object.values(config.inlineDialogues || {}).filter((definition) => (
        definition?.actions?.some((inline) => text.includes(inline.phrase))
      ));
    const actions = definitions.flatMap((definition) => definition.actions || []);
    actions.forEach((inline, groupIndex) => {
      const start = text.indexOf(inline.phrase);
      if (start < 0) return;
      const end = start + inline.phrase.length;
      const hits = chunks.filter((chunk) => chunk.end > start && chunk.start < end && chunk.end > chunk.start);
      hits.forEach((chunk, index) => {
        chunk.token.classList.add("galblog-inline-token");
        chunk.token.dataset.galblogInlineAction = inline.actionId;
        chunk.token.dataset.galblogInlineGroup = String(groupIndex);
        if (index === 0) {
          chunk.token.classList.add("galblog-inline-token-start");
          chunk.token.setAttribute("role", "button");
          chunk.token.tabIndex = 0;
          chunk.token.setAttribute("aria-label", inline.hint || inline.phrase);
          chunk.token.title = inline.hint || inline.phrase;
        }
      });
    });
  };
  const activateInlineAction = async (target) => {
    const actionId = target?.dataset?.galblogInlineAction;
    const action = actionId && config.actions[actionId];
    if (!action || inlineActionBusy) return;
    inlineActionBusy = true;
    document.documentElement.dataset.galblogInlineBusy = "true";
    lifecycle("galblog:inline-action", { actionId, action: action.action, status: "request" });
    let response;
    try { response = await postRequest(action.action, action.input); }
    catch (error) { response = { status: "failure", message: String(error) }; }
    lifecycle("galblog:inline-action", { actionId, action: action.action, status: response?.status || "failure", response });
    inlineActionBusy = false;
    delete document.documentElement.dataset.galblogInlineBusy;
  };
  const clearIdleBlink = () => {
    clearTimeout(idleBlinkTimer);
    clearTimeout(idleBlinkHalfTimer);
    clearTimeout(idleBlinkOpenTimer);
    idleBlinkTimer = 0;
    idleBlinkHalfTimer = 0;
    idleBlinkOpenTimer = 0;
  };
  const preloadFigureDifferentials = (animation) => {
    const stage = core?.gameplay?.pixiStage;
    if (!stage?.loadAsset) return;
    const paths = [
      animation?.mouthAnimation?.open,
      animation?.mouthAnimation?.halfOpen,
      animation?.mouthAnimation?.close,
      animation?.blinkAnimation?.open,
      config.blinkHalfFrames?.[animation?.blinkAnimation?.close],
      animation?.blinkAnimation?.close,
    ].filter((path) => typeof path === "string" && path.length > 0);
    for (const path of new Set(paths)) {
      if (preloadedFigures.has(path)) continue;
      preloadedFigures.add(path);
      stage.loadAsset(path, () => {});
    }
  };
  const preloadConfiguredFigures = () => {
    const stage = core?.gameplay?.pixiStage;
    if (!stage?.loadAsset) return;
    for (const path of config.figurePreloads || []) {
      if (typeof path !== "string" || !path || preloadedFigures.has(path)) continue;
      preloadedFigures.add(path);
      stage.loadAsset(path, () => {});
    }
  };
  const performManagedBlink = (target, animation, state, position) => {
    if (!originalBlinkAnimation) return;
    allowManagedBlink = true;
    try { originalBlinkAnimation(target, animation, state, position); }
    finally { allowManagedBlink = false; }
  };
  const installBlinkAdapter = () => {
    const stage = core?.gameplay?.pixiStage;
    if (!stage?.performBlinkAnimation || stage.__galBlogBlinkAdapter === true) return;
    originalBlinkAnimation = stage.performBlinkAnimation.bind(stage);
    stage.performBlinkAnimation = (...args) => {
      if (!allowManagedBlink) return;
      return originalBlinkAnimation(...args);
    };
    stage.__galBlogBlinkAdapter = true;
  };
  const queueIdleBlink = () => {
    clearTimeout(idleBlinkTimer);
    idleBlinkTimer = setTimeout(() => {
      idleBlinkTimer = 0;
      if (disposed) return;
      const current = idleBlinkTarget;
      if (!current) return;
      const vocal = document.getElementById("currentVocal");
      if (vocal && !vocal.paused && !vocal.ended) {
        queueIdleBlink();
        return;
      }
      const halfPath = config.blinkHalfFrames?.[current.animation?.blinkAnimation?.close];
      const halfAnimation = halfPath ? {
        ...current.animation,
        blinkAnimation: { ...current.animation.blinkAnimation, close: halfPath },
      } : current.animation;
      if (halfPath) performManagedBlink(current.target, halfAnimation, "closed", current.position);
      else performManagedBlink(current.target, current.animation, "closed", current.position);
      idleBlinkHalfTimer = setTimeout(() => {
        idleBlinkHalfTimer = 0;
        const latest = idleBlinkTarget;
        if (!latest) return;
        performManagedBlink(latest.target, latest.animation, "closed", latest.position);
      }, halfPath ? 65 : 0);
      idleBlinkOpenTimer = setTimeout(() => {
        idleBlinkOpenTimer = 0;
        const latest = idleBlinkTarget;
        if (!latest) return;
        performManagedBlink(latest.target, halfPath ? {
          ...latest.animation,
          blinkAnimation: { ...latest.animation.blinkAnimation, close: halfPath },
        } : latest.animation, halfPath ? "closed" : "open", latest.position);
        if (halfPath) setTimeout(() => performManagedBlink(latest.target, latest.animation, "open", latest.position), 95);
        queueIdleBlink();
      }, halfPath ? 115 : 190);
    }, 4200 + Math.random() * 3800);
  };
  const refreshIdleBlink = (state) => {
    const figures = Array.isArray(state?.freeFigure) ? state.freeFigure : [];
    const animations = Array.isArray(state?.figureAssociatedAnimation) ? state.figureAssociatedAnimation : [];
    const figure = [...figures].reverse().find((item) => item?.name && animations.some((animation) => animation?.targetId === item.key));
    const animation = [...animations].reverse().find((item) => item?.targetId === figure?.key && item?.blinkAnimation?.open && item?.blinkAnimation?.close);
    if (!figure || !animation) {
      idleBlinkSignature = "";
      idleBlinkTarget = null;
      clearIdleBlink();
      return;
    }
    preloadFigureDifferentials(animation);
    idleBlinkTarget = { target: figure.key, animation, position: figure.basePosition || "center" };
    const signature = String(figure.key);
    if (signature === idleBlinkSignature && (idleBlinkTimer || idleBlinkOpenTimer)) return;
    idleBlinkSignature = signature;
    clearIdleBlink();
    queueIdleBlink();
  };
  const escapeHtml = (value) => String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
  const nvlFadeMs = () => document.documentElement.dataset.galblogMotion === "reduced" ? 0 : 300;
  const nvlChoiceOpen = () => document.documentElement.dataset.galblogChoiceActive === "true";
  const nvlOverlayOpen = () => Boolean((nvlBacklog && !nvlBacklog.hidden) || (nvlPause && !nvlPause.hidden));
  const stopNvlType = () => { clearTimeout(nvlTypeTimer); nvlTypeTimer = 0; nvlTyping = false; };
  const nvlLineHtml = (line, current) => {
    const entering = current && line.entering ? " is-entering" : "";
    if (line.speaker) {
      return '<p class="is-dialogue' + (current ? " is-current" : "") + entering + '"><span class="galblog-nvl-quote">「' + escapeHtml(line.text) + "」</span></p>";
    }
    return '<p class="is-narration' + (current ? " is-current" : "") + entering + '">' + escapeHtml(line.text) + "</p>";
  };
  const renderNvlLines = () => {
    if (!nvlRoot) return;
    const box = nvlRoot.querySelector(".galblog-nvl-lines");
    if (!box) return;
    while (box.childElementCount > nvlLines.length) box.removeChild(box.lastElementChild);
    nvlLines.forEach((line, index) => {
      const current = index === nvlLines.length - 1;
      let node = box.children[index];
      if (!node) {
        box.insertAdjacentHTML("beforeend", nvlLineHtml(line, current));
        node = box.children[index];
        if (line.entering && node) {
          node.classList.add("is-entering");
          requestAnimationFrame(() => requestAnimationFrame(() => node.classList.remove("is-entering")));
        }
      } else {
        node.className = (line.speaker ? "is-dialogue" : "is-narration") + (current ? " is-current" : "");
      }
    });
    nvlRoot.classList.toggle("is-typing", nvlTyping);
  };
  const finishNvlType = () => {
    stopNvlType();
    const last = nvlLines[nvlLines.length - 1];
    if (last) last.entering = false;
    renderNvlLines();
  };
  const typeNvlLine = (line) => {
    stopNvlType();
    if (!line) return;
    if (nvlFadeMs() === 0 || nvlChoiceOpen()) {
      line.entering = false;
      renderNvlLines();
      return;
    }
    line.entering = true;
    nvlTyping = true;
    renderNvlLines();
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (!nvlLines.includes(line)) return;
      line.entering = false;
      renderNvlLines();
    }));
    nvlTypeTimer = setTimeout(() => {
      nvlTyping = false;
      nvlTypeTimer = 0;
      if (nvlRoot) nvlRoot.classList.remove("is-typing");
    }, nvlFadeMs());
  };
  const archiveNvlPage = () => {
    if (!nvlLines.length) return;
    nvlLogPages.push(nvlLines.map((line) => ({ speaker: line.speaker, text: line.text })));
  };
  const closeNvlBacklog = () => { if (nvlBacklog) nvlBacklog.hidden = true; };
  const syncNvlPausedFlag = () => {
    const open = Boolean((nvlBacklog && !nvlBacklog.hidden) || (nvlPause && !nvlPause.hidden));
    document.documentElement.dataset.galblogNvlPaused = open ? "true" : "false";
  };
  const closeNvlPause = () => {
    if (nvlPause) nvlPause.hidden = true;
    syncNvlPausedFlag();
  };
  const showNvlToast = (text) => {
    let toast = document.getElementById("galblog-nvl-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "galblog-nvl-toast";
      (document.getElementById("root") || document.body).appendChild(toast);
    }
    toast.textContent = text;
    toast.hidden = false;
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => { toast.hidden = true; }, 1400);
  };
  const ensureNvlPause = () => {
    if (nvlPause) return nvlPause;
    nvlPause = document.createElement("div");
    nvlPause.id = "galblog-nvl-pause";
    nvlPause.hidden = true;
    nvlPause.innerHTML = '<div class="galblog-nvl-pause__panel" data-nvl-pause-keep="true"><span>系统</span>'
      + [["log","回想"],["auto","自动"],["skip","快进"],["save","保存"],["load","读取"],["option","设置"],["title","标题"],["hide","隐藏正文"],["resume","继续阅读"]].map((item) => '<button type="button" data-nvl-pause="' + item[0] + '">' + item[1] + "</button>").join("")
      + "</div>";
    nvlPause.addEventListener("click", (event) => {
      const button = event.target instanceof Element ? event.target.closest("[data-nvl-pause]") : null;
      if (!button) {
        if (!event.target.closest("[data-nvl-pause-keep]")) closeNvlPause();
        return;
      }
      const action = button.dataset.nvlPause;
      closeNvlPause();
      if (action === "resume") return;
      if (action === "hide") {
        document.documentElement.dataset.galblogDialogueHidden = document.documentElement.dataset.galblogDialogueHidden === "true" ? "false" : "true";
        return;
      }
      if (action === "log") { toggleNvlBacklog(); return; }
      const menuButton = runtimeMenu && runtimeMenu.querySelector('[data-runtime-action="' + action + '"]');
      if (menuButton) menuButton.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    });
    (document.getElementById("root") || document.body).appendChild(nvlPause);
    return nvlPause;
  };
  const toggleNvlPause = (force) => {
    ensureNvlPause();
    closeNvlBacklog();
    if (force === true) nvlPause.hidden = false;
    else if (force === false) nvlPause.hidden = true;
    else nvlPause.hidden = !nvlPause.hidden;
    if (!nvlPause.hidden) nvlPauseLock = Date.now() + 280;
    syncNvlPausedFlag();
  };
  const renderNvlBacklog = () => {
    if (!nvlBacklog) return;
    const pages = nvlBacklog.querySelector(".galblog-nvl-backlog__pages");
    if (!pages) return;
    const all = nvlLogPages.concat(nvlLines.length ? [nvlLines.map((line) => ({ speaker: line.speaker, text: line.text }))] : []);
    pages.innerHTML = all.map((page, index) => "<article><small>第 " + String(index + 1) + " 页</small>" + page.map((line) => nvlLineHtml({ ...line, shown: line.text }, false)).join("") + "</article>").join("")
      || "<p>还没有可以回想的正文。</p>";
    pages.scrollTop = pages.scrollHeight;
  };
  const toggleNvlBacklog = () => {
    if (!nvlBacklog) {
      nvlBacklog = document.createElement("div");
      nvlBacklog.id = "galblog-nvl-backlog";
      nvlBacklog.hidden = true;
      nvlBacklog.innerHTML = '<div class="galblog-nvl-backlog__panel" data-nvl-backlog-keep="true"><header data-nvl-backlog-keep="true"><span>回想</span><button type="button" data-nvl-backlog-close>关闭</button></header><div class="galblog-nvl-backlog__pages" data-nvl-backlog-keep="true"></div></div>';
      nvlBacklog.addEventListener("click", (event) => {
        if (event.target.closest("[data-nvl-backlog-close]") || !event.target.closest("[data-nvl-backlog-keep]")) closeNvlBacklog();
      });
      (document.getElementById("root") || document.body).appendChild(nvlBacklog);
    }
    nvlBacklog.hidden = !nvlBacklog.hidden;
    if (!nvlBacklog.hidden) {
      nvlPauseLock = Date.now() + 280;
      renderNvlBacklog();
    }
    syncNvlPausedFlag();
  };
  const advanceWebgal = () => {
    const target = document.getElementById("FullScreenClick") || document.getElementById("root");
    target?.dispatchEvent(new MouseEvent("click", { view: window, bubbles: true, cancelable: true }));
  };
  const settleEngineText = () => {
    const pending = Array.from(document.querySelectorAll("[class*='_TextBox_textElement_']"))
      .some((node) => !/Settled/i.test(node.className || ""));
    if (pending) advanceWebgal();
  };
  const openNvlMenu = (event) => {
    if (event) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
    toggleNvlPause(true);
  };
  const onNvlInput = (event) => {
    if (document.documentElement.dataset.storyMode !== "nvl") return;
    if (event.type === "keydown" && event.key === "Escape") return;
    if (event.type === "pointerdown") return;
    if (event.target instanceof Element && event.target.closest("#galblog-nvl-menu")) {
      openNvlMenu(event);
      return;
    }
    if (event.type === "contextmenu") {
      event.preventDefault();
      event.stopPropagation();
      toggleNvlPause(true);
      return;
    }
    if (nvlOverlayOpen()) {
      if (Date.now() < nvlPauseLock) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      if (event.type === "keydown" && event.key !== "Escape") return;
      if (event.type === "click" && event.target.closest("[data-nvl-pause-keep], [data-nvl-backlog-keep]")) return;
      event.preventDefault();
      event.stopPropagation();
      closeNvlBacklog();
      closeNvlPause();
      return;
    }
    if (nvlChoiceOpen()) return;
    if (event.target instanceof Element && event.target.closest("#galblog-runtime-menu, [data-runtime-action], input, textarea, select, [class*='_Choose_']")) return;
    if (event.type === "keydown" && !["Enter", " ", "Spacebar"].includes(event.key)) return;
    const onLayer = event.target instanceof Element && event.target.closest("#galblog-nvl-layer");
    if (event.type === "click" && !onLayer) return;
    event.preventDefault();
    event.stopPropagation();
    if (nvlTyping) {
      finishNvlType();
      return;
    }
    advanceWebgal();
  };
  const ensureNvlLayer = () => {
    if (nvlRoot) return nvlRoot;
    nvlRoot = document.createElement("div");
    nvlRoot.id = "galblog-nvl-layer";
    nvlRoot.hidden = true;
    nvlRoot.innerHTML = '<div class="galblog-nvl-page"><div class="galblog-nvl-lines"></div></div><i class="galblog-nvl-next" aria-hidden="true"></i><button type="button" id="galblog-nvl-menu">菜单</button>';
    nvlRoot.addEventListener("click", onNvlInput, true);
    nvlRoot.addEventListener("contextmenu", onNvlInput, true);
    const menuButton = nvlRoot.querySelector("#galblog-nvl-menu");
    menuButton?.addEventListener("pointerdown", openNvlMenu, true);
    menuButton?.addEventListener("click", openNvlMenu, true);
    window.addEventListener("keydown", onNvlInput, true);
    (document.getElementById("root") || document.body).appendChild(nvlRoot);
    return nvlRoot;
  };
  const acceptNvlLine = (speaker, text, token) => {
    if (!text || nvlLines.some((item) => item.token === token)) return;
    const line = { speaker, text, token, shown: text, entering: true };
    nvlLines.push(line);
    typeNvlLine(line);
    setTimeout(settleEngineText, 32);
  };
  const syncNvlLayer = (gameVar) => {
    const mode = String(gameVar.__story_mode || "adv");
    const page = Number(gameVar.__nvl_page || 0);
    const line = String(gameVar.__nvl_line || "");
    const speaker = String(gameVar.__nvl_speaker || "");
    const dim = Number(gameVar.__nvl_dim);
    const root = document.documentElement;
    if (root) {
      root.dataset.storyMode = mode;
      if (Number.isFinite(dim) && dim >= 0) root.style.setProperty("--galblog-nvl-dim", String(dim));
    }
    if (mode !== "nvl") {
      stopNvlType();
      clearTimeout(nvlTurnTimer);
      closeNvlBacklog();
      closeNvlPause();
      if (nvlRoot) nvlRoot.hidden = true;
      nvlLines = [];
      nvlLogPages = [];
      nvlPage = 0;
      return;
    }
    ensureNvlLayer();
    nvlRoot.hidden = !(line || nvlLines.length);
    const token = String(page) + ":" + speaker + ":" + line;
    if (page !== nvlPage) {
      stopNvlType();
      archiveNvlPage();
      nvlPage = page;
      nvlLines = [];
      const box = nvlRoot.querySelector(".galblog-nvl-lines");
      if (box) box.innerHTML = "";
      if (nvlLines.length === 0 && document.documentElement.dataset.galblogMotion !== "reduced") {
        nvlRoot.classList.add("is-turning");
        clearTimeout(nvlTurnTimer);
        nvlTurnTimer = setTimeout(() => nvlRoot && nvlRoot.classList.remove("is-turning"), nvlFadeMs());
      }
    }
    acceptNvlLine(speaker, line, token);
  };
  const onStage = (state) => {
    const gameVar = gameVariables(state);
    syncNvlLayer(gameVar);
    const currentSceneFile = core?.sceneManager?.sceneData?.currentScene?.sceneName;
    const currentSceneId = Object.entries(config.sceneFiles).find(([, file]) => file === currentSceneFile)?.[0];
    if (currentSceneId) {
      const checkpoint = Object.values(config.actions).find((action) => (
        action.kind === "save-point" && action.input?.sceneId === currentSceneId
      ));
      if (checkpoint) lastCheckpointInput = checkpoint.input;
    }
    const layout = ["left", "center", "right"].includes(String(gameVar.__galblog_choice_layout))
      ? String(gameVar.__galblog_choice_layout)
      : "center";
    const root = document.documentElement;
    if (root) {
      root.dataset.galblogChoiceLayout = layout;
      root.dataset.galblogChoiceColumns = Number(gameVar.__galblog_choice_columns) === 2 ? "2" : "1";
      root.dataset.galblogChoiceActive = Number(gameVar.__galblog_choice_active) === 1 ? "true" : "false";
    }
    if (nvlChoiceOpen()) finishNvlType();
    const nextInlineDialogueCode = Number(gameVar.__galblog_inline_dialogue || 0);
    if (nextInlineDialogueCode !== inlineDialogueCode) {
      inlineDialogueCode = nextInlineDialogueCode;
      setTimeout(decorateInlineDialogue, 0);
      setTimeout(decorateInlineDialogue, 90);
    }
    refreshIdleBlink(state);
    const resumePoint = Number(gameVar.__galblog_resume_point || 0);
    if (resumePoint > 0 && resumePoint !== lastResumePoint) {
      lastResumePoint = resumePoint;
      clearTimeout(checkpointTimer);
      if (lastCheckpointInput?.mode === "auto" && resumePoint !== lastAutoSavedResumePoint) {
        checkpointTimer = setTimeout(() => {
          const latestState = runtimeState();
          const latestPoint = Number(gameVariables(latestState).__galblog_resume_point || 0);
          if (disposed || !latestState || latestPoint !== resumePoint || !lastCheckpointInput) return;
          lastAutoSavedResumePoint = resumePoint;
          void postRequest("save-progress", saveInput(lastCheckpointInput, latestState)).then((response) => lifecycle("galblog:auto-checkpoint", {
            target: lastCheckpointInput.target,
            resumePoint,
            status: response?.status || "failure",
          }));
        }, 420);
      }
    }
    const token = String(gameVar.__galblog_request || "");
    if (!token) { activeToken = ""; return; }
    if (token === activeToken || !config.actions[token]) return;
    activeToken = token;
    void handleToken(token, config.actions[token], state);
  };
  const receive = (event) => {
    if (disposed || !hostOrigin || event.source !== window.parent || event.origin !== hostOrigin || !validEnvelope(event.data)) return;
    const message = event.data;
    if (message.type === "event" && message.payload?.name === "settings-change") {
      const settings = applySettings(message.payload.settings, "event");
      void mergeEnginePreferences(settings);
      return;
    }
    if (message.type !== "result" || !message.replyTo || !pending.has(message.replyTo)) return;
    const item = pending.get(message.replyTo);
    clearTimeout(item.timer); pending.delete(message.replyTo); item.resolve(message.payload || { status: "failure" });
  };
  const installNativeUiAdapter = () => {
    if (!document.documentElement || typeof MutationObserver === "undefined" || document.documentElement.dataset.galBlogNativeUi === "true") return;
    document.documentElement.dataset.galBlogNativeUi = "true";
    const labels = {
      option: new Set(["选项", "選項", "Options", "Option", "オプション"]),
      save: new Set(["存档", "存檔", "Save", "セーブ"]),
      load: new Set(["读档", "讀檔", "Load", "ロード"]),
      title: new Set(["标题", "標題", "Title", "タイトル"]),
    };
    const quickLabels = new Set(["快速存档", "快速存檔", "Quick Save", "クイックセーブ", "快速读档", "快速讀檔", "Quick Load", "クイックロード"]);
    const openSaveData = (operation) => {
      if (operation === "load") return postRequest("open-load", { operation: "load" });
      const state = runtimeState();
      if (!lastCheckpointInput || !state) return Promise.resolve({ status: "failure", code: "NO_CHECKPOINT" });
      return postRequest("open-load", {
        operation: "save",
        snapshot: saveInput({ ...lastCheckpointInput, mode: "manual" }, state),
      });
    };
    const adapt = (leaf) => {
      if (leaf.children.length || leaf.dataset.galBlogControl || !leaf.textContent) return;
      const label = leaf.textContent.trim();
      if (quickLabels.has(label)) { const row = leaf.closest("button,[role='button'],li") || leaf; row.hidden = true; return; }
      const action = Object.entries(labels).find(([, values]) => values.has(label))?.[0];
      if (action) leaf.dataset.galBlogControl = action;
    };
    const activateNativeControl = (labels) => {
      const leaf = Array.from(document.querySelectorAll("span,button,[role='button']"))
        .find((item) => labels.includes(String(item.textContent || "").trim()));
      const control = leaf?.closest("[class*='_singleButton_'],button,[role='button']") || leaf;
      control?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    };
    const syncRuntimeToggles = () => {
      if (!runtimeMenu) return;
      [["auto", "Button_ControlPanel_auto"], ["skip", "Button_ControlPanel_fast"]].forEach(([action, id]) => {
        const nativeControl = document.getElementById(id);
        const active = String(nativeControl?.className || "").includes("_button_on_");
        const button = runtimeMenu.querySelector('[data-runtime-action="' + action + '"]');
        button?.classList.toggle("is-active", active);
        button?.setAttribute("aria-pressed", String(active));
      });
    };
    const runHostAction = async (button, operation) => {
      if (!button || button.getAttribute("aria-busy") === "true") return;
      button.setAttribute("aria-busy", "true");
      button.dataset.runtimePending = "true";
      try { await operation(); }
      finally { button.removeAttribute("aria-busy"); delete button.dataset.runtimePending; }
    };
    const createRuntimeMenu = () => {
      if (runtimeMenu || !document.getElementById("root")) return;
      runtimeMenu = document.createElement("nav");
      runtimeMenu.id = "galblog-runtime-menu";
      runtimeMenu.setAttribute("aria-label", "游戏控制");
      runtimeMenu.innerHTML = [
        ["log", "LOG", "回想"],
        ["auto", "AUTO", "自动播放"],
        ["skip", "SKIP", "快进"],
        ["save", "SAVE", "保存到 Blog"],
        ["load", "LOAD", "从 Blog 读档"],
        ["option", "OPTION", "打开 Blog 设置"],
        ["title", "TITLE", "返回 Blog 标题"],
      ].map(([action, label, title]) => '<button type="button" data-runtime-action="' + action + '" title="' + title + '"' + (["auto","skip"].includes(action) ? ' aria-pressed="false"' : '') + '>' + label + '</button>').join("");
      runtimeMenu.addEventListener("click", (event) => {
        const button = event.target instanceof Element ? event.target.closest("[data-runtime-action]") : null;
        const action = button?.dataset.runtimeAction;
        if (!action) return;
        event.preventDefault(); event.stopPropagation();
        if (action === "log") {
          if (document.documentElement.dataset.storyMode === "nvl") toggleNvlBacklog();
          else activateNativeControl(["回想", "Backlog", "Log", "ログ"]);
        }
        else if (action === "auto") { document.getElementById("Button_ControlPanel_auto")?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true })); setTimeout(syncRuntimeToggles, 0); }
        else if (action === "skip") { document.getElementById("Button_ControlPanel_fast")?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true })); setTimeout(syncRuntimeToggles, 0); }
        else if (action === "load") void runHostAction(button, () => openSaveData("load"));
        else if (action === "option") void runHostAction(button, () => postRequest("open-settings", {}));
        else if (action === "title") void runHostAction(button, () => postRequest("return-menu", { screen: "title" }));
        else void runHostAction(button, () => openSaveData("save"));
      });
      document.getElementById("root")?.appendChild(runtimeMenu);
      syncRuntimeToggles();
    };
    const scan = () => {
      document.querySelectorAll("span,button,[role='button']").forEach(adapt);
      const nativeControl = document.querySelector("[data-gal-blog-control]")?.closest("[class*='_singleButton_']")?.parentElement;
      if (nativeControl) nativeControl.dataset.galBlogNativeMenu = "true";
      createRuntimeMenu();
      syncRuntimeToggles();
      applySettingsToRuntime(window.__GAL_BLOG_SETTINGS__ || {});
      decorateInlineDialogue();
    };
    nativeUiClickListener = (event) => {
      const eventTarget = event.target instanceof Element ? event.target : null;
      const inlineTarget = eventTarget?.closest("[data-galblog-inline-action]");
      if (inlineTarget) {
        event.preventDefault(); event.stopImmediatePropagation();
        void activateInlineAction(inlineTarget);
        return;
      }
      const target = eventTarget?.closest("[data-gal-blog-control]");
      const action = target?.dataset.galBlogControl;
      if (!action) return;
      event.preventDefault(); event.stopImmediatePropagation();
      if (action === "option") void postRequest("open-settings", {});
      else if (action === "load") void openSaveData("load");
      else if (action === "title") void postRequest("return-menu", { screen: "title" });
      else void openSaveData("save");
    };
    document.addEventListener("click", nativeUiClickListener, true);
    inlineActionKeyListener = (event) => {
      if (!['Enter', ' '].includes(event.key)) return;
      const target = event.target instanceof Element ? event.target.closest("[data-galblog-inline-action]") : null;
      if (!target) return;
      event.preventDefault(); event.stopImmediatePropagation();
      void activateInlineAction(target);
    };
    document.addEventListener("keydown", inlineActionKeyListener, true);
    scan();
    nativeUiObserver = new MutationObserver(scan);
    nativeUiObserver.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
  };
  const installEscapeToggle = () => {
    const root = document.documentElement;
    if (!root || escapeToggleListener) return;
    root.dataset.galblogDialogueHidden = "false";
    escapeToggleListener = (event) => {
      if (event.key !== "Escape" || event.isComposing) return;
      const editing = event.target instanceof Element && event.target.closest("input, textarea, select, [contenteditable='true']");
      if (editing) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (event.type === "keydown" && !event.repeat) {
        if (document.documentElement.dataset.storyMode === "nvl") {
          if (nvlOverlayOpen()) { closeNvlBacklog(); closeNvlPause(); return; }
          toggleNvlPause();
          return;
        }
        root.dataset.galblogDialogueHidden = root.dataset.galblogDialogueHidden === "true" ? "false" : "true";
      }
    };
    // WebGAL also listens for Escape on window. Register here before the
    // engine bundle starts so hide/show dialogue wins deterministically.
    window.addEventListener("keydown", escapeToggleListener, true);
    window.addEventListener("keyup", escapeToggleListener, true);
  };
  const storyReady = () => {
    if (readyEmitted) return;
    readyEmitted = true;
    lifecycle("galblog:webgal-ready", { sessionId, target: launch.target });
    if (hostOrigin) emitHost(envelope("ready", { payload: { target: launch.target, engine: "WebGAL", engineVersion: "4.6.2" } }));
  };
  const attachWebGAL = async (runtimeCore, options = {}) => {
    if (!runtimeCore?.stageManager?.subscribe) throw new Error("WebGAL 4.6.2 adapter could not attach");
    core = runtimeCore;
    applyLaunchState();
    installBlinkAdapter();
    preloadConfiguredFigures();
    const state = runtimeState();
    if (state) {
      const checkpoint = Object.values(config.actions).find((action) => action.kind === "save-point" && (
        (launch.target.kind === "save-point" && action.input.target?.id === launch.target.id)
        || (launch.target.kind === "scene" && action.input.sceneId === launch.target.id)
        || (launch.target.kind === "start" && action.input.sceneId === config.startSceneId)
      ));
      if (checkpoint) {
        lastCheckpointInput = checkpoint.input;
      }
    }
    unsubscribe = core.stageManager.subscribe(onStage);
    if (state) onStage(state);
    installNativeUiAdapter();
    installEscapeToggle();
    applySettingsToRuntime(window.__GAL_BLOG_SETTINGS__ || {});
    if (options.deferReady !== true) storyReady();
  };
  const dispose = () => {
    if (disposed) return;
    disposed = true; unsubscribe?.(); nativeUiObserver?.disconnect();
    if (nativeUiClickListener) document.removeEventListener("click", nativeUiClickListener, true);
    if (inlineActionKeyListener) document.removeEventListener("keydown", inlineActionKeyListener, true);
    if (escapeToggleListener) {
      window.removeEventListener("keydown", escapeToggleListener, true);
      window.removeEventListener("keyup", escapeToggleListener, true);
    }
    runtimeMenu?.remove();
    runtimeMenu = null;
    stopNvlType();
    clearTimeout(nvlTurnTimer);
    if (nvlRoot) nvlRoot.removeEventListener("click", onNvlInput, true);
    window.removeEventListener("keydown", onNvlInput, true);
    nvlRoot?.remove();
    nvlBacklog?.remove();
    nvlPause?.remove();
    nvlRoot = null;
    nvlBacklog = null;
    nvlPause = null;
    nvlLines = [];
    nvlLogPages = [];
    clearTimeout(checkpointTimer);
    clearIdleBlink();
    window.removeEventListener("message", receive);
    for (const item of pending.values()) { clearTimeout(item.timer); item.resolve({ status: "failure", code: "DISPOSED" }); }
    pending.clear(); unlock();
  };
  installEscapeToggle();
  window.addEventListener("message", receive);
  window.addEventListener("pagehide", dispose, { once: true });
  window.GalBlogBridgeV1 = { prepare, attachWebGAL, storyReady, request: postRequest, captureThumbnail, dispose, config };
})();
