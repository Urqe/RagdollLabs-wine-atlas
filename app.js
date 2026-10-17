/*
 * RagDollLabs Wine Atlas application logic
 * ----------------------------------------
 * Core responsibilities live here: data loading, guarded profile lookup,
 * profile rendering, comparison, search, discovery and URL state.
 *
 * UX layers integrate through explicit `wineatlas:*` CustomEvents instead of
 * polling globals or replacing core functions. This keeps progressive
 * enhancements optional without making their failure silent or mysterious.
 */

const METRICS = [
  { key: "body", label: "Body", compare: true, high: "Fuller-bodied", low: "Leaner body" },
  { key: "acidity", label: "Acidity", compare: true, high: "Higher acidity", low: "Softer acidity" },
  { key: "tannin", label: "Tannin", compare: true, high: "More tannic", low: "Smoother tannin" },
  { key: "sweetness", label: "Sweetness", compare: false },
  { key: "alcohol", label: "Alcohol", compare: false },
  { key: "fruit", label: "Fruit", compare: true, high: "More fruit-forward", low: "More restrained fruit" },
  { key: "oak", label: "Oak", compare: true, high: "More oak-driven", low: "Less oak influence" },
  { key: "earth", label: "Earth", compare: true, high: "More earthy and savoury", low: "Cleaner and less earthy" }
];
const COMPARE_METRICS = METRICS.filter(metric => metric.compare);
const MIN_MEANINGFUL_SPREAD = 0.5;
const DISCOVERY_WEIGHT = 3;
const CLASSIC_WEIGHT = 1;
const INITIAL_ROUTE = new URL(window.location.href);

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
let WHY_RULES = {};
let PAIR_CACHE = null;
let lastSurprise = null;
let browseMethod = "grape";
let currentProfile = null;

const $ = id => document.getElementById(id);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const byName = ([, a], [, b]) => a.name.localeCompare(b.name);

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
/*
 * All current template attributes are quoted. escapeHtml already escapes both
 * quote characters plus &, < and >, so escapeAttr intentionally documents the
 * context rather than maintaining a second escaping algorithm.
 */
function escapeAttr(value) { return escapeHtml(value); }
function emit(name, detail = {}) {
  document.dispatchEvent(new CustomEvent(`wineatlas:${name}`, { detail }));
}

async function loadData() {
  const paths = [
    "./data/grapes.json",
    "./data/regions-classics-west.json",
    "./data/regions-classics-expanded.json",
    "./data/regions-discovery.json",
    "./data/regions-discovery-expanded.json",
    "./data/regions-styles.json",
    "./data/sources.json",
    "./data/locators.json",
    "./data/why-rules.json"
  ];
  const responses = await Promise.all(paths.map(path => fetch(path)));
  if (responses.some(response => !response.ok)) throw new Error("Wine data could not be loaded.");
  const [grapes, classicWest, classicExpanded, discovery, discoveryExpanded, styleRegions, sources, locators, whyRules] = await Promise.all(responses.map(response => response.json()));
  const regionGroups = [classicWest, classicExpanded, discovery, discoveryExpanded, styleRegions];
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
  WHY_RULES = whyRules;
  PAIR_CACHE = null;
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

/* Wine data is immutable after load, so profile pairs are safely memoized. */
function allPairs() {
  if (PAIR_CACHE) return PAIR_CACHE;
  const pairs = [];
  for (const [regionId, region] of Object.entries(REGIONS)) {
    for (const grapeId of Object.keys(region.grapes || {})) {
      const item = combinedProfile(grapeId, regionId);
      if (item) pairs.push(item);
    }
  }
  PAIR_CACHE = pairs;
  return PAIR_CACHE;
}

function optionMarkup(entries, includeCountry = false) {
  return entries.map(([id, item]) => {
    const label = includeCountry && item.country ? `${item.name} · ${item.country}` : item.name;
    return `<option value="${escapeAttr(id)}">${escapeHtml(label)}</option>`;
  }).join("");
}

function prependPlaceholder(select, text) {
  let option = [...select.options].find(item => item.dataset.placeholder === "true");
  if (!option) {
    option = document.createElement("option");
    option.value = "";
    option.disabled = true;
    option.dataset.placeholder = "true";
    select.prepend(option);
  }
  option.textContent = text;
  select.value = "";
}

function populateGrapes() {
  const entries = Object.entries(GRAPES).sort(byName);
  $("grape").innerHTML = optionMarkup(entries);
  $("cg").innerHTML = optionMarkup(entries);
  const initial = GRAPES["pinot-noir"] ? "pinot-noir" : entries[0]?.[0] || "";
  $("grape").value = initial;
  $("cg").value = initial;
}

function fillExploreRegions(grapeId, preferredRegion = null, withPlaceholder = false) {
  const entries = relevantRegions(grapeId);
  $("region").innerHTML = optionMarkup(entries, true);
  if (preferredRegion && entries.some(([id]) => id === preferredRegion)) {
    $("region").value = preferredRegion;
  } else if (withPlaceholder && entries.length > 1) {
    prependPlaceholder($("region"), "Choose a region…");
  } else if (entries[0]) {
    $("region").value = entries[0][0];
  }
  return entries;
}

function populateCountries(preferredCountry = null, withPlaceholder = false) {
  const countries = [...new Set(Object.values(REGIONS).map(region => region.country))].sort((a, b) => a.localeCompare(b));
  $("country").innerHTML = countries.map(country => `<option value="${escapeAttr(country)}">${escapeHtml(country)}</option>`).join("");
  if (preferredCountry && countries.includes(preferredCountry)) $("country").value = preferredCountry;
  else if (withPlaceholder) prependPlaceholder($("country"), "Choose a country…");
  else if (countries[0]) $("country").value = countries[0];
  return countries;
}

function populatePlaceRegions(preferredRegion = null, withPlaceholder = false) {
  const country = $("country").value;
  const entries = Object.entries(REGIONS).filter(([, region]) => region.country === country).sort(byName);
  $("placeRegion").innerHTML = optionMarkup(entries);
  if (preferredRegion && entries.some(([id]) => id === preferredRegion)) $("placeRegion").value = preferredRegion;
  else if (withPlaceholder && entries.length > 1) prependPlaceholder($("placeRegion"), "Choose a region…");
  else if (entries[0]) $("placeRegion").value = entries[0][0];
  return entries;
}

function populatePlaceGrapes(preferredGrape = null, withPlaceholder = false) {
  const region = REGIONS[$("placeRegion").value];
  const entries = Object.keys(region?.grapes || {}).map(id => [id, GRAPES[id]]).filter(([, grape]) => grape).sort(byName);
  $("placeGrape").innerHTML = optionMarkup(entries);
  if (preferredGrape && entries.some(([id]) => id === preferredGrape)) $("placeGrape").value = preferredGrape;
  else if (withPlaceholder && entries.length > 1) prependPlaceholder($("placeGrape"), "Choose a grape…");
  else if (entries[0]) $("placeGrape").value = entries[0][0];
  return entries;
}

function syncPlaceControls(grapeId, regionId) {
  const region = REGIONS[regionId];
  if (!region) return;
  populateCountries(region.country, false);
  populatePlaceRegions(regionId, false);
  populatePlaceGrapes(grapeId, false);
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
  if (!grapeMode && currentProfile) syncPlaceControls(currentProfile.grapeId, currentProfile.regionId);
}

function formatScore(value) { return value.toFixed(value % 1 ? 1 : 0); }
function metricBar(metric, profile, compact = false) {
  const columns = compact ? ' style="grid-template-columns:70px 1fr 30px"' : "";
  const width = clamp(profile[metric.key] / 5 * 100, 0, 100);
  return `<div class="bar"${columns}><div>${escapeHtml(metric.label)}</div><div class="track" aria-hidden="true"><div class="fill" style="width:${width}%"></div></div><div class="score"><span class="sr-only">${escapeHtml(metric.label)}: </span>${formatScore(profile[metric.key])}</div></div>`;
}

function renderFlavorGroups(noteGroups) {
  if (!noteGroups || typeof noteGroups !== "object") return "";
  return `<div class="note-groups">${Object.entries(noteGroups).map(([category, notes]) => `<section class="note-group" aria-label="${escapeAttr(category)}"><h4 class="note-group-title">${NOTE_ICONS[category] || DEFAULT_NOTE_ICON}<span>${escapeHtml(category)}</span></h4><div class="chips">${notes.map(note => `<span class="chip">${escapeHtml(note)}</span>`).join("")}</div></section>`).join("")}</div>`;
}

function renderBadges(region, grape) {
  const badges = (region.badges || []).filter(badge => badge !== "Indigenous grape");
  if (grape.indigenous) badges.push("Indigenous grape");
  if (!badges.length) return "";
  return `<div class="badges">${[...new Set(badges)].map(badge => `<span class="badge">${escapeHtml(badge)}</span>`).join("")}</div>`;
}

function renderIdentity(region) {
  const identity = region.identity;
  if (!identity) return "";
  const rows = [
    ["Climate", identity.setting],
    ["Terrain", identity.terrain],
    ["Soils", identity.soil],
    ["Influence", (identity.influences || []).join(" · ")]
  ].filter(([, value]) => value);
  return `<section class="identity" aria-labelledby="identityHeading"><h3 id="identityHeading">Regional identity</h3><dl class="identity-grid">${rows.map(([term, value]) => `<div><dt>${escapeHtml(term)}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}</dl></section>`;
}

/*
 * Why metadata is explicit. Region text is never parsed for grape names and is
 * never rewritten by regex. Optional rules can scope an item to grapes or
 * replace wording that needs a more careful scientific explanation.
 */
function renderWhy(regionId, region, regional, grapeId) {
  const hasProfileWhy = Array.isArray(regional.why) && regional.why.length;
  const source = hasProfileWhy ? regional.why : region.why;
  if (!Array.isArray(source)) return "";
  const rules = hasProfileWhy ? {} : (WHY_RULES[regionId] || {});
  const why = source.map((item, index) => {
    const rule = rules[String(index)] || {};
    if (Array.isArray(rule.grapes) && !rule.grapes.includes(grapeId)) return null;
    return {
      cause: rule.cause || item.cause,
      effect: rule.effect || item.effect
    };
  }).filter(Boolean);
  if (!why.length) return "";
  return `<section class="why" aria-labelledby="whyHeading"><h3 id="whyHeading">Why does it taste like this?</h3><p class="small">Typical growing and winemaking associations; sensory descriptors do not imply literal flavor transfer from soil or nearby plants.</p><ul class="why-list">${why.map(item => `<li><span class="why-cause">${escapeHtml(item.cause)}</span><span class="why-arrow" aria-hidden="true">→</span><span class="why-effect">${escapeHtml(item.effect)}</span></li>`).join("")}</ul></section>`;
}

function renderSources(region) {
  const resolved = (region.sources || []).map(id => SOURCES[id]).filter(Boolean);
  return `<details class="sources"><summary>Sources &amp; methodology</summary><p class="small">Regional profiles summarize typical characteristics. Producers and vintages vary.</p>${resolved.length ? `<ul class="source-list">${resolved.map(source => `<li><a href="${escapeAttr(source.url)}" rel="noopener" target="_blank">${escapeHtml(source.name)}</a></li>`).join("")}</ul>` : ""}</details>`;
}

function renderLocator(regionId, region) {
  const point = LOCATORS[regionId];
  if (!point) return "";
  const width = 320, height = 160;
  const x = ((point.lon + 180) / 360) * width;
  const y = ((90 - point.lat) / 180) * height;
  const regionName = escapeHtml(region.name);
  const country = escapeHtml(region.country);
  return `<div class="locator" aria-label="Approximate location of ${escapeAttr(region.name)}"><svg viewBox="0 0 ${width} ${height}" role="img" aria-label="World locator map showing ${escapeAttr(region.name)} in ${escapeAttr(region.country)}"><path class="land" d="M18 36l30-20 42 3 20 20-15 22-35 7-16 28-20-7-8-27zM94 93l20 8 17 24-7 31-18-5-12-25zM151 30l42-19 52 7 34 22-7 20-29 4-12 18-24-6-14 23-30-8-4-25-23-15zM221 91l21 2 19 22-7 30-23 10-14-22zM279 119l25 4 8 16-12 13-25-8z"/><path class="gridline" d="M0 80h320M80 0v160M160 0v160M240 0v160"/><circle class="marker-ring" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="7"/><circle class="marker-core" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.5"/></svg><div class="locator-caption">${country} · approximate regional location</div></div>`;
}

function wineColorDot(grape, regional = null) {
  const color = regional?.style?.color || grape?.color;
  if (!color) return "";
  return `<span class="wine-color-dot ${escapeAttr(color)}" aria-hidden="true"></span>`;
}

function profileDistance(a, b) {
  return Math.sqrt(METRICS.reduce((sum, metric) => sum + Math.pow((a[metric.key] || 0) - (b[metric.key] || 0), 2), 0));
}

function similarReason(source, candidate) {
  const close = METRICS.map(metric => ({ label: metric.label, diff: Math.abs(source[metric.key] - candidate[metric.key]) }))
    .sort((a, b) => a.diff - b.diff)
    .slice(0, 3)
    .map(item => item.label.toLowerCase());
  return `Closest on ${close.join(", ")}.`;
}

function renderSimilar(current) {
  const candidates = allPairs()
    .filter(item => !(item.grapeId === current.grapeId && item.regionId === current.regionId))
    .map(item => ({ ...item, score: profileDistance(current.profile, item.profile) + (item.grapeId === current.grapeId ? 0.12 : 0) }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);
  $("similarWines").innerHTML = candidates.map(item => `<button type="button" class="similar-item" data-grape="${escapeAttr(item.grapeId)}" data-region="${escapeAttr(item.regionId)}"><strong>${wineColorDot(item.grape, item.regional)}${escapeHtml(item.grape.name)}</strong><span class="similar-region">${escapeHtml(item.region.name)} · ${escapeHtml(item.region.country)}</span><span class="similar-reason">${escapeHtml(similarReason(current.profile, item.profile))}</span></button>`).join("");
  $("similarWines").querySelectorAll(".similar-item").forEach(button => button.addEventListener("click", () => selectProfile(button.dataset.grape, button.dataset.region, true)));
}

function renderExplore() {
  const current = combinedProfile($("grape").value, $("region").value);
  if (!current) return false;
  const { grapeId, regionId, grape, region, regional, profile } = current;
  $("title").textContent = `${grape.name} · ${region.name}`;
  $("pill").textContent = `${region.country} · ${region.climate}`;
  $("expect").textContent = regional.expect;
  $("climate").innerHTML = `<strong>Climate effect:</strong> ${escapeHtml(region.summary)}`;
  $("locatorMap").innerHTML = renderLocator(regionId, region);
  $("identity").innerHTML = renderBadges(region, grape) + renderIdentity(region);
  $("why").innerHTML = renderWhy(regionId, region, regional, grapeId);
  $("sourcesDrawer").innerHTML = renderSources(region);
  $("bars").innerHTML = METRICS.map(metric => metricBar(metric, profile)).join("");
  $("notes").innerHTML = renderFlavorGroups(regional.notes);
  $("serve").innerHTML = [["Serving temp", regional.serve], ["Decant", regional.decant], ["Glass", regional.glass], ["Ageing", regional.ageing]].map(([key, value]) => `<div class="box"><div class="k">${escapeHtml(key)}</div><div class="v">${escapeHtml(value)}</div></div>`).join("");
  $("pair").innerHTML = regional.pairings.map(item => `<span class="chip">${escapeHtml(item)}</span>`).join("");
  renderSimilar(current);
  return true;
}

function renderBiggestDifferences(selections) {
  if (selections.length < 2) return "";
  const rows = [];
  for (const metric of COMPARE_METRICS) {
    const sorted = selections.map(item => ({ item, value: item.profile[metric.key] })).sort((a, b) => a.value - b.value);
    const low = sorted[0], high = sorted[sorted.length - 1];
    const spread = high.value - low.value;
    if (spread >= MIN_MEANINGFUL_SPREAD && high.item.regionId !== low.item.regionId) rows.push({ metric, spread, high, low });
  }
  rows.sort((a, b) => b.spread - a.spread);
  if (!rows.length) return "";
  return `<section class="differences" aria-labelledby="diffHeading"><h3 id="diffHeading">Biggest differences</h3>${rows.slice(0, 4).map(row => `<div class="diff-row"><span class="diff-metric">${escapeHtml(row.metric.high)}</span><span class="diff-text">${escapeHtml(row.high.item.region.name)} vs ${escapeHtml(row.low.item.region.name)} — ${escapeHtml(row.high.item.region.name)} trends ${escapeHtml(row.metric.high.toLowerCase())}, while ${escapeHtml(row.low.item.region.name)} trends ${escapeHtml(row.metric.low.toLowerCase())}.</span></div>`).join("")}</section>`;
}

function resetCompare() {
  const grapeId = $("cg").value;
  const regions = relevantRegions(grapeId);
  $("compareRegionControls").innerHTML = "";
  if (!grapeId) {
    $("compareHint").textContent = "Choose a grape to compare regional expressions.";
    renderCompare();
    emit("compare-controls", { grapeId, regions });
    return;
  }
  if (regions.length < 2) {
    $("compareHint").textContent = "More regional expressions coming soon.";
    renderCompare();
    emit("compare-controls", { grapeId, regions });
    return;
  }
  $("compareHint").textContent = "Choose two or three regional expressions to compare.";
  for (let index = 0; index < 3; index += 1) {
    const id = `compareRegion${index + 1}`;
    const wrapper = document.createElement("div");
    wrapper.className = "compare-region-field";
    wrapper.innerHTML = `<label for="${id}">Region ${index + 1}</label><select id="${id}" class="cr"><option value="">— None —</option>${optionMarkup(regions, true)}</select>`;
    $("compareRegionControls").appendChild(wrapper);
    const select = wrapper.querySelector("select");
    if (regions[index]) select.value = regions[index][0];
    select.addEventListener("change", renderCompare);
  }
  renderCompare();
  emit("compare-controls", { grapeId, regions });
}

function collectCompareSelections(grapeId) {
  const seen = new Set();
  const selections = [];
  let duplicateCount = 0;
  for (const select of document.querySelectorAll(".cr")) {
    const regionId = select.value;
    if (!regionId) continue;
    if (seen.has(regionId)) {
      duplicateCount += 1;
      continue;
    }
    seen.add(regionId);
    const profile = combinedProfile(grapeId, regionId);
    if (profile) selections.push(profile);
  }
  return { selections, duplicateCount };
}

function renderCompare() {
  const grapeId = $("cg").value;
  const regions = relevantRegions(grapeId);
  if (!grapeId) {
    $("compareGrid").innerHTML = "";
    $("compareDifferences").innerHTML = "";
    $("compareMessage").textContent = "Choose a grape to compare regional expressions.";
    $("compareMessage").classList.remove("hidden");
    return;
  }
  if (regions.length < 2) {
    $("compareGrid").innerHTML = "";
    $("compareDifferences").innerHTML = "";
    $("compareMessage").textContent = "More regional expressions coming soon.";
    $("compareMessage").classList.remove("hidden");
    return;
  }
  $("compareMessage").classList.add("hidden");
  const { selections, duplicateCount } = collectCompareSelections(grapeId);
  $("compareHint").textContent = duplicateCount
    ? "Each region can only be compared once; duplicate selections are ignored."
    : "Choose two or three regional expressions to compare.";
  $("compareGrid").innerHTML = selections.map(({ grape, region, regional, profile }) => `<article class="compareCard"><h3>${escapeHtml(region.name)}</h3><div class="small">${escapeHtml(region.country)} · ${escapeHtml(region.climate)}</div>${renderBadges(region, grape)}<div class="bars compare-bars">${COMPARE_METRICS.map(metric => metricBar(metric, profile, true)).join("")}</div><p class="small compare-summary">${escapeHtml(regional.expect)}</p><p class="small"><strong>Serve:</strong> ${escapeHtml(regional.serve)} · <strong>Decant:</strong> ${escapeHtml(regional.decant)}</p></article>`).join("") || '<p class="small">Select regions to compare.</p>';
  $("compareDifferences").innerHTML = renderBiggestDifferences(selections);
}

function isDiscoveryRegion(region) { return (region.badges || []).some(tag => ["Discovery", "Emerging region"].includes(tag)); }
function pickWeighted(items) {
  const weighted = items.map(item => ({ item, weight: isDiscoveryRegion(item.region) ? DISCOVERY_WEIGHT : CLASSIC_WEIGHT }));
  let ticket = Math.random() * weighted.reduce((sum, entry) => sum + entry.weight, 0);
  for (const entry of weighted) {
    ticket -= entry.weight;
    if (ticket <= 0) return entry.item;
  }
  return weighted.length ? weighted[weighted.length - 1].item : null;
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
  $("moodButtons").innerHTML = MOODS.map(mood => `<button type="button" class="mood" data-mood="${escapeAttr(mood.id)}"><span class="mood-label">${escapeHtml(mood.label)}</span><span class="mood-hint">${escapeHtml(mood.hint)}</span></button>`).join("");
  $("moodButtons").querySelectorAll(".mood").forEach(button => button.addEventListener("click", () => {
    const mood = MOODS.find(item => item.id === button.dataset.mood);
    if (mood) moodPick(mood);
  }));
}

function flattenNotes(notes) { return Object.values(notes || {}).flat().join(" "); }
function searchHaystack(item) {
  return [item.grape.name, item.region.name, item.region.country, item.region.climate, item.region.summary, item.regional.expect, flattenNotes(item.regional.notes), ...(item.region.badges || [])].join(" ").toLowerCase();
}

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
  }).filter(result => result.matched).sort((a, b) => b.score - a.score || a.item.region.name.localeCompare(b.item.region.name)).slice(0, 10);
  $("searchResults").innerHTML = matches.length ? matches.map(({ item }) => `<button type="button" class="search-result" data-grape="${escapeAttr(item.grapeId)}" data-region="${escapeAttr(item.regionId)}"><strong>${wineColorDot(item.grape, item.regional)}${escapeHtml(item.grape.name)} · ${escapeHtml(item.region.name)}</strong><span>${escapeHtml(item.region.country)} · ${escapeHtml(item.region.climate)}</span></button>`).join("") : '<div class="search-empty">No matching profiles yet.</div>';
  $("searchResults").querySelectorAll(".search-result").forEach(button => button.addEventListener("click", () => {
    selectProfile(button.dataset.grape, button.dataset.region, true);
    $("searchInput").value = "";
    $("searchResults").innerHTML = "";
  }));
}

function updateUrl(grapeId, regionId) {
  if (!grapeId || !regionId) return;
  const url = new URL(window.location.href);
  url.searchParams.set("grape", grapeId);
  url.searchParams.set("region", regionId);
  window.history.replaceState(null, "", url);
}
function clearProfileUrl() {
  const url = new URL(window.location.href);
  url.searchParams.delete("grape");
  url.searchParams.delete("region");
  window.history.replaceState(null, "", url);
}

function selectProfile(grapeId, regionId, shouldAnnounce = false) {
  const profile = combinedProfile(grapeId, regionId);
  if (!profile) return false;
  setMode("explore");
  $("grape").value = grapeId;
  fillExploreRegions(grapeId, regionId, false);
  syncPlaceControls(grapeId, regionId);
  renderExplore();
  currentProfile = profile;
  updateUrl(grapeId, regionId);
  emit("profile-selected", { profile });
  if (shouldAnnounce) announce(`Showing ${profile.grape.name} from ${profile.region.name}.`);
  return true;
}

function announce(text) {
  $("liveStatus").textContent = "";
  window.setTimeout(() => { $("liveStatus").textContent = text; }, 30);
}

function applyInitialRoute() {
  const grapeId = INITIAL_ROUTE.searchParams.get("grape");
  const regionId = INITIAL_ROUTE.searchParams.get("region");
  return Boolean(grapeId && regionId && selectProfile(grapeId, regionId, false));
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
  emit("mode-changed", { mode, hasProfile: Boolean(currentProfile) });
}

function clearCurrentProfile() {
  currentProfile = null;
  clearProfileUrl();
}

function begin(action) {
  if (action === "surprise") return surpriseMe();
  clearCurrentProfile();

  if (action === "compare") {
    setMode("compare");
    prependPlaceholder($("cg"), "Choose a grape…");
    resetCompare();
    return;
  }

  setMode("explore");
  if (action === "place") {
    setBrowseMethod("place");
    populateCountries(null, true);
    $("placeRegion").innerHTML = '<option value="" disabled selected>Choose a country first…</option>';
    $("placeGrape").innerHTML = '<option value="" disabled selected>Choose a region first…</option>';
    emit("selection-needed", { title: "Explore by place", text: "Choose a country, then a region and grape to open a profile.", focus: "country" });
    return;
  }
  if (action === "search") {
    emit("selection-needed", { title: "Search the atlas", text: "Search for a grape, region, country or style, then choose a result.", focus: "searchInput" });
    return;
  }

  setBrowseMethod("grape");
  prependPlaceholder($("grape"), "Choose a grape…");
  $("region").innerHTML = '<option value="" disabled selected>Choose a grape first…</option>';
  emit("selection-needed", { title: "Start with a grape", text: "Choose a grape. If it has one regional expression, Wine Atlas will open it automatically.", focus: "grape" });
}

function handleGrapeChange() {
  const grapeId = $("grape").value;
  const regions = fillExploreRegions(grapeId, null, true);
  if (regions.length === 1) {
    selectProfile(grapeId, regions[0][0], false);
  } else if (regions.length > 1) {
    clearCurrentProfile();
    emit("selection-needed", { title: "Choose a region", text: "Now choose the regional expression you want to explore.", focus: "region" });
  } else {
    clearCurrentProfile();
    emit("selection-needed", { title: "No regional expression yet", text: "This grape is not currently mapped to a region in the atlas." });
  }
}

function handleCountryChange() {
  const regions = populatePlaceRegions(null, true);
  if (regions.length === 1) {
    $("placeRegion").value = regions[0][0];
    handlePlaceRegionChange();
  } else {
    $("placeGrape").innerHTML = '<option value="" disabled selected>Choose a region first…</option>';
    clearCurrentProfile();
    emit("selection-needed", { title: "Choose a region", text: "Choose a wine region within that country.", focus: "placeRegion" });
  }
}

function handlePlaceRegionChange() {
  const grapes = populatePlaceGrapes(null, true);
  if (grapes.length === 1) {
    $("placeGrape").value = grapes[0][0];
    selectProfile(grapes[0][0], $("placeRegion").value, false);
  } else {
    clearCurrentProfile();
    emit("selection-needed", { title: "Choose a grape", text: "Choose one of the grapes represented in this region.", focus: "placeGrape" });
  }
}

function wireEvents() {
  $("grape").addEventListener("change", handleGrapeChange);
  $("region").addEventListener("change", () => selectProfile($("grape").value, $("region").value, false));
  $("country").addEventListener("change", handleCountryChange);
  $("placeRegion").addEventListener("change", handlePlaceRegionChange);
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
    fillExploreRegions($("grape").value, null, false);
    populateCountries(null, false);
    populatePlaceRegions(null, false);
    populatePlaceGrapes(null, false);
    renderMoods();
    wireEvents();
    const sharedProfile = applyInitialRoute();
    if (!sharedProfile) renderExplore();
    resetCompare();
    window.WineAtlas.ready = true;
    emit("ready", { sharedProfile, initialRoute: new URL(INITIAL_ROUTE.href) });
  } catch (error) {
    console.error(error);
    document.querySelector("main").innerHTML = `<article class="card"><h2>Wine Atlas could not load</h2><p class="small">Please refresh the page. If running locally, serve the folder through a local web server rather than opening index.html directly.</p></article>`;
    emit("error", { error });
  }
}

/*
 * Public API contract for optional feature modules. Profile computation belongs
 * here and nowhere else. allPairs() returns a shallow copy so consumers may sort
 * or filter without mutating the memoized core cache.
 */
window.WineAtlas = {
  ready: false,
  begin,
  selectProfile,
  setMode,
  setBrowseMethod,
  resetCompare,
  clearProfileUrl,
  combinedProfile,
  allPairs: () => allPairs().slice(),
  hasActiveProfile: () => Boolean(currentProfile),
  getData: () => ({ grapes: GRAPES, regions: REGIONS }),
  escapeHtml,
  escapeAttr
};

document.addEventListener("DOMContentLoaded", init);
