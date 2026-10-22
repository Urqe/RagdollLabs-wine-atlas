import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createApp, ROOT } from './harness.mjs';
const data = JSON.parse(await readFile(`${ROOT}/data/beginner-journey.json`, 'utf8'));
const app = await createApp({url:'https://example.test/RagdollLabs-wine-atlas/?view=learn&lesson=taste'});
await app.settle();
const {window:w,document:d} = app;
assert.equal(d.querySelectorAll('.journey-method > li').length,6);
assert.equal(d.activeElement.id,'journeyHeading');
const field=d.getElementById('journey-observation');
assert.ok(d.querySelector(`label[for="${field.id}"]`));
field.value='My own <aroma> and uncertain grip'; field.dispatchEvent(new w.Event('input'));
d.getElementById('journey-next').click();
for(const id of ['acidity','tannin','body','sweetness']) {
  w.WineNavigation.go({view:'learn',lessonId:id});
  const practice=d.getElementById('journeyPractice');
  practice.open=true;
  const guidance=d.getElementById('journeyPracticeGuidance');
  assert.equal(guidance.open,false,'expected descriptions stay behind optional guidance');
  const notes=d.getElementById('journey-observation');
  notes.value='A feels more; uncertain'; notes.dispatchEvent(new w.Event('input'));
  guidance.open=true;
  const profile=guidance.querySelector('a[href*="grape="]'); profile.click();
  assert.equal(new URL(w.location.href).searchParams.get('lesson'),id);
  assert.ok(!d.getElementById('journeyReturn').classList.contains('hidden'));
  d.getElementById('journey-return-link').click();
  assert.equal(d.getElementById('journey-observation').value,'A feels more; uncertain');
  assert.equal(d.getElementById('journeyPracticeGuidance').open,false);
}
w.WineNavigation.go({view:'learn',lessonId:'taste'});
assert.equal(d.getElementById('journey-observation').value,'My own <aroma> and uncertain grip');
assert.equal(w.localStorage.length,0); assert.equal(w.sessionStorage.length,0);
assert.ok(!w.location.href.includes('aroma'));
await app.close();
// Scratch notes do not survive a fresh app instance. Malformed optional practice
// must leave the original vocabulary lessons and browsing usable.
for(const practice of [undefined,{}, {...data.practice,contrasts:{tannin:{...data.practice.contrasts.tannin,wines:[{grape:'x',region:'x'}]}}}]) {
  const bad=await createApp({url:'https://example.test/RagdollLabs-wine-atlas/?view=learn&lesson=tannin',fetch:r=>String(r).endsWith('beginner-journey.json')?{ok:true,json:async()=>({...data,practice})}:undefined});
  await bad.settle();
  assert.match(bad.document.getElementById('journeyPractice').textContent,/temporarily unavailable/);
  bad.document.getElementById('journey-next').click();
  assert.equal(new URL(bad.window.location.href).searchParams.get('lesson'),'body');
  await bad.close();
}
const fresh=await createApp({url:'https://example.test/RagdollLabs-wine-atlas/?view=learn&lesson=taste'}); await fresh.settle();
assert.equal(fresh.document.getElementById('journey-observation').value,''); await fresh.close();
console.log('OK: practical method, independent notes, optional guidance, profile returns and fail-soft practice');
