/*
 * RagDollLabs Wine Atlas — welcome-state UX
 * -----------------------------------------
 * This file intentionally layers UX behavior over app.js instead of duplicating
 * wine data or profile logic. All actual profile selection still resolves through
 * the guarded functions in app.js. Keeping this layer separate makes the new
 * landing flow straightforward for later reviewers to inspect or revise.
 */

const UX_INITIAL_URL = new URL(window.WINE_ATLAS_INITIAL_URL || window.location.href);

function waitForAtlasData(timeoutMs = 5000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const timer = window.setInterval(() => {
      if (typeof GRAPES !== "undefined" && Object.keys(GRAPES).length && typeof REGIONS !== "undefined" && Object.keys(REGIONS).length) {
        window.clearInterval(timer);
        resolve();
      } else if (Date.now() - started > timeoutMs) {
        window.clearInterval(timer);
        reject(new Error("Wine Atlas UX layer timed out waiting for app data."));
      }
    }, 40);
  });
}

function wineColorLabel(grapeId) {
  const grape = GRAPES[grapeId];
  if (!grape?.color) return "";
  const label = grape.color === "red" ? "Red wine grape" : "White wine grape";
  return `<span class="wine-color-indicator"><span class="wine-color-dot ${grape.color}" aria-hidden="true"></span>${label}</span>`;
}

function updateSelectorColor(selectId, indicatorId) {
  const select = document.getElementById(selectId);
  const indicator = document.getElementById(indicatorId);
  if (!select || !indicator) return;
  indicator.innerHTML = select.value ? wineColorLabel(select.value) : "";
}

function updateProfileColor() {
  const badge = document.getElementById("profileWineColor");
  const grapeId = document.getElementById("grape")?.value;
  const grape = GRAPES[grapeId];
  if (!badge || !grape?.color) {
    if (badge) badge.innerHTML = "";
    return;
  }
  const label = grape.color === "red" ? "Red" : "White";
  badge.innerHTML = `<span class="wine-color-badge"><span class="wine-color-dot ${grape.color}" aria-hidden="true"></span>${label}</span>`;
}

function decorateProfileButtons(container) {
  if (!container) return;
  container.querySelectorAll("[data-grape]").forEach(button => {
    if (button.dataset.colorDecorated === "true") return;
    const grape = GRAPES[button.dataset.grape];
    if (!grape?.color) return;
    const dot = document.createElement("span");
    dot.className = `wine-color-dot ${grape.color}`;
    dot.setAttribute("aria-hidden", "true");
    const first = button.querySelector("strong") || button.firstElementChild;
    if (first) first.prepend(dot);
    button.dataset.colorDecorated = "true";
  });
}

function addPlaceholder(select, label) {
  if (!select) return;
  let option = [...select.options].find(item => item.dataset.uxPlaceholder === "true");
  if (!option) {
    option = document.createElement("option");
    option.value = "";
    option.textContent = label;
    option.disabled = true;
    option.dataset.uxPlaceholder = "true";
    select.prepend(option);
  }
  select.value = "";
}

function showEmpty(title, text) {
  document.getElementById("emptyTitle").textContent = title;
  document.getElementById("emptyText").textContent = text;
  document.getElementById("emptyView").classList.remove("hidden");
  document.getElementById("exploreView").classList.add("hidden");
  document.getElementById("compareView").classList.add("hidden");
  updateProfileColor();
}

function showExploreResult() {
  document.getElementById("emptyView").classList.add("hidden");
  document.getElementById("exploreView").classList.remove("hidden");
  updateProfileColor();
}

function enterApp(action) {
  document.getElementById("welcomeView").classList.add("hidden");
  document.getElementById("appShell").classList.remove("hidden");

  if (action === "surprise") {
    surpriseMe();
    showExploreResult();
    return;
  }
  if (action === "compare") {
    setMode("compare");
    addPlaceholder(document.getElementById("cg"), "Choose a grape…");
    document.getElementById("compareGrid").innerHTML = "";
    document.getElementById("compareDifferences").innerHTML = "";
    document.getElementById("compareMessage").textContent = "Choose a grape to compare regional expressions.";
    document.getElementById("compareMessage").classList.remove("hidden");
    updateSelectorColor("cg", "compareGrapeColor");
    return;
  }

  setMode("explore");
  if (action === "place") {
    setBrowseMethod("place");
    addPlaceholder(document.getElementById("country"), "Choose a country…");
    document.getElementById("placeRegion").innerHTML = '<option value="" disabled selected>Choose a region…</option>';
    document.getElementById("placeGrape").innerHTML = '<option value="" disabled selected>Choose a grape…</option>';
    showEmpty("Explore by place", "Choose a country, then a region and grape to open a profile.");
    document.getElementById("country").focus();
    return;
  }
  if (action === "search") {
    showEmpty("Search the atlas", "Search for a grape, region, country or style, then choose a result.");
    document.getElementById("searchInput").focus();
    return;
  }

  setBrowseMethod("grape");
  addPlaceholder(document.getElementById("grape"), "Choose a grape…");
  document.getElementById("region").innerHTML = '<option value="" disabled selected>Choose a grape first…</option>';
  showEmpty("Start with a grape", "Choose a grape first, then select one of its regional expressions.");
  document.getElementById("grape").focus();
  updateSelectorColor("grape", "grapeColor");
}

function normalizeWelcomeUrl() {
  const clean = new URL(window.location.href);
  clean.searchParams.delete("grape");
  clean.searchParams.delete("region");
  window.history.replaceState(null, "", clean);
}

function renderFeaturedDiscoveries() {
  const picks = [
    ["assyrtiko", "santorini"],
    ["mavrud", "thracian-valley"],
    ["tannat", "canelones"]
  ].map(([grapeId, regionId]) => combinedProfile(grapeId, regionId)).filter(Boolean);
  const container = document.getElementById("featuredDiscoveries");
  container.innerHTML = picks.map(item => `<button type="button" data-grape="${item.grapeId}" data-region="${item.regionId}"><strong>${item.grape.name}</strong><span class="meta">${item.region.name} · ${item.region.country}</span></button>`).join("");
  decorateProfileButtons(container);
  container.querySelectorAll("button").forEach(button => button.addEventListener("click", () => {
    document.getElementById("welcomeView").classList.add("hidden");
    document.getElementById("appShell").classList.remove("hidden");
    selectProfile(button.dataset.grape, button.dataset.region, true);
    showExploreResult();
  }));
}

async function initUx() {
  try {
    await waitForAtlasData();

    const initialGrape = UX_INITIAL_URL.searchParams.get("grape");
    const initialRegion = UX_INITIAL_URL.searchParams.get("region");
    const hasSharedProfile = Boolean(initialGrape && initialRegion && combinedProfile(initialGrape, initialRegion));

    renderFeaturedDiscoveries();

    document.querySelectorAll("[data-welcome-action]").forEach(button => {
      button.addEventListener("click", () => enterApp(button.dataset.welcomeAction));
    });

    [
      ["grape", "grapeColor"],
      ["placeGrape", "placeGrapeColor"],
      ["cg", "compareGrapeColor"]
    ].forEach(([selectId, indicatorId]) => {
      document.getElementById(selectId)?.addEventListener("change", () => updateSelectorColor(selectId, indicatorId));
      updateSelectorColor(selectId, indicatorId);
    });

    /* app.js handles the actual state first; these listeners only control when a
       partially chosen hierarchy should reveal a finished profile. */
    document.getElementById("grape").addEventListener("change", () => {
      const region = document.getElementById("region");
      addPlaceholder(region, "Choose a region…");
      showEmpty("Choose a region", "Now choose the regional expression you want to explore.");
      normalizeWelcomeUrl();
    });
    document.getElementById("region").addEventListener("change", showExploreResult);
    document.getElementById("country").addEventListener("change", () => {
      setBrowseMethod("place");
      addPlaceholder(document.getElementById("placeRegion"), "Choose a region…");
      document.getElementById("placeGrape").innerHTML = '<option value="" disabled selected>Choose a region first…</option>';
      showEmpty("Choose a region", "Choose a wine region within that country.");
      normalizeWelcomeUrl();
    });
    document.getElementById("placeRegion").addEventListener("change", () => {
      setBrowseMethod("place");
      addPlaceholder(document.getElementById("placeGrape"), "Choose a grape…");
      showEmpty("Choose a grape", "Choose one of the grapes represented in this region.");
      normalizeWelcomeUrl();
    });
    document.getElementById("placeGrape").addEventListener("change", showExploreResult);
    document.getElementById("cg").addEventListener("change", () => updateSelectorColor("cg", "compareGrapeColor"));

    const observer = new MutationObserver(() => {
      decorateProfileButtons(document.getElementById("searchResults"));
      decorateProfileButtons(document.getElementById("similarWines"));
    });
    observer.observe(document.getElementById("searchResults"), { childList: true, subtree: true });
    observer.observe(document.getElementById("similarWines"), { childList: true, subtree: true });

    document.getElementById("searchResults").addEventListener("click", event => {
      if (event.target.closest("[data-grape]")) window.setTimeout(showExploreResult, 0);
    });
    document.getElementById("similarWines").addEventListener("click", event => {
      if (event.target.closest("[data-grape]")) window.setTimeout(showExploreResult, 0);
    });

    if (hasSharedProfile) {
      document.getElementById("welcomeView").classList.add("hidden");
      document.getElementById("appShell").classList.remove("hidden");
      showExploreResult();
      updateProfileColor();
    } else {
      document.getElementById("appShell").classList.add("hidden");
      document.getElementById("welcomeView").classList.remove("hidden");
      normalizeWelcomeUrl();
    }
  } catch (error) {
    console.error(error);
    document.getElementById("welcomeView")?.classList.add("hidden");
    document.getElementById("appShell")?.classList.remove("hidden");
  }
}

document.addEventListener("DOMContentLoaded", initUx);
