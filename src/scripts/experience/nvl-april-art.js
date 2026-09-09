// Directions use stable page/line IDs shared by all translations, never prose.
export function aprilTextBeat(pageId, line) {
  return (pageId === "ch1_anna_p01" && [2, 3, 6].includes(line))
    || (pageId === "ch1_anna_p03" && line === 3)
    || (pageId === "ch1_anna_p04" && line === 5);
}

export function aprilArtCue(month, pageId, line) {
  if (month !== "2026-04") return { active: false };
  const cue = { active: true, background: "", subject: "", camera: "medium", mood: "quiet" };
  if (pageId?.startsWith("ch1_self_")) {
    // Moonlit assets belong to night passages, not morning or the commute.
    if (["ch1_self_p05", "ch1_self_p06", "ch1_self_p07", "ch1_self_p10"].includes(pageId)) cue.background = "room";
    if (pageId === "ch1_self_p10" && line >= 3 && line < 7) cue.mood = "withdrawn";
    return cue;
  }
  if (!pageId?.startsWith("ch1_anna_")) return cue;
  cue.background = "agency";
  if (pageId === "ch1_anna_p01") {
    if (line >= 2) cue.subject = "declare";
    if (line >= 3) { cue.subject = "chair"; cue.camera = "wide"; }
    if (line >= 6) { cue.subject = "declare"; cue.camera = "close"; }
  }
  if (pageId === "ch1_anna_p02") cue.subject = "calm";
  if (pageId === "ch1_anna_p03") {
    cue.subject = line < 2 ? "calm" : "encourage";
    if (line >= 3) cue.camera = "close";
  }
  if (pageId === "ch1_anna_p04") {
    cue.subject = line < 3 ? "encourage" : "goodnight";
    if (line >= 5) { cue.camera = "close"; cue.mood = "warm"; }
  }
  return cue;
}

export function createAprilArt(modal, reducedMotion) {
  const layer = document.createElement("div");
  layer.className = "nvl-april-art";
  layer.setAttribute("aria-hidden", "true");
  modal.prepend(layer);
  const backgrounds = new Map();
  const portraits = new Map();
  let previous = "";
  let generation = 0;
  function asset(name, background = false) {
    const collection = background ? backgrounds : portraits;
    if (collection.has(name)) return collection.get(name);
    const image = new Image();
    image.alt = "";
    image.draggable = false;
    image.className = background ? "nvl-april-background" : `nvl-april-illustration nvl-art-${name}`;
    image.src = `/assets/nvl/2026-04/staging-v2/${name === "agency" ? "agency-original" : name}.png`;
    const ready = image.decode().then(() => image.classList.add("is-ready")).catch(() => {});
    layer.append(image);
    const entry = { image, ready };
    collection.set(name, entry);
    return entry;
  }
  return (month, pageId, line, instant = false) => {
    const cue = aprilArtCue(month, pageId, line);
    const key = JSON.stringify(cue);
    if (previous === key) return;
    previous = key;
    const ticket = ++generation;
    modal.dataset.aprilArt = String(cue.active);
    if (!cue.active) return;
    layer.dataset.instant = String(instant || reducedMotion());
    layer.dataset.pending = String(instant);
    // Decode first, keep the outgoing composition until the next shot is ready.
    const needed = [];
    if (cue.background) needed.push(asset(cue.background, true).ready);
    if (cue.subject) needed.push(asset(cue.subject).ready);
    Promise.all(needed).then(() => {
      if (ticket !== generation) return;
      layer.dataset.pending = "false";
      layer.dataset.camera = cue.camera;
      layer.dataset.mood = cue.mood;
      layer.dataset.subject = cue.subject;
      for (const [name, entry] of backgrounds) entry.image.classList.toggle("is-shown", name === cue.background);
      for (const [name, entry] of portraits) entry.image.classList.toggle("is-shown", name === cue.subject);
    });
    // Preload adjacent beats, not the entire source collection.
    if (pageId === "ch1_self_p10") { asset("agency", true); asset("declare"); }
    if (pageId === "ch1_anna_p01") { asset("declare"); asset("chair"); asset("calm"); }
    if (pageId === "ch1_anna_p02") asset("encourage");
    if (pageId === "ch1_anna_p03") asset("goodnight");
  };
}
