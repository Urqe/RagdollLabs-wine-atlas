/*
 * RagDollLabs Wine Atlas — practical discovery enhancements
 * --------------------------------------------------------
 * Keeps food-first discovery and profile-specific winemaking context separate
 * from the core profile engine. Both features consume the same validated data
 * and use WineAtlas.selectProfile() for navigation.
 */

const FOOD_ALIASES = {
  steak: ["steak", "beef"],
  beef: ["beef", "steak", "short ribs", "burgers"],
  burger: ["burgers", "beef"],
  burgers: ["burgers", "beef"],
  lamb: ["lamb", "braised lamb"],
  pork: ["pork"],
  duck: ["duck"],
  chicken: ["chicken", "roast chicken", "lemon chicken"],
  mushroom: ["mushrooms", "truffle dishes"],
  mushrooms: ["mushrooms", "truffle dishes"],
  cheese: ["cheese", "hard cheese", "aged cheese", "soft cheese", "goat cheese", "aged Manchego"],
  barbecue: ["barbecue", "bbq", "grilled meats", "beef"],
  bbq: ["barbecue", "bbq", "grilled meats", "beef"],
  fish: ["fish", "salmon", "shellfish"],
  salmon: ["salmon", "fish"],
  vegetables: ["vegetables", "grilled vegetables", "salads", "vegetarian dishes"]
};

let winemakingPromise = null;
let lastProfile = null;

function normalizeFood(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function expandedFoodTerms(query) {
  const normalized = normalizeFood(query);
  const direct = FOOD_ALIASES[normalized] || [];
  return [...new Set([normalized, ...direct].filter(Boolean))];
}

function foodScore(pairings, query) {
  const terms = expandedFoodTerms(query);
  if (!terms.length) return 0;
  const normalizedPairings = (pairings || []).map(item => ({ raw: item, normalized: normalizeFood(item) }));
  let best = 0;
  for (const pairing of normalizedPairings) {
    for (const term of terms) {
      if (pairing.normalized === term) best = Math.max(best, 100);
      else if (pairing.normalized.includes(term) || term.includes(pairing.normalized)) best = Math.max(best, 75);
      else if (pairing.normalized.split(/\W+/).some(word => word === term)) best = Math.max(best, 60);
    }
  }
  return best;
}

function allProfiles() {
  const { grapes, regions } = WineAtlas.getData();
  const profiles = [];
  for (const [regionId, region] of Object.entries(regions)) {
    for (const [grapeId, regional] of Object.entries(region.grapes || {})) {
      const grape = grapes[grapeId];
      if (grape) profiles.push({ grapeId, regionId, grape, region, regional });
    }
  }
  return profiles;
}

function rankFoodMatches(query) {
  return allProfiles()
    .map(item => ({ ...item, score: foodScore(item.regional.pairings, query) }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score || a.grape.name.localeCompare(b.grape.name) || a.region.name.localeCompare(b.region.name))
    .slice(0, 8);
}

function renderFoodMatches() {
  const input = document.getElementById("foodInput");
  const container = document.getElementById("foodResults");
  if (!input || !container) return;
  const query = input.value.trim();
  container.replaceChildren();
  if (query.length < 2) return;

  const matches = rankFoodMatches(query);
  if (!matches.length) {
    const empty = document.createElement("div");
    empty.className = "search-empty";
    empty.textContent = "No pairing matches yet. Try a broader food, such as lamb, beef, mushrooms or cheese.";
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
    button.addEventListener("click", () => {
      WineAtlas.selectProfile(item.grapeId, item.regionId, true);
      input.value = "";
      container.replaceChildren();
    });
    container.appendChild(button);
  }
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
  foodInput?.addEventListener("input", renderFoodMatches);
  foodInput?.addEventListener("keydown", handleFoodKeydown);
  foodResults?.addEventListener("keydown", handleFoodKeydown);
}

document.addEventListener("wineatlas:ready", () => {
  wireFunctionalFeatures();
  void loadWinemaking();
});

document.addEventListener("wineatlas:profile-selected", event => {
  lastProfile = event.detail.profile;
  void renderWinemaking(lastProfile);
});

document.addEventListener("wineatlas:selection-needed", () => {
  lastProfile = null;
  document.getElementById("winemaking")?.classList.add("hidden");
});
