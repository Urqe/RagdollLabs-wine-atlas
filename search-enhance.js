/*
 * Unified, accent-insensitive Atlas search
 * ----------------------------------------
 * One Explore search handles grapes, places, styles and food. When a query
 * resolves through the validated food-alias vocabulary, pairing relevance gets
 * an explicit ranking boost instead of requiring a second food-only input.
 */

let atlasFoodAliasesPromise = null;
let atlasFoodAliases = {};

function atlasNormalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function atlasFlattenNotes(notes) {
  return Object.values(notes || {}).flat().join(" ");
}

function atlasLoadFoodAliases() {
  if (!atlasFoodAliasesPromise) {
    atlasFoodAliasesPromise = fetch("./data/food-aliases.json")
      .then(response => response.ok ? response.json() : {})
      .then(data => (atlasFoodAliases = data))
      .catch(error => {
        console.warn("Food aliases unavailable; Atlas search will still match direct pairing text.", error);
        atlasFoodAliases = {};
        return {};
      });
  }
  return atlasFoodAliasesPromise;
}

function atlasExpandedFoodTerms(query) {
  const normalized = atlasNormalize(query);
  return [...new Set([normalized, ...(atlasFoodAliases[normalized] || []).map(atlasNormalize)].filter(Boolean))];
}

function atlasPairingScore(pairings, query) {
  const terms = atlasExpandedFoodTerms(query);
  if (!terms.length) return 0;
  let best = 0;
  for (const pairing of pairings || []) {
    const normalized = atlasNormalize(pairing);
    for (const term of terms) {
      if (normalized === term) best = Math.max(best, 100);
      else if (normalized.includes(term) || term.includes(normalized)) best = Math.max(best, 75);
    }
  }
  return best;
}

function atlasSearchProfiles() {
  const { grapes, regions } = WineAtlas.getData();
  const profiles = [];
  for (const [regionId, region] of Object.entries(regions)) {
    for (const [grapeId, regional] of Object.entries(region.grapes || {})) {
      const grape = grapes[grapeId];
      if (!grape) continue;
      profiles.push({ grapeId, regionId, grape, region, regional });
    }
  }
  return profiles;
}

function atlasEnhancedHaystack(item) {
  const style = item.regional.style || {};
  return atlasNormalize([
    item.grape.name, item.region.name, item.region.country, item.region.climate,
    item.region.summary, item.regional.expect, atlasFlattenNotes(item.regional.notes),
    ...(item.regional.pairings || []), ...(item.region.badges || []),
    style.family, style.color, style.sweetness, style.label, style.method, style.effect
  ].filter(Boolean).join(" "));
}

async function renderEnhancedAtlasSearch() {
  const input = document.getElementById("searchInput");
  const container = document.getElementById("searchResults");
  if (!input || !container) return;
  const rawQuery = input.value.trim();
  const query = atlasNormalize(rawQuery);
  container.replaceChildren();
  if (query.length < 2) return;

  await atlasLoadFoodAliases();
  if (input.value.trim() !== rawQuery) return;

  const terms = query.split(/\s+/).filter(Boolean);
  const aliasKnown = Boolean(atlasFoodAliases[query]);
  const matches = atlasSearchProfiles().map(item => {
    const haystack = atlasEnhancedHaystack(item);
    const pairingScore = atlasPairingScore(item.regional.pairings, rawQuery);
    const matched = terms.every(term => haystack.includes(term)) || pairingScore > 0;
    let score = pairingScore;
    const grape = atlasNormalize(item.grape.name);
    const region = atlasNormalize(item.region.name);
    const country = atlasNormalize(item.region.country);
    if (grape.includes(query)) score += 60;
    if (region.includes(query)) score += 60;
    if (country.includes(query)) score += 50;
    score += terms.filter(term => haystack.includes(term)).length * 5;
    return { item, matched, score, pairingScore };
  }).filter(result => result.matched)
    .sort((a, b) => b.score - a.score || a.item.region.name.localeCompare(b.item.region.name))
    .slice(0, 10);

  if (!matches.length) {
    const empty = document.createElement("div");
    empty.className = "search-empty";
    empty.textContent = "No matching profiles yet.";
    container.appendChild(empty);
    return;
  }

  if (aliasKnown || matches[0]?.pairingScore > 0) {
    const label = document.createElement("div");
    label.className = "search-empty";
    label.textContent = `Best pairing matches for “${rawQuery}”`;
    container.appendChild(label);
  }

  for (const { item, pairingScore } of matches) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "search-result";
    button.dataset.grape = item.grapeId;
    button.dataset.region = item.regionId;
    const title = document.createElement("strong");
    const dot = document.createElement("span");
    const displayColor = item.regional.style?.color || item.grape.color;
    dot.className = `wine-color-dot ${displayColor}`;
    dot.setAttribute("aria-hidden", "true");
    title.append(dot, document.createTextNode(`${item.grape.name} · ${item.region.name}`));
    const meta = document.createElement("span");
    const styleLabel = item.regional.style?.label ? ` · ${item.regional.style.label}` : "";
    meta.textContent = pairingScore > 0
      ? `${item.region.country} · pairs with ${item.regional.pairings.join(" · ")}`
      : `${item.region.country} · ${item.region.climate}${styleLabel}`;
    button.append(title, meta);
    button.addEventListener("click", () => {
      WineAtlas.selectProfile(item.grapeId, item.regionId, true);
      input.value = "";
      container.replaceChildren();
    });
    container.appendChild(button);
  }
}

document.addEventListener("wineatlas:ready", () => {
  void atlasLoadFoodAliases();
  document.getElementById("searchInput")?.addEventListener("input", () => { void renderEnhancedAtlasSearch(); });
});
