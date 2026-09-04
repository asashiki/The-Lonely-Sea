function fullscreenDocument() {
  let owner = window;
  try {
    while (owner.parent !== owner && owner.parent.location.origin === window.location.origin) {
      owner = owner.parent;
    }
  } catch {}
  return owner.document;
}

export function isDocumentFullscreen() {
  return Boolean(fullscreenDocument().fullscreenElement);
}

export async function toggleDocumentFullscreen() {
  const owner = fullscreenDocument();
  if (owner.fullscreenElement) await owner.exitFullscreen();
  else await owner.documentElement.requestFullscreen();
  return Boolean(owner.fullscreenElement);
}

export function onDocumentFullscreenChange(listener) {
  const owner = fullscreenDocument();
  owner.addEventListener("fullscreenchange", listener);
  return () => owner.removeEventListener("fullscreenchange", listener);
}

export function fullscreenLabel(active = isDocumentFullscreen()) {
  const language = document.documentElement.lang.toLocaleLowerCase("en-US");
  if (language.startsWith("ja")) return active ? "フルスクリーンを終了" : "フルスクリーン";
  if (language.startsWith("en")) return active ? "Exit fullscreen" : "Fullscreen";
  return active ? "退出全屏" : "全屏显示";
}
