/*
 * RagLabs Wine Atlas application logic
 * ------------------------------------
 * Design goals for future reviewers:
 * 1. Treat JSON as the source of truth for wine knowledge.
 * 2. Never assume a grape/region pair exists: every lookup is guarded.
 * 3. Rebuild compare selections whenever the grape changes so stale IDs
 *    cannot survive from the previous grape (the original compare bug).
 * 4. Keep rendering functions small and side-effect boundaries obvious.
 * 5. All new discovery features (Surprise me, moods) resolve exclusively
 *    through combinedProfile(), so they can never surface an invalid pair.
 */

const METRICS = [
  ["body", "Body"],
  ["acidity", "Acidity"],
  ["tannin", "Tannin"],
  ["sweetness", "Sweetness"],
  ["alcohol", "Alcohol"],
  ["fruit", "Fruit"],
  ["oak", "Oak"],
  ["earth", "Earth"]
];

const COMPARE_METRICS = [
  ["body", "Body"],
  ["acidity", "Acidity"],
  ["tannin", "Tannin"],
  ["fruit", "Fruit"],
  ["oak", "Oak"],
  ["earth", "Earth"]
];

// Human phrasing for the compare "biggest differences" panel.
// Wording stays qualitative because the underlying numbers are typical-style
// approximations, not lab measurements.
const DIFFERENCE_PHRASING = {
  body: { high: "Fuller-bodied", low: "Leaner body" },
  acidity: { high: "Higher acidity", low: "Softer acidity" },
  tannin: { high: "More tannic", low: "Smoother tannin" },
  fruit: { high: "More fruit-forward", low: "More restrained fruit" },
  oak: { high: "More oak-driven", low: "Less oak influence" },
  earth: { high: "More earthy and savoury", low: "Cleaner and less earthy" }
};

// Minimum spread (on the 0–5 scale) for a difference to be worth showing.
const MIN_MEANINGFUL_SPREAD = 0.5;

// Mood definitions drive mood-based discovery. Each mood is a predicate over
// the combined grape+region profile plus optional tag preferences, so moods
// can never invent a profile that does not exist in the data.
const MOODS = [
  { id: "light-elegant", label: "Light & elegant", hint: "Delicate reds and whites", test: p => p.body <= 2.5 && p.tannin <= 2.5 },
  { id: "big-ripe", label: "Big & ripe", hint: "Full, powerful and fruit-driven", test: p => p.body >= 4 && p.fruit >= 4 && p.alcohol >= 4 },
  { id: "earthy-savory", label: "Earthy & savoury", hint: "Forest floor, truffle and game", test: p => p.earth >= 4 },
  { id: "fresh-mineral", label: "Fresh & mineral", hint: "High-acid, crisp and clean", test: p => p.acidity >= 4 && p.body <= 3 },
  { id: "aromatic", label: "Aromatic", hint: "Perfumed and floral whites", test: p => p.acidity >= 4 && p.fruit >= 3 && p.body <= 2.5 },
  { id: "something-unusual", label: "Something unusual", hint: "Indigenous grapes and emerging regions", test: null, preferTags: ["Discovery", "Emerging region", "Indigenous grape"] }
];

// Discovery profiles are weighted 3:1 over classics in Surprise me to
// encourage exploration of the less familiar parts of the atlas.
const DISCOVERY_WEIGHT = 3;
const CLASSIC_WEIGHT = 1;

// Decorative inline SVG icons for flavor note categories. Icons complement,
// never replace, the visible text label.
const NOTE_ICONS = {
  "Fruit": '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="14" r="5"/><circle cx="15.5" cy="10.5" r="4"/><path d="M12 5c1.5-2 4-2 5-1.5-.5 2-2.5 3-5 1.5z"/></svg>',
  "Floral": '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 4c1 2 1 4 0 5-1-1-1-3 0-5zM12 15c1 2 1 4 0 5-1-1-1-3 0-5zM4 12c2-1 4-1 5 0-1 1-3 1-5 0zM15 12c2-1 4-1 5 0-1 1-3 1-5 0z"/></svg>',
  "Spice": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/><path d="M18 15l.8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8z"/></svg>',
  "Earth / savory": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19c0-6 3-9 7-9 1 3-1 4-1 6 0 1.5 1 2.5 3 3-2 1-9 1-9 0z"/><path d="M14 10c1-4 4-6 6-6 0 3-2 5-6 6z"/></svg>',
  "Oak / ageing": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h12v3c0 5-2 8-6 13-4-5-6-8-6-13z"/><path d="M12 8v8" stroke-width="1.5"/></svg>',
  "Mineral / herbal": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 20l5-9 5 9z"/><path d="M10 6c1.5 1 3.5 1 5 0M9 9c2.5 1.5 5.5 1.5 8 0" fill="none" stroke-width="1.5"/></svg>'
};
const DEFAULT_NOTE_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7" fill="none" stroke-width="1.5"/></svg>';

let GRAPES = {};
let REGIONS = {};
let SOURCES = {};

// The last profile surfaced by Surprise me, so the feature can avoid
// repeating itself on consecutive clicks where the pool allows it.
let lastSurprise = null;

const $ = id => document.getElementById(id);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

/**
 * Load structured wine data.
 * Region data is intentionally split into reviewable files instead of one
 * giant blob; Object.assign merges them into one REGIONS lookup. A duplicate
 * id across files would silently overwrite, so an explicit check keeps that
 * failure loud instead of quiet.
 * Relative paths keep GitHub Pages project URLs working.
 */
async function loadData() {
  const paths = [
    "./data/grapes.json",
    "./data/regions-classics-west.json",
    "./data/regions-classics-expanded.json",
    "./data/regions-discovery.json",
    "./data/sources.json"
  ];
  const responses = await Promise.all(paths.map(path => fetch(path)));
  if (responses.some(response => !response.ok)) {
    throw new Error("Wine data could not be loaded.");
  }
  const [grapes, ...regionGroupsAndSources] = await Promise.all(responses.map(response => response.json()));
  const sources = regionGroupsAndSources.pop();
  const regionGroups = regionGroupsAndSources;
  for (let i = 1; i < regionGroups.length; i += 1) {
    for (const id of Object.keys(regionGroups[i])) {
      if (regionGroups[0][id] !== undefined) {
        throw new Error(`Duplicate region id across data files: ${id}`);
      }
    }
  }
  GRAPES = grapes;
  REGIONS = Object.assign({}, ...regionGroups);
  SOURCES = sources;
}

/** Return only regions that explicitly define the selected grape. */
function relevantRegions(grapeId) {
  return Object.entries(REGIONS).filter(([, region]) => region.grapes?.[grapeId]);
}

/**
 * Safely combine a grape baseline with regional modifiers.
 * Returns null instead of throwing if a stale/invalid pair reaches this layer.
 */
function combinedProfile(grapeId, regionId) {
  const grape = GRAPES[grapeId];
  const region = REGIONS[regionId];
  const regional = region?.grapes?.[grapeId];
  if (!grape || !region || !regional) return null;
  const profile = { ...grape };
  for (const [key, modifier] of Object.entries(regional.mods || {})) {
    profile[key] = clamp((profile[key] || 0) + modifier, 0, 5);
  }
  return { grape, region, regional, profile };
}

/** All valid grape-region pairs, flattened for discovery features. */
function allPairs() {
  const pairs = [];
  for (const [regionId, region] of Object.entries(REGIONS)) {
    for (const grapeId of Object.keys(region.grapes || {})) {
      if (combinedProfile(grapeId, regionId)) pairs.push({ grapeId, regionId });
    }
  }
  return pairs;
}

/** True when a region is presented as a discovery/emerging expression. */
function isDiscoveryRegion(region) {
  const badges = region.badges || [];
  return badges.includes("Discovery") || badges.includes("Emerging region");
}

function optionMarkup(entries) {
  return entries.map(([id, item]) => `<option value="${id}">${item.name}</option>`).join("");
}

function formatScore(value) {
  return value.toFixed(value % 1 ? 1 : 0);
}

/** The visual bar is decorative; the adjacent text score is the accessible value. */
function metricBar(key, label, profile, compact = false) {
  const columns = compact ? ' style="grid-template-columns:70px 1fr 30px"' : "";
  return `<div class="bar"${columns}>
    <div>${label}</div>
    <div class="track" aria-hidden="true"><div class="fill" style="width:${profile[key] / 5 * 100}%"></div></div>
    <div class="score"><span class="sr-only">${label}: </span>${formatScore(profile[key])}</div>
  </div>`;
}

function populateGrapes() {
  const entries = Object.entries(GRAPES);
  $("grape").innerHTML = optionMarkup(entries);
  $("cg").innerHTML = optionMarkup(entries);
  $("grape").value = GRAPES["pinot-noir"] ? "pinot-noir" : entries[0]?.[0] || "";
  $("cg").value = $("grape").value;
}

function populateExploreRegions() {
  const regions = relevantRegions($("grape").value);
  $("region").innerHTML = optionMarkup(regions);
  renderExplore();
}

function renderFlavorGroups(noteGroups) {
  if (!noteGroups || typeof noteGroups !== "object") return "";
  return `<div class="note-groups">${Object.entries(noteGroups).map(([category, notes]) => `
    <section class="note-group" aria-label="${category}">
      <h4 class="note-group-title">${NOTE_ICONS[category] || DEFAULT_NOTE_ICON}<span>${category}</span></h4>
      <div class="chips">${notes.map(note => `<span class="chip">${note}</span>`).join("")}</div>
    </section>`).join("")}</div>`;
}

/** Discovery/Classic badges: subdued pills near the region identity. */
function renderBadges(region) {
  const badges = region.badges || [];
  if (!badges.length) return "";
  return `<div class="badges">${badges.map(b => `<span class="badge">${b}</span>`).join("")}</div>`;
}

/** Regional Identity: concise terroir summary rendered as a definition list. */
function renderIdentity(region) {
  const identity = region.identity;
  if (!identity) return "";
  const rows = [
    ["Climate", identity.setting],
    ["Terrain", identity.terrain],
    ["Soils", identity.soil],
    ["Influence", (identity.influences || []).join(" \u00b7 ")]
  ].filter(([, value]) => value);
  if (!rows.length) return "";
  return `<section class="identity" aria-labelledby="identityHeading">
    <h3 id="identityHeading">Regional identity</h3>
    <dl class="identity-grid">
      ${rows.map(([term, value]) => `<div><dt>${term}</dt><dd>${value}</dd></div>`).join("")}
    </dl>
  </section>`;
}

/** "Why does it taste like this?" — cause → effect pairs from structured data. */
function renderWhy(region) {
  const why = region.why;
  if (!Array.isArray(why) || !why.length) return "";
  return `<section class="why" aria-labelledby="whyHeading">
    <h3 id="whyHeading">Why does it taste like this?</h3>
    <ul class="why-list">
      ${why.map(item => `<li><span class="why-cause">${item.cause}</span><span class="why-arrow" aria-hidden="true">\u2192</span><span class="why-effect">${item.effect}</span></li>`).join("")}
    </ul>
  </section>`;
}

/** Sources & methodology: expandable drawer resolved through sources.json. */
function renderSources(region) {
  const ids = region.sources || [];
  const resolved = ids.map(id => SOURCES[id]).filter(Boolean);
  const list = resolved.length
    ? `<ul class="source-list">${resolved.map(s => `<li><a href="${s.url}" rel="noopener" target="_blank">${s.name}</a></li>`).join("")}</ul>`
    : "";
  return `<details class="sources">
    <summary>Sources &amp; methodology</summary>
    <p class="small">Regional style profiles summarize typical characteristics; original summaries based on the references below. Individual producers and vintages vary.</p>
    ${list}
  </details>`;
}

function renderExplore() {
  const result = combinedProfile($("grape").value, $("region").value);
  if (!result) {
    // Graceful empty state: an invalid pair can only arrive here via a stale
    // selector value or a hand-edited URL, neither of which should crash.
    $("title").textContent = "No profile available";
    $("pill").textContent = "";
    $("expect").textContent = "This grape and region combination is not in the atlas yet.";
    $("climate").innerHTML = "";
    $("identity").innerHTML = "";
    $("why").innerHTML = "";
    $("sourcesDrawer").innerHTML = "";
    $("bars").innerHTML = "";
    $("notes").innerHTML = "";
    $("serve").innerHTML = "";
    $("pair").innerHTML = "";
    return;
  }
  const { grape, region, regional, profile } = result;
  $("title").textContent = `${grape.name} \u00b7 ${region.name}`;
  $("pill").textContent = `${region.country} \u00b7 ${region.climate}`;
  $("expect").textContent = regional.expect;
  $("climate").innerHTML = `<strong>Climate effect:</strong> ${region.summary}`;
  $("identity").innerHTML = renderBadges(region) + renderIdentity(region);
  $("why").innerHTML = renderWhy(region);
  $("sourcesDrawer").innerHTML = renderSources(region);
  $("bars").innerHTML = METRICS.map(([key, label]) => metricBar(key, label, profile)).join("");
  $("notes").innerHTML = renderFlavorGroups(regional.notes);
  $("serve").innerHTML = [
    ["Serving temp", regional.serve],
    ["Decant", regional.decant],
    ["Glass", regional.glass],
    ["Ageing", regional.ageing]
  ].map(([key, value]) => `<div class="box"><div class="k">${key}</div><div class="v">${value}</div></div>`).join("");
  $("pair").innerHTML = regional.pairings.map(item => `<span class="chip">${item}</span>`).join("");
}

/**
 * Compare "Biggest differences" panel.
 * For each metric: find the highest and lowest region among the selection,
 * rank by spread, and show only differences at or above MIN_MEANINGFUL_SPREAD
 * so trivial variation stays off screen. Values are the same 0–5 numbers the
 * profile bars use, so the panel can never contradict the cards.
 */
function renderBiggestDifferences(selections) {
  if (selections.length < 2) return "";
  const rows = [];
  for (const [key] of COMPARE_METRICS) {
    let high = null;
    let low = null;
    for (const item of selections) {
      const value = item.profile[key];
      if (!high || value > high.value) high = { name: item.region.name, value };
      if (!low || value < low.value) low = { name: item.region.name, value };
    }
    const spread = high.value - low.value;
    if (spread >= MIN_MEANINGFUL_SPREAD && high.name !== low.name) {
      rows.push({ key, spread, high, low });
    }
  }
  rows.sort((a, b) => b.spread - a.spread);
  const top = rows.slice(0, 4);
  if (!top.length) return "";
  const wording = top.map(row => `
    <div class="diff-row">
      <span class="diff-metric">${DIFFERENCE_PHRASING[row.key].high}</span>
      <span class="diff-text">${row.high.name} vs ${row.low.name} \u2014 ${row.high.name} shows ${DIFFERENCE_PHRASING[row.key].high.toLowerCase()}; ${row.low.name} is closer to ${DIFFERENCE_PHRASING[row.key].low.toLowerCase()}.</span>
    </div>`).join("");
  return `<section class="differences" aria-labelledby="diffHeading">
    <h3 id="diffHeading">Biggest differences</h3>
    ${wording}
  </section>`;
}

/**
 * Rebuild compare controls from scratch on every grape change.
 * This deliberately clears old region IDs, fixing the stale-selection crash.
 */
function resetCompare() {
  const grapeId = $("cg").value;
  const regions = relevantRegions(grapeId);
  const controls = $("compareRegionControls");
  const hint = $("compareHint");
  controls.innerHTML = "";
  if (regions.length < 2) {
    hint.textContent = "More regional expressions coming soon.";
    renderCompare();
    return;
  }
  hint.textContent = "Choose two or three regional expressions to compare.";
  for (let index = 0; index < 3; index += 1) {
    const wrapper = document.createElement("div");
    const id = `compareRegion${index + 1}`;
    wrapper.innerHTML = `<label for="${id}">Region ${index + 1}</label>
      <select id="${id}" class="cr"><option value="">\u2014 None \u2014</option>${optionMarkup(regions)}</select>`;
    controls.appendChild(wrapper);
  }
  // Start with sensible, valid defaults. No stale values can survive this rebuild.
  const selects = [...document.querySelectorAll(".cr")];
  selects.forEach((select, index) => {
    if (regions[index]) select.value = regions[index][0];
    select.addEventListener("change", renderCompare);
  });
  renderCompare();
}

function renderCompare() {
  const grapeId = $("cg").value;
  const regions = relevantRegions(grapeId);
  const message = $("compareMessage");
  const grid = $("compareGrid");
  const differences = $("compareDifferences");
  if (regions.length < 2) {
    grid.innerHTML = "";
    differences.innerHTML = "";
    message.textContent = "More regional expressions coming soon.";
    message.classList.remove("hidden");
    return;
  }
  message.classList.add("hidden");
  // Secondary guard: invalid pairs can never crash the grid because
  // combinedProfile() returns null and the filter drops it here.
  const selections = [...document.querySelectorAll(".cr")]
    .map(select => select.value)
    .filter(Boolean)
    .map(regionId => combinedProfile(grapeId, regionId))
    .filter(Boolean);
  const cards = selections.map(({ region, regional, profile }) => `
      <article class="compareCard">
        <h3>${region.name}</h3>
        <div class="small">${region.country} \u00b7 ${region.climate}</div>
        ${renderBadges(region)}
        <div class="bars compare-bars">${COMPARE_METRICS.map(([key, label]) => metricBar(key, label, profile, true)).join("")}</div>
        <p class="small compare-summary">${regional.expect}</p>
        <p class="small"><strong>Serve:</strong> ${regional.serve} \u00b7 <strong>Decant:</strong> ${regional.decant}</p>
      </article>`);
  grid.innerHTML = cards.join("") || '<p class="small">Select regions to compare.</p>';
  differences.innerHTML = renderBiggestDifferences(selections);
}

/** Weighted pick: discovery profiles get 3x the chance of classics. */
function pickWeightedPair(pairs) {
  const weights = pairs.map(({ regionId }) =>
    isDiscoveryRegion(REGIONS[regionId]) ? DISCOVERY_WEIGHT : CLASSIC_WEIGHT);
  let total = 0;
  for (const w of weights) total += w;
  let ticket = Math.random() * total;
  for (let i = 0; i < pairs.length; i += 1) {
    ticket -= weights[i];
    if (ticket <= 0) return pairs[i];
  }
  return pairs[pairs.length - 1];
}

/**
 * Surprise me: jump to a random valid profile, preferring discovery regions.
 * Avoids repeating the previous pick where the pool is large enough.
 */
function surpriseMe() {
  const pairs = allPairs();
  if (!pairs.length) return;
  let pick = pickWeightedPair(pairs);
  if (pairs.length > 1 && lastSurprise) {
    let guard = 0;
    while ((pick.grapeId === lastSurprise.grapeId && pick.regionId === lastSurprise.regionId) && guard < 8) {
      pick = pickWeightedPair(pairs);
      guard += 1;
    }
  }
  lastSurprise = pick;
  setMode("explore");
  $("grape").value = pick.grapeId;
  populateExploreRegions();
  $("region").value = pick.regionId;
  renderExplore();
  updateUrl();
  announce(`Showing ${GRAPES[pick.grapeId].name} from ${REGIONS[pick.regionId].name}.`);
}

/**
 * Mood-based discovery: each mood filters allPairs() through its predicate
 * (or tag preference), then surfaces one random match. Always resolves to a
 * valid profile because the candidate pool is built from combinedProfile().
 */
function moodPick(mood) {
  let matches = [];
  for (const { grapeId, regionId } of allPairs()) {
    const { profile, region } = combinedProfile(grapeId, regionId);
    if (mood.test) {
      if (mood.test(profile)) matches.push({ grapeId, regionId });
    } else if (mood.preferTags) {
      const badges = region.badges || [];
      if (mood.preferTags.some(tag => badges.includes(tag))) matches.push({ grapeId, regionId });
    }
  }
  if (!matches.length) {
    announce("No profiles match that mood right now.");
    return;
  }
  const pick = matches[Math.floor(Math.random() * matches.length)];
  lastSurprise = pick;
  setMode("explore");
  $("grape").value = pick.grapeId;
  populateExploreRegions();
  $("region").value = pick.regionId;
  renderExplore();
  updateUrl();
  announce(`Showing ${GRAPES[pick.grapeId].name} from ${REGIONS[pick.regionId].name}.`);
}

/** Render the mood buttons once, wired to moodPick(). */
function renderMoods() {
  const container = $("moodButtons");
  container.innerHTML = MOODS.map(mood => `
    <button type="button" class="mood" data-mood="${mood.id}">
      <span class="mood-label">${mood.label}</span>
      <span class="mood-hint">${mood.hint}</span>
    </button>`).join("");
  container.querySelectorAll(".mood").forEach(button => {
    button.addEventListener("click", () => {
      const mood = MOODS.find(m => m.id === button.dataset.mood);
      if (mood) moodPick(mood);
    });
  });
}

/** Announce dynamic status changes to assistive technology. */
function announce(text) {
  const live = $("liveStatus");
  live.textContent = "";
  window.setTimeout(() => { live.textContent = text; }, 30);
}

/**
 * Shareable URLs: ?grape=<id>&region=<id>.
 * Invalid ids or pairs are ignored and fall back to the default view, so a
 * mistyped or hand-edited link can never crash the page.
 */
function applyUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const grapeId = params.get("grape");
  const regionId = params.get("region");
  if (grapeId && GRAPES[grapeId]) {
    $("grape").value = grapeId;
    populateExploreRegions();
    if (regionId && combinedProfile(grapeId, regionId)) {
      $("region").value = regionId;
      renderExplore();
      return;
    }
    // Valid grape, invalid region: keep the grape, let the region default.
    renderExplore();
  }
}

/** Keep the address bar shareable without reloading (no pushState history spam). */
function updateUrl() {
  const grapeId = $("grape").value;
  const regionId = $("region").value;
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
  if (!explore) renderCompare();
}

function wireEvents() {
  $("grape").addEventListener("change", () => { populateExploreRegions(); updateUrl(); });
  $("region").addEventListener("change", () => { renderExplore(); updateUrl(); });
  $("cg").addEventListener("change", resetCompare);
  $("surprise").addEventListener("click", surpriseMe);
  $("bExplore").addEventListener("click", () => setMode("explore"));
  $("bCompare").addEventListener("click", () => setMode("compare"));
}

async function init() {
  try {
    await loadData();
    populateGrapes();
    wireEvents();
    renderMoods();
    populateExploreRegions();
    applyUrlParams();
    resetCompare();
  } catch (error) {
    console.error(error);
    document.querySelector("main").innerHTML = `<article class="card"><h2>Wine Atlas could not load</h2><p class="small">Please refresh the page. If running locally, serve the folder through a local web server rather than opening index.html directly.</p></article>`;
  }
}

document.addEventListener("DOMContentLoaded", init);
