/* R15 pilot: cached ERA5 regional proxy, never a bottle-level quality score. */
window.WineVintage = (() => {
  const supported = new Set(['sancerre', 'marlborough', 'central-otago']);
  const cache = new Map();
  let current = null;
  let selected = null;
  let epoch = 0;
  const byId = id => document.getElementById(id);
  function valid(data, region) {
    return data?.schema === 1 && data?.region?.hemisphere === (region === 'sancerre' ? 'north' : 'south') &&
      data?.source?.model === 'ERA5' && data.source.baseline === '2000–2020' &&
      Number.isFinite(data?.baseline?.meanC) && Number.isFinite(data?.baseline?.rainMm) &&
      Object.keys(data?.years || {}).length >= 26 && Array.from({ length: Object.keys(data.years).length }, (_, i) => String(2000 + i)).every(year =>
        ['meanC','rainMm','hotDays30','gdd10'].every(key => Number.isFinite(data.years[year]?.[key])));
  }
  function load(region) {
    if (!cache.has(region)) cache.set(region, WineData.json(`./data/vintage/${region}.json`, { optional: true, fallback: null }));
    return cache.get(region);
  }
  const compare = (value, base, threshold) => value - base > threshold ? 'above' : base - value > threshold ? 'below' : 'near';
  function tasteHypothesis(profile, warmth, hotSpells) {
    const pinot = profile.grapeId === 'pinot-noir';
    if (warmth === 'above') return pinot ?
      'This wine might taste of ripe cherry or plum and feel fuller. Taste it to see how fresh it feels.' :
      'This wine might taste of ripe citrus or peach and feel rounder. Taste it to see if it still has a fresh, herbal edge.';
    if (warmth === 'below') return pinot ?
      'This wine might taste of tart red fruit and feel lighter and fresher. Taste the bottle to see if it does.' :
      'This wine might taste of sharp citrus and green herbs, with a fresher feel. Taste the bottle to see if it does.';
    if (hotSpells) return pinot ?
      'Some bottles might taste of riper red fruit and feel fuller. Taste yours to see how fresh it feels.' :
      'Some bottles might taste of riper citrus and feel rounder. Taste yours to see if it has a fresh, herbal edge.';
    return pinot ?
      'The weather gives no clear hint of a different style this year. You might find the usual red fruit, savoury notes and fresh feel. See what you taste in your glass.' :
      'The weather gives no clear hint of a different style this year. You might find the usual citrus, herbs and fresh feel. See what you taste in your glass.';
  }
  function render(data, year, profile) {
    const result = byId('vintageWeatherText');
    const values = data.years[year], baseline = data.baseline;
    const warmth = compare(values.meanC, baseline.meanC, 0.7);
    const hotSpells = warmth === 'near' && values.hotDays30 >= baseline.hotDays30 + 8 && values.hotDays30 >= baseline.hotDays30 * 1.5;
    const rain = compare(values.rainMm, baseline.rainMm, Math.max(25, baseline.rainMm * 0.2));
    const temperature = warmth === 'near' ? 'near its 2000–2020 average' : `${warmth} its 2000–2020 average`;
    const rainfall = rain === 'near' ? 'near the baseline' : `${rain} the baseline`;
    result.replaceChildren();
    const h = document.createElement('h3'); h.textContent = `${year} · ${data.region.label}`;
    const taste = document.createElement('p'); taste.className = 'vintage-taste'; taste.textContent = tasteHypothesis(profile, warmth, hotSpells);
    const context = document.createElement('p'); context.textContent = warmth === 'above' ? 'Why? The growing season was warmer than usual. Grapes may have ripened more, although heat and lack of water can also slow them down.' : warmth === 'below' ? 'Why? The growing season was cooler than usual. Grapes may have ripened more slowly.' : hotSpells ? 'Why? The season was close to average overall, but it had more very hot days than usual.' : 'Why? The growing season was close to its usual temperature. The weather gives us little reason to expect a change in taste.';
    const note = document.createElement('p'); note.className = 'small'; note.textContent = `This is a guide to what you might taste, not a review of a ${year} bottle. The vineyard, harvest and winemaker also affect the taste.`;
    const details = document.createElement('details'); details.className = 'vintage-measures';
    const summary = document.createElement('summary'); summary.textContent = 'Weather behind this reading';
    const measures = document.createElement('p'); measures.textContent = `The ${data.region.season} grid-cell proxy averaged ${values.meanC.toFixed(1)}°C, ${temperature}. Rainfall totaled ${Math.round(values.rainMm)} mm, ${rainfall}; ${values.hotDays30} days reached 30°C. Rainfall totals do not show when it fell or how a vineyard managed water.`;
    details.append(summary, measures);
    result.append(h, taste, context, note, details);
    selected = year;
  }
  function clear() {
    current = null; selected = null; ++epoch;
    byId('vintageWeather')?.classList.add('hidden');
    byId('vintageWeather')?.removeAttribute('open');
    byId('vintageWeatherText')?.replaceChildren();
  }
  async function show(profile) {
    const token = ++epoch;
    current = profile;
    const section = byId('vintageWeather');
    section.classList.add('hidden'); section.open = false;
    if (!profile || !supported.has(profile.regionId)) return;
    const data = await load(profile.regionId);
    if (token !== epoch || current !== profile || !valid(data, profile.regionId)) return;
    const recent = byId('vintageYear'); recent.replaceChildren();
    const years = Object.keys(data.years).map(Number).sort((a, b) => b - a);
    for (const year of years.slice(0, 6)) {
      const option = document.createElement('option'); option.value = String(year); option.textContent = year; recent.append(option);
    }
    byId('vintageOlderYear').value = '';
    byId('vintageOlderYear').max = String(years[5] - 1);
    byId('vintageOlderError').textContent = '';
    const source = byId('vintageSource');
    source.textContent = `${data.source.provider} ${data.source.model} reanalysis, ${data.source.resolution}; requested ${data.region.lat}°, ${data.region.lon}°, returned grid ${data.region.grid.lat}°, ${data.region.grid.lon}° (${Math.round(data.region.grid.elevationM)} m). ${data.region.locationNote} ${data.region.season} season; Southern Hemisphere vintages use October–December of the previous calendar year and January–March of the labeled year. Baseline: ${data.source.baseline}; retrieved ${data.source.retrievedOn}. Daily mean/max 2 m temperature and precipitation; the cached indicators also include days ≥30°C and growing-degree days above 10°C. Reanalysis blends models with observations and does not measure an individual vineyard or bottle. Data: `;
    const a = document.createElement('a'); a.href = data.source.url; a.textContent = 'Open-Meteo historical weather API (CC BY 4.0)'; source.append(a);
    render(data, String(years[0]), profile); section.classList.remove('hidden');
  }
  document.addEventListener('wineatlas:ready', () => {
    byId('vintageYear')?.addEventListener('change', event => {
      const profile = current, year = event.target.value;
      if (profile && supported.has(profile.regionId)) void load(profile.regionId).then(data => { if (profile === current && valid(data, profile.regionId) && data.years[year]) render(data, year, profile); });
    });
    byId('vintageOlderOpen')?.addEventListener('click', () => {
      const input = byId('vintageOlderYear'), year = input.value, error = byId('vintageOlderError');
      if (!/^20\d\d$/.test(year) || +year < 2000 || +year > Number(input.max)) { error.textContent = `Choose a year from 2000 to ${input.max}.`; input.focus(); return; }
      error.textContent = '';
      const profile = current;
      void load(profile.regionId).then(data => { if (profile === current && valid(data, profile.regionId)) render(data, year, profile); });
    });
  });
  document.addEventListener('wineatlas:profile-selected', event => { void show(event.detail.profile); });
  document.addEventListener('wineatlas:selection-needed', clear);
  return Object.freeze({ valid, load, get selected() { return selected; } });
})();
