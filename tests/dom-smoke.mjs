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

for (const file of ["app.js", "compare-country.js", "ux.js", "functional.js", "maturity.js", "learning.js"]) {
  window.eval(await readFile(path.join(ROOT, file), "utf8"));
}

if (document.readyState !== "loading") document.dispatchEvent(new window.Event("DOMContentLoaded", { bubbles: true }));
await ready;
assert.equal(window.WineAtlas.ready, true, "core app should initialize");
const tick = (ms = 35) => new Promise(resolve => setTimeout(resolve, ms));

// Brand kicker remains one word semantically while visually separating RagDoll and Labs.
assert.equal(document.querySelectorAll(".brand-ragdoll").length, 2);
assert.equal(document.querySelectorAll(".brand-labs").length, 2);
assert.equal(document.querySelector(".kicker").textContent.toLowerCase(), "ragdolllabs reference tools");

// Guarded lookup/navigation remains authoritative.
assert.equal(window.WineAtlas.selectProfile("not-a-grape", "not-a-region"), false);
assert.equal(window.WineAtlas.selectProfile("assyrtiko", "santorini"), true);
await tick();
assert.equal(document.getElementById("title").textContent, "Assyrtiko · Santorini");

// Winemaking choices appear only for explicitly curated grape-region profiles.
const winemaking = document.getElementById("winemaking");
assert.equal(winemaking.classList.contains("hidden"), false, "Santorini Assyrtiko should show winemaking choices");
assert.match(document.getElementById("winemakingChoices").textContent, /Stainless steel/);
assert.match(document.getElementById("winemakingChoices").textContent, /Oak/);
window.WineAtlas.selectProfile("areni-noir", "vayots-dzor");
await tick();
assert.equal(winemaking.classList.contains("hidden"), true, "uncurated profiles should not show generic vessel boilerplate");

// Maturity evolution is also intentionally sparse and must render all three stages.
window.WineAtlas.selectProfile("nebbiolo", "barolo");
await tick();
const maturity = document.getElementById("maturity");
assert.equal(maturity.classList.contains("hidden"), false, "Barolo Nebbiolo should show maturity evolution");
assert.equal(document.querySelectorAll("#maturityStages .maturity-stage").length, 3);
assert.match(document.getElementById("maturityStages").textContent, /Young/);
assert.match(document.getElementById("maturityStages").textContent, /Developing/);
assert.match(document.getElementById("maturityStages").textContent, /Mature/);
assert.ok(document.getElementById("vintageEffect").textContent.length > 20, "vintage note should be populated");
window.WineAtlas.selectProfile("assyrtiko", "santorini");
await tick();
assert.equal(maturity.classList.contains("hidden"), true, "profiles without maturity metadata should not show generic ageing copy");

// Learning layer annotates advanced terms after async feature rendering without linking common words everywhere.
window.WineAtlas.selectProfile("rkatsiteli", "kakheti");
await tick(60);
const qvevriTerm = document.querySelector('.glossary-term[data-glossary-id="qvevri"]');
assert.ok(qvevriTerm, "qvevri should become a contextual glossary term");
assert.equal(document.querySelector('.glossary-term[data-glossary-id="tannin"]'), null, "common tannin mentions should not become inline glossary clutter");
qvevriTerm.click();
await tick();
assert.equal(document.getElementById("glossaryDialogTitle").textContent, "Qvevri");
assert.match(document.getElementById("glossaryContent").textContent, /earthenware vessel/i);
assert.ok(document.getElementById("glossaryDialog").hasAttribute("open"), "contextual definition should open the glossary dialog");

document.getElementById("glossaryClose").click();
document.getElementById("glossaryOpen").click();
await tick();
assert.equal(document.getElementById("glossaryDialogTitle").textContent, "Wine glossary");
assert.ok(document.querySelectorAll("#glossaryContent .glossary-entry").length >= 10, "full glossary should contain the curated learning terms");

// Beyond-still profiles are real first-class profiles with production metadata.
window.WineAtlas.selectProfile("chardonnay", "champagne-blanc-de-blancs");
await tick();
assert.equal(document.getElementById("title").textContent, "Chardonnay · Champagne — Blanc de Blancs");
assert.match(document.getElementById("specialStyle").textContent, /Traditional method/);
assert.match(document.getElementById("specialStyle").textContent, /sparkling/i);
window.WineAtlas.selectProfile("port-blend", "douro-port-tawny");
await tick();
assert.match(document.getElementById("specialStyle").textContent, /Fortified/);
assert.match(document.getElementById("pair").textContent, /crème brûlée/i);
window.WineAtlas.selectProfile("moscatel-alexandria", "setubal-moscatel");
await tick();
assert.match(document.getElementById("specialStyle").textContent, /Moscatel de Setúbal/);
assert.match(document.getElementById("pair").textContent, /pavlova/i);

// Food-first discovery now supports dessert-oriented queries as well as savoury food.
const foodInput = document.getElementById("foodInput");
foodInput.value = "chocolate";
foodInput.dispatchEvent(new window.Event("input", { bubbles: true }));
let foodButtons = [...document.querySelectorAll("#foodResults .food-result")];
assert.ok(foodButtons.length > 0, "chocolate should return dessert-wine matches");
assert.ok(foodButtons.some(button => /port|moscatel/i.test(button.textContent)), "chocolate should surface fortified dessert options");
foodInput.value = "lamb";
foodInput.dispatchEvent(new window.Event("input", { bubbles: true }));
foodButtons = [...document.querySelectorAll("#foodResults .food-result")];
assert.ok(foodButtons.length > 0, "lamb should still return pairing matches");
assert.match(foodButtons[0].textContent.toLowerCase(), /lamb/);
foodInput.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
await tick();
const selectedUrl = new URL(window.location.href);
assert.ok(selectedUrl.searchParams.get("grape"));
assert.ok(selectedUrl.searchParams.get("region"));

// A single regional expression auto-opens instead of asking for a fake choice.
window.WineAtlas.begin("grape");
const grapeSelect = document.getElementById("grape");
grapeSelect.value = "areni-noir";
grapeSelect.dispatchEvent(new window.Event("change", { bubbles: true }));
await tick();
assert.equal(new URL(window.location.href).searchParams.get("region"), "vayots-dzor");

// Rapid Compare grape changes must rebuild controls without throwing or leaving stale values.
window.WineAtlas.setMode("compare");
const compareGrape = document.getElementById("cg");
for (const grapeId of ["pinot-noir", "cabernet-sauvignon", "syrah", "zinfandel", "assyrtiko", "port-blend"]) {
  compareGrape.value = grapeId;
  compareGrape.dispatchEvent(new window.Event("change", { bubbles: true }));
}
assert.equal(compareGrape.value, "port-blend");
assert.ok(document.querySelectorAll("#compareRegionControls .cr").length >= 2, "Port blend should expose Ruby/LBV and Tawny profiles to current compare mode");

console.log("OK: Wine Atlas DOM smoke tests passed");
