/*
 * Secondary interaction guards for the welcome-state UX.
 * app.js owns selection; ux.js owns the welcome/empty states. These listeners
 * simply make sure profile-producing actions also dismiss any instructional
 * empty state that was shown while the user was choosing how to begin.
 */
document.addEventListener("DOMContentLoaded", () => {
  const revealAfterSelection = event => {
    if (event.target.closest("button")) window.setTimeout(() => window.showExploreResult?.(), 0);
  };

  document.getElementById("surprise")?.addEventListener("click", () => window.setTimeout(() => window.showExploreResult?.(), 0));
  document.getElementById("moodButtons")?.addEventListener("click", revealAfterSelection);

  /* If Compare was the user's first entry path, returning to Explore should not
     suddenly reveal app.js's internal initialization profile. */
  document.getElementById("bExplore")?.addEventListener("click", () => {
    const params = new URLSearchParams(window.location.search);
    if (!params.get("grape") || !params.get("region")) {
      window.setTimeout(() => window.showEmpty?.("Choose where to begin", "Pick a grape, browse by place, search the atlas or use Surprise me."), 0);
    }
  });
});
