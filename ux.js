/*
 * RagDollLabs Wine Atlas — welcome and navigation UX
 * -------------------------------------------------
 * app.js owns state and selection. This layer reacts to explicit Wine Atlas
 * events, so first-entry UX never depends on polling globals, MutationObservers
 * or setTimeout(0) ordering between files.
 */

let uxWired = false;

function setWineColorIndicator(target, grape) {
  if (!target) return;
  target.replaceChildren();
  if (!grape?.color) return;

  const wrapper = document.createElement("span");
  wrapper.className = "wine-color-indicator";
  const dot = document.createElement("span");
  dot.className = `wine-color-dot ${grape.color}`;
  dot.setAttribute("aria-hidden", "true");
  wrapper.append(dot, document.createTextNode(grape.color === "red" ? "Red wine grape" : "White wine grape"));
  target.appendChild(wrapper);
}

function updateSelectorColor(selectId, indicatorId) {
  const select = document.getElementById(selectId);
  const indicator = document.getElementById(indicatorId);
  const grape = WineAtlas.getData().grapes[select?.value];
  setWineColorIndicator(indicator, grape);
}

function updateProfileColor() {
  const badge = document.getElementById("profileWineColor");
  const grape = WineAtlas.getData().grapes[document.getElementById("grape")?.value];
  if (!badge) return;
  badge.replaceChildren();
  if (!grape?.color) return;

  const wrapper = document.createElement("span");
  wrapper.className = "wine-color-badge";
  const dot = document.createElement("span");
  dot.className = `wine-color-dot ${grape.color}`;
  dot.setAttribute("aria-hidden", "true");
  wrapper.append(dot, document.createTextNode(grape.color === "red" ? "Red" : "White"));
  badge.appendChild(wrapper);
}

function showEmpty(title, text) {
  document.getElementById("emptyTitle").textContent = title;
  document.getElementById("emptyText").textContent = text;
  document.getElementById("emptyView").classList.remove("hidden");
  document.getElementById("exploreView").classList.add("hidden");
  document.getElementById("compareView").classList.add("hidden");
  document.getElementById("liveStatus").textContent = `${title}. ${text}`;
  updateProfileColor();
}

function showExploreResult() {
  document.getElementById("emptyView").classList.add("hidden");
  document.getElementById("exploreView").classList.remove("hidden");
  updateProfileColor();
}

function showAppShell() {
  document.getElementById("welcomeView").classList.add("hidden");
  document.getElementById("appShell").classList.remove("hidden");
}

function showWelcome() {
  document.getElementById("appShell").classList.add("hidden");
  document.getElementById("welcomeView").classList.remove("hidden");
  WineAtlas.clearProfileUrl();
}

function renderFeaturedDiscoveries() {
  const { grapes, regions } = WineAtlas.getData();
  const picks = [
    ["assyrtiko", "santorini"],
    ["mavrud", "thracian-valley"],
    ["tannat", "canelones"]
  ];
  const container = document.getElementById("featuredDiscoveries");
  container.replaceChildren();

  for (const [grapeId, regionId] of picks) {
    const grape = grapes[grapeId];
    const region = regions[regionId];
    if (!grape || !region?.grapes?.[grapeId]) continue;

    const button = document.createElement("button");
    button.type = "button";
    const strong = document.createElement("strong");
    const dot = document.createElement("span");
    dot.className = `wine-color-dot ${grape.color}`;
    dot.setAttribute("aria-hidden", "true");
    strong.append(dot, document.createTextNode(grape.name));
    const meta = document.createElement("span");
    meta.className = "meta";
    meta.textContent = `${region.name} · ${region.country}`;
    button.append(strong, meta);
    button.addEventListener("click", () => {
      showAppShell();
      WineAtlas.selectProfile(grapeId, regionId, true);
    });
    container.appendChild(button);
  }
}

function enterApp(action) {
  showAppShell();
  WineAtlas.begin(action);
}

function wireUxOnce() {
  if (uxWired) return;
  uxWired = true;

  document.querySelectorAll("[data-welcome-action]").forEach(button => {
    button.addEventListener("click", () => enterApp(button.dataset.welcomeAction));
  });

  [
    ["grape", "grapeColor"],
    ["placeGrape", "placeGrapeColor"],
    ["cg", "compareGrapeColor"]
  ].forEach(([selectId, indicatorId]) => {
    document.getElementById(selectId)?.addEventListener("change", () => updateSelectorColor(selectId, indicatorId));
  });
}

document.addEventListener("wineatlas:ready", event => {
  wireUxOnce();
  renderFeaturedDiscoveries();
  updateSelectorColor("grape", "grapeColor");
  updateSelectorColor("placeGrape", "placeGrapeColor");
  updateSelectorColor("cg", "compareGrapeColor");

  if (event.detail.sharedProfile) {
    showAppShell();
    showExploreResult();
  } else {
    showWelcome();
  }
});

document.addEventListener("wineatlas:profile-selected", () => {
  showAppShell();
  showExploreResult();
  updateSelectorColor("grape", "grapeColor");
  updateSelectorColor("placeGrape", "placeGrapeColor");
});

document.addEventListener("wineatlas:selection-needed", event => {
  showAppShell();
  showEmpty(event.detail.title, event.detail.text);
  if (event.detail.focus) document.getElementById(event.detail.focus)?.focus();
  updateSelectorColor("grape", "grapeColor");
  updateSelectorColor("placeGrape", "placeGrapeColor");
});

document.addEventListener("wineatlas:mode-changed", event => {
  if (event.detail.mode === "compare") {
    document.getElementById("emptyView").classList.add("hidden");
    return;
  }
  if (event.detail.hasProfile) showExploreResult();
  else showEmpty("Choose where to begin", "Pick a grape, browse by place, search the atlas or use Surprise me.");
});
