import { all, required } from "./dom.js";

export function initExitDialog() {
  const exitDialog = required("#exit-dialog");
  const stage = required(".stage");
  const exitCommand = required('[data-command="EXIT"]');
  const firstLink = required(".exit-dialog-link");

  function open() {
    exitDialog.setAttribute("aria-hidden", "false");
    stage.inert = true;
    const focusFirstLink = () => firstLink.focus({ preventScroll: true });
    focusFirstLink();
    window.setTimeout(() => {
      if (exitDialog.getAttribute("aria-hidden") === "false") focusFirstLink();
    }, 0);
  }

  function close() {
    if (exitDialog.getAttribute("aria-hidden") === "true") return false;
    exitDialog.setAttribute("aria-hidden", "true");
    stage.inert = false;
    exitCommand.focus({ preventScroll: true });
    return true;
  }

  exitCommand.addEventListener("click", open);
  all("[data-close-exit]").forEach((button) => button.addEventListener("click", () => close()));

  return { close };
}
