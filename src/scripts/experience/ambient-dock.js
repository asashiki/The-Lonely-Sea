export function initAmbientDock(dock) {
  if (!(dock instanceof HTMLElement)) return () => {};

  const triggers = [...dock.querySelectorAll("[data-ambient-trigger]")];
  const choices = [...dock.querySelectorAll("[data-scene-option], [data-weather-option]")];
  const sceneTrigger = dock.querySelector('[data-ambient-trigger="scene"]');

  function syncCurrentScene() {
    if (!(sceneTrigger instanceof HTMLButtonElement)) return;
    const scene = document.body.dataset.scene || "mist";
    sceneTrigger.dataset.currentScene = scene;
    const label = dock.querySelector(`[data-scene-option="${scene}"]`)?.getAttribute("aria-label") || "主题";
    sceneTrigger.title = label;
  }

  function setOpen(kind = "") {
    triggers.forEach((trigger) => {
      const open = trigger.dataset.ambientTrigger === kind;
      trigger.setAttribute("aria-expanded", String(open));
    });
    dock.querySelectorAll("[data-ambient-panel]").forEach((panel) => {
      panel.setAttribute("aria-hidden", String(panel.dataset.ambientPanel !== kind));
    });
    dock.dataset.openPanel = kind;
  }

  const handleTrigger = (event) => {
    const trigger = event.currentTarget;
    const kind = trigger.dataset.ambientTrigger || "";
    setOpen(trigger.getAttribute("aria-expanded") === "true" ? "" : kind);
  };
  const handleOutside = (event) => {
    if (!dock.contains(event.target)) setOpen("");
  };
  const handleChoice = () => window.requestAnimationFrame(() => {
    syncCurrentScene();
    setOpen("");
  });
  const handleKeydown = (event) => {
    if (event.key === "Escape" && dock.dataset.openPanel) setOpen("");
  };

  triggers.forEach((trigger) => trigger.addEventListener("click", handleTrigger));
  choices.forEach((choice) => choice.addEventListener("click", handleChoice));
  document.addEventListener("pointerdown", handleOutside, true);
  document.addEventListener("keydown", handleKeydown);
  const sceneObserver = new MutationObserver(syncCurrentScene);
  sceneObserver.observe(document.body, { attributes: true, attributeFilter: ["data-scene"] });
  syncCurrentScene();

  return () => {
    triggers.forEach((trigger) => trigger.removeEventListener("click", handleTrigger));
    choices.forEach((choice) => choice.removeEventListener("click", handleChoice));
    document.removeEventListener("pointerdown", handleOutside, true);
    document.removeEventListener("keydown", handleKeydown);
    sceneObserver.disconnect();
  };
}
