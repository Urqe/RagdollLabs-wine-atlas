import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createApp, ROOT } from './harness.mjs';
const labels = JSON.parse(await readFile(`${ROOT}/data/label-guidance.json`, 'utf8'));
const route = (grape, region) => `https://example.test/RagdollLabs-wine-atlas/?grape=${grape}&region=${region}`;
const app = await createApp({ url: route('chardonnay', 'chablis') });
await app.settle();
const { window: w, document: d } = app;
const guide = d.getElementById('labelGuidance');
assert.ok(!guide.classList.contains('hidden'));
assert.equal(guide.open, false);
assert.match(guide.textContent, /Chablis AOC/);
assert.match(guide.textContent, /does not promise steel-only/);
assert.ok(guide.querySelector('a[href^="https://www.chablis-wines.com"]'));
// The two Bordeaux references are not inferred from a generic Bordeaux label.
w.WineAtlas.selectProfile('cabernet-sauvignon', 'bordeaux');
assert.match(guide.textContent, /producer confirms Cabernet Sauvignon-led/);
assert.match(guide.textContent, /Bordeaux includes white and red wines/);
const alt = guide.querySelector('a[href*="grape=merlot"]'); assert.ok(alt);
alt.click();
assert.equal(w.WineAtlas.getActiveProfile().grapeId, 'merlot');
assert.match(guide.textContent, /producer confirms Merlot-led/);
for (const [grape, region, expected, limit] of [
  ['corvina','valpolicella','Valpolicella Classico DOC','Ripasso'],
  ['corvina','amarone','Amarone della Valpolicella Classico DOCG','Recioto'],
  ['glera','prosecco-doc','Extra Dry','bone-dry'],
  ['palomino','jerez-fino','Fino','Cream'],
  ['palomino','jerez-oloroso','dry/seco','sweet blends'],
  ['pedro-ximenez','jerez-px','Pedro Ximénez','all Sherry'],
  ['vidal-blanc','niagara-icewine','Vidal Blanc','Late Harvest'],
  ['riesling','niagara-icewine','Riesling','grape without'],
  ['cabernet-franc','niagara-icewine','Cabernet Franc','white grapes']
]) {
  w.WineAtlas.selectProfile(grape,region);
  assert.ok(!guide.classList.contains('hidden'),`${region}/${grape}`);
  assert.match(guide.textContent,new RegExp(expected));
  assert.match(guide.textContent,new RegExp(limit));
  assert.equal(guide.open,false,'switching profiles closes old guidance');
}
w.WineAtlas.selectProfile('corvina','amarone');
guide.open = true;
const define = [...guide.querySelectorAll('button')].find(button => button.textContent === 'Define appassimento');
assert.ok(define);
define.click(); await app.settle();
assert.ok(d.getElementById('glossaryDialog').open);
d.getElementById('glossaryClose').click();
assert.equal(d.activeElement, define);
w.WineAtlas.selectProfile('cabernet-sauvignon','napa');
assert.ok(guide.classList.contains('hidden'));
assert.equal(guide.textContent,'','no stale label advice on unsupported profiles');
w.WineNavigation.go({view:'flight',flightId:'fresh-versus-dried-grapes'});
assert.match(d.getElementById('flightsView').textContent,/Recognize it on the label/);
await app.close();

// New vineyard terms show their distinctions and documented, scoped examples.
const terms = await createApp(); await terms.settle();
await terms.window.WineLearning.showEntry('pre-post-phylloxera');
const dialog = terms.document.getElementById('glossaryDialog');
assert.ok(dialog.open);
assert.match(dialog.textContent,/no single worldwide dividing year/i);
assert.match(dialog.textContent,/Quinta do Noval Nacional Vintage Port/);
assert.match(dialog.textContent,/Bollinger Vieilles Vignes Françaises/);
assert.ok(dialog.querySelector('a[href*="quintadonoval.com"]'));
assert.ok(dialog.querySelector('a[href*="champagne-bollinger.com"]'));
terms.document.getElementById('glossaryClose').click();
await terms.close();

// Optional guidance must fail quietly, including malformed records and unsafe
// source references, without blocking the underlying profile or glossary.
for (const payload of [null, {}, {'chablis/chardonnay': {...labels['chablis/chardonnay'],sources:['missing']}},
 {'chablis/chardonnay': {...labels['chablis/chardonnay'],alternatives:[{grape:'missing',region:'bordeaux',label:'Missing'}]}}]) {
 const bad = await createApp({url:route('chardonnay','chablis'),fetch:resource=>String(resource).endsWith('label-guidance.json')?{ok:true,json:async()=>payload}:undefined});
 await bad.settle();
 assert.ok(bad.document.getElementById('labelGuidance').classList.contains('hidden'));
 assert.match(bad.document.getElementById('profileHeading').textContent,/Chablis/);
 await bad.close();
}
const hostile = await createApp({url:route('chardonnay','chablis'),fetch:resource=>String(resource).endsWith('label-guidance.json')?{ok:true,json:async()=>({'chablis/chardonnay':{...labels['chablis/chardonnay'],example:'<img src=x onerror=alert(1)>'}})}:undefined});
await hostile.settle(); assert.match(hostile.document.getElementById('labelGuidance').textContent,/<img/);
assert.equal(hostile.document.querySelectorAll('#labelGuidance img, #labelGuidance [onerror]').length,0); await hostile.close();
console.log('OK: sourced label cues, ambiguous expressions, alternatives, phylloxera examples and optional failures');
