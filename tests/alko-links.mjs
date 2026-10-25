import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createApp, ROOT } from './harness.mjs';

const config = JSON.parse(await readFile(`${ROOT}/data/alko-links.json`, 'utf8'));
const app = await createApp(); await app.settle();
const { window: w, document: d } = app;
const section = d.getElementById('alkoLinks');
const cases = [
  ['pinot-noir', 'burgundy', 'punaviinit?regionId=FRA_bourgogne&grapeId=grape_pinot_noir', false],
  ['chardonnay', 'burgundy', 'valkoviinit?regionId=FRA_bourgogne&grapeId=grape_chardonnay', false],
  ['sauvignon-blanc', 'sancerre', 'valkoviinit?countryId=FRA&grapeId=grape_sauvignon_blanc', true],
  ['sauvignon-blanc', 'marlborough', 'valkoviinit?countryId=NZL&grapeId=grape_sauvignon_blanc', true],
  ['pinot-noir', 'central-otago', 'punaviinit?countryId=NZL&grapeId=grape_pinot_noir', true],
  ['cabernet-sauvignon', 'bordeaux', 'punaviinit?regionId=FRA_bordeaux&grapeId=grape_cabernet_sauvignon', false],
  ['merlot', 'bordeaux', 'punaviinit?regionId=FRA_bordeaux&grapeId=grape_merlot', false],
  ['malbec', 'mendoza', 'punaviinit?regionId=ARG_mendoza&grapeId=grape_malbec', false],
  ['tempranillo', 'rioja', 'punaviinit?regionId=ESP_rioja&grapeId=grape_tempranillo', false],
  ['cabernet-sauvignon', 'napa', 'punaviinit?countryId=USA&grapeId=grape_cabernet_sauvignon', true],
  ['merlot', 'napa', 'punaviinit?countryId=USA&grapeId=grape_merlot', true],
  ['syrah', 'barossa', 'punaviinit?countryId=AUS&grapeId=grape_shiraz', true],
  ['provence-rose-blend', 'cotes-de-provence-rose', 'roseeviinit?regionId=FRA_provence', false],
  ['grenache', 'tavel-rose', 'roseeviinit?countryId=FRA&grapeId=grape_grenache', true],
  ['champagne-blend', 'champagne-brut-nv', 'kuohuviinit-ja-samppanjat?regionId=FRA_champagne', false],
  ['chardonnay', 'cremant-bourgogne', 'kuohuviinit-ja-samppanjat?regionId=FRA_bourgogne&grapeId=grape_chardonnay', false],
  ['pinot-noir', 'cremant-bourgogne', 'kuohuviinit-ja-samppanjat?regionId=FRA_bourgogne&grapeId=grape_pinot_noir', false],
  ['riesling', 'mosel', 'valkoviinit?regionId=DEU_mosel&grapeId=grape_riesling', false],
  ['albarino', 'rias-baixas', 'valkoviinit?countryId=ESP&grapeId=grape_albarino', true],
  ['glera', 'prosecco-doc', 'kuohuviinit-ja-samppanjat?countryId=ITA&grapeId=grape_glera', true],
  ['nebbiolo', 'barolo', 'punaviinit?regionId=ITA_piemonte&grapeId=grape_nebbiolo', false],
  ['nebbiolo', 'barbaresco', 'punaviinit?regionId=ITA_piemonte&grapeId=grape_nebbiolo', false],
  ['barbera', 'barbera-dasti', 'punaviinit?regionId=ITA_piemonte&grapeId=grape_barbera', false],
  ['sangiovese', 'tuscany', 'punaviinit?regionId=ITA_toscana&grapeId=grape_sangiovese', false],
  ['sangiovese', 'brunello', 'punaviinit?regionId=ITA_toscana&grapeId=grape_sangiovese', false],
  ['chardonnay', 'chablis', 'valkoviinit?regionId=FRA_bourgogne&grapeId=grape_chardonnay', false],
  ['gamay', 'beaujolais', 'punaviinit?countryId=FRA&grapeId=grape_gamay', true]
];
for (const [grape, region, url, fallback] of cases) {
  w.WineAtlas.selectProfile(grape, region); await app.settle();
  assert.equal(section.classList.contains('hidden'), false);
  assert.equal(section.querySelector('a').href, `https://www.alko.fi/fi/tuotteet/${url}`);
  assert.match(section.textContent, /Search at Alko/);
  assert.equal(section.textContent.includes('whole country'), fallback);
  assert.equal(section.textContent.includes('blend proportions'), region === 'bordeaux');
  assert.doesNotMatch(section.textContent, /price|stock|available|in stock/i);
  assert.match(config.profiles[`${region}/${grape}`].checkedOn, /^\d{4}-\d{2}-\d{2}$/);
}
const profile = w.WineAtlas.combinedProfile('pinot-noir', 'burgundy');
assert.equal(w.WineAlkoLinks.linkFor(profile, { ...config, regions: { ...config.regions, burgundy: { status: 'none' } } }), null);
assert.equal(w.WineAlkoLinks.linkFor(profile, { ...config, profiles: { ...config.profiles, 'burgundy/pinot-noir': { ...config.profiles['burgundy/pinot-noir'], checkedOn: '' } } }), null);
assert.equal(w.WineAlkoLinks.linkFor(w.WineAtlas.combinedProfile('malbec', 'mendoza'), { ...config, regions: { ...config.regions, mendoza: { ...config.regions.mendoza, id: 'FRA_mendoza' } } }), null);
assert.match(w.WineAlkoLinks.linkFor(w.WineAtlas.combinedProfile('syrah', 'barossa')).label, /Australia Shiraz/);
const champagne = w.WineAtlas.combinedProfile('champagne-blend', 'champagne-brut-nv');
assert.equal(w.WineAlkoLinks.linkFor(champagne, { ...config, profiles: { ...config.profiles, 'champagne-brut-nv/champagne-blend': { ...config.profiles['champagne-brut-nv/champagne-blend'], grapeFilter: true } } }), null);
assert.equal(w.WineAlkoLinks.linkFor(w.WineAtlas.combinedProfile('pinot-noir', 'cremant-bourgogne'), { ...config, profiles: { ...config.profiles, 'cremant-bourgogne/pinot-noir': { ...config.profiles['cremant-bourgogne/pinot-noir'], family: 'still' } } }), null);
w.WineAtlas.selectProfile('pinot-noir', 'willamette'); await app.settle();
assert.equal(section.classList.contains('hidden'), true);
await app.close();

const missing = await createApp({ fetch: url => String(url).includes('/data/alko-links.json') ? { ok: false, status: 404 } : undefined });
await missing.settle();
missing.window.WineAtlas.selectProfile('pinot-noir', 'burgundy'); await missing.settle();
assert.equal(missing.document.getElementById('alkoLinks').classList.contains('hidden'), true);
await missing.close();
console.log('OK: R17 checked links, country fallback, omitted profiles and optional data failure');
