import assert from "node:assert/strict";
import { createApp } from "./harness.mjs";

const { window, document, settle, close } = await createApp();
await settle();

assert.ok(document.querySelector(".welcome-ragdoll-link"), "landing page should keep the ragdoll as a clickable home affordance");
assert.equal(document.querySelector(".welcome-ragdoll-link img"), null, "landing cat should be layered into the vineyard artwork rather than covering the glassware");
assert.ok(document.querySelectorAll("[data-home-return]").length >= 4, "cat, title and brand should be home affordances");

// Shared food vocabulary: equivalent aliases produce the same candidates in both workspaces.
await window.FoodDiscovery.load();
const identity = rows => rows.map(({item}) => `${item.grapeId}::${item.regionId}`);
for (const [alias, canonical] of [["hamburger", "burger"], ["BBQ", "barbecue"], ["Döner", "doner"], ["phở", "pho"], ["taco al pastor", "tacos al pastor"]]) {
  assert.deepEqual(identity(await window.rankCompareMatches(alias)), identity(await window.rankCompareMatches(canonical)), `${alias} and ${canonical} should resolve equally`);
  const profiles = window.WineAtlas.allPairs();
  assert.deepEqual(profiles.map(p => window.atlasPairingScore(p.regional.pairings, alias)), profiles.map(p => window.atlasPairingScore(p.regional.pairings, canonical)));
}
for (const query of ["doner kebab", "carne asada", "tacos al pastor", "cochinita pibil", "sushi", "spicy sushi", "pho", "ramen", "shoyu ramen", "tonkotsu", "miso ramen", "falafel", "hummus", "summer rolls", "banh xeo"]) {
  const matches = await window.rankCompareMatches(query);
  assert.ok(matches.some(row => row.pairingMatch), `${query} must find curated pairings`);
}
assert.equal(window.atlasPairingScore(["pork"], "tacos al pastor"), 0, "a specific dish must not resolve to every pork pairing");
assert.equal(window.atlasPairingScore(["Sushi and nigiri"], "spicy sushi"), 0, "spicy sushi must not collapse into delicate nigiri");
assert.equal(window.atlasPairingScore(["Shoyu ramen"], "tonkotsu"), 0, "ramen broth variants must remain distinct");
const exploreInput = document.getElementById("searchInput");
exploreInput.value = "hamburger";
await window.renderEnhancedAtlasSearch();
assert.ok(document.querySelectorAll("#searchResults button").length > 0);
assert.ok(!document.getElementById("searchResults").textContent.includes("pairs with hamburger"), "aliases must not duplicate display labels");
exploreInput.value = "cochinita pibil";
await window.renderEnhancedAtlasSearch();
assert.ok(document.querySelector("#searchResults .food-guidance a[href^='https://']"), "curated guidance must carry its reference");
exploreInput.value = "";
await window.renderEnhancedAtlasSearch();

// Appellation intent is a hard filter in the one shared search engine.
const cremant = await window.WineSearch.rank("cremant", 50);
assert.equal(cremant.length, 5);
assert.deepEqual(identity(cremant), identity(await window.WineSearch.rank("CRÉMANT", 50)));
assert.ok(cremant.every(({item}) => item.regional.style.family === "sparkling" && item.regionId.startsWith("cremant-")));
assert.ok(!cremant.some(({item}) => item.regionId.includes("champagne")), "Champagne must not be passed off as crémant");
for (const [query, grapeId, count] of [["cremant pinot noir", "pinot-noir", 2], ["cremant chardonnay", "chardonnay", 1], ["cremant chenin", "chenin-blanc", 1], ["cremant pinot blanc", "pinot-blanc", 1]]) {
  const result = await window.WineSearch.rank(query, 50);
  assert.equal(result.length, count, query);
  assert.ok(result.every(({item}) => item.grapeId === grapeId && item.regional.style.family === "sparkling"));
  assert.deepEqual(identity(await window.rankCompareMatches(query)), identity(result), "Compare and Explore must share query interpretation");
}
assert.equal((await window.WineSearch.rank("cremant cabernet sauvignon")).length, 0, "permitted blending varieties mentioned in prose are not actual profile identities");
assert.equal((await window.WineSearch.rank("cremant champagne")).length, 0, "contradictory appellations must not silently broaden");
assert.equal((await window.WineSearch.rank("cremant d'alsace")).length, 2);
assert.equal((await window.WineSearch.rank("crémant de bourgogne")).length, 2);
const sparklingChicken = await window.WineSearch.rank("sparkling fried chicken", 50);
assert.ok(sparklingChicken.length >= 5);
assert.ok(sparklingChicken.every(({item, pairingScore}) => item.regional.style.family === "sparkling" && pairingScore > 0));
assert.deepEqual(identity(await window.WineSearch.rank("kuohuviini chardonnay", 50)), identity(await window.WineSearch.rank("sparkling chardonnay", 50)));
for (const [query, region] of [["champagne", "champagne-blanc-de-blancs"], ["cava", "cava"], ["prosecco", "prosecco-doc"]]) {
  const result = await window.WineSearch.rank(query);
  assert.ok(result.length && result.every(({item}) => item.regionId === region && item.regional.style.family === "sparkling"));
}
for (const query of ["pizza", "pizza margherita", "pepperoni", "funghi pizza", "pizza bianca", "fried chicken", "hot wings", "gochujang wings", "gyoza", "kevätkääryleet", "sweet-and-sour pork", "kung po chicken", "pad thai", "voikana", "samosas"]) {
  assert.ok((await window.WineSearch.rank(query)).some(row => row.pairingScore > 0), `${query} needs a pairing`);
}
for (const item of window.WineAtlas.allPairs()) {
  assert.ok(item.regional.pairings.every(label => label === label.toLowerCase()), "all food display labels must be lowercase");
}
exploreInput.value = "cremant pinot noir";
exploreInput.dispatchEvent(new window.Event("input", { bubbles: true }));
await settle();
assert.equal(document.querySelectorAll("#searchResults button").length, 2, "real input handler must delegate to structured search");
exploreInput.value = "hamburger";
exploreInput.dispatchEvent(new window.Event("input", { bubbles: true }));
await settle();
assert.ok([...document.querySelectorAll("#searchResults button span")].filter(span => !span.classList.contains("wine-color-dot")).every(span => !span.textContent.includes(" · lamb")), "food result copy should show matched foods rather than every profile pairing");
exploreInput.value = "";
await window.renderEnhancedAtlasSearch();

// Smart Discovery should expose distinct reasons rather than three anonymous nearest neighbours.
assert.equal(window.WineAtlas.selectProfile("cabernet-sauvignon", "napa"), true);
await settle();
const smartItems = [...document.querySelectorAll("#similarWines .smart-similar-item")];
assert.equal(smartItems.length, 3, "a well-covered profile should have three discovery routes");
assert.ok(smartItems.some(item => item.dataset.discoveryKind === "same-grape"), "same grape / different place should be represented");
assert.ok(smartItems.some(item => item.dataset.discoveryKind === "adventurous"), "a discovery-oriented recommendation should be represented");
assert.ok(smartItems.every(item => item.querySelector(".smart-discovery-label")?.textContent.trim()), "every recommendation should explain its intent");

// Special families must stay in a meaningful recommendation context.
assert.equal(window.WineAtlas.selectProfile("grenache", "tavel-rose"), true);
await settle();
const roseSuggestions = [...document.querySelectorAll("#similarWines .smart-similar-item")];
assert.ok(roseSuggestions.length >= 2);
for (const button of roseSuggestions) {
  const profile = window.WineAtlas.combinedProfile(button.dataset.grape, button.dataset.region);
  assert.equal(profile.regional.style?.family, "rose", "rosé discovery should not jump to unrelated still reds");
}

// Content-depth release adds maturity where bottle evolution is genuinely educational.
assert.equal(window.WineAtlas.selectProfile("semillon", "sauternes"), true);
await settle();
assert.equal(document.getElementById("maturity").classList.contains("hidden"), false);
assert.match(document.getElementById("maturitySummary").textContent, /Sauternes|apricot|botrytis/i);

// Compare is a distinct workspace: Explore search disappears and its own finder can seed a compatible trio from food.
window.WineAtlas.setMode("compare");
await settle();
assert.equal(document.getElementById("searchSection").classList.contains("hidden"), true, "Explore search should not compete with Compare controls");
const compareInput = document.getElementById("compareDiscoveryInput");
assert.ok(compareInput, "Compare should expose its own discovery search");
compareInput.value = "lamb";
compareInput.dispatchEvent(new window.Event("input", { bubbles: true }));
await settle();
const compareResults = [...document.querySelectorAll("#compareDiscoveryResults .compare-discovery-result")];
assert.ok(compareResults.length >= 3, "lamb should surface several comparison candidates");
const topMatches = document.getElementById("compareTopMatches");
assert.equal(topMatches.classList.contains("hidden"), false, "a compatible food query should offer quick comparison building");
topMatches.click();
await settle();
const selectedKeys = [1, 2, 3].map(index => document.getElementById(`advancedCompare${index}`).value).filter(Boolean);
assert.equal(selectedKeys.length, 3, "Compare top matches should populate three compatible wines when available");
const selectedProfiles = selectedKeys.map(key => {
  const [grapeId, regionId] = key.split("::");
  return window.WineAtlas.combinedProfile(grapeId, regionId);
});
assert.ok(selectedProfiles.slice(1).every(profile => window.advancedCompatible(selectedProfiles[0], profile)), "food-seeded comparison must respect Advanced Compare compatibility");

window.WineAtlas.setMode("explore");
await settle();
assert.equal(document.getElementById("searchSection").classList.contains("hidden"), false, "Explore search should return when leaving Compare");

// Cat, title and kicker all use the same no-reload path back to the landing page.
assert.equal(window.WineAtlas.selectProfile("cabernet-sauvignon", "napa"), true);
await settle();
assert.equal(document.getElementById("welcomeView").classList.contains("hidden"), true);
const cat = document.querySelector(".app-home-cat");
cat.focus();
cat.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true, detail: 1 }));
await settle();
assert.equal(document.getElementById("welcomeView").classList.contains("hidden"), false);
assert.equal(document.getElementById("appShell").classList.contains("hidden"), true);
assert.notEqual(document.activeElement, document.getElementById("welcomeTitle"), "pointer home navigation should not paint a focus ring around the landing title");
const homeUrl = new URL(window.location.href);
assert.equal(homeUrl.searchParams.has("grape"), false);
assert.equal(homeUrl.searchParams.has("region"), false);

console.log("OK: Smart Discovery, Compare discovery and home identity smoke tests passed");

await close();
