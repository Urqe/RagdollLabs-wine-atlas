import assert from "node:assert/strict";
import { createApp } from "./harness.mjs";

const app = await createApp();
const { window: w, document: d } = app;
await app.settle();
const key = row => `${row.item.grapeId}::${row.item.regionId}`;
const keys = rows => Array.from(rows, key);
const results = query => w.WineSearch.rank(query, 200);
const has = (rows, id) => keys(rows).includes(id);

// Consumer-facing style words constrain the actual wine, not its tasting prose.
const rose = await results("rosé");
assert.equal(rose.length, 4);
assert.ok(has(rose, "pinot-noir::cremant-alsace"), "sparkling rosé is still rosé");
assert.ok(!has(rose, "gewurztraminer::alsace"), "rose aromas do not make a wine rosé");
assert.deepEqual(keys(rose), keys(await results("ROSE WINES")));
const white = await results("white");
assert.ok(!has(white, "pinot-noir::burgundy"), "white-wine prose must not classify red Burgundy as white");
assert.ok(has(white, "pinot-noir::cremant-bourgogne"), "blanc de noirs uses the wine's colour, not the grape's");
assert.ok(has(white, "semillon::sauternes"), "golden sweet white wine remains white");
const sweet = await results("sweet wine");
assert.ok(has(sweet, "semillon::sauternes"));
assert.ok(has(sweet, "muscat-blanc::constantia"));
assert.ok(!has(sweet, "syrah::barossa"), "sweet oak is not residual sweetness");
assert.ok(!has(sweet, "riesling::mosel"), "the modeled off-dry Mosel is not a sweet-wine profile");
const orange = await results("orange wine");
assert.equal(orange.length, 2);
assert.ok(has(orange, "rkatsiteli::kakheti-qvevri-amber"));
assert.ok(!has(orange, "muscat-blanc::constantia"), "orange-fruit notes are not skin contact");
assert.deepEqual(keys(orange), keys(await results("amber")));
assert.equal((await results("red white")).length, 0, "conflicting filters must not broaden");
assert.equal((await results("still sparkling")).length, 0);

// Families, sweetness, colour, grape, place and food remain AND constraints.
const sparklingDry = await results("sparkling dry");
assert.equal(sparklingDry.length, 8);
assert.ok(has(sparklingDry, "champagne-blend::champagne-brut-nv"));
assert.ok(!has(sparklingDry, "glera::prosecco-doc"), "a dry-to-off-dry range is not guaranteed dry");
assert.deepEqual(keys(await results("sparkling sweet")), ["muscat-blanc::moscato-dasti"]);
assert.deepEqual(keys(await results("sparkling off-dry")), ["glera::prosecco-doc"]);
assert.deepEqual(keys(await results("sparkling dry-to-off-dry")), ["glera::prosecco-doc"]);
assert.deepEqual(keys(await results("dry sparkling rose")), ["pinot-noir::cremant-alsace"]);
assert.deepEqual(keys(await results("cremant dry chardonnay")), ["chardonnay::cremant-bourgogne"]);
assert.deepEqual(keys(await results("white fortified")), ["palomino::jerez-fino"], "wine colour distinguishes pale Fino from amber/brown fortified expressions");
assert.deepEqual(keys(await results("dry Riesling Germany")), ["riesling::rheingau"]);
const chicken = await results("dry sparkling fried chicken");
assert.ok(chicken.length > 0 && chicken.every(row => row.pairingScore > 0));
assert.ok(!has(chicken, "glera::prosecco-doc"));

// Explicit sensory search bypasses reserved style words only after its marker.
assert.ok(has(await results("aroma: rose"), "gewurztraminer::alsace"));
assert.ok(has(await results("notes: orange"), "muscat-blanc::constantia"));
assert.ok(!has(await results("dry aroma: rose"), "gewurztraminer::alsace"));
assert.ok(has(await results("dry aroma: rose"), "nebbiolo::barolo"));
assert.equal((await results("aroma:")).length, 0);
assert.equal((await results("aroma: sweet oak")).length, 0, "aroma mode searches typical note values, not unrelated prose");

// Whole-token identity matching avoids interior-substring matches, with a
// last-token prefix fallback so incomplete type-ahead queries remain useful.
assert.equal((await results("inot")).length, 0);
assert.equal((await results("strain")).length, 0, "restrained prose must not match strain");
assert.equal((await results("port")).length, 2, "Port must not match Portugal as a substring");
assert.ok((await results("cab")).length > 0);
assert.equal((await results("cremant champagne")).length, 0);
assert.equal((await results("cremant cabernet sauvignon")).length, 0);

// Synonyms resolve existing identities without inventing appellation coverage.
for (const [alias, canonical] of [["Spätburgunder", "Pinot Noir"], ["Spaetburgunder", "Pinot Noir"],
  ["Primitivo", "Zinfandel"], ["Alvarinho", "Albariño"]]) {
  assert.deepEqual(keys(await results(alias)), keys(await results(canonical)), alias);
  assert.ok(w.WineSearch.notices(alias)[0].includes("Showing represented regions"));
}
assert.deepEqual(keys(await results("Spaetburgunder Germany")), ["pinot-noir::ahr"]);
assert.deepEqual(keys(await results("Primitivo Lodi")), ["zinfandel::lodi"]);
assert.deepEqual(keys(await results("Alvarinho Uruguay")), ["albarino::maldonado"]);
assert.deepEqual(keys(await results("Primitivo Italy")), ["zinfandel::primitivo-manduria"]);
assert.match(w.WineSearch.notices("Primitivo")[0], /regions in Italy, USA/);
assert.match(w.WineSearch.notices("Alvarinho")[0], /Portugal, Spain, Uruguay/);

// The generic Muscat family and a named appellation are different searches.
const muscat = await results("moscato");
for (const id of ["muscat-blanc::constantia", "muscat-blanc::crimea-muscat", "muscat-blanc::moscato-dasti", "moscatel-alexandria::setubal-moscatel"]) {
  assert.ok(has(muscat, id), id);
}
assert.deepEqual(keys(muscat), keys(await results("muscat")));
assert.deepEqual(keys(await results("Moscato d’Asti")), ["muscat-blanc::moscato-dasti"]);
assert.deepEqual(keys(await results("sparkling moscato")), ["muscat-blanc::moscato-dasti"]);
assert.equal((await results("Moscato Bianco")).length, 3, "a longer grape name takes precedence over generic moscato");

// Food phrases containing reserved words must stay intact, including aliases.
for (const query of ["white pizza", "white pizzas", "sweet and sour pork", "sweet sour pork", "sweet-and-sour pork"]) {
  const rows = await results(query);
  assert.ok(rows.length && rows.every(row => row.pairingScore > 0), query);
  assert.equal(w.WineSearch.parse(query).constraints.length, 0, query);
}
const whitePizza = await results("white pizza");
assert.ok(has(whitePizza, "pinot-noir::burgundy"), "white pizza is a dish, not a wine-colour request");
const sweetPork = await results("white wine sweet-and-sour pork");
assert.ok(sweetPork.length && sweetPork.every(row => row.pairingScore > 0));
assert.ok(sweetPork.every(row => ["white", "white-gold"].includes(w.WineModel.color(row.item))));

// Exercise both actual result presentations, not just the query helper. Queries
// fit both result limits so the visible Explore and Compare candidates agree.
w.WineAtlas.begin("grape");
for (const query of ["rosé", "sparkling dry", "sparkling sweet", "orange wine", "Primitivo", "Moscato d'Asti", "sweet sour pork"]) {
  const input = d.getElementById("searchInput");
  input.value = query;
  input.dispatchEvent(new w.Event("input", { bubbles: true }));
  await app.settle();
  const explore = [...d.querySelectorAll("#searchResults .search-result")].map(button => `${button.dataset.grape}::${button.dataset.region}`);
  w.WineAtlas.setMode("compare");
  d.getElementById("compareDiscoveryInput").value = query;
  await w.compareRunDiscovery();
  const compare = [...d.querySelectorAll("#compareDiscoveryResults button[data-profile-key]")].map(button => button.dataset.profileKey);
  assert.deepEqual(explore, compare, query);
  assert.deepEqual(explore, keys(await results(query)), query);
  w.WineAtlas.setMode("explore");
}
d.getElementById("searchInput").value = "Primitivo Italy";
await w.renderEnhancedAtlasSearch();
assert.match(d.getElementById("searchResults").textContent, /regions in Italy, USA/);
assert.match(d.getElementById("searchResults").textContent, /Primitivo.*Manduria/);
d.getElementById("searchInput").value = 'aroma: <img src=x onerror="alert(1)">';
await w.renderEnhancedAtlasSearch();
assert.equal(d.querySelectorAll("#searchResults img, #searchResults [onerror]").length, 0);
assert.match(d.getElementById("searchHelp").textContent, /aroma: rose/);
assert.match(d.getElementById("compareSearchHelp").textContent, /aroma: rose/);
await app.close();

// Loading a food vocabulary must not block pure structured, identity or aroma
// requests. Once loaded, reparse dishes whose words initially looked like style.
let releaseAliases;
const delayed = await createApp({ fetch: (resource, options, localFetch) => {
  if (String(resource).endsWith("food-aliases.json")) return new Promise(resolve => { releaseAliases = () => resolve(localFetch(resource)); });
} });
async function promptly(promise) {
  let timer;
  try {
    return await Promise.race([promise, new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error("wine search waited for food aliases")), 500);
    })]);
  } finally { clearTimeout(timer); }
}
for (const query of ["sparkling dry", "Primitivo", "aroma: rose", "cremant chardonnay", "off-dry"]) {
  assert.ok((await promptly(delayed.window.WineSearch.rank(query))).length > 0, query);
}
const porkPending = delayed.window.WineSearch.rank("sweet sour pork");
releaseAliases();
const pork = await porkPending;
assert.ok(pork.length && pork.every(row => row.pairingScore > 0), "reparse must protect a newly loaded food alias");
await delayed.close();
console.log("OK: structured style search, aroma intent, synonyms, food protection and Explore/Compare parity passed");
