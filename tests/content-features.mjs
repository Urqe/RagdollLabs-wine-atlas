import assert from "node:assert/strict";
import { createApp } from "./harness.mjs";

const { window, document, settle, close } = await createApp();
await settle();
const atlas = window.WineAtlas;

function open(grape, region) {
  assert.equal(atlas.selectProfile(grape, region), true, `${grape}/${region} should open`);
}

// Newly covered wines render as full profiles.
for (const [grape, region] of [["malbec", "mendoza"], ["malbec", "cahors"], ["gamay", "beaujolais"],
  ["gruner-veltliner", "wachau"], ["albarino", "rias-baixas"], ["champagne-blend", "champagne-brut-nv"],
  ["pinot-gris", "alto-adige"], ["pinot-gris", "alsace"], ["muscat-blanc", "moscato-dasti"]]) {
  open(grape, region);
  await settle();
  assert.equal(document.querySelectorAll("#bars .bar").length, 8, `${grape}/${region} shows eight metrics`);
  assert.ok(document.querySelectorAll("#why li").length >= 1, `${grape}/${region} explains its style`);
}

// Regional Why items scoped to grapes live in regions.json.
open("merlot", "bordeaux");
await settle();
assert.ok(!document.getElementById("why").textContent.includes("Left Bank gravel"), "Cabernet-only explanation is hidden for Merlot");
open("cabernet-sauvignon", "bordeaux");
await settle();
assert.ok(document.getElementById("why").textContent.includes("Left Bank gravel"));

// The indigenous badge follows the grape's origin, not every place it grows.
open("saperavi", "kakheti");
await settle();
assert.ok(document.getElementById("identity").textContent.includes("Indigenous grape"));
open("saperavi", "krasnodar");
await settle();
assert.ok(!document.getElementById("identity").textContent.includes("Indigenous grape"));

// Similar rounded scores are permitted; profile identity is not a numeric uniqueness constraint.
for (const item of atlas.allPairs()) {
  assert.ok(item.regional.style?.label && item.regional.style?.composition?.text);
}

// Alcohol follows the documented ABV anchors.
const score = (grape, region) => atlas.combinedProfile(grape, region).profile;
assert.ok(score("riesling", "mosel").alcohol <= 1.5, "Mosel Kabinett is low in alcohol");
assert.ok(score("pinot-noir", "burgundy").alcohol >= 3, "red Burgundy is mid-range, not light");
assert.equal(score("port-blend", "douro-port-ruby").alcohol, 5);
assert.equal(score("chardonnay", "cremant-bourgogne").sweetness, 1, "Brut sparkling scores as dry (1)");

// The Aromatic mood only offers aromatic white grapes.
const aromaticButton = [...document.querySelectorAll("#moodButtons button")].find(button => button.textContent.includes("Aromatic"));
assert.ok(aromaticButton);
for (let i = 0; i < 10; i += 1) {
  aromaticButton.click();
  await settle();
  const grape = atlas.getActiveProfile().grape;
  assert.equal(grape?.aromatic, true, `Aromatic mood picked ${document.getElementById("title").textContent}`);
}

// Legacy same-grape comparison markup is gone; Compare has one implementation.
assert.equal(document.getElementById("cg"), null);
assert.equal(document.getElementById("compareGrid"), null);
assert.ok(document.getElementById("advancedCompareControls"));

// "How wine gets its taste" opens in the learning dialog and its examples open profiles.
const tasteButton = document.getElementById("tasteBasicsOpen");
assert.ok(tasteButton);
tasteButton.click();
await settle();
await new Promise(resolve => setImmediate(resolve));
assert.equal(document.getElementById("glossaryDialogTitle").textContent, "How wine gets its taste");
assert.ok(document.querySelectorAll(".taste-section").length >= 10);
const example = [...document.querySelectorAll(".taste-example")].find(button => button.textContent.includes("Moscato"));
assert.ok(example);
example.click();
await settle();
assert.ok(document.getElementById("title").textContent.includes("Moscato d'Asti"));

// Beginner glossary terms are available.
document.getElementById("glossaryOpen").click();
await settle();
await new Promise(resolve => setImmediate(resolve));
const glossaryText = document.getElementById("glossaryContent").textContent;
for (const term of ["Acidity", "Body", "Dry, off-dry and sweet", "Oak", "Carbonic maceration", "Dosage"]) {
  assert.ok(glossaryText.includes(term), `glossary includes ${term}`);
}
document.getElementById("glossaryClose").click();

// Historical guide uses the same modal, typography and profile navigation.
const historyControl = document.getElementById("historyOpen");
assert.equal(historyControl.tagName, "BUTTON");
historyControl.click();
assert.equal(document.getElementById("glossaryDialogTitle").textContent, "Wine before the modern cellar");
assert.equal(document.querySelectorAll("#glossaryContent .history-section").length, 3);
const evidence = document.querySelector("#glossaryContent .history-evidence");
assert.ok(evidence && !evidence.open);
assert.equal(evidence.querySelectorAll("li").length, 3);
assert.equal(document.querySelectorAll("#glossaryContent .history-section .history-sources").length, 0);
const historyProfile = document.querySelector('#glossaryContent a[href*="region=kakheti-qvevri-amber"]');
assert.ok(historyProfile);
historyProfile.click();
await settle();
assert.equal(document.getElementById("glossaryDialog").open, false);
assert.ok(document.getElementById("title").textContent.includes("Kakheti"));

// Constrained search covers the new Champagne and Moscato profiles.
assert.equal((await window.WineSearch.rank("champagne")).length, 2);
assert.ok((await window.WineSearch.rank("moscato")).length >= 1);

// Glossary terms are tappable inside the "Wine style & production" section too.
open("chardonnay", "champagne-blanc-de-blancs");
await settle();
await new Promise(resolve => setImmediate(resolve));
assert.ok(document.querySelector('#specialStyle .glossary-term[data-glossary-id="lees"]'), "lees is annotated in the style section");

// Loire is split into honest sub-regions; Mosel notes its range of styles.
assert.equal(atlas.getData().regions.loire.name, "Touraine");
assert.ok(atlas.combinedProfile("chenin-blanc", "anjou"));
assert.equal(atlas.combinedProfile("chenin-blanc", "loire"), null);
assert.match(atlas.combinedProfile("riesling", "mosel").regional.expect, /dry \(trocken\) to sweet/);

// The score link opens the explainer at "Reading the scores".
const scoreHelp = document.getElementById("scoreHelp");
assert.ok(scoreHelp);
scoreHelp.click();
await settle();
await new Promise(resolve => setImmediate(resolve));
assert.equal(document.getElementById("glossaryDialogTitle").textContent, "How wine gets its taste");
assert.ok(document.querySelector('.taste-section[data-section-id="scores"]').classList.contains("glossary-entry-focused"));
document.getElementById("glossaryClose").click();

// Profile changes create history entries; Back restores the previous wine, then the landing page.
const start = window.history.length;
open("malbec", "mendoza");
open("malbec", "cahors");
assert.ok(window.history.length >= start + 1, "selecting a profile adds a history entry");
assert.equal(new URL(window.location.href).searchParams.get("region"), "cahors");
window.history.back();
await new Promise(resolve => window.addEventListener("popstate", resolve, { once: true }));
await settle();
assert.equal(document.getElementById("title").textContent, "Malbec · Mendoza");

// Compare seeds the current wine only on the first visit, so a cleared Compare stays empty.
atlas.setMode("compare");
await settle();
assert.ok(window.WineComparison.snapshot().keys[0], "first visit seeds the current wine");
window.WineComparison.replace([]);
atlas.setMode("explore");
atlas.setMode("compare");
await settle();
assert.equal(window.WineComparison.snapshot().keys[0], "", "a cleared Compare is not re-seeded");
atlas.setMode("explore");

// Link previews and favicon are declared.
assert.ok(document.querySelector('link[rel="icon"]'));
assert.match(document.querySelector('meta[property="og:image"]').content, /^https:\/\/.+og-image\.jpg$/);

await close();
console.log("OK: new wines, calibration, scoped Why entries, origin badges, taste explainer, glossary, history and Compare seeding passed");
