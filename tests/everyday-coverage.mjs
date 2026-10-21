import assert from 'node:assert/strict';
import { createApp } from './harness.mjs';
const app = await createApp();
const { window: w, document: d } = app;
await app.settle();
const search = async query => Array.from(await w.WineSearch.rank(query,200), row=>`${row.item.grapeId}::${row.item.regionId}`).sort();
const keys = ['montepulciano::montepulciano-abruzzo','nero-davola::sicilia-nero-davola','mourvedre::jumilla','mencia::bierzo','macabeo::rioja-blanco'];
assert.equal(w.WineAtlas.allPairs().length,141);
assert.equal(Object.keys(w.WineAtlas.getData().grapes).length,59);
assert.equal(Object.keys(w.WineAtlas.getData().regions).length,112);
for (const key of keys) {
  const [grape,region]=key.split('::');
  assert.ok(w.WineAtlas.selectProfile(grape,region));
  await app.settle();
  assert.equal(d.activeElement.id,'profileHeading');
  assert.equal(d.querySelectorAll('#bars .bar').length,8);
  assert.ok(d.querySelector('#locatorMap svg'));
  assert.ok(d.querySelectorAll('#pair .chip').length>=4);
  assert.match(d.getElementById('sourcesDrawer').textContent,/Reviewed 2026-10-21/);
  assert.match(d.getElementById('sourcesDrawer').textContent,/Evidence still to review/);
  assert.equal(new URL(w.location.href).searchParams.get('region'),region);
}
const exact=[
 ['Montepulciano',keys[0]], ["Montepulciano d'Abruzzo",keys[0]], ['Abruzzo',keys[0]],
 ["Nero d'Avola",keys[1]], ['Nero davola',keys[1]], ['Sicily',keys[1]], ['Sicilia',keys[1]],
 ['Monastrell Jumilla',keys[2]], ['Mourvèdre Jumilla',keys[2]], ['Mataro Jumilla',keys[2]], ['Jumilla',keys[2]],
 ['Mencía',keys[3]], ['Mencia Bierzo',keys[3]], ['El Bierzo',keys[3]],
 ['white Rioja',keys[4]], ['Rioja blanco',keys[4]], ['Viura Rioja',keys[4]]
];
for (const [query,key] of exact) assert.deepEqual(await search(query),[key],query);
assert.match(w.WineSearch.notices('Monastrell')[0],/Monastrell → Mourvèdre.*France, Spain/);
assert.deepEqual(await search('Monastrell France'),['mourvedre::bandol-red']);
for (const query of ['Monastrell','Mourvèdre','Mataro']) assert.deepEqual(await search(query),['mourvedre::bandol-red',keys[2]].sort());
assert.deepEqual(await search('sweet Jumilla'),[]);
assert.deepEqual(await search('red white Rioja'),[]);
assert.deepEqual(await search('sparkling Viura'),['macabeo::cava']);
assert.deepEqual(await search('dry Viura'),['macabeo::cava',keys[4]].sort());
assert.deepEqual(await search('Viura'),['macabeo::cava',keys[4]].sort());
assert.deepEqual(await search('Rioja'),['macabeo::rioja-blanco','tempranillo::rioja'].sort());
assert.deepEqual(await search('red Rioja'),['tempranillo::rioja']);
for (const query of ['Vino Nobile di Montepulciano','Rosso di Montepulciano',"Cerasuolo d'Abruzzo",'Cerasuolo di Vittoria','Montepulciano d Abruzzo Riserva','Monopole Clásico','white Rioja Reserva','barrel aged white Rioja','Jumilla dulce']) {
  assert.deepEqual(await search(query),[],query);
  assert.match(w.WineSearch.notices(query).join(' '),/not represented/,query);
}
// Regional display names do not duplicate the grape or leak a sparkling recipe.
w.WineAtlas.selectProfile('macabeo','rioja-blanco');
await app.settle();
assert.match(d.getElementById('title').textContent,/^Viura \(Macabeo\)/);
assert.match(d.getElementById('specialStyle').textContent,/stainless-steel fermentation/);
assert.ok(!d.getElementById('specialStyle').textContent.includes('Second fermentation'));
const white=w.WineAtlas.combinedProfile('macabeo','rioja-blanco');
const cava=w.WineAtlas.combinedProfile('macabeo','cava');
const rueda=w.WineAtlas.combinedProfile('verdejo','rueda');
const redRioja=w.WineAtlas.combinedProfile('tempranillo','rioja');
assert.equal(white.profile.oak,0);
assert.equal(w.WineModel.compatible(white,cava),false);
assert.equal(w.WineModel.compatible(white,redRioja),false);
assert.equal(w.WineModel.compatible(white,rueda),true);
const sameGrape=w.smartRecommendations(white).find(route=>route.item.regionId==='cava');
assert.equal(sameGrape.relation,'contrast');
assert.match(sameGrape.reason,/contrast/i);
assert.equal(w.smartIsClose(white,cava),false);
const nero=w.WineAtlas.combinedProfile('nero-davola','sicilia-nero-davola');
assert.equal(nero.profile.oak,0,'cocoa/coffee descriptors do not assert oak maturation');
assert.equal(w.WineModel.compatible(nero,redRioja),true);
for (const query of ['Monastrell','Mencía','Montepulciano',"Nero d'Avola",'white Rioja','Vino Nobile di Montepulciano']) {
  w.WineAtlas.begin('search');d.getElementById('searchInput').value=query;await w.renderEnhancedAtlasSearch();
  const explore=[...d.querySelectorAll('#searchResults .search-result')].map(x=>`${x.dataset.grape}::${x.dataset.region}`).sort();
  w.WineAtlas.setMode('compare');d.getElementById('compareDiscoveryInput').value=query;await w.compareRunDiscovery();
  const compare=[...d.querySelectorAll('#compareDiscoveryResults button[data-profile-key]')].map(x=>x.dataset.profileKey).sort();
  assert.deepEqual(explore,compare,query);assert.deepEqual(explore,await search(query),query);
}
w.WineComparison.replace(['macabeo::rioja-blanco','verdejo::rueda']);
assert.match(d.querySelector('#advancedCompareGrid h3').textContent,/Viura \(Macabeo\)/);
w.WineComparison.replace(['mourvedre::jumilla','montepulciano::montepulciano-abruzzo','nero-davola::sicilia-nero-davola']);
assert.equal(w.WineComparison.snapshot().keys.filter(Boolean).length,3);
assert.match(d.querySelector('#advancedCompareGrid h3').textContent,/Monastrell \(Mourvèdre\)/);
w.WineAtlas.setMode('explore');w.WineGallery.show();
assert.equal(d.querySelectorAll('.gallery-card').length,141);
assert.match(d.querySelector('.gallery-card[data-region="jumilla"]').textContent,/Monastrell \(Mourvèdre\)/);
await app.close();
const restored=await createApp({url:'https://example.test/RagdollLabs-wine-atlas/?view=compare&compare=macabeo::rioja-blanco,verdejo::rueda'});
await restored.settle();assert.equal(restored.window.WineComparison.snapshot().keys.filter(Boolean).length,2);await restored.close();
console.log('OK: R5 C everyday profiles, identity and name precision, sources, Compare, discovery and share links');
