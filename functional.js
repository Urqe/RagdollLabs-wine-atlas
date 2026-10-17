/*
 * RagDollLabs Wine Atlas — practical discovery enhancements
 * --------------------------------------------------------
 * Keeps food-first discovery and profile-specific winemaking context separate
 * from the core profile engine. Both features consume validated data and use
 * the public WineAtlas profile API; this module never recomputes profile rules.
 *
 * Optional enrichment JSON is intentionally fail-soft. If an optional file
 * cannot be fetched, the affected section stays hidden for that page session
 * and the error is logged. Core browsing remains usable; reload is the retry.
 */

let winemakingPromise = null;
let lastProfile = null;
function normalizeFood(value) { return FoodDiscovery.normalize(value); }
function loadFoodAliases() { return FoodDiscovery.load(); }
function expandedFoodTerms(query) { return FoodDiscovery.terms(query); }
function foodScore(pairings, query) { return FoodDiscovery.score(pairings, query); }

function allProfiles() {
  return WineAtlas.allPairs();
}

function rankFoodMatches(query) {
  return allProfiles()
    .map(item => ({ ...item, score: foodScore(item.regional.pairings, query) }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score || a.grape.name.localeCompare(b.grape.name) || a.region.name.localeCompare(b.region.name))
    .slice(0, 8);
}

async function renderFoodMatches() {
  const input = document.getElementById("foodInput");
  const container = document.getElementById("foodResults");
  if (!input || !container) return;
  const query = input.value.trim();
  container.replaceChildren();
  if (query.length < 2) return;

  await loadFoodAliases();
  if (input.value.trim() !== query) return;
  const matches = rankFoodMatches(query);
  if (!matches.length) {
    const empty = document.createElement("div");
    empty.className = "search-empty";
    empty.textContent = "No pairing matches yet. Try a broader food, such as lamb, beef, mushrooms, cheese or dessert.";
    container.appendChild(empty);
    return;
  }

  for (const item of matches) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "search-result food-result";
    button.dataset.grape = item.grapeId;
    button.dataset.region = item.regionId;

    const title = document.createElement("strong");
    const dot = document.createElement("span");
    dot.className = `wine-color-dot ${item.grape.color}`;
    dot.setAttribute("aria-hidden", "true");
    title.append(dot, document.createTextNode(`${item.grape.name} · ${item.region.name}`));

    const meta = document.createElement("span");
    meta.textContent = `${item.region.country} · pairs with ${item.regional.pairings.join(" · ")}`;
    button.append(title, meta);
    container.appendChild(button);
  }
}

function handleFoodClick(event) {
  const button = event.target.closest?.(".food-result");
  if (!button) return;
  const input = document.getElementById("foodInput");
  const container = document.getElementById("foodResults");
  WineAtlas.selectProfile(button.dataset.grape, button.dataset.region, true);
  if (input) input.value = "";
  container?.replaceChildren();
}

function foodResultButtons() {
  return [...document.querySelectorAll("#foodResults .food-result")];
}

function handleFoodKeydown(event) {
  const input = document.getElementById("foodInput");
  const results = document.getElementById("foodResults");
  const buttons = foodResultButtons();
  if (event.target === input) {
    if (event.key === "Escape") {
      if (input.value || buttons.length) {
        event.preventDefault();
        input.value = "";
        results.replaceChildren();
      }
    } else if (buttons.length && event.key === "ArrowDown") {
      event.preventDefault();
      buttons[0].focus();
    } else if (buttons.length && event.key === "Enter") {
      event.preventDefault();
      buttons[0].click();
    }
    return;
  }

  const button = event.target.closest?.(".food-result");
  if (!button) return;
  const index = buttons.indexOf(button);
  if (event.key === "Escape") {
    event.preventDefault();
    input.focus();
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

function renderSpecialStyle(profile) {
  document.getElementById("specialStyle")?.remove();
  const style = profile?.regional?.style;
  if (!style) return;
  const anchor = document.getElementById("winemaking") || document.querySelector("#exploreView .content2");
  if (!anchor) return;

  const section = document.createElement("section");
  section.id = "specialStyle";
  section.className = "identity";
  section.setAttribute("aria-labelledby", "specialStyleHeading");
  const heading = document.createElement("h3");
  heading.id = "specialStyleHeading";
  heading.textContent = "Wine style & production";

  const grid = document.createElement("dl");
  grid.className = "identity-grid";
  const rows = [
    ["Style", style.label],
    ["Family", style.family],
    ["Sweetness", style.sweetness],
    ["Method", style.method]
  ];
  for (const [term, value] of rows) {
    if (!value) continue;
    const row = document.createElement("div");
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    dt.textContent = term;
    dd.textContent = value;
    row.append(dt, dd);
    grid.appendChild(row);
  }
  const effect = document.createElement("p");
  effect.className = "small";
  effect.textContent = style.effect;
  section.append(heading, grid, effect);
  anchor.insertAdjacentElement("beforebegin", section);
  document.dispatchEvent(new CustomEvent("wineatlas:special-style-rendered", { detail: { profile } }));
}

function loadWinemaking() {
  if (!winemakingPromise) {
    winemakingPromise = fetch("./data/winemaking.json")
      .then(response => {
        if (!response.ok) throw new Error("Winemaking data could not be loaded.");
        return response.json();
      })
      .catch(error => {
        console.error(error);
        return {};
      });
  }
  return winemakingPromise;
}

function signalWinemakingRendered(profile, visible) {
  document.dispatchEvent(new CustomEvent("wineatlas:winemaking-rendered", { detail: { profile, visible } }));
}

async function renderWinemaking(profile) {
  const section = document.getElementById("winemaking");
  const choicesTarget = document.getElementById("winemakingChoices");
  if (!section || !choicesTarget || !profile) return;
  const data = await loadWinemaking();
  if (lastProfile !== profile) return;

  const entry = data?.[profile.regionId]?.[profile.grapeId];
  const choices = entry?.choices || [];
  choicesTarget.replaceChildren();
  if (!choices.length) {
    section.classList.add("hidden");
    signalWinemakingRendered(profile, false);
    return;
  }

  for (const choice of choices) {
    const card = document.createElement("article");
    card.className = "winemaking-choice";
    const heading = document.createElement("div");
    heading.className = "winemaking-choice-head";
    const vessel = document.createElement("strong");
    vessel.textContent = choice.vessel;
    const prevalence = document.createElement("span");
    prevalence.className = "winemaking-prevalence";
    prevalence.textContent = choice.prevalence;
    heading.append(vessel, prevalence);
    card.appendChild(heading);

    if (choice.context) {
      const context = document.createElement("div");
      context.className = "winemaking-context";
      context.textContent = choice.context;
      card.appendChild(context);
    }

    const effect = document.createElement("p");
    effect.textContent = choice.effect;
    card.appendChild(effect);
    choicesTarget.appendChild(card);
  }
  section.classList.remove("hidden");
  signalWinemakingRendered(profile, true);
}

function wireFunctionalFeatures() {
  const foodInput = document.getElementById("foodInput");
  const foodResults = document.getElementById("foodResults");
  foodInput?.addEventListener("input", () => { void renderFoodMatches(); });
  foodInput?.addEventListener("keydown", handleFoodKeydown);
  foodResults?.addEventListener("keydown", handleFoodKeydown);
  foodResults?.addEventListener("click", handleFoodClick);
}

document.addEventListener("wineatlas:ready", () => {
  wireFunctionalFeatures();
  void loadFoodAliases();
  void loadWinemaking();
});

document.addEventListener("wineatlas:profile-selected", event => {
  lastProfile = event.detail.profile;
  renderSpecialStyle(lastProfile);
  void renderWinemaking(lastProfile);
});

document.addEventListener("wineatlas:selection-needed", () => {
  lastProfile = null;
  document.getElementById("specialStyle")?.remove();
  document.getElementById("winemaking")?.classList.add("hidden");
});
