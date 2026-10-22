import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createApp, ROOT } from './harness.mjs';
const data = JSON.parse(await readFile(`${ROOT}/data/beginner-journey.json`, 'utf8'));
const base = 'https://example.test/RagdollLabs-wine-atlas/';
const app = await createApp();
const { window: w, document: d, settle } = app;
await settle();
const params = () => new URL(w.location.href).searchParams;
const visible = id => !d.getElementById(id).closest('.hidden');
async function back() {
  await new Promise(resolve => { w.addEventListener('popstate', resolve, { once: true }); w.history.back(); });
  await settle();
}
d.querySelector('[data-journey-open]').click();
assert.equal(params().get('view'), 'learn');
assert.equal(params().get('lesson'), 'start');
assert.match(d.getElementById('journeyView').textContent, /No bottle|no test to pass/);
assert.equal(d.activeElement.id, 'journeyHeading');
assert.equal(visible('journeyView'), true);
assert.equal(d.querySelector('.layout').classList.contains('journey-layout'), true);
assert.equal(d.getElementById('journeyView').querySelector('input, textarea'), null);
// A newcomer can skip, finish and restart without a quiz or stored progress.
d.getElementById('journey-skip').click();
assert.equal(params().get('lesson'), 'first-comparison');
d.getElementById('journey-next').click();
assert.equal(params().get('lesson'), 'complete');
assert.match(d.getElementById('journeyView').textContent, /Body describes weight, not quality/);
d.getElementById('journey-restart').click();
d.getElementById('journey-next').click();
assert.equal(params().get('lesson'), 'taste');
d.getElementById('journey-next').click();
assert.equal(params().get('lesson'), 'acidity');

for (const lesson of data.lessons) {
  assert.equal(params().get('lesson'), lesson.id);
  assert.match(d.getElementById('journeyView').textContent, /Try noticing this/);
  assert.ok(d.getElementById('journeyView').textContent.includes(lesson.exercise));
  assert.equal(d.querySelector('[aria-current="step"]').id, `journey-step-${lesson.id}`);
  assert.equal(d.querySelectorAll('.journey-primary').length, 1, 'one clear next action');
  assert.equal(d.getElementById('journeyMore').open, false, 'technical detail stays optional');
  d.getElementById('journeyExamples').open = true;
  const example = d.getElementById('journey-profile');
  example.focus();
  example.click();
  assert.equal(params().get('lesson'), lesson.id);
  assert.equal(d.activeElement.id, 'profileHeading');
  assert.ok(visible('journeyReturn'));
  assert.equal(d.querySelector('.layout').classList.contains('journey-layout'), false);
  // An explicit return works even for a shared profile URL.
  const shared = await createApp({ url: w.location.href });
  await shared.settle();
  assert.ok(!shared.document.getElementById('journeyReturn').classList.contains('hidden'));
  shared.document.getElementById('journey-return-link').click();
  assert.equal(new URL(shared.window.location.href).searchParams.get('lesson'), lesson.id);
  await shared.close();
  await back();
  assert.equal(d.activeElement.id, 'journey-profile');
  assert.equal(d.getElementById('journeyExamples').open, true);
  // Dialog close and Escape return to the actual invoking control and same lesson.
  d.getElementById('journeyMore').open = true;
  d.getElementById('journey-definition').focus();
  d.getElementById('journey-definition').click();
  await settle();
  assert.equal(d.getElementById('glossaryDialogTitle').textContent, lesson.id === 'sweetness' ? 'Dry, off-dry and sweet' : lesson.id[0].toUpperCase() + lesson.id.slice(1));
  d.getElementById('glossaryClose').click();
  assert.equal(d.activeElement.id, 'journey-definition');
  d.getElementById('journey-guide').focus();
  d.getElementById('journey-guide').click();
  await settle();
  assert.ok(d.querySelector(`.taste-section[data-section-id="${lesson.guideSection}"].glossary-entry-focused`));
  d.getElementById('glossaryDialog').dispatchEvent(new w.Event('cancel', { cancelable: true }));
  assert.equal(d.getElementById('glossaryDialog').hasAttribute('open'), false);
  assert.equal(d.activeElement.id, 'journey-guide');
  assert.equal(params().get('lesson'), lesson.id);
  d.getElementById('journey-next').click();
}
assert.equal(params().get('lesson'), 'first-comparison');
// The first flight, its Compare, worksheet and profiles all retain the return route.
d.getElementById('journey-flight').click();
assert.equal(params().get('view'), 'flight');
assert.equal(params().get('lesson'), 'first-comparison');
assert.ok(visible('journeyReturn'));
d.getElementById('flight-compare').click();
assert.equal(params().get('view'), 'compare');
assert.equal(params().get('lesson'), 'first-comparison');
assert.equal(w.WineComparison.profiles().length, 2);
const compareShared = await createApp({ url: w.location.href });
await compareShared.settle();
assert.equal(new URL(compareShared.window.location.href).searchParams.get('lesson'), 'first-comparison');
assert.ok(!compareShared.document.getElementById('journeyReturn').classList.contains('hidden'));
await compareShared.close();
w.WineComparison.setBiggestOnly(true);
assert.equal(params().get('lesson'), 'first-comparison');
d.querySelector('#compareFlightContext a[href*="worksheet"]').click();
assert.equal(params().get('lesson'), 'first-comparison');
assert.equal(params().get('view'), 'worksheet');
d.getElementById('worksheet-back').click();
d.getElementById('flight-profile-1').click();
assert.equal(params().get('lesson'), 'first-comparison');
assert.equal(params().get('flight'), data.firstFlight);
d.getElementById('profile-flight-back').click();
d.getElementById('flight-compare').click();
w.WineComparison.remove(2);
assert.equal(params().has('lesson'), false, 'manual wine changes cannot keep a mismatched lesson context');
assert.equal(visible('journeyReturn'), false);
// Reusing a flight from a different lesson must rebuild its context links.
for (const lessonId of ['acidity', 'first-comparison']) {
  w.WineNavigation.go({ view: 'learn', lessonId });
  d.getElementById('journey-flight').click();
  d.getElementById('flight-compare').click();
  assert.equal(new URL(d.getElementById('compare-flight-back').href).searchParams.get('lesson'), lessonId);
  d.getElementById('compare-flight-back').click();
  assert.equal(params().get('lesson'), lessonId);
}
// Normal exploration is still direct, without inheriting a learning journey.
w.WineNavigation.go({ view: 'learn', lessonId: 'body' });
w.WineAtlas.selectProfile('pinot-noir', 'burgundy');
assert.equal(params().has('lesson'), false);
w.WineNavigation.go({ view: 'learn', lessonId: 'complete' });
d.getElementById('journey-restart').click();
assert.equal(params().get('lesson'), 'start');
await app.close();

// Every step deep-links and refreshes; invalid steps and unrelated context fail honestly.
for (const id of ['start', 'taste', 'aromas', ...data.lessons.map(x => x.id), 'first-comparison', 'complete', 'unknown']) {
  const direct = await createApp({ url: `${base}?view=learn&lesson=${id}` });
  await direct.settle();
  assert.equal(direct.document.activeElement.id, 'journeyHeading');
  assert.match(direct.document.getElementById('journeyView').textContent, id === 'unknown' ? /Lesson not available/ : /Your First Glass/);
  await direct.close();
}
const unrelated = await createApp({ url: `${base}?grape=pinot-noir&region=burgundy&lesson=acidity` });
await unrelated.settle();
assert.equal(new URL(unrelated.window.location.href).searchParams.has('lesson'), false);
await unrelated.close();

// Optional data failures never block the core or strand the beginner.
for (const payload of [null, {}, { ...data, lessons: [] }, { ...data, lessons: [data.lessons[0], data.lessons[0], ...data.lessons.slice(2)] }]) {
  const malformed = await createApp({ url: `${base}?view=learn`, fetch: resource => String(resource).endsWith('beginner-journey.json') ? { ok: true, json: async () => payload } : undefined });
  await malformed.settle();
  assert.match(malformed.document.getElementById('journeyView').textContent, /Lesson not available/);
  malformed.window.WineAtlas.selectProfile('pinot-noir', 'burgundy');
  assert.equal(malformed.document.activeElement.id, 'profileHeading');
  await malformed.close();
}
const noGlossary = await createApp({ url: `${base}?view=learn&lesson=acidity`, fetch: resource => String(resource).endsWith('glossary.json') ? { ok: false, status: 503 } : undefined });
await noGlossary.settle();
assert.match(noGlossary.document.getElementById('journeyView').textContent, /mouth-watering|mouth water/);
noGlossary.document.getElementById('journey-next').click();
assert.equal(new URL(noGlossary.window.location.href).searchParams.get('lesson'), 'tannin');
await noGlossary.close();
const noFlight = await createApp({ url: `${base}?view=learn&lesson=first-comparison`, fetch: resource => String(resource).endsWith('tasting-flights.json') ? { ok: false, status: 503 } : undefined });
await noFlight.settle();
assert.match(noFlight.document.getElementById('journeyView').textContent, /flight is temporarily unavailable/);
noFlight.document.getElementById('journey-next').click();
assert.equal(new URL(noFlight.window.location.href).searchParams.get('lesson'), 'complete');
await noFlight.close();

// Leaving during loading wins; moving keyboard focus alone does not cancel a lesson.
for (const leave of [false, true]) {
  let release;
  const delayed = await createApp({ fetch: (resource, options, localFetch) => String(resource).endsWith('beginner-journey.json') ? new Promise(resolve => { release = () => resolve(localFetch(resource)); }) : undefined });
  assert.ok((await delayed.window.WineSearch.rank('cremant')).length > 0);
  delayed.document.querySelector('[data-journey-open]').click();
  assert.match(delayed.document.getElementById('journeyView').textContent, /Loading/);
  delayed.document.querySelector('#journeyView a').focus();
  if (leave) delayed.window.WineAtlas.selectProfile('pinot-noir', 'burgundy');
  release();
  await delayed.settle();
  assert.equal(delayed.document.activeElement.id, leave ? 'profileHeading' : 'journeyHeading');
  await delayed.close();
}
// A late detailed-guide response must not reopen a dialog over the next lesson.
let finishGuide, guideStarted;
const guideRequest = new Promise(resolve => { guideStarted = resolve; });
const pendingGuide = await createApp({ url: `${base}?view=learn&lesson=acidity`, fetch: (resource, options, localFetch) => String(resource).endsWith('taste-basics.json') ? new Promise(resolve => { finishGuide = () => resolve(localFetch(resource)); guideStarted(); }) : undefined });
await pendingGuide.settle();
pendingGuide.document.getElementById('journey-guide').click();
await guideRequest;
pendingGuide.document.getElementById('journey-next').click();
finishGuide();
await pendingGuide.settle();
assert.equal(pendingGuide.document.getElementById('glossaryDialog').hasAttribute('open'), false);
assert.equal(pendingGuide.document.activeElement.id, 'journeyHeading');
await pendingGuide.close();

const hostile = await createApp({ url: `${base}?view=learn&lesson=acidity`, fetch: resource => String(resource).endsWith('beginner-journey.json') ? { ok: true, json: async () => ({ ...data, lessons: data.lessons.map((l, i) => i ? l : { ...l, cue: '<img src=x onerror=alert(1)>' }) }) } : undefined });
await hostile.settle();
assert.match(hostile.document.getElementById('journeyView').textContent, /<img/);
assert.equal(hostile.document.querySelectorAll('[onerror]').length, 0);
await hostile.close();
console.log('OK: optional beginner journey, progression, reference dialogs, return context, history, loading and safe rendering');
