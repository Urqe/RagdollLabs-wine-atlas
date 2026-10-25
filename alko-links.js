/* R17: a small, checked set of outbound search links. No Alko catalog data is fetched. */
window.WineAlkoLinks = (() => {
  const node = () => document.getElementById('alkoLinks');
  let config = null;
  let active = null;
  const load = WineData.json('./data/alko-links.json', { optional: true, fallback: null }).then(data => {
    config = data?.schema === 1 ? data : null;
    render(active);
  });
  function linkFor(profile, data = config) {
    if (!profile || !data || data.base !== 'https://www.alko.fi/fi/tuotteet/') return null;
    const entry = data.profiles?.[`${profile.regionId}/${profile.grapeId}`];
    const region = data.regions?.[profile.regionId];
    const style = profile.regional?.style;
    if (!entry || !region || !/^\d{4}-\d{2}-\d{2}$/.test(entry.checkedOn) ||
        !/^\d{4}-\d{2}-\d{2}$/.test(region.checkedOn) ||
        style?.family !== (entry.family || 'still') || style.color !== entry.color ||
        !['red', 'white', 'rose'].includes(entry.color) ||
        !['still', 'rose', 'sparkling'].includes(style.family)) return null;
    const categoryKey = style.family === 'sparkling' ? 'sparkling' : entry.color;
    const category = data.categories?.[categoryKey];
    const grape = data.grapes?.[profile.grapeId];
    const country = data.countries?.[profile.region.country];
    if (!['punaviinit', 'valkoviinit', 'roseeviinit', 'kuohuviinit-ja-samppanjat'].includes(category)) return null;
    const omitGrape = entry.grapeFilter === false && style.composition?.kind === 'representative-blend';
    if (entry.grapeFilter === false && !omitGrape) return null;
    if (!omitGrape && !/^grape_[a-z_]+$/.test(grape || '')) return null;
    if (!/^[A-Z]{3}$/.test(country || '')) return null;
    const url = new URL(category, data.base);
    let label;
    const grapeLabel = omitGrape ? '' : `${data.grapeLabels?.[profile.grapeId] || profile.grape.name} `;
    const styleLabel = style.family === 'sparkling' ? 'sparkling wines ' : style.family === 'rose' ? 'rosé wines ' : '';
    if (entry.scope === 'region' && region.status === 'verified' &&
        /^[A-Z]{3}_[a-z0-9-]+$/.test(region.id || '') && region.id.startsWith(`${country}_`) &&
        typeof region.label === 'string' && region.label.trim()) {
      url.searchParams.set('regionId', region.id);
      label = `${region.label} ${grapeLabel}${styleLabel}at Alko`;
    } else if (entry.scope === 'country' && region.status === 'country-fallback') {
      url.searchParams.set('countryId', country);
      label = `${profile.region.country} ${grapeLabel}${styleLabel}at Alko`;
    } else return null;
    if (!omitGrape) url.searchParams.set('grapeId', grape);
    return { url: url.href, label, countryFallback: entry.scope === 'country', blendNote: !omitGrape && style.composition?.kind === 'representative-blend' };
  }
  function render(profile) {
    active = profile;
    const section = node();
    if (!section) return;
    section.replaceChildren();
    section.classList.add('hidden');
    const item = linkFor(profile);
    if (!item) return;
    const link = document.createElement('a');
    link.href = item.url;
    link.textContent = 'Search at Alko';
    link.setAttribute('aria-label', `Search ${item.label}`);
    const description = document.createElement('span');
    description.textContent = `${item.countryFallback ? `Search ${item.label}. This covers the whole country, not just ${profile.region.name}.` : `Search ${item.label}.`}${item.blendNote ? " Alko's grape filter does not show blend proportions." : ''} Results open on Alko's site.`;
    section.append(link, description);
    section.classList.remove('hidden');
  }
  document.addEventListener('wineatlas:profile-selected', event => render(event.detail.profile));
  document.addEventListener('wineatlas:selection-needed', () => render(null));
  return Object.freeze({ load: () => load, linkFor, render });
})();
