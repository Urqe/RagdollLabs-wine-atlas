/*
 * RagDollLabs Wine Atlas — welcome and navigation UX
 * -------------------------------------------------
 * app.js owns state and selection. This layer reacts to explicit Wine Atlas
 * events, so first-entry UX never depends on polling globals, MutationObservers
 * or setTimeout(0) ordering between files.
 */

let uxWired = false;
let pendingSimilarOrigin = null;
let similarBackOrigin = null;
let returningFromSimilar = false;

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

function setSelectPlaceholder(selectId, text) {
  const select = document.getElementById(selectId);
  if (!select) return;
  let option = [...select.options].find(item => item.dataset.uxPlaceholder === "true");
  if (!option) {
    option = document.createElement("option");
    option.value = "";
    option.disabled = true;
    option.dataset.uxPlaceholder = "true";
    select.prepend(option);
  }
  option.textContent = text;
  select.value = "";
}

function showInvalidInitialRoute() {
  showAppShell();
  WineAtlas.clearProfileUrl();
  WineAtlas.setBrowseMethod("grape");
  setSelectPlaceholder("grape", "Choose a grape…");
  document.getElementById("region").replaceChildren();
  setSelectPlaceholder("region", "Choose a grape first…");
  showEmpty(
    "Profile not found",
    "That grape and region combination isn't in the atlas yet. Choose another grape or region."
  );
  document.getElementById("grape")?.focus();
}

function currentProfileReference() {
  const url = new URL(window.location.href);
  const grapeId = url.searchParams.get("grape");
  const regionId = url.searchParams.get("region");
  const { grapes, regions } = WineAtlas.getData();
  if (!grapes[grapeId] || !regions[regionId]?.grapes?.[grapeId]) return null;
  return {
    grapeId,
    regionId,
    label: `${grapes[grapeId].name} · ${regions[regionId].name}`
  };
}

/* Ageing is still rendered by the core Serve It Tonight model, but the focused
   profile hierarchy presents it with maturity/vintage education instead. Moving
   the already-rendered DOM node keeps one source of truth for the content. */
function moveAgeingToLearning() {
  const target = document.getElementById("ageingSnapshot");
  if (!target) return;
  target.replaceChildren();
  const ageingBox = [...document.querySelectorAll("#serve .box")]
    .find(box => box.querySelector(".k")?.textContent.trim() === "Ageing");
  if (ageingBox) target.appendChild(ageingBox);
}

function renderSimilarBack() {
  const card = document.querySelector(".similar-card");
  if (!card) return;
  let slot = document.getElementById("similarBack");
  if (!slot) {
    slot = document.createElement("div");
    slot.id = "similarBack";
    slot.className = "similar-back-slot";
    const intro = card.querySelector("p.small");
    intro?.insertAdjacentElement("afterend", slot);
  }
  slot.replaceChildren();
  if (!similarBackOrigin) return;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "similar-back";
  button.textContent = `← Back to ${similarBackOrigin.label}`;
  button.addEventListener("click", () => {
    const origin = similarBackOrigin;
    similarBackOrigin = null;
    returningFromSimilar = true;
    WineAtlas.selectProfile(origin.grapeId, origin.regionId, true);
  });
  slot.appendChild(button);
}

function searchResultButtons() {
  return [...document.querySelectorAll("#searchResults .search-result")];
}

function clearSearchResults(focusInput = false) {
  const input = document.getElementById("searchInput");
  input.value = "";
  document.getElementById("searchResults").replaceChildren();
  if (focusInput) input.focus();
}

function handleSearchInputKeydown(event) {
  const buttons = searchResultButtons();
  if (event.key === "Escape") {
    if (document.getElementById("searchInput").value || buttons.length) {
      event.preventDefault();
      clearSearchResults(false);
    }
    return;
  }
  if (!buttons.length) return;
  if (event.key === "ArrowDown") {
    event.preventDefault();
    buttons[0].focus();
  } else if (event.key === "Enter") {
    event.preventDefault();
    buttons[0].click();
  }
}

function handleSearchResultsKeydown(event) {
  const button = event.target.closest(".search-result");
  if (!button) return;
  const buttons = searchResultButtons();
  const index = buttons.indexOf(button);
  if (event.key === "Escape") {
    event.preventDefault();
    clearSearchResults(true);
  } else if (event.key === "ArrowDown") {
    event.preventDefault();
    buttons[(index + 1) % buttons.length]?.focus();
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    buttons[(index - 1 + buttons.length) % buttons.length]?.focus();
  } else if (event.key === "Home") {
    event.preventDefault();
    buttons[0]?.focus();
  } else if (event.key === "End") {
    event.preventDefault();
    buttons[buttons.length - 1]?.focus();
  }
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

  document.getElementById("searchInput")?.addEventListener("keydown", handleSearchInputKeydown);
  document.getElementById("searchResults")?.addEventListener("keydown", handleSearchResultsKeydown);

  /* Capture before app.js handles the Similar Wines button click, so we can
     remember the profile the user came from without introducing router state. */
  document.getElementById("similarWines")?.addEventListener("click", event => {
    if (!event.target.closest(".similar-item")) return;
    pendingSimilarOrigin = currentProfileReference();
  }, true);
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
    moveAgeingToLearning();
  } else {
    const route = event.detail.initialRoute;
    const attemptedProfile = route?.searchParams?.has("grape") || route?.searchParams?.has("region");
    if (attemptedProfile) showInvalidInitialRoute();
    else showWelcome();
  }
});

document.addEventListener("wineatlas:profile-selected", () => {
  if (pendingSimilarOrigin) {
    similarBackOrigin = pendingSimilarOrigin;
    pendingSimilarOrigin = null;
  } else if (returningFromSimilar) {
    returningFromSimilar = false;
  } else {
    similarBackOrigin = null;
  }

  showAppShell();
  showExploreResult();
  moveAgeingToLearning();
  renderSimilarBack();
  updateSelectorColor("grape", "grapeColor");
  updateSelectorColor("placeGrape", "placeGrapeColor");
});

document.addEventListener("wineatlas:selection-needed", event => {
  similarBackOrigin = null;
  pendingSimilarOrigin = null;
  renderSimilarBack();
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
  else showEmpty("Choose where to begin", "Pick a grape, browse by place, search the atlas or use Discover.");
});
