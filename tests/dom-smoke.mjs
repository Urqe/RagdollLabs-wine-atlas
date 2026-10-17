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
  const file = path.join(ROOT, relative);
  try {
    const text = await readFile(file, "utf8");
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

for (const file of ["app.js", "compare-country.js", "ux.js", "functional.js", "search-enhance.js", "advanced-compare.js", "maturity.js", "learning.js"]) {
  window.eval(await readFile(path.join(ROOT, file), "utf8"));
}

if (document.readyState !== "loading") document.dispatchEvent(new window.Event("DOMContentLoaded", { bubbles: true }));
await ready;
assert.equal(window.WineAtlas.ready, true, "core app should initialize");
const tick = (ms = 35) => new Promise(resolve => setTimeout(resolve, ms));
await tick();

assert.equal(document.querySelectorAll(".brand-ragdoll").length, 2);
assert.equal(document.querySelectorAll(".brand-labs").length, 2);
assert.equal(document.querySelector(".kicker").textContent.toLowerCase(), "ragdolllabs reference tools");

assert.equal(window.WineAtlas.selectProfile("not-a-grape", "not-a-region"), false);
assert.equal(window.WineAtlas.selectProfile("assyrtiko", "santorini"), true);
await tick();
assert.equal(document.getElementById("title").textContent, "Assyrtiko · Santorini");

const winemaking = document.getElementById("winemaking");
assert.equal(winemaking.classList.contains("hidden"), false);
assert.match(document.getElementById("winemakingChoices").textContent, /Stainless steel/);
window.WineAtlas.selectProfile("areni-noir", "vayots-dzor");
await tick();
assert.equal(winemaking.classList.contains("hidden"), true);

window.WineAtlas.selectProfile("nebbiolo", "barolo");
await tick();
const maturity = document.getElementById("maturity");
assert.equal(maturity.classList.contains("hidden"), false);
assert.equal(document.querySelectorAll("#maturityStages .maturity-stage").length, 3);

window.WineAtlas.selectProfile("rkatsiteli", "kakheti");
await tick(60);
const qvevriTerm = document.querySelector('.glossary-term[data-glossary-id="qvevri"]');
assert.ok(qvevriTerm);
qvevriTerm.click();
await tick();
assert.equal(document.getElementById("glossaryDialogTitle").textContent, "Qvevri");
document.getElementById("glossaryClose").click();

window.WineAtlas.selectProfile("chardonnay", "champagne-blanc-de-blancs");
await tick();
assert.match(document.getElementById("specialStyle").textContent, /Traditional method/);
window.WineAtlas.selectProfile("port-blend", "douro-port-tawny");
await tick();
assert.match(document.getElementById("pair").textContent, /crème brûlée/i);

const foodInput = document.getElementById("foodInput");
foodInput.value = "chocolate";
foodInput.dispatchEvent(new window.Event("input", { bubbles: true }));
assert.ok(document.querySelectorAll("#foodResults .food-result").length > 0);

// Main Atlas search is accent-insensitive and now includes pairings/style metadata.
const searchInput = document.getElementById("searchInput");
searchInput.value = "creme brulee";
searchInput.dispatchEvent(new window.Event("input", { bubbles: true }));
await tick();
const cremeResults = [...document.querySelectorAll("#searchResults .search-result")];
assert.ok(cremeResults.length > 0, "ASCII creme brulee should match accented pairings");
assert.ok(cremeResults.some(button => /Sauternes|Tawny|Moscatel/i.test(button.textContent)), "dessert search should surface relevant sweet or fortified wines");

// Advanced Compare injects profile selectors and keeps still-wine comparisons color-compatible.
window.WineAtlas.selectProfile("cabernet-sauvignon", "napa");
await tick();
window.WineAtlas.setMode("compare");
await tick();
const adv1 = document.getElementById("advancedCompare1");
const adv2 = document.getElementById("advancedCompare2");
assert.ok(adv1 && adv2, "advanced compare controls should exist");
assert.match(adv1.value, /^cabernet-sauvignon::napa$/);
const redOptionValues = [...adv2.options].map(option => option.value).filter(Boolean);
assert.ok(redOptionValues.some(value => value.startsWith("syrah::")), "red still comparison should allow another red grape");
assert.equal(redOptionValues.some(value => value.startsWith("chardonnay::burgundy")), false, "red still comparison must not offer white still wine");
adv2.value = redOptionValues.find(value => value.startsWith("syrah::"));
adv2.dispatchEvent(new window.Event("change", { bubbles: true }));
await tick();
assert.ok(document.querySelectorAll("#advancedCompareGrid .advanced-compare-card").length >= 2);
assert.match(document.getElementById("advancedCompareDifferences").textContent, /Biggest differences/);

// Sparkling uses family compatibility rather than enforcing grape color.
adv1.value = "chardonnay::champagne-blanc-de-blancs";
adv1.dispatchEvent(new window.Event("change", { bubbles: true }));
await tick();
const sparklingValues = [...adv2.options].map(option => option.value).filter(Boolean);
assert.ok(sparklingValues.some(value => value.startsWith("glera::prosecco-doc")));
assert.ok(sparklingValues.some(value => value.startsWith("macabeo::cava")));
assert.equal(sparklingValues.some(value => value.startsWith("cabernet-sauvignon::napa")), false);

// Fortified family can compare Port with Moscatel despite different base colors/styles.
adv1.value = "port-blend::douro-port-tawny";
adv1.dispatchEvent(new window.Event("change", { bubbles: true }));
await tick();
const fortifiedValues = [...adv2.options].map(option => option.value).filter(Boolean);
assert.ok(fortifiedValues.includes("port-blend::douro-port-ruby"));
assert.ok(fortifiedValues.includes("moscatel-alexandria::setubal-moscatel"));

// Single-choice navigation still works.
window.WineAtlas.begin("grape");
const grapeSelect = document.getElementById("grape");
grapeSelect.value = "areni-noir";
grapeSelect.dispatchEvent(new window.Event("change", { bubbles: true }));
await tick();
assert.equal(new URL(window.location.href).searchParams.get("region"), "vayots-dzor");

console.log("OK: Wine Atlas DOM smoke tests passed");
