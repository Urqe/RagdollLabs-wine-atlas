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
    return {
      ok: true,
      status: 200,
      json: async () => JSON.parse(text),
      text: async () => text
    };
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

for (const file of ["app.js", "compare-country.js", "ux.js", "functional.js"]) {
  window.eval(await readFile(path.join(ROOT, file), "utf8"));
}

if (document.readyState !== "loading") {
  document.dispatchEvent(new window.Event("DOMContentLoaded", { bubbles: true }));
}
await ready;
assert.equal(window.WineAtlas.ready, true, "core app should initialize");

const tick = (ms = 25) => new Promise(resolve => setTimeout(resolve, ms));

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

// Food-first discovery ranks real pairing data and opens a valid profile.
const foodInput = document.getElementById("foodInput");
foodInput.value = "lamb";
foodInput.dispatchEvent(new window.Event("input", { bubbles: true }));
const foodButtons = [...document.querySelectorAll("#foodResults .food-result")];
assert.ok(foodButtons.length > 0, "lamb should return pairing matches");
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
for (const grapeId of ["pinot-noir", "cabernet-sauvignon", "syrah", "zinfandel", "assyrtiko"]) {
  compareGrape.value = grapeId;
  compareGrape.dispatchEvent(new window.Event("change", { bubbles: true }));
}
assert.equal(compareGrape.value, "assyrtiko");
assert.ok(document.querySelectorAll("#compareRegionControls .cr").length >= 2, "multi-region grape should rebuild compare controls");

console.log("OK: Wine Atlas DOM smoke tests passed");
