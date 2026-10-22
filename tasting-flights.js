/* Curated lessons reference the core catalog; comparison and history still have
 * one owner each. Optional flight loading must not block normal wine browsing. */
window.WineFlights = (() => {
  const el = WineDOM.element;
  const byId = id => document.getElementById(id);
  const flightViews = new Set(['flights', 'flight', 'worksheet']);
  let data = [];
  let loaded = false;
  let lessonContext = null;
  const promise = WineData.json('./data/tasting-flights.json', { optional: true, fallback: [] }).then(value => {
    data = Array.isArray(value) ? value : [];
    loaded = true;
    renderRelated();
  });
  function definition(id) {
    const matches = data.filter(item => item?.id === id);
    const flight = matches.length === 1 ? matches[0] : null;
    if (!flight || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) return null;
    for (const field of ['title', 'question', 'intro', 'selection', 'serving', 'limitation']) {
      if (typeof flight[field] !== 'string' || !flight[field].trim()) return null;
    }
    if (!Array.isArray(flight.observations) || flight.observations.length < 2 || flight.observations.length > 3 ||
        !flight.observations.every(text => typeof text === 'string' && text.trim())) return null;
    if (!Array.isArray(flight.wines) || flight.wines.length < 2 || flight.wines.length > 3 ||
        !flight.wines.every(wine => typeof wine?.grape === 'string' && typeof wine.region === 'string')) return null;
    return flight;
  }
  const keyOf = wine => `${wine.grape}::${wine.region}`;
  function resolve(id) {
    const flight = definition(id);
    if (!flight) return null;
    const profiles = flight.wines.map(wine => WineAtlas.combinedProfile(wine.grape, wine.region));
    if (profiles.some(item => !item) || new Set(flight.wines.map(keyOf)).size !== profiles.length ||
        !profiles.slice(1).every(item => WineModel.compatible(profiles[0], item))) return null;
    return { ...flight, profiles };
  }
  function contextId(route) {
    if (!['profile', 'compare'].includes(route.view)) return null;
    const flight = resolve(route.flightId);
    if (!flight) return null;
    if (route.view === 'compare') {
      const expected = flight.wines.map(keyOf).concat(['', '', '']).slice(0, 3);
      if (!WineComparison.snapshot().keys.every((key, i) => key === expected[i])) return null;
    } else if (route.view === 'profile' && !flight.wines.some(wine => wine.grape === route.grapeId && wine.region === route.regionId)) return null;
    return flight.id;
  }
  function routeHref(route) {
    const params = new URLSearchParams({ view: route.view });
    if (route.flightId) params.set('flight', route.flightId);
    if (route.lessonId) params.set('lesson', route.lessonId);
    if (route.view === 'profile') {
      params.delete('view');
      params.set('grape', route.grapeId);
      params.set('region', route.regionId);
    }
    return `?${params}`;
  }
  function link(text, route, id) {
    route = window.WineJourney ? WineJourney.carry(route, lessonContext) : route;
    const node = el('a', text, 'flight-link');
    node.href = routeHref(route);
    if (id) node.id = id;
    node.addEventListener('click', event => {
      // Preserve native new-tab, copy-link and modified-click behavior.
      if (event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      WineNavigation.go(route);
    });
    return node;
  }
  function heading(text, id) {
    const node = el('h2', text);
    node.id = id;
    node.tabIndex = -1;
    return node;
  }
  function paragraph(text, className = '') { return el('p', text, className); }
  function actions(...nodes) {
    const row = el('nav', null, 'flight-actions');
    row.setAttribute('aria-label', 'Tasting flight actions');
    row.append(...nodes);
    return row;
  }
  function hide() {
    lessonContext = null;
    for (const id of ['flightsView', 'worksheetView', 'profileFlightContext', 'compareFlightContext']) byId(id)?.classList.add('hidden');
    document.querySelector('.layout')?.classList.remove('flight-layout');
    document.body.classList.remove('worksheet-route');
  }
  function prepare(worksheet = false) {
    WineUX.showAppShell();
    for (const id of ['emptyView', 'exploreView', 'compareView', 'galleryView']) byId(id)?.classList.add('hidden');
    document.querySelector('.layout').classList.add('flight-layout');
    const target = byId(worksheet ? 'worksheetView' : 'flightsView');
    target.classList.remove('hidden');
    target.replaceChildren();
    document.body.classList.toggle('worksheet-route', worksheet);
    return target;
  }
  function showLoading() {
    hide();
    const target = prepare();
    target.append(heading('Loading tasting flights…', 'flightsHeading'), actions(link('Explore wines', { view: 'explore' })));
    byId('liveStatus').textContent = 'Loading tasting flights.';
  }
  function unavailable(target) {
    target.append(heading('Flight not available', target.id === 'worksheetView' ? 'worksheetHeading' : 'flightsHeading'),
      paragraph('This flight could not be found or its wines are no longer available together. Browse the tasting flights, or explore wines individually.'),
      actions(link('All tasting flights', { view: 'flights' }), link('Explore wines', { view: 'explore' })));
    byId('liveStatus').textContent = 'Tasting flight not available.';
  }
  function flightCard(flight) {
    const card = el('article', null, 'flight-card');
    const title = el('h3');
    title.append(link(flight.title, { view: 'flight', flightId: flight.id }, `flight-card-${flight.id}`));
    card.append(paragraph(`${flight.wines.length} wines · Guided comparison`, 'kicker'), title,
      paragraph(flight.question), paragraph(flight.profiles.map(item => item.region.name).join(' · '), 'small'));
    return card;
  }
  function profileLink(item, flightId, index) {
    return link(`${index + 1}. ${WineModel.profileName(item)} · ${item.region.name}`,
      { view: 'profile', grapeId: item.grapeId, regionId: item.regionId, flightId }, `flight-profile-${index + 1}`);
  }
  function showCatalog(target) {
    target.append(heading('Taste the Difference', 'flightsHeading'),
      paragraph('Six guided ways to explore what changes in the glass. Pick a question, compare the styles, and discover what you notice.'),
      paragraph('You can follow every flight without buying or drinking wine. Read the question, explore the profiles and compare the modeled styles.', 'small'),
      actions(link('Explore wines', { view: 'explore' })));
    const grid = el('div', null, 'flight-grid');
    const flights = data.map(item => resolve(item?.id)).filter(Boolean);
    grid.append(...flights.map(flightCard));
    target.append(grid);
    if (!flights.length) target.append(paragraph('Tasting flights could not be loaded. Explore wines for now, or reload the page to try again.', 'flight-notice'));
    byId('liveStatus').textContent = `${flights.length} guided tasting flights available.`;
  }
  function showDetail(target, flight) {
    target.append(paragraph('Guided tasting flight', 'kicker'), heading(flight.title, 'flightsHeading'),
      paragraph(flight.question, 'flight-question'), paragraph(flight.intro),
      actions(link('Open flight in Compare', { view: 'compare', flightId: flight.id }, 'flight-compare'),
        link('Printable worksheet', { view: 'worksheet', flightId: flight.id }, 'flight-worksheet'),
        link('All tasting flights', { view: 'flights' }, 'flight-all')),
      paragraph('No bottles needed: explore the profiles and Compare to follow the lesson. If tasting, record your own observations on the worksheet before opening the expected profiles.', 'small'));
    const wines = el('section', null, 'flight-section');
    wines.append(el('h3', 'The wines · suggested tasting order'));
    const list = el('div', null, 'flight-wines');
    flight.profiles.forEach((item, index) => list.append(profileLink(item, flight.id, index)));
    wines.append(list);
    target.append(wines);
    for (const [title, text] of [['Choosing bottles', flight.selection], ['Setting up', flight.serving]]) {
      const section = el('section', null, 'flight-section');
      section.append(el('h3', title), paragraph(text));
      if (title === 'Choosing bottles') section.append(paragraph('Open each linked wine profile for any available “Recognize it on the label” cues. Check the actual producer and cuvée before substituting a bottle.', 'small'));
      target.append(section);
    }
    const observations = el('section', null, 'flight-section');
    observations.append(el('h3', 'What to notice'),
      paragraph('Smell first, then take a small sip if tasting. Notice texture as well as flavour. Fruit and spice notes are aroma associations: after spitting or swallowing, breathe out gently through your nose and see what lingers. Sweetness and sourness are not confined to separate zones of your tongue.', 'small'));
    const prompts = el('ol');
    flight.observations.forEach(text => prompts.append(el('li', text)));
    observations.append(prompts);
    const limitations = el('details', null, 'flight-section');
    limitations.id = 'flightLimitations';
    limitations.append(el('summary', 'What this comparison can tell you'), paragraph(flight.limitation),
      paragraph('The profiles describe typical styles; your bottle and your impressions may differ. Use the scores to compare broad tendencies, not to mark your tasting right or wrong. For background reading, open a profile’s Learn more → Sources & methodology.', 'small'));
    target.append(observations, limitations);
    byId('liveStatus').textContent = `${flight.title}. ${flight.wines.length} wines in this guided flight.`;
  }
  function writingLine(label, className = '') {
    const row = el('div', null, `worksheet-line ${className}`);
    row.append(el('span', label), el('span', null, 'worksheet-blank'));
    return row;
  }
  function showWorksheet(target, flight) {
    target.append(heading('Tasting worksheet', 'worksheetHeading'), paragraph(flight.title, 'flight-question'), paragraph(flight.question));
    const print = el('button', 'Print worksheet', 'flight-link');
    print.type = 'button';
    print.addEventListener('click', () => window.print());
    target.append(actions(print, link('Back to flight', { view: 'flight', flightId: flight.id }, 'worksheet-back')),
      paragraph('Write your impressions before reading the expected profiles. Use small pours, or work through the comparison without wine. Numbers below follow the flight’s suggested order.', 'worksheet-intro'));
    flight.profiles.forEach((item, index) => {
      const section = el('section', null, 'worksheet-wine');
      section.append(el('h3', `${index + 1}. ${WineModel.profileName(item)} · ${item.region.name}`),
        writingLine('Bottle / producer'), writingLine('Vintage / date'),
        writingLine('Aromas in my own words', 'worksheet-notes'),
        writingLine('Acidity · tannin · body · sweetness', 'worksheet-notes'),
        writingLine('Finish / preference'));
      target.append(section);
    });
    const reflection = el('section', null, 'worksheet-reflection');
    reflection.append(el('h3', 'Return to the question'), writingLine('What changed? What surprised me?', 'worksheet-notes'),
      paragraph('After recording your impressions, revisit the flight and compare the editorial profiles. Producer, vintage and bottle condition can explain differences; matching the atlas is not the goal.', 'small'));
    target.append(reflection);
    byId('liveStatus').textContent = `Printable worksheet for ${flight.title}.`;
  }
  function show(route) {
    lessonContext = window.WineJourney?.contextId(route) || null;
    const target = prepare(route.view === 'worksheet');
    if (route.view === 'flights') return showCatalog(target);
    const flight = resolve(route.flightId);
    if (!flight) return unavailable(target);
    if (route.view === 'worksheet') showWorksheet(target, flight);
    else showDetail(target, flight);
  }
  function renderContext(route) {
    lessonContext = window.WineJourney?.contextId(route) || null;
    const id = contextId(route);
    const target = byId(route.view === 'compare' ? 'compareFlightContext' : 'profileFlightContext');
    if (!target) return;
    // Stable nodes retain keyboard focus when only the display preference changes.
    if (id && target.dataset.flightId === id && target.dataset.lessonId === (lessonContext || '')) { target.classList.remove('hidden'); return; }
    target.replaceChildren();
    target.dataset.flightId = id || '';
    target.dataset.lessonId = lessonContext || '';
    target.classList.toggle('hidden', !id);
    if (!id) return;
    const flight = resolve(id);
    const titleId = route.view === 'compare' ? 'flightCompareHeading' : 'flightProfileHeading';
    target.append(paragraph('Guided tasting flight', 'kicker'), heading(flight.title, titleId),
      paragraph(flight.question), actions(link('Back to flight', { view: 'flight', flightId: id }, `${route.view}-flight-back`),
        link('Printable worksheet', { view: 'worksheet', flightId: id })));
    if (route.view === 'compare') {
      target.append(paragraph('Describe your own impressions before reading the expected profiles. Changing the wine selection ends this guided comparison; you can still compare manually.', 'small'));
    }
  }
  function renderRelated() {
    const target = byId('relatedFlights');
    if (!target || !window.WineAtlas?.ready) return;
    const profile = WineAtlas.getActiveProfile();
    target.replaceChildren();
    const matches = profile ? data.map(item => resolve(item?.id)).filter(flight => flight && flight.wines.some(wine => wine.grape === profile.grapeId && wine.region === profile.regionId)) : [];
    byId('relatedFlightsCard').classList.toggle('hidden', !matches.length);
    for (const flight of matches) target.append(link(flight.title, { view: 'flight', flightId: flight.id }));
  }
  document.addEventListener('wineatlas:profile-selected', renderRelated);
  document.addEventListener('wineatlas:ready', () => {
    document.querySelectorAll('[data-flights-open]').forEach(node => {
      node.addEventListener('click', event => {
        if (event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        WineNavigation.go({ view: 'flights' });
      });
    });
    renderRelated();
  });
  return Object.freeze({ load: () => promise, get loaded() { return loaded; }, resolve, contextId,
    needsData: route => flightViews.has(route.view) || Boolean(route.flightId),
    isView: view => flightViews.has(view), show, hide, showLoading, renderContext });
})();
