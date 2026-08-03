import { all, required } from "./dom.js";

export function initExitDialog() {
  const exitDialog = required("#exit-dialog");
  const stage = required(".stage");
  const exitCommand = required('[data-command="EXIT"]');
  const noButton = required('[data-exit-modal-answer="no"]');

  function open() {
    exitDialog.setAttribute("aria-hidden", "false");
    stage.inert = true;
    noButton.focus({ preventScroll: true });
  }

  function close(message) {
    if (exitDialog.getAttribute("aria-hidden") === "true") return false;
    exitDialog.setAttribute("aria-hidden", "true");
    stage.inert = false;
    if (message) {
      const note = required(".menu-note span");
      note.textContent = message;
      window.setTimeout(() => { note.textContent = "MAIN MENU"; }, 1700);
    }
    exitCommand.focus({ preventScroll: true });
    return true;
  }

  exitCommand.addEventListener("click", open);
  all("[data-close-exit]").forEach((button) => button.addEventListener("click", () => close()));
  noButton.addEventListener("click", () => close());
  required('[data-exit-modal-answer="yes"]').addEventListener("click", () => close("SESSION ENDED / THE SEA WILL WAIT"));

  return { close };
}
