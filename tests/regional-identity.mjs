import assert from 'node:assert/strict';
import { createApp } from './harness.mjs';
const app=await createApp();
const {window:w,document:d}=app;
await app.settle();
const search=async query=>Array.from(await w.WineSearch.rank(query,200),row=>`${row.item.grapeId}::${row.item.regionId}`).sort();
const keys=['grenache::chateauneuf-du-pape','mourvedre::bandol-red','melon-de-bourgogne::muscadet-sevre-maine','torrontes-riojano::salta-torrontes','semillon::hunter-semillon'];
assert.equal(w.WineAtlas.allPairs().length,150);
assert.equal(Object.keys(w.WineAtlas.getData().grapes).length,60);
assert.equal(Object.keys(w.WineAtlas.getData().regions).length,118);
for(const key of keys){
 const [grape,region]=key.split('::');assert.ok(w.WineAtlas.selectProfile(grape,region));await app.settle();
 assert.equal(d.activeElement.id,'profileHeading');assert.equal(d.querySelectorAll('#bars .bar').length,8);
 assert.ok(d.querySelector('#locatorMap svg'));assert.ok(d.querySelectorAll('#pair .chip').length>=4);
 assert.match(d.getElementById('sourcesDrawer').textContent,/Reviewed 2026-10-21/);
 assert.match(d.getElementById('sourcesDrawer').textContent,/Evidence still to review/);
 assert.equal(new URL(w.location.href).searchParams.get('region'),region);
}
for(const [query,key] of [["Châteauneuf-du-Pape",keys[0]],['Chateauneuf',keys[0]],['Bandol',keys[1]],['Monastrell France',keys[1]],['Muscadet',keys[2]],['Melon',keys[2]],['Melon B',keys[2]],['Melon de Bourgogne',keys[2]],['Torrontés',keys[3]],['Torrontes Riojano',keys[3]],['dry Torrontés',keys[3]],['Hunter Valley',keys[4]],['dry Hunter Semillon',keys[4]],['Semillon Australia',keys[4]]])assert.deepEqual(await search(query),[key],query);
assert.deepEqual(await search('sweet Hunter Valley'),[]);
assert.deepEqual(await search('rose Torrontes'),[]);
assert.deepEqual(await search('sweet Muscadet'),[]);
assert.ok(!(await search('Muscat')).includes(keys[2]));
assert.ok(!(await search('Moscato')).includes(keys[2]));
assert.deepEqual(await search('Monastrell'),['mourvedre::bandol-red','mourvedre::jumilla']);
assert.match(w.WineSearch.notices('Monastrell')[0],/France, Spain/);
assert.deepEqual(await search('dry Semillon'),[keys[4]]);
assert.deepEqual(await search('sweet Semillon'),['semillon::sauternes']);
for(const query of ['white Chateauneuf du Pape','Chateauneuf du Pape blanc','Bandol rosé','white Bandol','Muscadet Clisson','Torrontes Mendocino','Torrontes Sanjuanino','Torrontes tardio']){
 assert.deepEqual(await search(query),[],query);assert.match(w.WineSearch.notices(query).join(' '),/not represented/,query);
}
for(const [grape,region] of [['grenache','chateauneuf-du-pape'],['mourvedre','bandol-red']]){
 const item=w.WineAtlas.combinedProfile(grape,region);assert.equal(item.regional.style.composition.kind,'representative-blend');
 w.WineAtlas.selectProfile(grape,region);await app.settle();assert.match(d.getElementById('title').textContent,/led blend/);
}
const hunter=w.WineAtlas.combinedProfile('semillon','hunter-semillon');
const sauternes=w.WineAtlas.combinedProfile('semillon','sauternes');
assert.equal(hunter.profile.oak,0);assert.ok(hunter.profile.sweetness<=1);assert.ok(hunter.profile.acidity>=4);
assert.equal(w.WineModel.compatible(hunter,sauternes),false);assert.equal(w.smartIsClose(hunter,sauternes),false);
const contrast=w.smartRecommendations(hunter).find(route=>route.item.regionId==='sauternes');
assert.equal(contrast.relation,'contrast');assert.match(contrast.reason,/dry → sweet/);
w.WineAtlas.selectProfile('semillon','hunter-semillon');await app.settle();
assert.ok(!d.getElementById('maturity').classList.contains('hidden'));
assert.equal(d.querySelectorAll('#maturityStages .maturity-stage').length,3);
assert.match(d.getElementById('maturitySummary').textContent,/without oak/);
assert.match(d.getElementById('maturityStages').textContent,/remains dry and unoaked/);
[...d.querySelectorAll('#specialStyle button')].find(button=>button.textContent==='Contrast with sweet botrytised Sauternes').click();
await app.settle();assert.equal(new URL(w.location.href).searchParams.get('region'),'sauternes');
w.WineAtlas.selectProfile('torrontes-riojano','salta-torrontes');await app.settle();
assert.ok(d.getElementById('maturity').classList.contains('hidden'),'optional maturity remains selective');
for(const query of ['Bandol','Muscadet','Torrontés','Hunter Valley','white Bandol']){
 w.WineAtlas.begin('search');d.getElementById('searchInput').value=query;await w.renderEnhancedAtlasSearch();
 const explore=[...d.querySelectorAll('#searchResults .search-result')].map(x=>`${x.dataset.grape}::${x.dataset.region}`).sort();
 w.WineAtlas.setMode('compare');d.getElementById('compareDiscoveryInput').value=query;await w.compareRunDiscovery();
 const compare=[...d.querySelectorAll('#compareDiscoveryResults button[data-profile-key]')].map(x=>x.dataset.profileKey).sort();
 assert.deepEqual(explore,compare,query);assert.deepEqual(explore,await search(query),query);
}
w.WineComparison.replace(['mourvedre::bandol-red','mourvedre::jumilla']);
assert.match(d.querySelector('#advancedCompareGrid h3').textContent,/Mourvèdre-led blend/);
assert.equal(w.WineComparison.snapshot().keys.filter(Boolean).length,2);
w.WineAtlas.setMode('explore');w.WineGallery.show();assert.equal(d.querySelectorAll('.gallery-card').length,150);
assert.match(d.querySelector('.gallery-card[data-region="bandol-red"]').textContent,/Mourvèdre-led blend/);
await app.close();
const restored=await createApp({url:'https://example.test/RagdollLabs-wine-atlas/?view=compare&compare=semillon::hunter-semillon,melon-de-bourgogne::muscadet-sevre-maine'});
await restored.settle();assert.equal(restored.window.WineComparison.snapshot().keys.filter(Boolean).length,2);await restored.close();
console.log('OK: R5 D regional blends, Muscadet identity, Torrontés scope, dry Hunter maturity, precise search and Compare');
