import assert from 'node:assert/strict';
import {createApp} from './harness.mjs';
const app=await createApp();const {window:w,document:d}=app;await app.settle();
const search=async q=>Array.from(await w.WineSearch.rank(q,200),row=>`${row.item.grapeId}::${row.item.regionId}`).sort();
const keys=['cabernet-sauvignon::red-mountain','syrah::walla-walla','riesling::finger-lakes-dry','cabernet-franc::monticello','viognier::monticello','riesling::old-mission-dry'];
const pairs=w.WineAtlas.allPairs();
assert.equal(pairs.length,150);assert.equal(Object.keys(w.WineAtlas.getData().regions).length,118);assert.equal(Object.keys(w.WineAtlas.getData().grapes).length,60);
assert.equal(pairs.filter(item=>item.region.country==='USA').length,13);
assert.equal(new Set(pairs.map(item=>item.region.country)).size,23);
for(const key of keys){const [grape,region]=key.split('::');assert.ok(w.WineAtlas.selectProfile(grape,region));await app.settle();assert.equal(d.activeElement.id,'profileHeading');assert.equal(d.querySelectorAll('#bars .bar').length,8);assert.ok(d.querySelector('#locatorMap svg'));assert.ok(d.querySelectorAll('#pair .chip').length>=4);assert.match(d.getElementById('sourcesDrawer').textContent,/Reviewed 2026-10-21/);assert.match(d.getElementById('sourcesDrawer').textContent,/Evidence still to review/);assert.equal(new URL(w.location.href).searchParams.get('region'),region);}
for(const [query,expected] of [
 ['Red Mountain',[keys[0]]],['Walla Walla',[keys[1]]],['Finger Lakes',[keys[2]]],['Old Mission Peninsula',[keys[5]]],['Monticello',[keys[3],keys[4]]],
 ['Virginia Cabernet Franc',[keys[3]]],['Monticello Viognier',[keys[4]]],['New York dry Riesling',[keys[2]]],['Michigan dry Riesling',[keys[5]]],
 ['Washington',[keys[0],keys[1]]],['Washington Syrah',[keys[1]]],['Oregon',['pinot-noir::willamette',keys[1]]],['Oregon Pinot Noir',['pinot-noir::willamette']],
 ['Oregon Washington Syrah',[keys[1]]],['USA Virginia',[keys[3],keys[4]]]
])assert.deepEqual(await search(query),expected.sort(),query);
const california=await search('California');assert.equal(california.length,6);assert.ok(!california.some(key=>keys.includes(key)));
assert.deepEqual(await search('sweet New York Riesling'),[]);assert.deepEqual(await search('sweet Michigan Riesling'),[]);assert.deepEqual(await search('sparkling Finger Lakes'),[]);
for(const query of ['Finger Lakes semi dry Riesling','Finger Lakes icewine','Old Mission Peninsula sweet Riesling','Old Mission ice wine','Rocks District of Milton-Freewater']){assert.deepEqual(await search(query),[],query);assert.match(w.WineSearch.notices(query).join(' '),/not represented/,query);}
const get=(gid,rid)=>w.WineAtlas.combinedProfile(gid,rid);
const fl=get('riesling','finger-lakes-dry'),omp=get('riesling','old-mission-dry'),mosel=get('riesling','mosel');
for(const item of [fl,omp]){assert.equal(item.regional.style.sweetness,'dry');assert.ok(item.profile.sweetness<=1);assert.equal(item.profile.oak,0);assert.ok(w.WineModel.compatible(item,mosel));assert.equal(w.smartIsClose(item,mosel),false);}
assert.equal(w.smartIsClose(fl,omp),true);
assert.ok(w.WineModel.compatible(get('cabernet-sauvignon','red-mountain'),get('cabernet-sauvignon','napa')));
assert.ok(w.WineModel.compatible(get('syrah','walla-walla'),get('syrah','barossa')));
for(const [gid,rid,name,blend] of [['cabernet-sauvignon','red-mountain','Cabernet Sauvignon-led blend','85% Cabernet Sauvignon'],['cabernet-franc','monticello','Cabernet Franc-led blend','95% Cabernet Franc'],['viognier','monticello','Viognier-led blend','84% Viognier']]){
 const item=get(gid,rid);assert.equal(item.regional.style.composition.kind,'representative-blend');w.WineAtlas.selectProfile(gid,rid);await app.settle();assert.match(d.getElementById('title').textContent,new RegExp(name));assert.ok(d.getElementById('profileExpression').textContent.includes(blend));
}
// Per-grape Why scope prevents red extraction copy leaking into the white profile.
w.WineAtlas.selectProfile('viognier','monticello');await app.settle();assert.ok(!d.getElementById('why').textContent.includes('Gentle red extraction'));
assert.equal(w.WineAtlas.getData().regions['walla-walla'].country,'USA');assert.match(w.WineAtlas.getData().regions['walla-walla'].name,/Washington \/ Oregon/);
for(const query of ['Red Mountain','Oregon','Finger Lakes','Monticello white','Michigan dry Riesling','Rocks District']){w.WineAtlas.begin('search');d.getElementById('searchInput').value=query;await w.renderEnhancedAtlasSearch();const explore=[...d.querySelectorAll('#searchResults .search-result')].map(x=>`${x.dataset.grape}::${x.dataset.region}`).sort();w.WineAtlas.setMode('compare');d.getElementById('compareDiscoveryInput').value=query;await w.compareRunDiscovery();const compare=[...d.querySelectorAll('#compareDiscoveryResults button[data-profile-key]')].map(x=>x.dataset.profileKey).sort();assert.deepEqual(explore,compare,query);assert.deepEqual(explore,await search(query),query);}
w.WineComparison.replace(['riesling::finger-lakes-dry','riesling::old-mission-dry']);
assert.match(d.getElementById('advancedCompareDifferences').textContent,/No metric difference reaches the 0.5-point display threshold/);
assert.equal(w.WineComparison.snapshot().keys.filter(Boolean).length,2);
w.WineAtlas.setMode('explore');w.WineGallery.show();assert.equal(d.querySelectorAll('.gallery-card').length,150);assert.equal(d.querySelectorAll('#gallery-usa .gallery-card').length,13);
await app.close();
const restored=await createApp({url:'https://example.test/RagdollLabs-wine-atlas/?view=compare&compare=riesling::finger-lakes-dry,riesling::old-mission-dry'});await restored.settle();assert.equal(restored.window.WineComparison.snapshot().keys.filter(Boolean).length,2);await restored.close();
console.log('OK: R6 US AVA/state coverage, blends, dry Riesling, scoped Why, search parity, Compare and Gallery');
