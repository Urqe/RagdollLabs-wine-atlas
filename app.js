/*
 * RagLabs Wine Atlas application logic
 * ------------------------------------
 * Design goals for future reviewers:
 * 1. Treat JSON as the source of truth for wine knowledge.
 * 2. Never assume a grape/region pair exists: every lookup is guarded.
 * 3. Rebuild compare selections whenever the grape changes so stale IDs
 *    cannot survive from the previous grape (the original compare bug).
 * 4. Keep rendering functions small and side-effect boundaries obvious.
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

let GRAPES = {};
let REGIONS = {};

const $ = id => document.getElementById(id);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

/** Load structured wine data. Relative paths keep GitHub Pages project URLs working. */
async function loadData() {
  const [grapesResponse, regionsResponse] = await Promise.all([
    fetch("./data/grapes.json"),
    fetch("./data/regions.json")
  ]);

  if (!grapesResponse.ok || !regionsResponse.ok) {
    throw new Error("Wine data could not be loaded.");
  }

  [GRAPES, REGIONS] = await Promise.all([
    grapesResponse.json(),
    regionsResponse.json()
  ]);
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
      <h4 class="note-group-title">${category}</h4>
      <div class="chips">${notes.map(note => `<span class="chip">${note}</span>`).join("")}</div>
    </section>`).join("")}</div>`;
}

function renderExplore() {
  const result = combinedProfile($("grape").value, $("region").value);
  if (!result) {
    $("title").textContent = "No profile available";
    $("expect").textContent = "This grape and region combination is not in the atlas yet.";
    $("bars").innerHTML = "";
    $("notes").innerHTML = "";
    $("serve").innerHTML = "";
    $("pair").innerHTML = "";
    return;
  }

  const { grape, region, regional, profile } = result;
  $("title").textContent = `${grape.name} · ${region.name}`;
  $("pill").textContent = `${region.country} · ${region.climate}`;
  $("expect").textContent = regional.expect;
  $("climate").innerHTML = `<strong>Climate effect:</strong> ${region.summary}`;
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
      <select id="${id}" class="cr"><option value="">— None —</option>${optionMarkup(regions)}</select>`;
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

  if (regions.length < 2) {
    grid.innerHTML = "";
    message.textContent = "More regional expressions coming soon.";
    message.classList.remove("hidden");
    return;
  }

  message.classList.add("hidden");

  const cards = [...document.querySelectorAll(".cr")]
    .map(select => select.value)
    .filter(Boolean)
    .map(regionId => combinedProfile(grapeId, regionId))
    .filter(Boolean) // Secondary guard: invalid pairs can never crash the grid.
    .map(({ region, regional, profile }) => `
      <article class="compareCard">
        <h3>${region.name}</h3>
        <div class="small">${region.country} · ${region.climate}</div>
        <div class="bars compare-bars">${COMPARE_METRICS.map(([key, label]) => metricBar(key, label, profile, true)).join("")}</div>
        <p class="small compare-summary">${regional.expect}</p>
        <p class="small"><strong>Serve:</strong> ${regional.serve} · <strong>Decant:</strong> ${regional.decant}</p>
      </article>`);

  grid.innerHTML = cards.join("") || '<p class="small">Select regions to compare.</p>';
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
  $("grape").addEventListener("change", populateExploreRegions);
  $("region").addEventListener("change", renderExplore);
  $("cg").addEventListener("change", resetCompare);
  $("bExplore").addEventListener("click", () => setMode("explore"));
  $("bCompare").addEventListener("click", () => setMode("compare"));
}

async function init() {
  try {
    await loadData();
    populateGrapes();
    wireEvents();
    populateExploreRegions();
    resetCompare();
  } catch (error) {
    console.error(error);
    document.querySelector("main").innerHTML = `<article class="card"><h2>Wine Atlas could not load</h2><p class="small">Please refresh the page. If running locally, serve the folder through a local web server rather than opening index.html directly.</p></article>`;
  }
}

document.addEventListener("DOMContentLoaded", init);
