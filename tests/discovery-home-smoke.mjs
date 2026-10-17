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
  "app.js", "compare-country.js", "ux.js", "functional.js", "search-enhance.js",
  "advanced-compare.js", "compare-discovery.js", "maturity.js", "learning.js",
  "smart-discovery.js", "home-brand.js"
]) {
  window.eval(await readFile(path.join(ROOT, file), "utf8"));
}

if (document.readyState !== "loading") document.dispatchEvent(new window.Event("DOMContentLoaded", { bubbles: true }));
await ready;
const tick = (ms = 45) => new Promise(resolve => setTimeout(resolve, ms));
await tick();

assert.ok(document.querySelector(".welcome-ragdoll-link"), "landing page should keep the ragdoll as a clickable home affordance");
assert.equal(document.querySelector(".welcome-ragdoll-link img"), null, "landing cat should be layered into the vineyard artwork rather than covering the glassware");
assert.ok(document.querySelectorAll("[data-home-return]").length >= 4, "cat, title and brand should be home affordances");

// Smart Discovery should expose distinct reasons rather than three anonymous nearest neighbours.
assert.equal(window.WineAtlas.selectProfile("cabernet-sauvignon", "napa"), true);
await tick();
const smartItems = [...document.querySelectorAll("#similarWines .smart-similar-item")];
assert.equal(smartItems.length, 3, "a well-covered profile should have three discovery routes");
assert.ok(smartItems.some(item => item.dataset.discoveryKind === "same-grape"), "same grape / different place should be represented");
assert.ok(smartItems.some(item => item.dataset.discoveryKind === "adventurous"), "a discovery-oriented recommendation should be represented");
assert.ok(smartItems.every(item => item.querySelector(".smart-discovery-label")?.textContent.trim()), "every recommendation should explain its intent");

// Special families must stay in a meaningful recommendation context.
assert.equal(window.WineAtlas.selectProfile("grenache", "tavel-rose"), true);
await tick();
const roseSuggestions = [...document.querySelectorAll("#similarWines .smart-similar-item")];
assert.ok(roseSuggestions.length >= 2);
for (const button of roseSuggestions) {
  const profile = window.WineAtlas.combinedProfile(button.dataset.grape, button.dataset.region);
  assert.equal(profile.regional.style?.family, "rose", "rosé discovery should not jump to unrelated still reds");
}

// Content-depth release adds maturity where bottle evolution is genuinely educational.
assert.equal(window.WineAtlas.selectProfile("semillon", "sauternes"), true);
await tick(70);
assert.equal(document.getElementById("maturity").classList.contains("hidden"), false);
assert.match(document.getElementById("maturitySummary").textContent, /Sauternes|apricot|botrytis/i);

// Compare is a distinct workspace: Explore search disappears and its own finder can seed a compatible trio from food.
window.WineAtlas.setMode("compare");
await tick();
assert.equal(document.getElementById("searchSection").classList.contains("hidden"), true, "Explore search should not compete with Compare controls");
const compareInput = document.getElementById("compareDiscoveryInput");
assert.ok(compareInput, "Compare should expose its own discovery search");
compareInput.value = "lamb";
compareInput.dispatchEvent(new window.Event("input", { bubbles: true }));
await tick(90);
const compareResults = [...document.querySelectorAll("#compareDiscoveryResults .compare-discovery-result")];
assert.ok(compareResults.length >= 3, "lamb should surface several comparison candidates");
const topMatches = document.getElementById("compareTopMatches");
assert.equal(topMatches.classList.contains("hidden"), false, "a compatible food query should offer quick comparison building");
topMatches.click();
await tick();
const selectedKeys = [1, 2, 3].map(index => document.getElementById(`advancedCompare${index}`).value).filter(Boolean);
assert.equal(selectedKeys.length, 3, "Compare top matches should populate three compatible wines when available");
const selectedProfiles = selectedKeys.map(key => {
  const [grapeId, regionId] = key.split("::");
  return window.WineAtlas.combinedProfile(grapeId, regionId);
});
assert.ok(selectedProfiles.slice(1).every(profile => window.advancedCompatible(selectedProfiles[0], profile)), "food-seeded comparison must respect Advanced Compare compatibility");

window.WineAtlas.setMode("explore");
await tick();
assert.equal(document.getElementById("searchSection").classList.contains("hidden"), false, "Explore search should return when leaving Compare");

// Cat, title and kicker all use the same no-reload path back to the landing page.
assert.equal(window.WineAtlas.selectProfile("cabernet-sauvignon", "napa"), true);
await tick();
assert.equal(document.getElementById("welcomeView").classList.contains("hidden"), true);
const cat = document.querySelector(".app-home-cat");
cat.focus();
cat.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true, detail: 1 }));
await tick();
assert.equal(document.getElementById("welcomeView").classList.contains("hidden"), false);
assert.equal(document.getElementById("appShell").classList.contains("hidden"), true);
assert.notEqual(document.activeElement, document.getElementById("welcomeTitle"), "pointer home navigation should not paint a focus ring around the landing title");
const homeUrl = new URL(window.location.href);
assert.equal(homeUrl.searchParams.has("grape"), false);
assert.equal(homeUrl.searchParams.has("region"), false);

console.log("OK: Smart Discovery, Compare discovery and home identity smoke tests passed");
