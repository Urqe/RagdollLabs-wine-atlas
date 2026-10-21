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
console.log('OK: search request races, empty comparison intent and malformed optional learning enrichment');
