import assert from 'node:assert/strict';
import { createApp } from './harness.mjs';
const app = await createApp({ url: 'https://example.test/RagdollLabs-wine-atlas/?view=learn&lesson=blind' });
await app.settle();
const { window:w, document:d } = app;
assert.equal(d.activeElement.id, 'journeyHeading');
assert.ok(d.getElementById('blind-set'));
d.getElementById('blind-set').value = 'region'; d.getElementById('blind-set').dispatchEvent(new w.Event('change'));
d.getElementById('blind-count').value = '2'; d.getElementById('blind-count').dispatchEvent(new w.Event('change'));
d.getElementById('blind-actual-A').value = '2'; d.getElementById('blind-actual-B').value = '0';
d.getElementById('blind-bottle-A').value = 'Producer A 2022'; d.getElementById('blind-bottle-B').value = 'Producer B 2021';
d.getElementById('blind-start').click();
assert.equal(d.getElementById('blind-set'), null, 'host mapping removed from learner DOM');
assert.ok(!d.getElementById('journeyView').textContent.includes('Producer A 2022'));
assert.ok(!d.getElementById('journeyView').textContent.includes('Central Otago'));
assert.ok(!w.location.href.includes('pinot') && !w.location.href.includes('region='));
assert.equal(d.getElementById('blind-candidates'), null);
d.getElementById('blind-candidate-step').click(); assert.match(d.getElementById('blind-error')?.textContent || d.body.textContent, /Write at least one observed clue/);
for (const code of ['A','B']) {
  const field=d.getElementById(`blind-clues-${code}`); field.value='Acidity and body; uncertain'; field.dispatchEvent(new w.Event('input'));
}
d.getElementById('blind-candidate-step').click();
assert.ok(d.getElementById('blind-candidates'));
assert.ok(!d.getElementById('journeyView').textContent.includes('Producer A 2022'));
d.getElementById('blind-hypothesis-A').value='Maybe Burgundy'; d.getElementById('blind-hypothesis-A').dispatchEvent(new w.Event('input'));
for (const code of ['A','B']) {
  for (const key of ['hypothesis','alternative']) {
    const field=d.getElementById(`blind-${key}-${code}`); field.value=field.value || 'Uncertain; another region could fit'; field.dispatchEvent(new w.Event('input'));
  }
}
w.WineNavigation.go({ view:'explore' });
w.WineNavigation.go({ view:'learn', lessonId:'blind' });
assert.equal(d.getElementById('blind-hypothesis-A').value,'Maybe Burgundy');
assert.ok(!d.getElementById('journeyView').textContent.includes('Producer A 2022'));
d.getElementById('blind-reveal').click();
assert.match(d.getElementById('journeyView').textContent,/Sample A[\s\S]*Producer A 2022[\s\S]*Central Otago/);
assert.match(d.getElementById('journeyView').textContent,/Sample B[\s\S]*Producer B 2021[\s\S]*Burgundy/);
assert.equal(w.localStorage.length,0); assert.equal(w.sessionStorage.length,0);
d.getElementById('blind-end').click(); assert.ok(d.getElementById('blind-set'));
await app.close();
const fresh=await createApp({url:'https://example.test/RagdollLabs-wine-atlas/?view=learn&lesson=blind'}); await fresh.settle();
assert.ok(fresh.document.getElementById('blind-set')); await fresh.close();
const three=await createApp({url:'https://example.test/RagdollLabs-wine-atlas/?view=learn&lesson=blind'}); await three.settle();
const t=three.document, v=three.window;
t.getElementById('blind-set').value='structure'; t.getElementById('blind-set').dispatchEvent(new v.Event('change'));
t.getElementById('blind-count').value='3'; t.getElementById('blind-count').dispatchEvent(new v.Event('change'));
for (const [code, index] of [['A','1'],['B','2'],['C','0']]) {
  t.getElementById(`blind-actual-${code}`).value=index;
  t.getElementById(`blind-bottle-${code}`).value=`Bottle ${code} NV`;
}
t.getElementById('blind-start').click();
assert.ok(t.getElementById('blind-clues-C'));
assert.ok(!t.getElementById('journeyView').textContent.includes('Bottle C NV'));
await three.close();
console.log('OK: blind setup concealment, neutral route, observation gate, mapping, navigation, reveal and reset');
