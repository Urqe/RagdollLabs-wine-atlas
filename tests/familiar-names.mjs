import assert from 'node:assert/strict';
import { createApp } from './harness.mjs';
const app = await createApp();
const { window: w, document: d } = app;
await app.settle();
const keys = rows => Array.from(rows, row => `${row.item.grapeId}::${row.item.regionId}`);
const search = async query => keys(await w.WineSearch.rank(query, 200));
const newPairs = [['chardonnay','chablis'],['zinfandel','primitivo-manduria'],['corvina','valpolicella'],['corvina','amarone'],['verdejo','rueda'],['pinotage','stellenbosch']];
const data = w.WineAtlas.getData();
assert.equal(Object.keys(data.grapes).length, 59);
assert.equal(Object.keys(data.regions).length, 112);
assert.equal(w.WineAtlas.allPairs().length, 141);
assert.equal(new Set(w.WineAtlas.allPairs().map(item=>item.region.country)).size, 22);
for (const [grape, region] of newPairs) {
  assert.ok(w.WineAtlas.selectProfile(grape, region));
  await app.settle();
  assert.equal(d.activeElement.id, 'profileHeading');
  assert.equal(d.querySelectorAll('#bars .bar').length, 8);
  assert.ok(d.querySelector('#locatorMap svg'));
  assert.match(d.getElementById('sourcesDrawer').textContent, /Reviewed 2026-10-20/);
  assert.match(d.getElementById('sourcesDrawer').textContent, /Evidence still to review/);
  assert.ok(d.querySelectorAll('#pair .chip').length >= 4);
  assert.equal(new URL(w.location.href).searchParams.get('grape'), grape);
  assert.equal(new URL(w.location.href).searchParams.get('region'), region);
}
const exact = [
 ['Chablis','chardonnay::chablis'], ['dry Primitivo Puglia','zinfandel::primitivo-manduria'],
 ['Primitivo di Manduria','zinfandel::primitivo-manduria'], ['Valpolicella','corvina::valpolicella'],
 ['Valpolicella Classico','corvina::valpolicella'], ['Amarone della Valpolicella','corvina::amarone'],
 ['Amarone Valpolicella','corvina::amarone'], ['appassimento','corvina::amarone'],
 ['dry appassimento','corvina::amarone'], ['Rueda Verdejo','verdejo::rueda'], ['Pinotage','pinotage::stellenbosch']
];
for (const [query, key] of exact) assert.deepEqual(await search(query), [key], query);
assert.deepEqual((await search('Corvina')).sort(), ['corvina::amarone','corvina::valpolicella']);
assert.deepEqual(await search('Primitivo Lodi'), ['zinfandel::lodi']);
assert.deepEqual(await search('sweet Primitivo Italy'), []);
assert.deepEqual(await search('sweet appassimento'), []);
assert.match(w.WineSearch.notices('Primitivo')[0], /Italy, USA/);
for (const query of ['Valpolicella Ripasso','Ripasso','Recioto della Valpolicella','Primitivo di Manduria Dolce Naturale','Chablis Grand Cru','Chablis Premier Cru','Petit Chablis']) {
  assert.deepEqual(await search(query), [], query);
  assert.match(w.WineSearch.notices(query).join(' '), /not represented|not separately represented|not represented separately/, query);
}
// Same grape identity; production remains an explained contrast, not a substitute.
const valpo = w.WineAtlas.combinedProfile('corvina','valpolicella');
const amarone = w.WineAtlas.combinedProfile('corvina','amarone');
assert.ok(w.WineModel.compatible(valpo, amarone));
assert.equal(w.smartIsClose(valpo, amarone), false);
const contrast = w.smartRecommendations(valpo).find(route=>route.item.regionId === 'amarone');
assert.equal(contrast.relation, 'contrast');
assert.match(contrast.reason, /dried grapes \(appassimento\)/);
w.WineAtlas.selectProfile('corvina','valpolicella');
d.querySelector('#specialStyle button').click();
await app.settle();
assert.match(d.getElementById('profileExpression').textContent, /Appassimento/);
assert.ok(d.querySelector('#specialStyle .glossary-term[data-glossary-id="appassimento"]'));
// Profile-specific names reach every result/control without changing IDs or aliases.
w.WineAtlas.selectProfile('zinfandel','primitivo-manduria');
await app.settle();
assert.match(d.getElementById('title').textContent, /^Primitivo \(Zinfandel\)/);
assert.match(d.getElementById('placeGrape').selectedOptions[0].textContent, /Primitivo/);
assert.match(d.getElementById('liveStatus').textContent, /Primitivo/);
w.WineGallery.show();
assert.match(d.querySelector('.gallery-card[data-region="primitivo-manduria"]').textContent, /Primitivo \(Zinfandel\)/);
assert.equal(d.querySelectorAll('.gallery-card').length, 141);
w.WineAtlas.begin('search');
for (const query of ['Primitivo Italy','Valpolicella','Amarone','Chablis','Rueda Verdejo','Pinotage']) {
  d.getElementById('searchInput').value = query;
  await w.renderEnhancedAtlasSearch();
  const explore = [...d.querySelectorAll('#searchResults .search-result')].map(x=>`${x.dataset.grape}::${x.dataset.region}`);
  w.WineAtlas.setMode('compare');
  d.getElementById('compareDiscoveryInput').value = query;
  await w.compareRunDiscovery();
  const compare = [...d.querySelectorAll('#compareDiscoveryResults button[data-profile-key]')].map(x=>x.dataset.profileKey);
  assert.deepEqual(explore, compare, query);
  assert.deepEqual(explore, await search(query), query);
  w.WineAtlas.setMode('explore');
}
w.WineAtlas.setMode('compare');
w.WineComparison.replace(['zinfandel::primitivo-manduria','zinfandel::lodi']);
assert.match(d.querySelector('#advancedCompareGrid h3').textContent, /Primitivo \(Zinfandel\)/);
assert.ok([...d.querySelectorAll('#advancedCompare1 option')].some(o=>o.value==='zinfandel::primitivo-manduria' && o.textContent.includes('Primitivo')));
w.WineComparison.replace(['corvina::valpolicella','corvina::amarone']);
assert.match(d.getElementById('advancedCompareDifferences').textContent, /appassimento/);
await app.close();
console.log('OK: R5 A coverage, exact/absent wine names, display names, glossary, discovery, Compare and search parity');
