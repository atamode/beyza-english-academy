export function setupKeyboardActivation() {
  document.addEventListener("keydown", event => {
    if ((event.key === "Enter" || event.key === " ") && event.target.matches("[role='button'][tabindex='0']")) {
      event.preventDefault();
      event.target.click();
    }
  });
}

export async function toggleFullscreen() {
  if (!document.fullscreenElement) await document.documentElement.requestFullscreen?.();
  else await document.exitFullscreen?.();
}
