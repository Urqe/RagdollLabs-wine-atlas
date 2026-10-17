import assert from "node:assert/strict";
import { createApp } from "./harness.mjs";

const { window, document, settle, close } = await createApp();
await settle();

assert.equal(window.WineAtlas.ready, true);
assert.equal(typeof window.WineAtlas.combinedProfile, "function");
assert.equal(typeof window.WineAtlas.allPairs, "function");
assert.ok(window.WineAtlas.allPairs().length > 0);

// Focused shell: one visible Explore search, secondary discovery and learning collapsed.
assert.equal(document.querySelectorAll("[data-welcome-action]").length, 3);
assert.equal(document.getElementById("foodSection"), null, "food search should be merged into the main Atlas search");
assert.ok(document.getElementById("discoverTools") instanceof window.HTMLDetailsElement);
assert.equal(document.getElementById("discoverTools").open, false);
assert.ok(document.getElementById("learnMore") instanceof window.HTMLDetailsElement);
assert.equal(document.getElementById("learnMore").open, false);

assert.equal(window.WineAtlas.selectProfile("assyrtiko", "santorini"), true);
await settle();
assert.equal(document.getElementById("title").textContent, "Assyrtiko · Santorini");
assert.ok(document.querySelectorAll("#bars .bar").length > 0);
assert.ok(document.getElementById("notes").textContent.trim().length > 0);
assert.equal(document.querySelectorAll("#serve .box").length, 3);
assert.equal(document.getElementById("winemaking").classList.contains("hidden"), false);

window.WineAtlas.selectProfile("nebbiolo", "barolo");
await settle();
assert.equal(document.getElementById("maturity").classList.contains("hidden"), false);
assert.equal(document.querySelectorAll("#maturityStages .maturity-stage").length, 3);

window.WineAtlas.selectProfile("rkatsiteli", "kakheti");
await settle();
const qvevriTerm = document.querySelector('.glossary-term[data-glossary-id="qvevri"]');
assert.ok(qvevriTerm);
qvevriTerm.click();
await settle();
assert.equal(document.getElementById("glossaryDialogTitle").textContent, "Qvevri");
document.getElementById("glossaryClose").click();

// Unified Atlas search: food aliases, accents and style text all use the same field.
const searchInput = document.getElementById("searchInput");
searchInput.value = "bbq";
searchInput.dispatchEvent(new window.Event("input", { bubbles: true }));
await settle();
assert.ok(document.querySelectorAll("#searchResults .search-result").length > 0, "bbq alias should resolve in unified search");
assert.match(document.getElementById("searchResults").textContent, /Best pairing matches/i);

searchInput.value = "creme brulee";
searchInput.dispatchEvent(new window.Event("input", { bubbles: true }));
await settle();
const cremeResults = [...document.querySelectorAll("#searchResults .search-result")];
assert.ok(cremeResults.length > 0);
assert.ok(cremeResults.some(button => /Sauternes|Tawny|Moscatel/i.test(button.textContent)));

searchInput.value = "rose";
searchInput.dispatchEvent(new window.Event("input", { bubbles: true }));
await settle();
assert.ok([...document.querySelectorAll("#searchResults .search-result")].some(button => /Provence|Tavel|Navarra/i.test(button.textContent)));

// Special profiles retain appearance and production context.
assert.equal(window.WineAtlas.selectProfile("provence-rose-blend", "cotes-de-provence-rose"), true);
await settle();
assert.ok(document.querySelector("#profileWineColor .wine-color-dot.rose"));
assert.equal(window.WineAtlas.selectProfile("ribolla-gialla", "collio-oslavia-orange"), true);
await settle();
assert.ok(document.querySelector("#profileWineColor .wine-color-dot.orange"));

// Advanced Compare uses canonical metrics and compatibility-aware selectors.
window.WineAtlas.selectProfile("cabernet-sauvignon", "napa");
await settle();
window.WineAtlas.setMode("compare");
await settle();
const adv1 = document.getElementById("advancedCompare1");
const adv2 = document.getElementById("advancedCompare2");
const adv3 = document.getElementById("advancedCompare3");
const biggestOnly = document.getElementById("advancedBiggestOnly");
assert.ok(adv1 && adv2 && adv3);
assert.match(adv1.value, /^cabernet-sauvignon::napa$/);
const redValues = [...adv2.options].map(option => option.value).filter(Boolean);
assert.ok(redValues.some(value => value.startsWith("syrah::")));
assert.equal(redValues.some(value => value.startsWith("chardonnay::burgundy")), false);
adv2.value = redValues.find(value => value.startsWith("syrah::"));
adv2.dispatchEvent(new window.Event("change", { bubbles: true }));
await settle();

const napa = window.WineAtlas.combinedProfile("cabernet-sauvignon", "napa");
const compareScores = [...document.querySelectorAll("#advancedCompareGrid .advanced-compare-card:first-child .score")]
  .map(node => Number(node.textContent.trim().split(/\s+/).at(-1)));
const expectedScores = ["body", "acidity", "tannin", "sweetness", "alcohol", "fruit", "oak", "earth"].map(key => napa.profile[key]);
assert.deepEqual(compareScores, expectedScores);

const thirdRed = [...adv3.options].map(option => option.value).find(value => value && value !== adv1.value && value !== adv2.value);
assert.ok(thirdRed);
adv3.value = thirdRed;
adv3.dispatchEvent(new window.Event("change", { bubbles: true }));
await settle();
assert.equal(biggestOnly.checked, true);

adv1.value = "chardonnay::champagne-blanc-de-blancs";
adv1.dispatchEvent(new window.Event("change", { bubbles: true }));
await settle();
const sparklingValues = [...adv2.options].map(option => option.value).filter(Boolean);
assert.ok(sparklingValues.some(value => value.startsWith("glera::prosecco-doc")));
assert.equal(sparklingValues.some(value => value.startsWith("cabernet-sauvignon::napa")), false);

// Single-choice navigation remains guarded and URL-backed.
window.WineAtlas.begin("grape");
const grapeSelect = document.getElementById("grape");
grapeSelect.value = "areni-noir";
grapeSelect.dispatchEvent(new window.Event("change", { bubbles: true }));
await settle();
assert.equal(new URL(window.location.href).searchParams.get("region"), "vayots-dzor");

console.log("OK: Wine Atlas DOM smoke tests passed");

await close();
