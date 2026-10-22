import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createApp, ROOT } from './harness.mjs';
const app = await createApp();
const { window: w, document: d } = app;
await app.settle();
w.WineAtlas.begin('search');
const input = d.getElementById('searchInput');
input.value = 'riesling';
const expected = (await w.WineSearch.rank('riesling', 10)).length;
// Same query can recur while an earlier request is pending (IME or A → B → A).
await Promise.all([w.renderEnhancedAtlasSearch(), w.renderEnhancedAtlasSearch()]);
assert.equal(d.querySelectorAll('#searchResults .search-result').length, expected);
const pending = w.renderEnhancedAtlasSearch();
input.value = '';
await w.renderEnhancedAtlasSearch();
await pending;
assert.equal(d.getElementById('searchResults').textContent, '', 'clearing cancels earlier output');
// Explicitly empty or invalid comparison routes cannot silently seed the previous profile.
w.WineAtlas.selectProfile('cabernet-sauvignon', 'napa');
w.WineNavigation.go({ view: 'compare', flightId: 'missing' });
assert.equal(w.WineComparison.profiles().length, 0);
assert.equal(d.querySelectorAll('#advancedCompareGrid .compareCard').length, 0);
assert.match(d.getElementById('liveStatus').textContent, /not available/);
await app.close();
const reset = await createApp();
await reset.settle();
reset.window.WineAtlas.selectProfile('pinot-noir', 'burgundy');
reset.window.WineComparison.replace([]);
reset.window.WineAtlas.setMode('compare');
assert.equal(reset.window.WineComparison.profiles().length, 0, 'explicit reset is a choice, not permission to auto-seed');
await reset.close();

const glossary = JSON.parse(await readFile(`${ROOT}/data/glossary.json`, 'utf8'));
const mixed = await createApp({ url: 'https://example.test/RagdollLabs-wine-atlas/?view=learn&lesson=acidity', fetch: resource =>
  String(resource).endsWith('glossary.json') ? { ok: true, json: async () => ({ ...glossary, broken: null, badAliases: { ...glossary.acidity, aliases: 'not-an-array' } }) } : undefined });
await mixed.settle();
await mixed.window.WineJourney.load();
assert.equal(mixed.window.WineJourney.loaded, true);
assert.match(mixed.document.getElementById('journeyView').textContent, /mouth-watering/);
await mixed.window.WineLearning.showGlossary();
assert.equal(mixed.document.querySelectorAll('.glossary-entry').length, Object.keys(glossary).length, 'retain good definitions and omit malformed records');
mixed.document.getElementById('glossaryClose').click();
await mixed.close();

for (const payload of [{ broken: null }, { broken: 42 }, { broken: { term: 'Incomplete' } }]) {
  const bad = await createApp({ url: 'https://example.test/RagdollLabs-wine-atlas/?view=learn&lesson=tannin', fetch: resource =>
    String(resource).endsWith('glossary.json') ? { ok: true, json: async () => payload } : undefined });
  await bad.settle();
  await bad.window.WineJourney.load();
  assert.equal(bad.window.WineJourney.loaded, true);
  assert.equal(bad.document.activeElement.id, 'journeyHeading');
  assert.match(bad.document.getElementById('journeyView').textContent, /drying or grippy/);
  bad.document.getElementById('journey-next').click();
  assert.equal(new URL(bad.window.location.href).searchParams.get('lesson'), 'body');
  await bad.close();
}
for (const payload of [{ title: 'Guide', intro: 'Intro', sections: 'not-an-array' }, { title: 'Guide', intro: 'Intro', sections: [null] }, { title: 'Guide', intro: 'Intro', sections: [{ id: 'bad', heading: 'Bad', body: 'not-an-array' }] }]) {
  const bad = await createApp({ fetch: resource => String(resource).endsWith('taste-basics.json') ? { ok: true, json: async () => payload } : undefined });
  await bad.settle();
  await bad.window.WineLearning.showGuide('scores');
  assert.equal(bad.document.getElementById('glossaryDialogTitle').textContent, 'Taste guide unavailable');
  bad.document.getElementById('glossaryClose').click();
  bad.window.WineAtlas.selectProfile('pinot-noir', 'burgundy');
  assert.equal(bad.document.activeElement.id, 'profileHeading');
  await bad.close();
}
const partialGuide = await createApp({ fetch: resource => String(resource).endsWith('taste-basics.json') ? { ok: true, json: async () => ({ title: 'Guide', intro: 'Intro', sections: [null, { id: 'valid', heading: 'Valid section', body: ['Useful text'], examples: [null, { grape: 'pinot-noir', region: 'burgundy', label: 'Burgundy' }] }] }) } : undefined });
await partialGuide.settle();
await partialGuide.window.WineLearning.showGuide('valid');
assert.equal(partialGuide.document.querySelectorAll('.taste-section').length, 1);
assert.equal(partialGuide.document.querySelectorAll('.taste-example').length, 1);
partialGuide.document.getElementById('glossaryClose').click();
await partialGuide.close();

// Compare searches can overlap while food vocabulary loads. The latest input
// event wins even when a previous request has the same query text.
const compare = await createApp();
await compare.settle();
compare.window.WineAtlas.setMode('compare');
const compareInput = compare.document.getElementById('compareDiscoveryInput');
const originalRank = compare.window.WineSearch.rank;
const oldRows = await originalRank('pinot', 12);
const newRows = await originalRank('riesling', 12);
const pendingRanks = [];
compare.window.WineSearch.rank = () => new Promise(resolve => pendingRanks.push(resolve));
compareInput.value = 'pinot'; const first = compare.window.compareRunDiscovery();
compareInput.value = 'riesling'; const second = compare.window.compareRunDiscovery();
compareInput.value = 'pinot'; const third = compare.window.compareRunDiscovery();
pendingRanks[2](newRows); await third;
pendingRanks[0](oldRows); pendingRanks[1](newRows); await Promise.all([first, second]);
assert.match(compare.document.getElementById('compareDiscoveryResults').textContent, /Riesling/);
assert.doesNotMatch(compare.document.getElementById('compareDiscoveryResults').textContent, /Pinot/);
compareInput.value = 'pinot'; const leaving = compare.window.compareRunDiscovery();
compare.window.WineAtlas.setMode('explore');
pendingRanks[3](oldRows); await leaving;
assert.equal(compare.document.getElementById('compareDiscoveryResults').textContent, '');
compare.window.WineSearch.rank = originalRank;
await compare.close();

// A slow optional lesson must have a shareable route and a visible focus target
// while loading; navigating away must prevent its late response from rerouting.
let finishJourney;
const slow = await createApp({ fetch: (resource, options, localFetch) =>
  String(resource).endsWith('beginner-journey.json') ? new Promise(resolve => { finishJourney = () => resolve(localFetch(resource)); }) : undefined });
slow.window.WineNavigation.go({ view: 'learn', lessonId: 'tannin' });
assert.equal(new URL(slow.window.location.href).searchParams.get('lesson'), 'tannin');
assert.equal(slow.document.activeElement.id, 'journeyHeading');
assert.match(slow.document.getElementById('journeyHeading').textContent, /Loading/);
slow.window.WineNavigation.go({ view: 'explore' });
finishJourney(); await slow.settle();
assert.equal(new URL(slow.window.location.href).searchParams.get('view'), 'explore');
assert.ok(!slow.document.getElementById('emptyView').classList.contains('hidden'));
await slow.close();
let finishFlights;
const slowFlight = await createApp({ fetch: (resource, options, localFetch) =>
  String(resource).endsWith('tasting-flights.json') ? new Promise(resolve => { finishFlights = () => resolve(localFetch(resource)); }) : undefined });
slowFlight.window.WineNavigation.go({ view: 'worksheet', flightId: 'sauvignon-two-places' });
assert.equal(new URL(slowFlight.window.location.href).searchParams.get('view'), 'worksheet');
assert.equal(slowFlight.document.activeElement.id, 'flightsHeading');
finishFlights(); await slowFlight.settle();
assert.equal(slowFlight.document.activeElement.id, 'worksheetHeading');
assert.match(slowFlight.document.getElementById('worksheetView').textContent, /Print worksheet/);
await slowFlight.close();
console.log('OK: search races, optional route loading, empty comparison intent and malformed learning enrichment');
