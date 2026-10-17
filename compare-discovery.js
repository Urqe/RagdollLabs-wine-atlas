/*
 * RagDollLabs Wine Atlas — Compare discovery
 * ------------------------------------------
 * Compare is its own workspace. Explore-only search/navigation is hidden while
 * Compare is active, and this module turns search terms (including foods) into
 * candidates that fill the Advanced Compare slots instead of navigating away.
 *
 * Compatibility itself remains owned by advanced-compare.js. This companion is
 * deliberately loaded after it and reuses its comparison functions rather than
 * copying the family/color compatibility rules into a second module.
 */

let compareDiscoveryMatches = [];

function compareNormalize(value) { return FoodDiscovery.normalize(value); }

function compareFlattenNotes(notes) {
  return Object.values(notes || {}).flat().join(" ");
}

function compareProfileKey(item) {
  return `${item.grapeId}::${item.regionId}`;
}

function compareAdvancedReady() {
  return typeof window.advancedCompatible === "function" &&
    document.getElementById("advancedCompare1");
}

function compareCurrentProfiles() {
  if (!compareAdvancedReady()) return [];
  return [1, 2, 3].map(index => {
    const key = document.getElementById(`advancedCompare${index}`)?.value;
    if (!key) return null;
    const [grapeId, regionId] = key.split("::");
    return WineAtlas.combinedProfile(grapeId, regionId);
  }).filter(Boolean);
}

function compareSetProfiles(profiles) {
  if (!compareAdvancedReady()) return;
  const selected = profiles.filter(Boolean).slice(0, 3);
  const first = document.getElementById("advancedCompare1");
  const second = document.getElementById("advancedCompare2");
  const third = document.getElementById("advancedCompare3");
  if (!first || !second || !third) return;

  first.value = selected[0] ? compareProfileKey(selected[0]) : "";
  first.dispatchEvent(new Event("change", { bubbles: true }));

  const secondKey = selected[1] ? compareProfileKey(selected[1]) : "";
  if (secondKey && [...second.options].some(option => option.value === secondKey)) {
    second.value = secondKey;
    second.dispatchEvent(new Event("change", { bubbles: true }));
  }

  const thirdKey = selected[2] ? compareProfileKey(selected[2]) : "";
  if (thirdKey && [...third.options].some(option => option.value === thirdKey)) {
    third.value = thirdKey;
    third.dispatchEvent(new Event("change", { bubbles: true }));
  }
}

function compareHaystack(item) {
  const style = item.regional.style || {};
  return compareNormalize([
    item.grape.name,
    item.region.name,
    item.region.country,
    item.region.climate,
    item.region.summary,
    item.regional.expect,
    compareFlattenNotes(item.regional.notes),
    ...(item.regional.pairings || []),
    ...(item.region.badges || []),
    style.family,
    style.color,
    style.sweetness,
    style.label,
    style.method,
    style.effect
  ].filter(Boolean).join(" "));
}

function compareProfileLabel(item) {
  const style = item.regional.style?.label;
  return `${item.grape.name} · ${item.region.name}${style ? ` · ${style}` : ""}`;
}

async function rankCompareMatches(rawQuery) {
  const query = compareNormalize(rawQuery);
  if (query.length < 2) return [];
  await FoodDiscovery.load();
  const terms = query.split(/\s+/).filter(Boolean);

  return WineAtlas.allPairs().map(item => {
    const haystack = compareHaystack(item);
    const grape = compareNormalize(item.grape.name);
    const region = compareNormalize(item.region.name);
    const country = compareNormalize(item.region.country);
    const style = compareNormalize([
      item.regional.style?.family,
      item.regional.style?.color,
      item.regional.style?.label,
      item.regional.style?.method
    ].filter(Boolean).join(" "));
    const pairingScore = FoodDiscovery.score(item.regional.pairings, query);
    const termMatch = terms.every(term => haystack.includes(term));
    const matched = pairingScore > 0 || termMatch;
    let score = pairingScore;
    if (grape.includes(query)) score += 10;
    if (region.includes(query)) score += 9;
    if (style.includes(query)) score += 8;
    if (country.includes(query)) score += 6;
    if (!FoodDiscovery.known(query)) score += terms.filter(term => haystack.includes(term)).length;
    return { item, matched, score, pairingMatch: pairingScore > 0 };
  }).filter(result => result.matched)
    .sort((a, b) => b.score - a.score || a.item.region.name.localeCompare(b.item.region.name))
    .slice(0, 12);
}

function compareCanAdd(item) {
  if (!compareAdvancedReady()) return { allowed: false, reason: "Compare is still loading" };
  const current = compareCurrentProfiles();
  const key = compareProfileKey(item);
  if (current.some(profile => compareProfileKey(profile) === key)) return { allowed: false, reason: "Added" };
  if (current.length >= 3) return { allowed: false, reason: "Comparison full" };
  if (current[0] && !window.advancedCompatible(current[0], item)) return { allowed: false, reason: "Different comparison style" };
  return { allowed: true, reason: "Add" };
}

function compareRenderResults() {
  const container = document.getElementById("compareDiscoveryResults");
  const topButton = document.getElementById("compareTopMatches");
  if (!container || !topButton) return;
  container.replaceChildren();

  if (!compareDiscoveryMatches.length) {
    topButton.classList.add("hidden");
    return;
  }

  FoodDiscovery.appendGuidance(container, document.getElementById("compareDiscoveryInput")?.value);

  for (const result of compareDiscoveryMatches) {
    const { item, pairingMatch } = result;
    const state = compareCanAdd(item);
    const row = document.createElement("div");
    row.className = "compare-discovery-result";
    const copy = document.createElement("div");
    const strong = document.createElement("strong");
    strong.textContent = compareProfileLabel(item);
    const meta = document.createElement("span");
    meta.textContent = `${item.region.country}${pairingMatch ? " · pairing match" : ""}`;
    copy.append(strong, meta);
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = state.reason;
    button.disabled = !state.allowed;
    button.dataset.profileKey = compareProfileKey(item);
    row.append(copy, button);
    container.appendChild(row);
  }

  const best = compareDiscoveryMatches[0]?.item;
  const compatibleCount = best && compareAdvancedReady()
    ? compareDiscoveryMatches.filter(result => window.advancedCompatible(best, result.item)).length
    : 0;
  topButton.classList.toggle("hidden", compatibleCount < 2);
  topButton.disabled = compatibleCount < 2;
}

async function compareRunDiscovery() {
  const input = document.getElementById("compareDiscoveryInput");
  const container = document.getElementById("compareDiscoveryResults");
  if (!input || !container) return;
  const query = input.value.trim();
  if (compareNormalize(query).length < 2) {
    compareDiscoveryMatches = [];
    container.replaceChildren();
    document.getElementById("compareTopMatches")?.classList.add("hidden");
    return;
  }
  const matches = await rankCompareMatches(query);
  if (input.value.trim() !== query) return;
  compareDiscoveryMatches = matches;
  compareRenderResults();
  if (!compareDiscoveryMatches.length) {
    const empty = document.createElement("div");
    empty.className = "compare-discovery-empty";
    empty.textContent = "No comparison candidates found.";
    container.appendChild(empty);
  }
}

function compareAddProfile(item) {
  if (!compareCanAdd(item).allowed) return;
  compareSetProfiles([...compareCurrentProfiles(), item]);
  compareRenderResults();
}

function compareFillTopMatches() {
  if (!compareAdvancedReady() || !compareDiscoveryMatches.length) return;
  const first = compareDiscoveryMatches[0].item;
  const compatible = compareDiscoveryMatches
    .map(result => result.item)
    .filter(item => window.advancedCompatible(first, item))
    .slice(0, 3);
  if (compatible.length < 2) return;
  compareSetProfiles(compatible);
  compareRenderResults();
}

function compareDiscoveryClick(event) {
  const add = event.target.closest?.("button[data-profile-key]");
  if (add) {
    const result = compareDiscoveryMatches.find(entry => compareProfileKey(entry.item) === add.dataset.profileKey);
    if (result) compareAddProfile(result.item);
    return;
  }
  if (event.target.closest?.("#compareTopMatches")) compareFillTopMatches();
}

function injectCompareDiscovery() {
  const controls = document.getElementById("advancedCompareControls");
  if (!controls || document.getElementById("compareDiscovery")) return;
  const panel = document.createElement("section");
  panel.id = "compareDiscovery";
  panel.className = "compare-discovery";
  panel.innerHTML = `
    <h3>Find wines to compare</h3>
    <p class="small">Search by grape, place, style or food. Add candidates individually, or let Wine Atlas build a compatible comparison from the best matches.</p>
    <label for="compareDiscoveryInput">Search comparison candidates</label>
    <input id="compareDiscoveryInput" type="search" autocomplete="off" placeholder="Try ‘lamb’, ‘sparkling’, ‘rosé’ or ‘Cabernet’" aria-controls="compareDiscoveryResults">
    <div id="compareDiscoveryResults" class="compare-discovery-results" aria-label="Comparison search results"></div>
    <button id="compareTopMatches" class="compare-top-matches hidden" type="button">Compare top 3 compatible matches</button>`;
  controls.prepend(panel);
  document.getElementById("compareDiscoveryInput")?.addEventListener("input", compareRunDiscovery);
  panel.addEventListener("click", compareDiscoveryClick);
}

function setCompareWorkspaceMode(mode) {
  const comparing = mode === "compare";
  document.getElementById("searchSection")?.classList.toggle("hidden", comparing);
  if (!comparing) {
    const input = document.getElementById("compareDiscoveryInput");
    if (input) input.value = "";
    compareDiscoveryMatches = [];
    document.getElementById("compareDiscoveryResults")?.replaceChildren();
  }
}

document.addEventListener("wineatlas:ready", () => {
  injectCompareDiscovery();
});

document.addEventListener("wineatlas:mode-changed", event => {
  setCompareWorkspaceMode(event.detail.mode);
  if (event.detail.mode === "compare") {
    injectCompareDiscovery();
    document.getElementById("compareDiscoveryInput")?.focus();
  }
});
