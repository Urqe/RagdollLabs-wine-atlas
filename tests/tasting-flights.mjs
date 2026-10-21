import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createApp, ROOT } from './harness.mjs';
const flights = JSON.parse(await readFile(`${ROOT}/data/tasting-flights.json`, 'utf8'));
assert.equal(flights.length, 6);
const base = 'https://example.test/RagdollLabs-wine-atlas/';
const app = await createApp();
const { window: w, document: d, settle } = app;
await settle();
const visible = id => !d.getElementById(id).closest('.hidden');
const params = () => new URL(w.location.href).searchParams;
const keys = () => Array.from(w.WineComparison.snapshot().keys);
async function travel(direction) {
  await new Promise(resolve => { w.addEventListener('popstate', resolve, { once: true }); w.history[direction](); });
  await settle();
}
// The landing, sidebar and learning entry points all lead to the same route.
d.getElementById('welcomeFlights').click();
assert.equal(params().get('view'), 'flights');
assert.equal(d.querySelectorAll('.flight-card').length, 6);
assert.equal(d.activeElement.id, 'flightsHeading');
assert.ok(d.querySelector('.layout').classList.contains('flight-layout'));
d.getElementById('flight-card-sauvignon-two-places').focus();
d.getElementById('flight-card-sauvignon-two-places').click();
assert.equal(params().get('flight'), flights[0].id);
assert.match(d.getElementById('flightsView').textContent, /Choosing bottles|What to notice/);
await travel('back');
assert.equal(d.activeElement.id, 'flight-card-sauvignon-two-places');
await travel('forward');
assert.equal(d.activeElement.id, 'flightsHeading');

// Each flight replaces stale selections once and restores its complete lesson.
for (const flight of flights) {
  const expected = flight.wines.map(wine => `${wine.grape}::${wine.region}`).concat(['', '', '']).slice(0, 3);
  w.WineComparison.replace(['macabeo::cava', 'glera::prosecco-doc', 'champagne-blend::champagne-brut-nv']);
  w.WineNavigation.go({ view: 'flight', flightId: flight.id });
  let notifications = 0;
  const changed = () => ++notifications;
  d.addEventListener('wineatlas:comparison-changed', changed);
  d.getElementById('flight-compare').click();
  d.removeEventListener('wineatlas:comparison-changed', changed);
  assert.equal(notifications, 1, `${flight.id}: one atomic replacement`);
  assert.deepEqual(keys(), expected);
  assert.equal(params().get('view'), 'compare');
  assert.equal(params().get('flight'), flight.id);
  assert.equal(params().get('grape'), null);
  assert.equal(d.activeElement.id, 'flightCompareHeading');
  assert.ok(visible('compareFlightContext') && visible('compareView'));
  assert.equal(d.querySelectorAll('#advancedCompareGrid .compareCard').length, flight.wines.length);
  assert.ok(!d.querySelector('.layout').classList.contains('flight-layout'));
  const shared = await createApp({ url: w.location.href });
  await shared.settle();
  assert.deepEqual(Array.from(shared.window.WineComparison.snapshot().keys), expected);
  assert.equal(shared.document.getElementById('flightCompareHeading').textContent, flight.title);
  await shared.close();
}
// Display toggles preserve flight identity AND focused nodes; selection edits end it.
const backLink = d.getElementById('compare-flight-back');
backLink.focus();
w.WineComparison.setBiggestOnly(true);
assert.equal(params().get('flight'), 'routes-to-sweetness');
assert.equal(d.activeElement, backLink);
w.WineComparison.remove(3);
assert.equal(params().has('flight'), false);
assert.equal(visible('compareFlightContext'), false);
await travel('back');
assert.equal(params().get('flight'), 'routes-to-sweetness');
assert.equal(d.activeElement.id, 'compare-flight-back');
assert.equal(keys().filter(Boolean).length, 3);

// Profile exploration retains an explicit return to the originating flight.
w.WineNavigation.go({ view: 'flight', flightId: flights[0].id });
d.getElementById('flight-profile-1').click();
assert.equal(d.activeElement.id, 'profileHeading');
assert.equal(params().get('flight'), flights[0].id);
assert.ok(visible('profileFlightContext'));
await settle();
assert.ok(visible('relatedFlightsCard'));
d.getElementById('profile-flight-back').click();
assert.equal(params().get('view'), 'flight');
await travel('back');
assert.equal(params().get('grape'), 'sauvignon-blanc');
assert.equal(visible('profileFlightContext'), true);

// Worksheet includes bottles/vintages, observation space and reflection, not model answers.
w.WineNavigation.go({ view: 'flight', flightId: 'routes-to-sweetness' });
d.getElementById('flight-worksheet').click();
assert.equal(params().get('view'), 'worksheet');
assert.equal(d.activeElement.id, 'worksheetHeading');
assert.equal(d.querySelectorAll('.worksheet-wine').length, 3);
const worksheet = d.getElementById('worksheetView').textContent;
assert.match(worksheet, /Bottle \/ producer|Vintage \/ date|What surprised me/);
assert.doesNotMatch(worksheet, /apricot|saffron|marmalade|brioche/i);
let prints = 0;
w.print = () => ++prints;
d.querySelector('#worksheetView button').click();
assert.equal(prints, 1);
const worksheetReload = await createApp({ url: w.location.href });
await worksheetReload.settle();
assert.equal(worksheetReload.document.querySelectorAll('.worksheet-wine').length, 3);
await worksheetReload.close();
d.getElementById('worksheet-back').click();
assert.equal(d.body.classList.contains('worksheet-route'), false);
await travel('back');
assert.equal(visible('worksheetView'), true);
await travel('forward');
assert.equal(visible('flightsView'), true);

// Learning guide integrates flights without keeping a modal over the next view.
d.querySelector('[data-home-return]').click();
d.querySelector('[data-taste-basics]').click();
await settle();
const learningLink = d.querySelector('#glossaryContent a[href="?view=flights"]');
assert.ok(learningLink);
learningLink.click();
assert.equal(d.getElementById('glossaryDialog').hasAttribute('open'), false);
assert.equal(params().get('view'), 'flights');
await app.close();

// Direct routes seed canonical wines; invalid IDs never seed partial or stale flights.
const direct = await createApp({ url: `${base}?view=compare&flight=sparkling-production` });
await direct.settle();
assert.deepEqual(Array.from(direct.window.WineComparison.snapshot().keys), ['glera::prosecco-doc', 'champagne-blend::champagne-brut-nv', '']);
await direct.close();
for (const view of ['flight', 'worksheet', 'compare']) {
  const bad = await createApp({ url: `${base}?view=${view}&flight=missing` });
  await bad.settle();
  assert.match(bad.document.getElementById('liveStatus').textContent, /not available/);
  assert.ok(bad.document.activeElement.closest('.hidden') === null);
  if (view === 'compare') assert.equal(bad.window.WineComparison.profiles().length, 0);
  else assert.match(bad.document.querySelector('main').textContent, /Flight not available/);
  await bad.close();
}
const mismatch = await createApp({ url: `${base}?view=compare&flight=sparkling-production&compare=macabeo::cava` });
await mismatch.settle();
assert.equal(new URL(mismatch.window.location.href).searchParams.has('flight'), false);
assert.equal(mismatch.document.getElementById('compareFlightContext').classList.contains('hidden'), true);
await mismatch.close();

// Missing/malformed enrichment leaves the core usable; broken flights are not partly compared.
for (const payload of [null, {}, [{ ...flights[0], wines: [flights[0].wines[0], { grape: 'missing', region: 'missing' }] }], [{ ...flights[0], wines: [flights[0].wines[0], { grape: 'cabernet-sauvignon', region: 'napa' }] }]]) {
  const bad = await createApp({ url: `${base}?view=flight&s=keep&flight=${flights[0].id}`, fetch: resource => String(resource).endsWith('tasting-flights.json') ? { ok: true, json: async () => payload } : undefined });
  await bad.settle();
  assert.match(bad.document.getElementById('flightsView').textContent, /Flight not available/);
  assert.equal(bad.document.getElementById('flight-compare'), null);
  bad.window.WineAtlas.selectProfile('pinot-noir', 'burgundy');
  assert.equal(new URL(bad.window.location.href).searchParams.has('flight'), false);
  await bad.close();
}
const failed = await createApp({ url: `${base}?view=flights`, fetch: resource => String(resource).endsWith('tasting-flights.json') ? { ok: false, status: 503 } : undefined });
await failed.settle();
assert.match(failed.document.getElementById('flightsView').textContent, /could not be loaded/);
failed.document.querySelector('#flightsView a').click();
assert.equal(new URL(failed.window.location.href).searchParams.get('view'), 'explore');
await failed.close();

// A late request cannot hijack navigation after the user leaves a loading flight.
let release;
const delayed = await createApp({ url: `${base}?view=flight&flight=${flights[0].id}`, fetch: (resource, options, localFetch) => {
  if (String(resource).endsWith('tasting-flights.json')) return new Promise(resolve => { release = () => resolve(localFetch(resource)); });
} });
assert.match(delayed.document.getElementById('flightsView').textContent, /Loading/);
delayed.window.WineAtlas.selectProfile('pinot-noir', 'burgundy');
release();
await delayed.settle();
assert.equal(new URL(delayed.window.location.href).searchParams.get('grape'), 'pinot-noir');
assert.equal(delayed.document.activeElement.id, 'profileHeading');
await delayed.close();

// Moving keyboard focus during loading is not a navigation cancellation.
let finish;
const focusedLoading = await createApp({ fetch: (resource, options, localFetch) => {
  if (String(resource).endsWith('tasting-flights.json')) return new Promise(resolve => { finish = () => resolve(localFetch(resource)); });
} });
assert.ok((await focusedLoading.window.WineSearch.rank('cremant')).length > 0, 'normal browsing never waits for flights');
focusedLoading.document.getElementById('welcomeFlights').click();
focusedLoading.document.querySelector('#flightsView a').focus();
finish();
await focusedLoading.settle();
assert.equal(focusedLoading.document.querySelectorAll('.flight-card').length, 6);
assert.equal(new URL(focusedLoading.window.location.href).searchParams.get('view'), 'flights');
await focusedLoading.close();

// Rendering never interprets lesson text as HTML.
const hostile = await createApp({ url: `${base}?view=flight&flight=${flights[0].id}`, fetch: resource => String(resource).endsWith('tasting-flights.json') ? { ok: true, json: async () => [{ ...flights[0], title: '<img src=x onerror=alert(1)>' }] } : undefined });
await hostile.settle();
assert.match(hostile.document.getElementById('flightsHeading').textContent, /<img/);
assert.equal(hostile.document.querySelectorAll('[onerror]').length, 0);
await hostile.close();
console.log('OK: guided flights, atomic Compare, shared routes, worksheet, history, loading and safe rendering');
