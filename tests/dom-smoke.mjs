import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = await readFile(path.join(ROOT, "index.html"), "utf8");
const dom = new JSDOM(html, {
  url: "https://example.test/RagdollLabs-wine-atlas/",
  runScripts: "outside-only",
  pretendToBeVisual: true
});
const { window } = dom;
const { document } = window;

window.fetch = async resource => {
  const raw = typeof resource === "string" ? resource : resource.url;
  const relative = raw.replace(/^https?:\/\/[^/]+\/RagdollLabs-wine-atlas\//, "").replace(/^\.\//, "");
  try {
    const text = await readFile(path.join(ROOT, relative), "utf8");
    return { ok: true, status: 200, json: async () => JSON.parse(text), text: async () => text };
  } catch {
    return { ok: false, status: 404, json: async () => ({}), text: async () => "" };
  }
};

const ready = new Promise((resolve, reject) => {
  const timeout = setTimeout(() => reject(new Error("wineatlas:ready was not emitted")), 3000);
  document.addEventListener("wineatlas:ready", event => {
    clearTimeout(timeout);
    resolve(event);
  }, { once: true });
});

for (const file of [
  "app.js", "compare-country.js", "ux.js", "food-discovery.js", "wine-search.js", "functional.js", "search-enhance.js",
  "advanced-compare.js", "compare-discovery.js", "maturity.js", "learning.js",
  "smart-discovery.js", "home-brand.js"
]) {
  window.eval(await readFile(path.join(ROOT, file), "utf8"));
}

if (document.readyState !== "loading") document.dispatchEvent(new window.Event("DOMContentLoaded", { bubbles: true }));
await ready;
const tick = (ms = 45) => new Promise(resolve => setTimeout(resolve, ms));
await tick();

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
await tick();
assert.equal(document.getElementById("title").textContent, "Assyrtiko · Santorini");
assert.ok(document.querySelectorAll("#bars .bar").length > 0);
assert.ok(document.getElementById("notes").textContent.trim().length > 0);
assert.equal(document.querySelectorAll("#serve .box").length, 3);
assert.equal(document.getElementById("winemaking").classList.contains("hidden"), false);

window.WineAtlas.selectProfile("nebbiolo", "barolo");
await tick();
assert.equal(document.getElementById("maturity").classList.contains("hidden"), false);
assert.equal(document.querySelectorAll("#maturityStages .maturity-stage").length, 3);

window.WineAtlas.selectProfile("rkatsiteli", "kakheti");
await tick(60);
const qvevriTerm = document.querySelector('.glossary-term[data-glossary-id="qvevri"]');
assert.ok(qvevriTerm);
qvevriTerm.click();
await tick();
assert.equal(document.getElementById("glossaryDialogTitle").textContent, "Qvevri");
document.getElementById("glossaryClose").click();

// Unified Atlas search: food aliases, accents and style text all use the same field.
const searchInput = document.getElementById("searchInput");
searchInput.value = "bbq";
searchInput.dispatchEvent(new window.Event("input", { bubbles: true }));
await tick(80);
assert.ok(document.querySelectorAll("#searchResults .search-result").length > 0, "bbq alias should resolve in unified search");
assert.match(document.getElementById("searchResults").textContent, /Best pairing matches/i);

searchInput.value = "creme brulee";
searchInput.dispatchEvent(new window.Event("input", { bubbles: true }));
await tick(80);
const cremeResults = [...document.querySelectorAll("#searchResults .search-result")];
assert.ok(cremeResults.length > 0);
assert.ok(cremeResults.some(button => /Sauternes|Tawny|Moscatel/i.test(button.textContent)));

searchInput.value = "rose";
searchInput.dispatchEvent(new window.Event("input", { bubbles: true }));
await tick(80);
assert.ok([...document.querySelectorAll("#searchResults .search-result")].some(button => /Provence|Tavel|Navarra/i.test(button.textContent)));

// Special profiles retain appearance and production context.
assert.equal(window.WineAtlas.selectProfile("provence-rose-blend", "cotes-de-provence-rose"), true);
await tick();
assert.ok(document.querySelector("#profileWineColor .wine-color-dot.rose"));
assert.equal(window.WineAtlas.selectProfile("ribolla-gialla", "collio-oslavia-orange"), true);
await tick();
assert.ok(document.querySelector("#profileWineColor .wine-color-dot.orange"));

// Advanced Compare uses canonical metrics and compatibility-aware selectors.
window.WineAtlas.selectProfile("cabernet-sauvignon", "napa");
await tick();
window.WineAtlas.setMode("compare");
await tick();
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
await tick();

const napa = window.WineAtlas.combinedProfile("cabernet-sauvignon", "napa");
const compareScores = [...document.querySelectorAll("#advancedCompareGrid .advanced-compare-card:first-child .score")]
  .map(node => Number(node.textContent.trim().split(/\s+/).at(-1)));
const expectedScores = ["body", "acidity", "tannin", "sweetness", "alcohol", "fruit", "oak", "earth"].map(key => napa.profile[key]);
assert.deepEqual(compareScores, expectedScores);

const thirdRed = [...adv3.options].map(option => option.value).find(value => value && value !== adv1.value && value !== adv2.value);
assert.ok(thirdRed);
adv3.value = thirdRed;
adv3.dispatchEvent(new window.Event("change", { bubbles: true }));
await tick();
assert.equal(biggestOnly.checked, true);

adv1.value = "chardonnay::champagne-blanc-de-blancs";
adv1.dispatchEvent(new window.Event("change", { bubbles: true }));
await tick();
const sparklingValues = [...adv2.options].map(option => option.value).filter(Boolean);
assert.ok(sparklingValues.some(value => value.startsWith("glera::prosecco-doc")));
assert.equal(sparklingValues.some(value => value.startsWith("cabernet-sauvignon::napa")), false);

// Single-choice navigation remains guarded and URL-backed.
window.WineAtlas.begin("grape");
const grapeSelect = document.getElementById("grape");
grapeSelect.value = "areni-noir";
grapeSelect.dispatchEvent(new window.Event("change", { bubbles: true }));
await tick();
assert.equal(new URL(window.location.href).searchParams.get("region"), "vayots-dzor");

console.log("OK: Wine Atlas DOM smoke tests passed");
