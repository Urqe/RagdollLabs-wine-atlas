import assert from "node:assert/strict";
import { createApp } from "./harness.mjs";

const app = await createApp();
const { window: w, document: d } = app;
await app.settle();
const profile = (grape, region) => w.WineAtlas.combinedProfile(grape, region);
const keys = () => Array.from(w.WineComparison.snapshot().keys);
const cava = profile("macabeo", "cava");
const champagne = profile("chardonnay", "champagne-blanc-de-blancs");
const prosecco = profile("glera", "prosecco-doc");
const alsace = profile("pinot-noir", "cremant-alsace");
const bourgogne = profile("pinot-noir", "cremant-bourgogne");
w.WineAtlas.setMode("compare");
w.WineComparison.replace([cava, champagne, prosecco]);
let notifications = 0;
const changed = () => { notifications += 1; };
d.addEventListener("wineatlas:comparison-changed", changed);
w.WineComparison.replace([alsace, bourgogne]);
assert.equal(notifications, 1, "replacement must be one atomic transaction");
assert.deepEqual(keys(), ["pinot-noir::cremant-alsace", "pinot-noir::cremant-bourgogne", ""], "old third wine must be cleared");
assert.equal(d.querySelectorAll("#advancedCompareGrid .compareCard").length, 2);
assert.equal(d.getElementById("advancedCompare3").value, "");
assert.equal(d.querySelector('.advanced-slot-remove[data-slot="1"]').hidden, false);
assert.equal(d.querySelector('.advanced-slot-remove[data-slot="2"]').hidden, false);
assert.equal(d.querySelector('.advanced-slot-remove[data-slot="3"]').hidden, true);
const slotOneRemove = d.querySelector('.advanced-slot-remove[data-slot="1"]');
slotOneRemove.click();
assert.deepEqual(keys(), ["pinot-noir::cremant-bourgogne", "", ""], "slot removal must promote the next wine");
assert.equal(slotOneRemove.hidden, false, "the promoted first wine must remain removable");
w.WineComparison.replace([alsace, bourgogne]);
const leakedSnapshot = w.WineComparison.snapshot();
leakedSnapshot.keys[0] = "tampered";
assert.equal(keys()[0], "pinot-noir::cremant-alsace", "snapshots must not expose the state array");

w.advancedSeedProfile(cava);
const input = d.getElementById("compareDiscoveryInput");
input.value = "cava";
await w.compareRunDiscovery();
assert.equal(d.querySelector("#compareDiscoveryResults button").disabled, true);
w.advancedRemoveSlot(1);
assert.equal(d.querySelector("#compareDiscoveryResults button").disabled, false, "Remove must refresh discovery without another query");
assert.equal(d.querySelector("#compareDiscoveryResults button").textContent, "Add");
d.querySelector("#compareDiscoveryResults button").click();
assert.deepEqual(keys(), ["macabeo::cava", "", ""]);
assert.equal(d.querySelector("#compareDiscoveryResults button").textContent, "Added");

// Manual changes, duplicates and compatibility share the same rules as discovery.
w.WineComparison.replace([cava, champagne, prosecco]);
const slot1 = d.getElementById("advancedCompare1");
slot1.value = "cabernet-sauvignon::napa";
slot1.dispatchEvent(new w.Event("change", { bubbles: true }));
assert.deepEqual(keys(), ["cabernet-sauvignon::napa", "", ""]);
assert.equal(d.getElementById("advancedBiggestOnly").checked, false);
w.WineComparison.replace([cava, cava, profile("cabernet-sauvignon", "napa")]);
assert.deepEqual(keys(), ["macabeo::cava", "", ""]);
w.WineComparison.replace([cava]);
w.WineComparison.setSlot(3, "glera::prosecco-doc");
w.WineComparison.remove(1);
assert.deepEqual(keys(), ["glera::prosecco-doc", "", ""], "a filled third slot must be promoted when slot 2 is empty");
w.WineComparison.setSlot(3, "missing::profile");
assert.equal(w.WineComparison.snapshot().biggestOnly, false, "invalid third selection must not enable concise mode");
w.WineComparison.setBiggestOnly(true);
assert.equal(d.getElementById("advancedBiggestOnly").checked, true);
d.removeEventListener("wineatlas:comparison-changed", changed);
assert.equal(d.querySelectorAll("#compareGrid .compareCard").length, 0, "hidden legacy comparison must not be rendered");
assert.ok(Object.isFrozen(w.WineModel.metrics));

// Entity encoding is tested only in its documented HTML contexts.
const payloads = [
  '<img src=x onerror="alert(1)">', '"><svg onload=alert(1)>',
  "' autofocus onfocus=alert(1) x='", '&lt;script&gt;alert(1)&lt;/script&gt;', '` onmouseover=alert(1)'
];
for (const value of payloads) {
  const host = d.createElement("div");
  host.innerHTML = `<span>${w.WineAtlas.escapeHtml(value)}</span><input value="${w.WineAtlas.escapeAttr(value)}">`;
  assert.equal(host.querySelector("span").textContent, value);
  assert.equal(host.querySelector("input").getAttribute("value"), value);
  assert.equal(host.querySelectorAll("img, svg, script, [onerror], [onload], [onfocus], [onmouseover]").length, 0);
}
for (const url of ["javascript:alert(1)", "data:text/html,<script>alert(1)</script>", "http://example.com", "//example.com", "/relative", "https://user:password@example.com", "java\nscript:alert(1)", "https://exa\tmple.com"]) {
  assert.equal(w.WineDOM.referenceUrl(url), null, `unsafe reference: ${url}`);
  assert.equal(w.WineDOM.referenceLink({ name: payloads[0], url }).tagName, "SPAN");
}
const safe = w.WineDOM.referenceLink({ name: payloads[0], url: "https://example.com/reference?a=1&b=2" });
assert.equal(safe.tagName, "A");
assert.equal(safe.textContent, payloads[0]);
assert.equal(safe.querySelector("img"), null);
assert.equal(safe.rel, "noopener noreferrer");

// Exercise both retained legacy templates and new DOM rendering with hostile data.
const { grapes, regions } = w.WineAtlas.getData();
const hostile = payloads[0];
grapes["pinot-noir"].name = hostile;
regions.burgundy.grapes["pinot-noir"].pairings.push(hostile);
regions.burgundy.grapes["pinot-noir"].expect = hostile;
regions.burgundy.grapes["pinot-noir"].notes.Fruit.push(hostile);
regions.burgundy.summary = hostile;
w.WineAtlas.selectProfile("pinot-noir", "burgundy");
await app.settle();
assert.equal(d.querySelectorAll("[onerror], [onload], [onfocus], [onmouseover]").length, 0);
assert.ok(d.getElementById("pair").textContent.includes(hostile));
assert.equal(d.getElementById("expect").textContent, hostile);
assert.ok(d.getElementById("notes").textContent.includes(hostile));
await app.close();

const failed = await createApp({ expectError: true, fetch: resource =>
  String(resource).endsWith("grapes.json") ? { ok: false, status: 503 } : undefined });
assert.equal(failed.document.getElementById("appShell").classList.contains("hidden"), false);
assert.equal(failed.document.querySelector("main").getAttribute("role"), "alert");
assert.match(failed.document.querySelector("main").textContent, /could not load/);
assert.equal(failed.document.querySelector("main").closest(".hidden"), null, "startup error must be visible");
await failed.close();

// Hold optional requests indefinitely; pure wine queries must already work.
let releaseAliases, releaseGuidance;
const delayed = await createApp({ fetch: (resource, options, localFetch) => {
  if (String(resource).endsWith("food-aliases.json")) return new Promise(resolve => { releaseAliases = () => resolve(localFetch(resource)); });
  if (String(resource).endsWith("food-dishes.json")) return new Promise(resolve => { releaseGuidance = () => resolve(localFetch(resource)); });
} });
async function deadline(promise) {
  let timer;
  try { return await Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("operation waited for unrelated optional data")), 500); })]); }
  finally { clearTimeout(timer); }
}
assert.equal((await deadline(delayed.window.WineSearch.rank("cremant"))).length, 5);
assert.equal((await deadline(delayed.window.WineSearch.rank("cremant pinot noir"))).length, 2);
releaseAliases();
assert.ok((await deadline(delayed.window.WineSearch.rank("hamburger"))).length > 0, "aliases must not wait for dish prose");
const delayedInput = delayed.document.getElementById("searchInput");
delayedInput.value = "cochinita pibil";
await deadline(delayed.window.renderEnhancedAtlasSearch());
const originalButton = delayed.document.querySelector("#searchResults button");
originalButton.focus();
releaseGuidance();
await delayed.settle();
assert.ok(delayed.document.querySelector("#searchResults .food-guidance"));
assert.equal(delayed.document.activeElement, originalButton, "late guidance must preserve result nodes and keyboard focus");
await delayed.close();

// Bounded loading must settle and abort even when a fetch mock ignores AbortSignal.
let optionalSignal, requiredSignal;
const hanging = await createApp({ fetch: (resource, options) => {
  if (String(resource).endsWith("never-optional.json")) { optionalSignal = options.signal; return new Promise(() => {}); }
  if (String(resource).endsWith("never-required.json")) { requiredSignal = options.signal; return new Promise(() => {}); }
} });
assert.equal(Object.keys(await hanging.window.WineData.json("./never-optional.json", { optional: true, timeoutMs: 5 })).length, 0);
assert.equal(optionalSignal.aborted, true);
await assert.rejects(hanging.window.WineData.json("./never-required.json", { timeoutMs: 5 }), /timed out/);
assert.equal(requiredSignal.aborted, true);
await hanging.close();

// Keep the explicit basic fallbacks functional without duplicate enhanced work.
const fallback = await createApp({ omitScripts: ["advanced-compare.js", "compare-discovery.js", "compare-state.js", "smart-discovery.js", "search-enhance.js"] });
await fallback.settle();
fallback.window.WineAtlas.setMode("compare");
assert.ok(fallback.document.querySelectorAll("#compareGrid .compareCard").length >= 2);
fallback.window.WineAtlas.selectProfile("pinot-noir", "burgundy");
assert.ok(fallback.document.querySelectorAll("#similarWines button").length > 0);
const basicSearch = fallback.document.getElementById("searchInput");
basicSearch.value = "pinot";
basicSearch.dispatchEvent(new fallback.window.Event("input", { bubbles: true }));
assert.ok(fallback.document.querySelectorAll("#searchResults button").length > 0);
await fallback.close();
console.log("OK: state transitions, loading failures, safe rendering and explicit fallbacks passed");
