import assert from 'node:assert/strict';
import { createApp } from './harness.mjs';
const app = await createApp();
const { window: w, document: d } = app;
await app.settle();
const shown = id => !d.getElementById(id).closest('.hidden');
const params = () => new URL(w.location.href).searchParams;
async function back() {
  await new Promise(resolve => { w.addEventListener('popstate', resolve, { once: true }); w.history.back(); });
  await app.settle();
}
// A card far down the gallery must hand focus and scroll to its profile.
w.WineGallery.show();
assert.equal(params().get('view'), 'gallery');
const card = d.querySelector('.gallery-card[data-grape="cabernet-sauvignon"][data-region="napa"]');
card.focus();
let scrolled = false;
d.getElementById('profileHeading').scrollIntoView = () => { scrolled = true; };
card.click();
assert.equal(d.activeElement.id, 'profileHeading');
assert.ok(scrolled && shown('exploreView'));
assert.match(d.getElementById('liveStatus').textContent, /Cabernet.*Napa/);
await back();
assert.ok(shown('galleryView'));
assert.equal(d.activeElement, card);
await new Promise(resolve => { w.addEventListener('popstate', resolve, { once: true }); w.history.forward(); });
await app.settle();
assert.ok(shown('exploreView'));
assert.equal(d.activeElement.id, 'profileHeading');
// Compare owns its URL and remains shareable, including a sparse third slot.
w.WineAtlas.setMode('compare');
w.WineComparison.replace(['macabeo::cava']);
w.WineComparison.setSlot(3, 'glera::prosecco-doc');
const shared = w.location.href;
assert.equal(params().get('view'), 'compare');
assert.equal(params().get('grape'), null);
const refreshed = await createApp({ url: shared });
await refreshed.settle();
assert.ok(!refreshed.document.getElementById('compareView').classList.contains('hidden'));
assert.deepEqual(Array.from(refreshed.window.WineComparison.snapshot().keys), ['macabeo::cava', '', 'glera::prosecco-doc']);
assert.equal(refreshed.window.WineComparison.snapshot().biggestOnly, true);
await refreshed.close();
// Duplicate, incompatible, unknown and malformed keys cannot become selections.
for (const key of ['macabeo::cava', 'cabernet-sauvignon::napa', 'missing::wine', 'macabeo::cava::extra']) {
  const invalid = await createApp({ url: `https://example.test/RagdollLabs-wine-atlas/?view=compare&compare=${encodeURIComponent('macabeo::cava,' + key)}` });
  await invalid.settle();
  assert.deepEqual(Array.from(invalid.window.WineComparison.snapshot().keys), ['macabeo::cava', '', '']);
  assert.equal(new URL(invalid.window.location.href).searchParams.get('compare'), 'macabeo::cava');
  await invalid.close();
}
const remove = d.querySelector('.advanced-remove');
remove.focus();
remove.click();
assert.ok(d.activeElement.matches('.advanced-remove, #advancedCompare1'));
assert.ok(d.activeElement.isConnected);
await back();
assert.ok(shown('compareView'));
assert.deepEqual(Array.from(w.WineComparison.snapshot().keys), ['macabeo::cava', '', 'glera::prosecco-doc']);
// Existing profile links and friendly gold-white badge survive the router.
const gold = w.WineAtlas.allPairs().find(item => item.regional.style?.color === 'white-gold');
assert.ok(gold);
w.WineAtlas.selectProfile(gold.grapeId, gold.regionId);
assert.match(d.getElementById('profileWineColor').textContent, /White \/ gold/);
const legacy = await createApp({ url: 'https://example.test/RagdollLabs-wine-atlas/?grape=cabernet-sauvignon&region=napa' });
await legacy.settle();
assert.equal(legacy.document.activeElement.id, 'profileHeading');
await legacy.close();
const invalidProfile = await createApp({ url: 'https://example.test/RagdollLabs-wine-atlas/?grape=unknown&region=napa' });
await invalidProfile.settle();
assert.match(invalidProfile.document.getElementById('emptyTitle').textContent, /Profile not found/);
assert.equal(new URL(invalidProfile.window.location.href).searchParams.get('grape'), null);
await invalidProfile.close();
await app.close();
console.log('OK: navigation, URL validation, Back/Forward and focus regression tests');
