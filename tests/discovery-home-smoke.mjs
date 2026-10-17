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
  "advanced-compare.js", "maturity.js", "learning.js", "smart-discovery.js", "home-brand.js"
]) {
  window.eval(await readFile(path.join(ROOT, file), "utf8"));
}

if (document.readyState !== "loading") document.dispatchEvent(new window.Event("DOMContentLoaded", { bubbles: true }));
await ready;
const tick = (ms = 45) => new Promise(resolve => setTimeout(resolve, ms));
await tick();

assert.ok(document.querySelector(".welcome-ragdoll"), "landing page should include the ragdoll mascot");
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

// Cat, title and kicker all use the same no-reload path back to the landing page.
assert.equal(document.getElementById("welcomeView").classList.contains("hidden"), true);
document.querySelector(".app-home-cat").click();
await tick();
assert.equal(document.getElementById("welcomeView").classList.contains("hidden"), false);
assert.equal(document.getElementById("appShell").classList.contains("hidden"), true);
const homeUrl = new URL(window.location.href);
assert.equal(homeUrl.searchParams.has("grape"), false);
assert.equal(homeUrl.searchParams.has("region"), false);

console.log("OK: Smart Discovery, content depth and home identity smoke tests passed");
