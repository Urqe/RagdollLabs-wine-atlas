import assert from 'node:assert/strict';
import { createApp } from './harness.mjs';
const app = await createApp();
const { window: w, document: d } = app;
await app.settle();
const keys = ['vidal-blanc', 'riesling', 'cabernet-franc'].map(g => `${g}::niagara-icewine`);
const search = async query => Array.from(await w.WineSearch.rank(query, 200), row => `${row.item.grapeId}::${row.item.regionId}`).sort();
const data = w.WineAtlas.getData();
assert.equal(w.WineAtlas.allPairs().length, 150);
assert.equal(Object.keys(data.grapes).length, 60);
assert.equal(Object.keys(data.regions).length, 118);
assert.equal(new Set(w.WineAtlas.allPairs().map(p => p.region.country)).size, 23);
assert.equal(data.grapes['vidal-blanc'].indigenous, false);
assert.equal(data.grapes['vidal-blanc'].color, 'white');
for (const query of ['Canada', 'Canadian icewine', 'ice wine', 'ice-wine', 'Niagara', 'Niagara Peninsula', 'Ontario', 'vin de glace']) {
  assert.deepEqual(await search(query), [...keys].sort(), query);
}
for (const [query, grape] of [['Vidal', 'vidal-blanc'], ['Vidal Blanc', 'vidal-blanc'], ['Vidal 256 icewine', 'vidal-blanc'], ['Niagara Riesling', 'riesling'], ['red ice wine', 'cabernet-franc']]) {
  assert.deepEqual(await search(query), [`${grape}::niagara-icewine`], query);
}
for (const query of ['dry Niagara', 'dry Vidal', 'fortified icewine', 'botrytis icewine', 'sparkling icewine', 'Okanagan icewine', 'German Eiswein', 'sweet Finger Lakes Riesling']) {
  assert.deepEqual(await search(query), [], query);
}
for (const query of ['sparkling ice wine', 'British Columbia icewine', 'Eiswein']) assert.match(w.WineSearch.notices(query).join(' '), /not represented/, query);
const get = (g, r = 'niagara-icewine') => w.WineAtlas.combinedProfile(g, r);
const vidal = get('vidal-blanc'), riesling = get('riesling'), cabfranc = get('cabernet-franc');
for (const item of [vidal, riesling, cabfranc]) {
  assert.equal(item.regional.style.family, 'sweet');
  assert.equal(item.regional.style.productionClass, 'natural-freeze');
  assert.equal(item.regional.style.effervescence, 'none');
  assert.equal(item.profile.sweetness, 5);
  assert.equal(item.profile.alcohol, 1.5);
  assert.ok(item.profile.acidity >= 4);
  assert.ok(w.WineModel.compatible(item, get('semillon', 'sauternes')));
  assert.equal(w.smartIsClose(item, get('semillon', 'sauternes')), false);
  assert.equal(w.smartIsClose(item, get('riesling', 'finger-lakes-dry')), false);
  w.WineAtlas.selectProfile(item.grapeId, item.regionId);
  await app.settle();
  assert.equal(d.activeElement.id, 'profileHeading');
  assert.equal(d.querySelectorAll('#bars .bar').length, 8);
  assert.ok(d.querySelector('#locatorMap svg'));
  assert.ok(d.querySelectorAll('#pair .chip').length >= 4);
  assert.match(d.getElementById('profileExpression').textContent, /Icewine/);
  assert.match(d.getElementById('sourcesDrawer').textContent, /Reviewed 2026-10-21/);
  assert.match(d.getElementById('sourcesDrawer').textContent, /Evidence still to review/);
  assert.match(d.getElementById('specialStyle').textContent, /pressed (?:immediately )?while frozen/);
  assert.equal(new URL(w.location.href).searchParams.get('region'), 'niagara-icewine');
}
assert.equal(w.WineModel.color(cabfranc), 'red');
assert.ok(cabfranc.profile.tannin <= .5);
assert.equal(w.WineModel.compatible(cabfranc, get('cabernet-franc', 'monticello')), false);
assert.equal(w.WineModel.compatible(riesling, get('riesling', 'mosel')), false);
// Production class must block close-style substitution even when all scores are equal.
const sameNumbers = {...riesling, profile: {...vidal.profile}, regional: {...riesling.regional, style: {...riesling.regional.style, productionClass: 'botrytised'}}};
assert.equal(w.smartIsClose(vidal, sameNumbers), false);
assert.ok(w.WineModel.styleDifferences(vidal, sameNumbers).some(x => /natural freezing.*noble-rot/.test(x)));
for (const query of ['Canadian icewine', 'red icewine', 'Niagara Riesling', 'dry Vidal', 'Eiswein']) {
  w.WineAtlas.begin('search'); d.getElementById('searchInput').value = query; await w.renderEnhancedAtlasSearch();
  const explore = [...d.querySelectorAll('#searchResults .search-result')].map(x => `${x.dataset.grape}::${x.dataset.region}`).sort();
  w.WineAtlas.setMode('compare'); d.getElementById('compareDiscoveryInput').value = query; await w.compareRunDiscovery();
  const compare = [...d.querySelectorAll('#compareDiscoveryResults button[data-profile-key]')].map(x => x.dataset.profileKey).sort();
  assert.deepEqual(explore, compare, query); assert.deepEqual(explore, await search(query), query);
}
w.WineComparison.replace(keys);
assert.equal(w.WineComparison.snapshot().keys.filter(Boolean).length, 3);
assert.match(d.getElementById('advancedCompareDifferences').textContent, /Colour/);
assert.match(d.getElementById('advancedCompareDifferences').textContent, /frozen/);
w.WineAtlas.setMode('explore'); w.WineGallery.show();
assert.equal(d.querySelectorAll('.gallery-card').length, 150);
assert.equal(d.querySelectorAll('#gallery-canada .gallery-card').length, 3);
d.querySelector('#gallery-canada .gallery-card[data-grape="vidal-blanc"]').click(); await app.settle();
assert.match(d.getElementById('title').textContent, /Vidal Blanc Icewine/);
assert.ok(!d.getElementById('identity').textContent.includes('Indigenous grape'));
d.querySelector('#expect [data-glossary-id="icewine"]').click(); await app.settle();
assert.equal(d.getElementById('glossaryDialogTitle').textContent, 'Icewine');
assert.match(d.getElementById('glossaryContent').textContent, /naturally frozen on the vine/);
assert.match(d.getElementById('glossaryContent').textContent, /Ontario-specific/);
d.getElementById('glossaryClose').click();
d.querySelector('[data-taste-basics]').click(); await app.settle();
assert.equal(d.querySelectorAll('[data-section-id="icewine"] .taste-example').length, 3);
assert.match(d.querySelector('[data-section-id="icewine"]').textContent, /British Columbia/);
d.querySelectorAll('[data-section-id="icewine"] .taste-example')[2].click(); await app.settle();
assert.match(d.getElementById('title').textContent, /Cabernet Franc Icewine/);
assert.equal(d.activeElement.id, 'profileHeading');
await app.close();
const restored = await createApp({url: 'https://example.test/RagdollLabs-wine-atlas/?view=compare&compare=vidal-blanc::niagara-icewine,riesling::niagara-icewine,cabernet-franc::niagara-icewine'});
await restored.settle(); assert.equal(restored.window.WineComparison.snapshot().keys.filter(Boolean).length, 3); await restored.close();
console.log('OK: R7 Canadian icewine identity, natural-freeze discovery, search precision/parity, colour, Compare, routes and Gallery');
