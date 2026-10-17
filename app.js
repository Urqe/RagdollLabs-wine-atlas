/*
 * RagDollLabs Wine Atlas application logic
 * ----------------------------------------
 * Reviewer guide:
 * 1. JSON is the source of truth for wine knowledge; UI logic must not invent
 *    grape/region combinations.
 * 2. combinedProfile() guards every grape/region lookup and is reused by
 *    search, discovery, comparison and recommendations.
 * 3. Region files are merged only after a cross-file duplicate-id check.
 * 4. Browse-by-place is a second navigation path over the same data, not a
 *    second copy of state.
 * 5. Locator maps are schematic SVGs driven by coordinates in locators.json;
 *    no map tiles, third-party script or tracking service is required.
 * 6. Similar-wine recommendations are deterministic sensory-distance matches,
 *    not AI-generated claims.
 */

const METRICS = [
  ["body", "Body"], ["acidity", "Acidity"], ["tannin", "Tannin"],
  ["sweetness", "Sweetness"], ["alcohol", "Alcohol"], ["fruit", "Fruit"],
  ["oak", "Oak"], ["earth", "Earth"]
];
const COMPARE_METRICS = METRICS.filter(([key]) => !["sweetness", "alcohol"].includes(key));
const MIN_MEANINGFUL_SPREAD = 0.5;
const DISCOVERY_WEIGHT = 3;
const CLASSIC_WEIGHT = 1;

const DIFFERENCE_PHRASING = {
  body: { high: "Fuller-bodied", low: "Leaner body" },
  acidity: { high: "Higher acidity", low: "Softer acidity" },
  tannin: { high: "More tannic", low: "Smoother tannin" },
  fruit: { high: "More fruit-forward", low: "More restrained fruit" },
  oak: { high: "More oak-driven", low: "Less oak influence" },
  earth: { high: "More earthy and savoury", low: "Cleaner and less earthy" }
};

const MOODS = [
  { id: "light-elegant", label: "Light & elegant", hint: "Delicate reds and whites", test: ({ profile }) => profile.body <= 2.5 && profile.tannin <= 2.5 },
  { id: "big-ripe", label: "Big & ripe", hint: "Full, powerful and fruit-driven", test: ({ profile }) => profile.body >= 4 && profile.fruit >= 4 && profile.alcohol >= 4 },
  { id: "earthy-savory", label: "Earthy & savoury", hint: "Forest floor, truffle and game", test: ({ profile }) => profile.earth >= 4 },
  { id: "fresh-mineral", label: "Fresh & mineral", hint: "High-acid, crisp and clean", test: ({ profile }) => profile.acidity >= 4 && profile.body <= 3 },
  { id: "aromatic", label: "Aromatic", hint: "Perfumed and floral whites", test: ({ profile, grape }) => grape.color === "white" && profile.acidity >= 4 && profile.fruit >= 3 && profile.body <= 3 },
  { id: "something-unusual", label: "Something unusual", hint: "Indigenous grapes and emerging regions", test: ({ grape, region }) => Boolean(grape.indigenous) || (region.badges || []).some(tag => ["Discovery", "Emerging region"].includes(tag)) }
];

const NOTE_ICONS = {
  "Fruit": '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="14" r="5"/><circle cx="15.5" cy="10.5" r="4"/><path d="M12 5c1.5-2 4-2 5-1.5-.5 2-2.5 3-5 1.5z"/></svg>',
  "Floral": '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 4c1 2 1 4 0 5-1-1-1-3 0-5zM12 15c1 2 1 4 0 5-1-1-1-3 0-5zM4 12c2-1 4-1 5 0-1 1-3 1-5 0zM15 12c2-1 4-1 5 0-1 1-3 1-5 0z"/></svg>',
  "Spice": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/></svg>',
  "Earth / savory": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19c0-6 3-9 7-9 1 3-1 4-1 6 0 1.5 1 2.5 3 3-2 1-9 1-9 0z"/></svg>',
  "Oak / ageing": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h12v3c0 5-2 8-6 13-4-5-6-8-6-13z"/></svg>',
  "Mineral / herbal": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 20l5-9 5 9z"/></svg>'
};
const DEFAULT_NOTE_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7" fill="none" stroke-width="1.5"/></svg>';

let GRAPES = {};
let REGIONS = {};
let SOURCES = {};
let LOCATORS = {};
let lastSurprise = null;
let browseMethod = "grape";

const $ = id => document.getElementById(id);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const byName = ([, a], [, b]) => a.name.localeCompare(b.name);

async function loadData() {
  const paths = [
    "./data/grapes.json",
    "./data/regions-classics-west.json",
    "./data/regions-classics-expanded.json",
    "./data/regions-discovery.json",
    "./data/regions-discovery-expanded.json",
    "./data/sources.json",
    "./data/locators.json"
  ];
  const responses = await Promise.all(paths.map(path => fetch(path)));
  if (responses.some(response => !response.ok)) throw new Error("Wine data could not be loaded.");
  const [grapes, classicWest, classicExpanded, discovery, discoveryExpanded, sources, locators] = await Promise.all(responses.map(response => response.json()));
  const regionGroups = [classicWest, classicExpanded, discovery, discoveryExpanded];
  const seen = new Set();
  for (const group of regionGroups) {
    for (const id of Object.keys(group)) {
      if (seen.has(id)) throw new Error(`Duplicate region id across data files: ${id}`);
      seen.add(id);
    }
  }
  GRAPES = grapes;
  REGIONS = Object.assign({}, ...regionGroups);
  SOURCES = sources;
  LOCATORS = locators;
}

function relevantRegions(grapeId) {
  return Object.entries(REGIONS).filter(([, region]) => region.grapes?.[grapeId]).sort(byName);
}

function combinedProfile(grapeId, regionId) {
  const grape = GRAPES[grapeId];
  const region = REGIONS[regionId];
  const regional = region?.grapes?.[grapeId];
  if (!grape || !region || !regional) return null;
  const profile = { ...grape };
  for (const [key, modifier] of Object.entries(regional.mods || {})) {
    profile[key] = clamp((profile[key] || 0) + modifier, 0, 5);
  }
  return { grapeId, regionId, grape, region, regional, profile };
}

function allPairs() {
  const pairs = [];
  for (const [regionId, region] of Object.entries(REGIONS)) {
    for (const grapeId of Object.keys(region.grapes || {})) {
      const item = combinedProfile(grapeId, regionId);
      if (item) pairs.push(item);
    }
  }
  return pairs;
}

function optionMarkup(entries) {
  return entries.map(([id, item]) => `<option value="${id}">${item.name}</option>`).join("");
}

function populateGrapes() {
  const entries = Object.entries(GRAPES).sort(byName);
  $("grape").innerHTML = optionMarkup(entries);
  $("cg").innerHTML = optionMarkup(entries);
  $("grape").value = GRAPES["pinot-noir"] ? "pinot-noir" : entries[0]?.[0] || "";
  $("cg").value = $("grape").value;
}

function populateExploreRegions(preferredRegion = null) {
  const entries = relevantRegions($("grape").value);
  $("region").innerHTML = optionMarkup(entries);
  if (preferredRegion && entries.some(([id]) => id === preferredRegion)) $("region").value = preferredRegion;
  renderExplore();
}

/* Country -> Region -> Grape is a hierarchy over the same REGIONS object. */
function populateCountries(preferredCountry = null) {
  const countries = [...new Set(Object.values(REGIONS).map(region => region.country))].sort((a, b) => a.localeCompare(b));
  $("country").innerHTML = countries.map(country => `<option value="${country}">${country}</option>`).join("");
  if (preferredCountry && countries.includes(preferredCountry)) $("country").value = preferredCountry;
  populatePlaceRegions();
}

function populatePlaceRegions(preferredRegion = null) {
  const country = $("country").value;
  const entries = Object.entries(REGIONS).filter(([, region]) => region.country === country).sort(byName);
  $("placeRegion").innerHTML = optionMarkup(entries);
  if (preferredRegion && entries.some(([id]) => id === preferredRegion)) $("placeRegion").value = preferredRegion;
  populatePlaceGrapes();
}

function populatePlaceGrapes(preferredGrape = null) {
  const region = REGIONS[$("placeRegion").value];
  const entries = Object.keys(region?.grapes || {}).map(id => [id, GRAPES[id]]).filter(([, grape]) => grape).sort(byName);
  $("placeGrape").innerHTML = optionMarkup(entries);
  if (preferredGrape && entries.some(([id]) => id === preferredGrape)) $("placeGrape").value = preferredGrape;
}

function syncPlaceControls(grapeId, regionId) {
  const region = REGIONS[regionId];
  if (!region) return;
  populateCountries(region.country);
  populatePlaceRegions(regionId);
  populatePlaceGrapes(grapeId);
}

function setBrowseMethod(method) {
  browseMethod = method;
  const grapeMode = method === "grape";
  $("browseByGrape").classList.toggle("on", grapeMode);
  $("browseByPlace").classList.toggle("on", !grapeMode);
  $("browseByGrape").setAttribute("aria-pressed", String(grapeMode));
  $("browseByPlace").setAttribute("aria-pressed", String(!grapeMode));
  $("grapeBrowseControls").classList.toggle("hidden", !grapeMode);
  $("placeBrowseControls").classList.toggle("hidden", grapeMode);
  if (!grapeMode) syncPlaceControls($("grape").value, $("region").value);
}

function formatScore(value) { return value.toFixed(value % 1 ? 1 : 0); }
function metricBar(key, label, profile, compact = false) {
  const columns = compact ? ' style="grid-template-columns:70px 1fr 30px"' : "";
  return `<div class="bar"${columns}><div>${label}</div><div class="track" aria-hidden="true"><div class="fill" style="width:${profile[key] / 5 * 100}%"></div></div><div class="score"><span class="sr-only">${label}: </span>${formatScore(profile[key])}</div></div>`;
}

function renderFlavorGroups(noteGroups) {
  if (!noteGroups || typeof noteGroups !== "object") return "";
  return `<div class="note-groups">${Object.entries(noteGroups).map(([category, notes]) => `<section class="note-group" aria-label="${category}"><h4 class="note-group-title">${NOTE_ICONS[category] || DEFAULT_NOTE_ICON}<span>${category}</span></h4><div class="chips">${notes.map(note => `<span class="chip">${note}</span>`).join("")}</div></section>`).join("")}</div>`;
}

function renderBadges(region, grape) {
  const badges = (region.badges || []).filter(badge => badge !== "Indigenous grape");
  if (grape.indigenous) badges.push("Indigenous grape");
  if (!badges.length) return "";
  return `<div class="badges">${[...new Set(badges)].map(b => `<span class="badge">${b}</span>`).join("")}</div>`;
}

function renderIdentity(region) {
  const i = region.identity;
  if (!i) return "";
  const rows = [["Climate", i.setting], ["Terrain", i.terrain], ["Soils", i.soil], ["Influence", (i.influences || []).join(" · ")]].filter(([, v]) => v);
  return `<section class="identity" aria-labelledby="identityHeading"><h3 id="identityHeading">Regional identity</h3><dl class="identity-grid">${rows.map(([term, value]) => `<div><dt>${term}</dt><dd>${value}</dd></div>`).join("")}</dl></section>`;
}

function grapeAliases(grape) { return grape.name.toLowerCase().split("/").map(x => x.trim()).filter(Boolean); }
function whyAppliesToGrape(item, grapeId) {
  const text = `${item.cause} ${item.effect}`.toLowerCase();
  if (grapeAliases(GRAPES[grapeId]).some(alias => text.includes(alias))) return true;
  for (const [otherId, grape] of Object.entries(GRAPES)) {
    if (otherId !== grapeId && grapeAliases(grape).some(alias => text.includes(alias))) return false;
  }
  return true;
}

/* Soil affects vine conditions; wording should not imply rocks literally flavor wine. */
function cautiousWhyEffect(item) {
  const cause = item.cause.toLowerCase();
  if (/garrigue|surrounding herbs|scrub/.test(cause)) return "The wines are often described with similar herbal notes; this is a regional association, not literal flavor transfer.";
  if (/soil|slate|limestone|granite|marl|galestro|tuffeau|llicorella|chernozem|volcanic/.test(cause)) return "Affects drainage, water availability and vine growth; mineral or savory tasting notes are descriptive associations rather than material transferred from the soil.";
  return item.effect;
}

function renderWhy(region, regional, grapeId) {
  const source = Array.isArray(regional.why) && regional.why.length ? regional.why : region.why;
  if (!Array.isArray(source)) return "";
  const why = source.filter(item => whyAppliesToGrape(item, grapeId));
  if (!why.length) return "";
  return `<section class="why" aria-labelledby="whyHeading"><h3 id="whyHeading">Why does it taste like this?</h3><p class="small">Typical growing and winemaking associations; terroir affects vine conditions rather than literally adding mineral flavors.</p><ul class="why-list">${why.map(item => `<li><span class="why-cause">${item.cause}</span><span class="why-arrow" aria-hidden="true">→</span><span class="why-effect">${cautiousWhyEffect(item)}</span></li>`).join("")}</ul></section>`;
}

function renderSources(region) {
  const resolved = (region.sources || []).map(id => SOURCES[id]).filter(Boolean);
  return `<details class="sources"><summary>Sources &amp; methodology</summary><p class="small">Regional profiles summarize typical characteristics. Producers and vintages vary.</p>${resolved.length ? `<ul class="source-list">${resolved.map(s => `<li><a href="${s.url}" rel="noopener" target="_blank">${s.name}</a></li>`).join("")}</ul>` : ""}</details>`;
}

/* A small equirectangular world locator: informative, not a boundary-accurate GIS map. */
function renderLocator(regionId, region) {
  const point = LOCATORS[regionId];
  if (!point) return "";
  const width = 320, height = 160;
  const x = ((point.lon + 180) / 360) * width;
  const y = ((90 - point.lat) / 180) * height;
  return `<div class="locator" aria-label="Approximate location of ${region.name}"><svg viewBox="0 0 ${width} ${height}" role="img" aria-label="World locator map showing ${region.name} in ${region.country}"><path class="land" d="M18 36l30-20 42 3 20 20-15 22-35 7-16 28-20-7-8-27zM94 93l20 8 17 24-7 31-18-5-12-25zM151 30l42-19 52 7 34 22-7 20-29 4-12 18-24-6-14 23-30-8-4-25-23-15zM221 91l21 2 19 22-7 30-23 10-14-22zM279 119l25 4 8 16-12 13-25-8z"/><path class="gridline" d="M0 80h320M80 0v160M160 0v160M240 0v160"/><circle class="marker-ring" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="7"/><circle class="marker-core" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.5"/></svg><div class="locator-caption">${region.country} · approximate regional location</div></div>`;
}

function profileDistance(a, b) {
  let sum = 0;
  for (const [key] of METRICS) sum += Math.pow((a[key] || 0) - (b[key] || 0), 2);
  return Math.sqrt(sum);
}

function similarReason(source, candidate) {
  const close = METRICS.map(([key, label]) => ({ label, diff: Math.abs(source[key] - candidate[key]) })).sort((a, b) => a.diff - b.diff).slice(0, 3).map(x => x.label.toLowerCase());
  return `Closest on ${close.join(", ")}.`;
}

/* Similar profiles use only existing structured metrics; same-profile is excluded. */
function renderSimilar(current) {
  const candidates = allPairs().filter(item => !(item.grapeId === current.grapeId && item.regionId === current.regionId)).map(item => {
    const diversityPenalty = item.grapeId === current.grapeId ? 0.12 : 0;
    return { ...item, score: profileDistance(current.profile, item.profile) + diversityPenalty };
  }).sort((a, b) => a.score - b.score).slice(0, 3);
  $("similarWines").innerHTML = candidates.map(item => `<button type="button" class="similar-item" data-grape="${item.grapeId}" data-region="${item.regionId}"><strong>${item.grape.name}</strong><span class="similar-region">${item.region.name} · ${item.region.country}</span><span class="similar-reason">${similarReason(current.profile, item.profile)}</span></button>`).join("");
  $("similarWines").querySelectorAll(".similar-item").forEach(button => button.addEventListener("click", () => selectProfile(button.dataset.grape, button.dataset.region, true)));
}

function renderExplore() {
  const current = combinedProfile($("grape").value, $("region").value);
  if (!current) {
    $("title").textContent = "No profile available";
    ["pill", "climate", "identity", "why", "sourcesDrawer", "bars", "notes", "serve", "pair", "locatorMap", "similarWines"].forEach(id => $(id).innerHTML = "");
    $("expect").textContent = "This grape and region combination is not in the atlas yet.";
    return;
  }
  const { grapeId, regionId, grape, region, regional, profile } = current;
  $("title").textContent = `${grape.name} · ${region.name}`;
  $("pill").textContent = `${region.country} · ${region.climate}`;
  $("expect").textContent = regional.expect;
  $("climate").innerHTML = `<strong>Climate effect:</strong> ${region.summary}`;
  $("locatorMap").innerHTML = renderLocator(regionId, region);
  $("identity").innerHTML = renderBadges(region, grape) + renderIdentity(region);
  $("why").innerHTML = renderWhy(region, regional, grapeId);
  $("sourcesDrawer").innerHTML = renderSources(region);
  $("bars").innerHTML = METRICS.map(([key, label]) => metricBar(key, label, profile)).join("");
  $("notes").innerHTML = renderFlavorGroups(regional.notes);
  $("serve").innerHTML = [["Serving temp", regional.serve], ["Decant", regional.decant], ["Glass", regional.glass], ["Ageing", regional.ageing]].map(([k, v]) => `<div class="box"><div class="k">${k}</div><div class="v">${v}</div></div>`).join("");
  $("pair").innerHTML = regional.pairings.map(item => `<span class="chip">${item}</span>`).join("");
  renderSimilar(current);
  if (browseMethod === "place") syncPlaceControls(grapeId, regionId);
}

function renderBiggestDifferences(selections) {
  if (selections.length < 2) return "";
  const rows = [];
  for (const [key] of COMPARE_METRICS) {
    const sorted = selections.map(item => ({ item, value: item.profile[key] })).sort((a, b) => a.value - b.value);
    const low = sorted[0], high = sorted[sorted.length - 1], spread = high.value - low.value;
    if (spread >= MIN_MEANINGFUL_SPREAD && high.item.regionId !== low.item.regionId) rows.push({ key, spread, high, low });
  }
  rows.sort((a, b) => b.spread - a.spread);
  if (!rows.length) return "";
  return `<section class="differences" aria-labelledby="diffHeading"><h3 id="diffHeading">Biggest differences</h3>${rows.slice(0, 4).map(row => `<div class="diff-row"><span class="diff-metric">${DIFFERENCE_PHRASING[row.key].high}</span><span class="diff-text">${row.high.item.region.name} vs ${row.low.item.region.name} — ${row.high.item.region.name} trends ${DIFFERENCE_PHRASING[row.key].high.toLowerCase()}, while ${row.low.item.region.name} trends ${DIFFERENCE_PHRASING[row.key].low.toLowerCase()}.</span></div>`).join("")}</section>`;
}

function resetCompare() {
  const grapeId = $("cg").value;
  const regions = relevantRegions(grapeId);
  $("compareRegionControls").innerHTML = "";
  if (regions.length < 2) {
    $("compareHint").textContent = "More regional expressions coming soon.";
    renderCompare();
    return;
  }
  $("compareHint").textContent = "Choose two or three regional expressions to compare.";
  for (let i = 0; i < 3; i += 1) {
    const id = `compareRegion${i + 1}`;
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `<label for="${id}">Region ${i + 1}</label><select id="${id}" class="cr"><option value="">— None —</option>${optionMarkup(regions)}</select>`;
    $("compareRegionControls").appendChild(wrapper);
  }
  [...document.querySelectorAll(".cr")].forEach((select, i) => {
    if (regions[i]) select.value = regions[i][0];
    select.addEventListener("change", renderCompare);
  });
  renderCompare();
}

function renderCompare() {
  const grapeId = $("cg").value;
  const regions = relevantRegions(grapeId);
  if (regions.length < 2) {
    $("compareGrid").innerHTML = "";
    $("compareDifferences").innerHTML = "";
    $("compareMessage").textContent = "More regional expressions coming soon.";
    $("compareMessage").classList.remove("hidden");
    return;
  }
  $("compareMessage").classList.add("hidden");
  const seen = new Set();
  const selections = [...document.querySelectorAll(".cr")].map(s => s.value).filter(Boolean).filter(id => !seen.has(id) && seen.add(id)).map(regionId => combinedProfile(grapeId, regionId)).filter(Boolean);
  $("compareGrid").innerHTML = selections.map(({ grape, region, regional, profile }) => `<article class="compareCard"><h3>${region.name}</h3><div class="small">${region.country} · ${region.climate}</div>${renderBadges(region, grape)}<div class="bars compare-bars">${COMPARE_METRICS.map(([key, label]) => metricBar(key, label, profile, true)).join("")}</div><p class="small compare-summary">${regional.expect}</p><p class="small"><strong>Serve:</strong> ${regional.serve} · <strong>Decant:</strong> ${regional.decant}</p></article>`).join("") || '<p class="small">Select regions to compare.</p>';
  $("compareDifferences").innerHTML = renderBiggestDifferences(selections);
}

function isDiscoveryRegion(region) { return (region.badges || []).some(x => ["Discovery", "Emerging region"].includes(x)); }
function pickWeighted(items) {
  const weighted = items.map(item => ({ item, weight: isDiscoveryRegion(item.region) ? DISCOVERY_WEIGHT : CLASSIC_WEIGHT }));
  let ticket = Math.random() * weighted.reduce((sum, x) => sum + x.weight, 0);
  for (const entry of weighted) { ticket -= entry.weight; if (ticket <= 0) return entry.item; }
  return weighted.at(-1)?.item;
}

function surpriseMe() {
  let candidates = allPairs();
  if (lastSurprise && candidates.length > 1) candidates = candidates.filter(item => !(item.grapeId === lastSurprise.grapeId && item.regionId === lastSurprise.regionId));
  const pick = pickWeighted(candidates);
  if (!pick) return;
  lastSurprise = pick;
  selectProfile(pick.grapeId, pick.regionId, true);
}

function moodPick(mood) {
  const matches = allPairs().filter(mood.test);
  if (!matches.length) return announce("No profiles match that mood right now.");
  const pick = matches[Math.floor(Math.random() * matches.length)];
  selectProfile(pick.grapeId, pick.regionId, true);
}

function renderMoods() {
  $("moodButtons").innerHTML = MOODS.map(mood => `<button type="button" class="mood" data-mood="${mood.id}"><span class="mood-label">${mood.label}</span><span class="mood-hint">${mood.hint}</span></button>`).join("");
  $("moodButtons").querySelectorAll(".mood").forEach(button => button.addEventListener("click", () => moodPick(MOODS.find(m => m.id === button.dataset.mood))));
}

function flattenNotes(notes) { return Object.values(notes || {}).flat().join(" "); }
function searchHaystack(item) {
  return [item.grape.name, item.region.name, item.region.country, item.region.climate, item.region.summary, item.regional.expect, flattenNotes(item.regional.notes), ...(item.region.badges || [])].join(" ").toLowerCase();
}

/* Search intentionally indexes only visible/structured knowledge already in the app. */
function runSearch() {
  const query = $("searchInput").value.trim().toLowerCase();
  if (query.length < 2) { $("searchResults").innerHTML = ""; return; }
  const terms = query.split(/\s+/).filter(Boolean);
  const matches = allPairs().map(item => {
    const haystack = searchHaystack(item);
    const matched = terms.every(term => haystack.includes(term));
    let score = 0;
    if (item.grape.name.toLowerCase().includes(query)) score += 5;
    if (item.region.name.toLowerCase().includes(query)) score += 5;
    if (item.region.country.toLowerCase().includes(query)) score += 4;
    score += terms.filter(term => haystack.includes(term)).length;
    return { item, matched, score };
  }).filter(x => x.matched).sort((a, b) => b.score - a.score || a.item.region.name.localeCompare(b.item.region.name)).slice(0, 10);
  $("searchResults").innerHTML = matches.length ? matches.map(({ item }) => `<button type="button" class="search-result" role="option" data-grape="${item.grapeId}" data-region="${item.regionId}"><strong>${item.grape.name} · ${item.region.name}</strong><span>${item.region.country} · ${item.region.climate}</span></button>`).join("") : '<div class="search-empty">No matching profiles yet.</div>';
  $("searchResults").querySelectorAll(".search-result").forEach(button => button.addEventListener("click", () => {
    selectProfile(button.dataset.grape, button.dataset.region, true);
    $("searchInput").value = "";
    $("searchResults").innerHTML = "";
  }));
}

function selectProfile(grapeId, regionId, shouldAnnounce = false) {
  if (!combinedProfile(grapeId, regionId)) return false;
  setMode("explore");
  $("grape").value = grapeId;
  populateExploreRegions(regionId);
  syncPlaceControls(grapeId, regionId);
  renderExplore();
  updateUrl();
  if (shouldAnnounce) announce(`Showing ${GRAPES[grapeId].name} from ${REGIONS[regionId].name}.`);
  return true;
}

function announce(text) {
  $("liveStatus").textContent = "";
  window.setTimeout(() => { $("liveStatus").textContent = text; }, 30);
}

function applyUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const grapeId = params.get("grape");
  const regionId = params.get("region");
  if (grapeId && regionId && selectProfile(grapeId, regionId, false)) return;
  if (grapeId && GRAPES[grapeId]) {
    $("grape").value = grapeId;
    populateExploreRegions();
  }
  updateUrl();
}

function updateUrl() {
  const grapeId = $("grape").value, regionId = $("region").value;
  if (!grapeId || !regionId) return;
  const url = new URL(window.location.href);
  url.searchParams.set("grape", grapeId);
  url.searchParams.set("region", regionId);
  window.history.replaceState(null, "", url);
}

function setMode(mode) {
  const explore = mode === "explore";
  $("bExplore").classList.toggle("on", explore);
  $("bCompare").classList.toggle("on", !explore);
  $("bExplore").setAttribute("aria-pressed", String(explore));
  $("bCompare").setAttribute("aria-pressed", String(!explore));
  $("exploreControls").classList.toggle("hidden", !explore);
  $("compareControls").classList.toggle("hidden", explore);
  $("exploreView").classList.toggle("hidden", !explore);
  $("compareView").classList.toggle("hidden", explore);
  $("moodSection").classList.toggle("hidden", !explore);
  if (!explore) renderCompare();
}

function wireEvents() {
  $("grape").addEventListener("change", () => { populateExploreRegions(); syncPlaceControls($("grape").value, $("region").value); updateUrl(); });
  $("region").addEventListener("change", () => { renderExplore(); syncPlaceControls($("grape").value, $("region").value); updateUrl(); });
  $("country").addEventListener("change", () => { populatePlaceRegions(); selectProfile($("placeGrape").value, $("placeRegion").value, false); });
  $("placeRegion").addEventListener("change", () => { populatePlaceGrapes(); selectProfile($("placeGrape").value, $("placeRegion").value, false); });
  $("placeGrape").addEventListener("change", () => selectProfile($("placeGrape").value, $("placeRegion").value, false));
  $("cg").addEventListener("change", resetCompare);
  $("surprise").addEventListener("click", surpriseMe);
  $("searchInput").addEventListener("input", runSearch);
  $("browseByGrape").addEventListener("click", () => setBrowseMethod("grape"));
  $("browseByPlace").addEventListener("click", () => setBrowseMethod("place"));
  $("bExplore").addEventListener("click", () => setMode("explore"));
  $("bCompare").addEventListener("click", () => setMode("compare"));
}

async function init() {
  try {
    await loadData();
    populateGrapes();
    populateExploreRegions();
    populateCountries();
    renderMoods();
    wireEvents();
    applyUrlParams();
    resetCompare();
  } catch (error) {
    console.error(error);
    document.querySelector("main").innerHTML = `<article class="card"><h2>Wine Atlas could not load</h2><p class="small">Please refresh the page. If running locally, serve the folder through a local web server rather than opening index.html directly.</p></article>`;
  }
}

document.addEventListener("DOMContentLoaded", init);
