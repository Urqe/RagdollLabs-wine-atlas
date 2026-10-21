import assert from 'node:assert/strict';
import { createApp } from './harness.mjs';
const app = await createApp();
const { window: w, document: d } = app;
await app.settle();
const search = async query => Array.from(await w.WineSearch.rank(query, 200), row => `${row.item.grapeId}::${row.item.regionId}`).sort();
const pairs = [['palomino','jerez-fino'],['palomino','jerez-oloroso'],['pedro-ximenez','jerez-px'],['boal','madeira-boal'],['albarino','vinho-verde-alvarinho']];
for (const [grape, region] of pairs) {
  assert.ok(w.WineAtlas.selectProfile(grape, region));
  await app.settle();
  assert.equal(d.activeElement.id, 'profileHeading');
  assert.equal(d.querySelectorAll('#bars .bar').length, 8);
  assert.ok(d.querySelector('#locatorMap svg'));
  assert.match(d.getElementById('sourcesDrawer').textContent, /Reviewed 2026-10-21/);
  assert.match(d.getElementById('sourcesDrawer').textContent, /Evidence still to review/);
  assert.ok(d.querySelectorAll('#pair .chip').length >= 4);
  assert.equal(new URL(w.location.href).searchParams.get('region'), region);
}
const expected = new Map([
 ['Fino',['palomino::jerez-fino']], ['Oloroso',['palomino::jerez-oloroso']],
 ['sweet sherry',['pedro-ximenez::jerez-px']], ['PX Sherry',['pedro-ximenez::jerez-px']],
 ['Pedro Ximénez',['pedro-ximenez::jerez-px']], ['dry sherry',['palomino::jerez-fino','palomino::jerez-oloroso']],
 ['white fortified',['palomino::jerez-fino']], ['Madeira',['boal::madeira-boal']],
 ['Bual',['boal::madeira-boal']], ['medium-sweet Madeira',['boal::madeira-boal']],
 ['Vinho Verde',['albarino::vinho-verde-alvarinho']], ['Alvarinho Portugal',['albarino::vinho-verde-alvarinho']],
 ['dry Alvarinho Vinho Verde',['albarino::vinho-verde-alvarinho']], ['Monção e Melgaço',['albarino::vinho-verde-alvarinho']]
]);
for (const [query, keys] of expected) assert.deepEqual(await search(query), keys.sort(), query);
assert.equal((await search('Jerez')).length, 3);
assert.deepEqual(await search('sweet Fino'), []);
assert.deepEqual(await search('sweet Oloroso'), []);
assert.deepEqual(await search('sparkling Vinho Verde'), []);
for (const query of ['Amontillado','Manzanilla','Palo Cortado','Cream Sherry','Sweet Oloroso','Sercial','dry Madeira','Malmsey','Loureiro','Vinho Verde rosé','sparkling Vinho Verde']) {
  assert.deepEqual(await search(query), [], query);
  assert.match(w.WineSearch.notices(query).join(' '), /not represented/, query);
}
assert.match(w.WineSearch.notices('Alvarinho')[0], /Portugal, Spain, Uruguay/);
const fino = w.WineAtlas.combinedProfile('palomino','jerez-fino');
const oloroso = w.WineAtlas.combinedProfile('palomino','jerez-oloroso');
const px = w.WineAtlas.combinedProfile('pedro-ximenez','jerez-px');
const boal = w.WineAtlas.combinedProfile('boal','madeira-boal');
const ruby = w.WineAtlas.combinedProfile('port-blend','douro-port-ruby');
const tawny = w.WineAtlas.combinedProfile('port-blend','douro-port-tawny');
// Broad Compare retains educational contrasts and existing shared selections.
for (const item of [oloroso,px,boal,ruby,tawny]) {
  assert.ok(w.WineModel.compatible(fino,item));
  assert.equal(w.smartIsClose(fino,item), false);
}
assert.equal(w.smartIsClose(boal,tawny), false, 'warm Madeira maturation is not ordinary oxidative cask ageing');
assert.equal(w.smartIsClose(px,tawny), false, 'raisined PX is not a close substitute for Tawny');
assert.equal(w.WineModel.colorLabel('brown'),'Brown / mahogany');
w.WineAtlas.selectProfile('palomino','jerez-fino');
await app.settle();
const contrast = w.smartRecommendations(fino).find(route=>route.item.regionId==='jerez-oloroso');
assert.equal(contrast.relation,'contrast');
assert.match(contrast.reason,/biological ageing under flor.*oxidative cask ageing/);
assert.ok(d.querySelector('#specialStyle .glossary-term[data-glossary-id="flor"]'));
[...d.querySelectorAll('#specialStyle button')].find(button=>button.textContent==='Contrast with dry oxidative Oloroso').click();
await app.settle();
assert.equal(new URL(w.location.href).searchParams.get('region'),'jerez-oloroso');
// Both UI search surfaces use the same exact and unavailable semantics.
for (const query of ['dry Sherry','sweet Sherry','Madeira','Vinho Verde','Cream Sherry']) {
  w.WineAtlas.begin('search');
  d.getElementById('searchInput').value=query;
  await w.renderEnhancedAtlasSearch();
  const explore=[...d.querySelectorAll('#searchResults .search-result')].map(x=>`${x.dataset.grape}::${x.dataset.region}`).sort();
  w.WineAtlas.setMode('compare');
  d.getElementById('compareDiscoveryInput').value=query;
  await w.compareRunDiscovery();
  const compare=[...d.querySelectorAll('#compareDiscoveryResults button[data-profile-key]')].map(x=>x.dataset.profileKey).sort();
  assert.deepEqual(explore,compare,query);
  assert.deepEqual(explore,await search(query),query);
}
w.WineComparison.replace(['palomino::jerez-fino','palomino::jerez-oloroso','pedro-ximenez::jerez-px']);
const context=d.getElementById('advancedCompareDifferences').textContent;
assert.match(context,/Sweetness: dry → sweet/);
assert.match(context,/Colour: White \/ gold → Brown \/ mahogany/);
assert.match(context,/biological ageing under flor →.*oxidative cask ageing/);
assert.match(context,/sun-dried grapes, fortification and oxidative ageing/);
assert.match(d.getElementById('advancedCompareHint').textContent,/Dry and sweet fortified/);
w.WineComparison.replace(['port-blend::douro-port-ruby','port-blend::douro-port-tawny']);
assert.equal(w.WineComparison.snapshot().keys.filter(Boolean).length,2);
w.WineAtlas.setMode('explore');
w.WineGallery.show();
assert.equal(d.querySelectorAll('.gallery-card').length,131);
assert.match(d.querySelector('.gallery-card[data-region="vinho-verde-alvarinho"]').textContent,/Alvarinho \(Albariño\)/);
await app.close();
// Fortified contrast links survive refresh, including the new brown colour.
const restored=await createApp({url:'https://example.test/RagdollLabs-wine-atlas/?view=compare&compare=palomino::jerez-fino,pedro-ximenez::jerez-px'});
await restored.settle();
assert.equal(restored.window.WineComparison.snapshot().keys.filter(Boolean).length,2);
assert.match(restored.document.getElementById('advancedCompareDifferences').textContent,/dry → sweet/);
await restored.close();
console.log('OK: R5 B classic families, evidence, colour, precise search, comparison contrasts, discovery and share links');
