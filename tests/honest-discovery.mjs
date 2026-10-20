import assert from 'node:assert/strict';
import { createApp } from './harness.mjs';
const app = await createApp();
const { window: w, document: d } = app;
await app.settle();
const profile = (grape, region) => w.WineAtlas.combinedProfile(grape, region);
const key = item => `${item.grapeId}::${item.regionId}`;
const moscato = profile('muscat-blanc', 'moscato-dasti');
const cava = profile('macabeo', 'cava');
const prosecco = profile('glera', 'prosecco-doc');
// Learning compatibility is intentionally broader than a close style match.
for (const sparkling of [cava, prosecco]) {
  assert.ok(w.WineModel.compatible(moscato, sparkling));
  assert.equal(w.smartIsClose(moscato, sparkling), false);
  const reason = w.smartReason(moscato, sparkling, 'contrast');
  assert.match(reason, /Sweetness: sweet →/);
  assert.match(reason, /one interrupted tank fermentation → second fermentation/);
  if (sparkling === cava) assert.match(reason, /gentle bubbles → sparkling bubbles/);
  else assert.ok(!reason.includes("Bubbles:"), "the existing Prosecco reference also models gentle bubbles");
}
const picks = w.smartRecommendations(moscato);
assert.ok(picks.length < 3, 'a sparse style must not force a third recommendation');
assert.ok(picks.every(pick => pick.relation === 'contrast'));
assert.ok(picks.some(pick => key(pick.item) === key(prosecco)));
assert.ok(picks.every(pick => /Contrast|contrast/.test(pick.label)));
w.WineAtlas.selectProfile('muscat-blanc', 'moscato-dasti');
await app.settle();
assert.match(d.querySelector('.discovery-coverage').textContent, /No close modeled-style matches/);
assert.equal(d.querySelectorAll('[data-discovery-relation="similar"]').length, 0);
// Pinot Noir blanc de noirs and rosé share a grape and bottle method, not colour/base vinification.
const blanc = profile('pinot-noir', 'cremant-bourgogne');
const rose = profile('pinot-noir', 'cremant-alsace');
const sameGrape = w.smartRecommendations(blanc).find(pick => pick.kind === 'same-grape');
assert.equal(key(sameGrape.item), key(rose));
assert.equal(sameGrape.relation, 'contrast');
assert.match(sameGrape.reason, /White → Rosé; white vinification versus rosé skin contact/);
assert.equal(w.smartIsClose(blanc, rose), false);
assert.equal(w.smartIsClose(profile('rkatsiteli', 'kakheti'), profile('rkatsiteli', 'kakheti-qvevri-amber')), false);
// Real close matches explain salient traits rather than matching zero tannin/oak.
const napa = profile('cabernet-sauvignon', 'napa');
const napaPicks = w.smartRecommendations(napa);
assert.ok(napaPicks.some(pick => /full body|firm tannin/.test(pick.reason)));
assert.ok(napaPicks.every(pick => !/Close on tannin, body, oak|comparable production context/.test(pick.reason)));
const classicNative = profile('albarino', 'rias-baixas');
assert.equal(w.smartIsDiscovery(classicNative, napa), false, 'indigenous alone must not imply an adventurous route');
const originalPairs = w.WineAtlas.allPairs;
const ids = current => Array.from(w.smartRecommendations(current), pick => key(pick.item));
const originalIds = ids(napa);
try {
  // Neither indigenous flags nor source order affect recommendation priority.
  w.WineAtlas.allPairs = () => originalPairs().reverse().map(item => ({ ...item, grape: { ...item.grape, indigenous: !item.grape.indigenous } }));
  assert.deepEqual(ids(napa), originalIds);
  // A single represented alternative yields one explained contrast, not filler.
  w.WineAtlas.allPairs = () => [moscato, cava];
  assert.equal(w.smartRecommendations(moscato).length, 1);
  assert.equal(w.smartRecommendations(moscato)[0].relation, 'contrast');
  w.WineAtlas.allPairs = () => [moscato];
  w.smartRender(moscato);
  assert.equal(d.querySelectorAll('.smart-similar-item').length, 0);
  assert.match(d.querySelector('.discovery-coverage').textContent, /No useful discovery route/);
} finally { w.WineAtlas.allPairs = originalPairs; }
// Test the threshold itself, independently of current catalog scores.
const fixture = (id, overrides = {}) => ({ grapeId: id, regionId: id, grape: { color: 'red' },
  regional: { style: { family: 'still', color: 'red', sweetness: 'dry' } },
  profile: { body: 3, acidity: 3, tannin: 3, sweetness: 1, alcohol: 3, fruit: 3, oak: 0, earth: 3, ...overrides } });
assert.equal(w.smartIsClose(fixture('a'), fixture('b', { oak: 2.9 })), true);
assert.equal(w.smartIsClose(fixture('a'), fixture('b', { oak: 3 })), false);
assert.equal(w.smartIsClose(fixture('a'), fixture('b', { body: 4.6 })), false, 'core-trait cap applies even when RMS is low');
assert.equal(w.smartIsClose(fixture('a'), fixture('b', { sweetness: 2 })), false);
const missingMethod = { ...cava, regional: { ...cava.regional, style: { ...cava.regional.style, productionClass: undefined } } };
assert.equal(w.smartIsClose(cava, missingMethod), false, 'unknown production cannot establish closeness');
// Catalog-wide invariants: stable, distinct and correctly labeled routes.
for (const current of originalPairs()) {
  const routes = w.smartRecommendations(current);
  assert.ok(routes.length <= 3);
  assert.equal(new Set(Array.from(routes, pick => key(pick.item))).size, routes.length);
  for (const pick of routes) {
    assert.notEqual(key(current), key(pick.item));
    assert.equal(pick.relation === 'similar', w.smartIsClose(current, pick.item));
    if (pick.relation === 'contrast') assert.match(pick.reason, /contrast/);
    if (pick.kind === 'adventurous') {
      assert.notEqual(pick.item.region.country, current.region.country);
      assert.notEqual(pick.item.grapeId, current.grapeId);
      assert.ok(w.smartIsDiscovery(pick.item, current));
      assert.equal(pick.relation, 'similar');
    }
  }
}
// Compare keeps semantic differences visible beside numeric differences.
w.WineAtlas.setMode('compare');
w.WineComparison.replace([moscato, prosecco]);
assert.match(d.getElementById('advancedCompareDifferences').textContent, /Compared with slot 1:.*Sweetness: sweet → dry-to-off-dry/);
assert.match(d.getElementById('advancedCompareDifferences').textContent, /one interrupted tank fermentation → second fermentation in tank/);
assert.ok(!d.getElementById('advancedCompareDifferences').textContent.includes('gentle bubbles → sparkling bubbles'));
w.WineComparison.replace([moscato, cava]);
assert.match(d.getElementById('advancedCompareDifferences').textContent, /gentle bubbles → sparkling bubbles/);
// Even numerically identical fixtures keep their production differences visible.
const originalCombined = w.WineAtlas.combinedProfile;
try {
  w.WineAtlas.combinedProfile = (grape, region) => {
    const result = originalCombined(grape, region);
    return result && region === 'prosecco-doc' ? { ...result, profile: { ...moscato.profile } } : result;
  };
  w.WineComparison.replace([moscato, prosecco]);
  assert.match(d.getElementById('advancedCompareDifferences').textContent, /No metric difference reaches the 0.5-point display threshold/);
  assert.match(d.getElementById('advancedCompareDifferences').textContent, /one interrupted tank fermentation → second fermentation in tank/);
} finally { w.WineAtlas.combinedProfile = originalCombined; }
await app.close();
console.log('OK: honest discovery thresholds, contrasts, sparse coverage, salient reasons and comparison context');
