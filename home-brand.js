/*
 * RagDollLabs Wine Atlas — home / brand navigation
 * ------------------------------------------------
 * Branding is a real navigation affordance. Links retain an href fallback, while
 * this enhancement returns to the already-loaded landing page without a reload.
 */

function returnToWineAtlasHome(event) {
  event?.preventDefault?.();
  WineAtlas.clearProfileUrl();
  document.getElementById("appShell")?.classList.add("hidden");
  const welcome = document.getElementById("welcomeView");
  welcome?.classList.remove("hidden");
  document.getElementById("glossaryDialog")?.close?.();
  const heading = document.getElementById("welcomeTitle");
  if (heading) {
    heading.setAttribute("tabindex", "-1");
    heading.focus({ preventScroll: true });
  }
  window.scrollTo?.({ top: 0, behavior: "smooth" });
}

document.addEventListener("wineatlas:ready", () => {
  document.querySelectorAll("[data-home-return]").forEach(link => {
    link.addEventListener("click", returnToWineAtlasHome);
  });
});
