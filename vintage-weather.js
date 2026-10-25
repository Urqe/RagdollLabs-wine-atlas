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
      'A riper cherry or plum impression and a broader feel are plausible. Check whether the wine still has the acidity and savoury detail you expect from this region.' :
      'Riper citrus or stone-fruit notes and a rounder feel are plausible. Check whether the wine still has the brisk acidity or herbal edge you expect.';
    if (warmth === 'below') return pinot ?
      'Tarter red fruit, a lighter feel and more noticeable acidity are plausible. Check whether the fruit is actually restrained rather than assuming it from the year.' :
      'Sharper citrus, a greener herbal edge and more noticeable acidity are plausible. Check whether the fruit is actually less ripe in this bottle.';
    if (hotSpells) return pinot ?
      'The season average was ordinary, but more hot days leave room for riper red-fruit notes in some bottles. Check that against the wine’s acidity and body; harvest decisions can reverse the impression.' :
      'The season average was ordinary, but more hot days leave room for riper citrus or a rounder feel in some bottles. Check that against the wine’s acidity and herbal edge.';
    return pinot ?
      'There is no strong temperature signal for a departure from the regional red-fruit and savoury reference. Begin there, then check the fruit ripeness, body and acidity in your glass.' :
      'There is no strong temperature signal for a departure from the regional citrus, herbal and fresh-acid reference. Begin there, then check fruit ripeness, texture and acidity in your glass.';
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
    const context = document.createElement('p'); context.textContent = warmth === 'above' ? 'Why this might happen: a warmer growing season can advance ripening, but heat or water stress can also interrupt it.' : warmth === 'below' ? 'Why this might happen: a cooler growing season can slow ripening, depending on harvest timing.' : hotSpells ? 'Why this might happen: the season average was close to baseline, but unusually frequent hot days could affect ripening on exposed sites.' : 'Why the suggestion is restrained: season-average temperature was close to this proxy’s recent baseline.';
    const note = document.createElement('p'); note.className = 'small'; note.textContent = `This is a hypothesis to test against a real ${year} bottle, not a review or a guarantee. Producer, vineyard, harvest date and winemaking can outweigh the regional signal.`;
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
