let activeTransition;

// Keep the selected illustration continuous when LOAD opens a chapter. This is
// a same-document enhancement; the title's iframe handoff stays unchanged.
export async function transitionReadingChapter(root, commit, { reducedMotion = false } = {}) {
  if (activeTransition) {
    activeTransition.skipTransition();
    await activeTransition.finished.catch(() => {});
  }
  const selector = root.classList.contains('is-system-layer-open')
    ? '[data-article-preview-image]' : '.reading-frontispiece-art img';
  const source = root.querySelector(selector);
  const rect = source?.getBoundingClientRect();
  if (reducedMotion || !document.startViewTransition || !rect?.width || rect.bottom <= 0 || rect.top >= innerHeight) {
    commit();
    return;
  }
  source.style.viewTransitionName = 'reading-cover';
  let target;
  let committed = false;
  const update = () => {
    if (committed) return;
    committed = true;
    commit();
    source.style.removeProperty('view-transition-name');
    target = root.querySelector('.reading-frontispiece-art img');
    if (target) target.style.viewTransitionName = 'reading-cover';
  };
  const cleanup = () => {
    source.style.removeProperty('view-transition-name');
    target?.style.removeProperty('view-transition-name');
  };
  try {
    const transition = document.startViewTransition(update);
    activeTransition = transition;
    void transition.ready.catch(() => {});
    void transition.finished.catch(() => {}).finally(() => {
      cleanup();
      if (activeTransition === transition) activeTransition = null;
    });
    await transition.updateCallbackDone;
  } catch (error) {
    cleanup();
    if (committed) throw error;
    update();
    cleanup();
  }
}
