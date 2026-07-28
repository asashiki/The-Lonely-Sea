import { all, required } from "./dom.js";

export function initStartScreen({ reduceMotion }) {
  const startScreen = required(".start-screen");
  const choices = all("[data-start-topic]", startScreen);
  const panels = all("[data-start-panel]", startScreen);
  const dialogPages = required("[data-start-dialog-pages]", startScreen);
  let activeTopic = choices[0]?.dataset.startTopic || "about";
  let transition = null;

  function commit(topic) {
    activeTopic = topic;
    choices.forEach((button) => {
      if (button.dataset.startTopic === topic) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
    panels.forEach((panel) => {
      panel.setAttribute("aria-hidden", String(panel.dataset.startPanel !== topic));
    });
  }

  async function selectTopic(topic, { animate = true } = {}) {
    if (!choices.some((button) => button.dataset.startTopic === topic) || topic === activeTopic) return;
    transition?.cancel();

    if (!animate || reduceMotion.matches) {
      commit(topic);
      return;
    }

    transition = dialogPages.animate(
      [
        { opacity: 1, transform: "translate3d(0,0,0)" },
        { opacity: 0, transform: "translate3d(0,-.7rem,0)" },
      ],
      { duration: 125, easing: "ease-out", fill: "both" },
    );

    try {
      await transition.finished;
    } catch {
      return;
    }

    commit(topic);
    transition = dialogPages.animate(
      [
        { opacity: 0, transform: "translate3d(0,.7rem,0)" },
        { opacity: 1, transform: "translate3d(0,0,0)" },
      ],
      { duration: 240, easing: "cubic-bezier(.22,1,.36,1)", fill: "both" },
    );

    try {
      await transition.finished;
    } catch {}
    transition?.cancel();
    transition = null;
  }

  choices.forEach((button) => {
    button.addEventListener("click", (event) => {
      selectTopic(button.dataset.startTopic, { animate: event.detail > 0 });
    });
  });

  function changePage(direction) {
    const index = Math.max(0, choices.findIndex((button) => button.dataset.startTopic === activeTopic));
    const next = Math.max(0, Math.min(choices.length - 1, index + direction));
    selectTopic(choices[next].dataset.startTopic, { animate: false });
    choices[next].focus({ preventScroll: true });
  }

  function deactivate() {
    transition?.cancel();
    transition = null;
  }

  return {
    changePage,
    deactivate,
  };
}
