// Page and line IDs are shared by the three authored translations.
export function juneArtCue(month, pageId, line) {
  if (month !== "2026-06") return { active: false, subject: "" };
  let subject = "";
  if (pageId === "ch2_claude_p01") subject = line < 2 ? "listen" : "concern";
  if (pageId === "ch2_claude_p02") subject = line < 2 ? "encourage" : "concern";
  if (pageId === "ch2_claude_p03") subject = "listen";
  if (pageId === "ch2_claude_p04") subject = "encourage";
  if (pageId === "ch2_claude_p05") subject = line < 4 ? "listen" : "goodnight";
  return { active: true, subject };
}

export function createJuneArt(modal, reducedMotion) {
  const layer = document.createElement("div");
  layer.className = "nvl-june-art";
  layer.setAttribute("aria-hidden", "true");
  modal.prepend(layer);
  const assets = new Map();
  let serial = 0;
  let previous = "";
  function asset(name) {
    if (assets.has(name)) return assets.get(name);
    const image = new Image();
    image.alt = "";
    image.draggable = false;
    image.className = "nvl-june-portrait";
    image.src = `/assets/nvl/2026-06/claude-v1/${name}.webp`;
    const ready = image.decode().then(() => true).catch(() => false);
    layer.append(image);
    const entry = { image, ready };
    assets.set(name, entry);
    return entry;
  }
  return (month, pageId, line, instant = false) => {
    const cue = juneArtCue(month, pageId, line);
    const key = JSON.stringify(cue);
    if (key === previous) return;
    previous = key;
    const ticket = ++serial;
    modal.dataset.juneArt = String(cue.active);
    modal.dataset.junePortrait = String(Boolean(cue.subject));
    layer.dataset.instant = String(instant || reducedMotion());
    if (!cue.active || !cue.subject) {
      layer.dataset.subject = "";
      for (const { image } of assets.values()) image.classList.remove("is-shown");
      return;
    }
    asset(cue.subject).ready.then((ready) => {
      if (ticket !== serial) return;
      layer.dataset.subject = ready ? cue.subject : "";
      for (const [name, { image }] of assets) image.classList.toggle("is-shown", ready && name === cue.subject);
    });
    // Only the four small chapter assets; decoding is shared across repeated opens.
    for (const name of ["listen", "concern", "encourage", "goodnight"]) asset(name);
  };
}
