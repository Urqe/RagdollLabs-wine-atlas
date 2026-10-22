import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createApp, ROOT } from './harness.mjs';
const data=JSON.parse(await readFile(`${ROOT}/data/aroma-practice.json`,'utf8'));
const url='https://example.test/RagdollLabs-wine-atlas/?view=learn&lesson=aromas';
const app=await createApp({url}); await app.settle();
const {window:w,document:d}=app;
const go=()=>w.WineNavigation.go({view:'learn',lessonId:'aromas'});
assert.equal(d.activeElement.id,'journeyHeading');
assert.match(d.getElementById('liveStatus').textContent,/Find the Notes/);
for(const id of ['aroma-vocabulary','aroma-references','aroma-setup']) assert.equal(d.getElementById(id).open,false);
assert.ok(d.querySelector('label[for="journey-observation"]'));
const note=d.getElementById('journey-observation'); note.value='<img src=x onerror=alert(1)> my own word';note.dispatchEvent(new w.Event('input'));
w.WineNavigation.go({view:'learn',lessonId:'taste'});go();
assert.equal(d.getElementById('journey-observation').value,note.value);
assert.equal(d.querySelectorAll('[onerror]').length,0);
// A partner must record distinct, real sample identities. Setup is removed from
// the learner DOM, not merely styled as hidden; refresh has no mapping to recover.
d.getElementById('aroma-start').click(); assert.match(d.getElementById('aroma-setup-error').textContent,/two different/);
d.getElementById('aroma-actual-A').value='lemon'; d.getElementById('aroma-actual-B').value='lemon';
d.getElementById('aroma-start').click();assert.ok(d.getElementById('aroma-setup'));
d.getElementById('aroma-actual-B').value='mint';d.getElementById('aroma-start').click();
assert.equal(d.getElementById('aroma-setup'),null);
assert.equal(d.getElementById('aroma-references'),null);
assert.equal(d.getElementById('aroma-feedback'),null);
assert.equal(d.getElementById('aroma-guess-A').value,'');
assert.equal(d.getElementById('journey-observation').value,'');
assert.equal(d.activeElement.id,'journeyHeading');
assert.match(d.getElementById('liveStatus').textContent,/Identities concealed/);
const guess=d.getElementById('aroma-guess-A');guess.value='lemon';guess.dispatchEvent(new w.Event('change'));
const notes=d.getElementById('journey-observation');notes.value='A bright, B leafy';notes.dispatchEvent(new w.Event('input'));
w.WineNavigation.go({view:'learn',lessonId:'acidity'});go();
assert.equal(d.getElementById('aroma-guess-A').value,'lemon');
assert.equal(d.getElementById('aroma-feedback'),null,'route return must not reveal identities');
assert.equal(d.getElementById('journey-observation').value,'A bright, B leafy');
assert.equal(new URL(w.location.href).searchParams.get('lesson'),'aromas');
assert.ok(!w.location.href.includes('lemon'));assert.equal(w.localStorage.length,0);assert.equal(w.sessionStorage.length,0);
d.getElementById('aroma-reveal').click();
assert.match(d.getElementById('aroma-feedback').textContent,/Sample A: Lemon peel/);
assert.match(d.getElementById('aroma-feedback').textContent,/selection matches/);
assert.match(d.getElementById('aroma-feedback').textContent,/Sample B: Fresh mint/);
assert.match(d.getElementById('aroma-feedback').textContent,/left this uncertain/);
d.getElementById('aroma-reset').click();assert.equal(d.getElementById('aroma-feedback'),null);
// Reverse the mapping and choose a nonmatching reference: feedback follows the
// recorded contents, never the reference list order or prior round.
d.getElementById('aroma-actual-A').value='mint';d.getElementById('aroma-actual-B').value='lemon';d.getElementById('aroma-start').click();
const g=d.getElementById('aroma-guess-A');g.value='apple';g.dispatchEvent(new w.Event('change'));
d.getElementById('aroma-reveal').click();
assert.match(d.getElementById('aroma-feedback').textContent,/Sample A: Fresh mint/);
assert.match(d.getElementById('aroma-feedback').textContent,/You selected Fresh apple/);
await app.close();
const fresh=await createApp({url}); await fresh.settle();assert.ok(fresh.document.getElementById('aroma-setup'));assert.equal(fresh.document.getElementById('aroma-feedback'),null);assert.equal(fresh.document.getElementById('journey-observation').value,'');await fresh.close();
// Optional malformed data must fail softly without stranding the four lessons.
for(const payload of [null,{}, {...data,samples:[null,...data.samples.slice(1)]}, {...data,sources:[{...data.sources[0],url:'javascript:alert(1)'}]}, {...data,samples:data.samples.map(x=>({...x,id:'duplicate'}))}]) {
 const bad=await createApp({url,fetch:r=>String(r).endsWith('aroma-practice.json')?{ok:true,json:async()=>payload}:undefined});await bad.settle();
 assert.match(bad.document.getElementById('journeyView').textContent,/Aroma practice unavailable/);
 bad.window.WineNavigation.go({view:'learn',lessonId:'tannin'});assert.match(bad.document.getElementById('journeyView').textContent,/drying grip/);await bad.close();
}
const hostile=await createApp({url,fetch:r=>String(r).endsWith('aroma-practice.json')?{ok:true,json:async()=>({...data,samples:data.samples.map((x,i)=>i?x:{...x,name:'<img src=x onerror=alert(1)>'})})}:undefined});await hostile.settle();
assert.match(hostile.document.getElementById('aroma-references').textContent,/<img/);assert.equal(hostile.document.querySelectorAll('[onerror]').length,0);await hostile.close();
console.log('OK: aroma observation, optional vocabulary, coded reference setup/reveal/reset, tab-only state and safe failures');
