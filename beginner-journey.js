/* Short, optional sensory lessons. URL state owns the current step; there is no
 * progress database, taste score, account or second wine computation. */
window.WineJourney = (() => {
  const el = WineDOM.element;
  const byId = id => document.getElementById(id);
  let data = null;
  let glossary = {};
  let loaded = false;
  const reserved = ['start', 'taste', 'aromas', 'blind', 'first-comparison', 'complete'];
  const scratch = new Map();
  const label = lesson => lesson.id[0].toUpperCase() + lesson.id.slice(1);
  const promise = Promise.all([
    WineData.json('./data/beginner-journey.json', { optional: true, fallback: null }),
    loadGlossary(), WineFlights.load(), WineAromas.load()
  ]).then(([value, definitions]) => {
    data = value;
    glossary = definitions;
    loaded = true;
  });
  function lessons() {
    if (!data || !Array.isArray(data.lessons)) return [];
    const ids = new Set();
    const valid = data.lessons.every(lesson => {
      if (!lesson || !/^[a-z][a-z0-9-]*$/.test(lesson.id) || reserved.includes(lesson.id) || ids.has(lesson.id)) return false;
      ids.add(lesson.id);
      return ['title', 'glossary', 'cue', 'exercise', 'takeaway', 'flight', 'guideSection'].every(field => typeof lesson[field] === 'string' && lesson[field].trim()) &&
        typeof lesson.profile?.grape === 'string' && typeof lesson.profile.region === 'string';
    });
    return valid && data.lessons.length === 4 && typeof data.title === 'string' && data.title.trim() &&
      typeof data.intro === 'string' && data.intro.trim() && typeof data.firstFlight === 'string' ? data.lessons : [];
  }
  function resolve(id) {
    if (!lessons().length) return null;
    if (reserved.includes(id)) return { id };
    return lessons().find(lesson => lesson.id === id) || null;
  }
  function contextId(route) {
    const lesson = resolve(route.lessonId);
    if (!lesson || route.view === 'learn') return null;
    const flight = lesson.id === 'first-comparison' ? data.firstFlight : lesson.flight;
    if (route.view === 'profile') {
      if (lesson.profile?.grape === route.grapeId && lesson.profile.region === route.regionId) return lesson.id;
      if (practice(lesson.id)?.wines.some(wine => wine.grape === route.grapeId && wine.region === route.regionId)) return lesson.id;
      const linked = route.flightId === flight && WineFlights.resolve(flight);
      return linked && linked.wines.some(wine => wine.grape === route.grapeId && wine.region === route.regionId) ? lesson.id : null;
    }
    if (['flight', 'worksheet', 'compare'].includes(route.view) && route.flightId === flight && WineFlights.resolve(flight)) {
      return route.view !== 'compare' || WineFlights.contextId(route) ? lesson.id : null;
    }
    return null;
  }
  function carry(route, lessonId) {
    // During creation of a new comparison its state has not committed yet. The
    // flight route will validate the full selection before writing its URL.
    const check = route.view === 'compare' ? { ...route, view: 'flight', lessonId } : { ...route, lessonId };
    return contextId(check) ? { ...route, lessonId } : route;
  }
  function href(route) {
    const p = new URLSearchParams();
    if (route.view === 'profile') { p.set('grape', route.grapeId); p.set('region', route.regionId); }
    else p.set('view', route.view);
    if (route.lessonId) p.set('lesson', route.lessonId);
    if (route.flightId) p.set('flight', route.flightId);
    return `?${p}`;
  }
  function link(text, route, id, primary = false) {
    const node = el('a', text, `journey-link${primary ? ' journey-primary' : ''}`);
    node.href = href(route);
    if (id) node.id = id;
    node.addEventListener('click', event => {
      if (event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      WineNavigation.go(route);
    });
    return node;
  }
  function heading(text) {
    const node = el('h2', text);
    node.id = 'journeyHeading';
    node.tabIndex = -1;
    return node;
  }
  function hide() {
    byId('journeyView')?.classList.add('hidden');
    byId('journeyReturn')?.classList.add('hidden');
    document.querySelector('.layout')?.classList.remove('journey-layout');
  }
  function prepare() {
    WineUX.showAppShell();
    for (const id of ['emptyView', 'exploreView', 'compareView', 'galleryView', 'flightsView', 'worksheetView']) byId(id).classList.add('hidden');
    document.querySelector('.layout').classList.add('journey-layout');
    const target = byId('journeyView');
    target.classList.remove('hidden');
    target.replaceChildren();
    return target;
  }
  function actions(...nodes) {
    const nav = el('nav', null, 'journey-actions');
    nav.setAttribute('aria-label', 'Lesson actions');
    nav.append(...nodes);
    return nav;
  }
  function showLoading() {
    const target = prepare();
    target.append(heading('Loading Your First Glass…'), actions(link('Explore wines', { view: 'explore' })));
    byId('liveStatus').textContent = 'Loading the beginner journey.';
  }
  function progress(current) {
    const nav = el('nav', null, 'journey-progress');
    nav.setAttribute('aria-label', 'Journey steps');
    const steps = [['start', 'Start'], ['taste', 'Tasting method'], ...lessons().map(lesson => [lesson.id, label(lesson)]), ['aromas', 'Find the Notes'], ['first-comparison', 'Try a comparison'], ['blind', 'Blind practice'], ['complete', 'Finish']];
    for (const [id, label] of steps) {
      const node = link(label, { view: 'learn', lessonId: id }, `journey-step-${id}`);
      if (id === current) node.setAttribute('aria-current', 'step');
      nav.append(node);
    }
    return nav;
  }
  function referenceButtons(target, section, glossaryId) {
    const details = el('details', null, 'journey-more');
    details.id = 'journeyMore';
    details.append(el('summary', 'Definitions, scores & more detail'));
    const controls = el('div', null, 'journey-actions');
    const buttons = [
      ['Read the full taste guide', button => WineLearning.showGuide(section, button)],
      ['Browse the wine glossary', button => WineLearning.showGlossary(button)]
    ];
    if (glossary[glossaryId]) {
      details.append(el('p', glossary[glossaryId].definition));
      buttons.unshift(['Open this glossary entry', button => WineLearning.showEntry(glossaryId, button)]);
    }
    for (const [text, action] of buttons) {
      const button = el('button', text, 'journey-link');
      button.type = 'button';
      button.id = text.startsWith('Open') ? 'journey-definition' : text.startsWith('Read') ? 'journey-guide' : 'journey-glossary';
      button.addEventListener('click', () => action(button));
      controls.append(button);
    }
    details.append(controls);
    target.append(details);
  }
  function practice(id) {
    const entry = data?.practice?.contrasts?.[id];
    if (!entry || !['title', 'selection', 'prompt', 'guidance'].every(key => typeof entry[key] === 'string' && entry[key].trim()) ||
        !Array.isArray(entry.wines) || entry.wines.length !== 2 || !entry.wines.every(wine => WineAtlas.combinedProfile(wine?.grape, wine?.region)) ||
        !Array.isArray(entry.references) || !entry.references.length || !entry.references.every(key => reference(key))) return null;
    return entry;
  }
  function reference(id) {
    const ref = data?.practice?.references?.[id];
    if (!ref || !['label', 'url', 'scope', 'reviewedOn'].every(key => typeof ref[key] === 'string' && ref[key].trim())) return null;
    try { return new URL(ref.url).protocol === 'https:' ? ref : null; } catch { return null; }
  }
  function sources(target, ids) {
    const details = el('details', null, 'journey-more');
    details.append(el('summary', 'Further reading'));
    for (const id of ids) {
      const ref = reference(id);
      if (!ref) continue;
      const a = el('a', ref.label, 'journey-link');
      a.href = ref.url;
      details.append(a);
    }
    target.append(details);
  }
  function observation(target, id) {
    const label = el('label', 'Your observations · before opening the guidance');
    const field = el('textarea');
    field.id = 'journey-observation';
    field.rows = 4;
    field.maxLength = 2000;
    label.htmlFor = field.id;
    field.value = scratch.get(id) || '';
    field.setAttribute('aria-describedby', 'journey-note-help');
    field.addEventListener('input', () => scratch.set(id, field.value));
    target.append(label, field, el('p', 'Optional scratch notes stay in this tab while you explore. Reloading clears them. They are not saved or scored. You can also write on paper.', 'small'));
    field.nextElementSibling.id = 'journey-note-help';
  }
  function showMethod(target) {
    target.append(heading('A simple method for your first tasting'), el('p', 'Use one wine or a pair. Reading explains the method; trying real examples helps you learn the sensations. There is no target drinking amount or pace.', 'journey-lead'));
    const steps = data?.practice?.method;
    if (Array.isArray(steps) && steps.length === 6 && steps.every(step => step && typeof step.title === 'string' && step.title.trim() && typeof step.body === 'string' && step.body.trim())) {
      const list = el('ol', null, 'journey-method');
      for (const step of steps) { const li = el('li'); li.append(el('h3', step.title), el('p', step.body)); list.append(li); }
      target.append(list);
      observation(target, 'taste');
      sources(target, ['method', 'taste']);
    } else target.append(el('p', 'The tasting method is temporarily unavailable. You can still continue with the four ideas or reload to try again.'));
    target.append(actions(link('Next: Acidity', { view: 'learn', lessonId: 'acidity' }, 'journey-next', true), link('Back', { view: 'learn', lessonId: 'start' })));
  }
  function showPractice(target, id) {
    const entry = practice(id);
    const details = el('details', null, 'journey-more');
    details.id = 'journeyPractice';
    details.append(el('summary', 'Practise with real examples'));
    if (!entry) { details.append(el('p', 'Practice details are temporarily unavailable. Continue with the idea above or reload to try again.')); target.append(details); return; }
    details.append(el('h3', entry.title), el('p', entry.selection), el('p', 'Label the selected wines A and B. These are named learning examples, not a blind test. If you have no wine, read the instructions; imagined sensations do not establish practical recognition.', 'small'), el('p', entry.prompt), el('p', 'Use the pair as a reference: lower, middle or higher describes your impression relative to these glasses. You can also write similar or uncertain. These are not laboratory levels or targets on the atlas’s 0–5 scales.', 'small'));
    observation(details, id);
    const guidance = el('details', null, 'journey-more');
    guidance.id = 'journeyPracticeGuidance';
    guidance.append(el('summary', 'After noting impressions: compare guidance'), el('p', entry.guidance));
    const links = entry.wines.map(wine => {
      const item = WineAtlas.combinedProfile(wine.grape, wine.region);
      return link(`${WineModel.profileName(item)} · ${item.region.name}`, { view: 'profile', grapeId: wine.grape, regionId: wine.region, lessonId: id });
    });
    guidance.append(actions(...links));
    sources(guidance, entry.references);
    details.append(guidance);
    target.append(details);
  }
  function show(route) {
    const target = prepare();
    const id = route.lessonId || 'start';
    const step = resolve(id);
    if (!step) {
      target.append(heading('Lesson not available'), el('p', 'This lesson could not be found or the beginner guide could not be loaded. Start again, or explore the atlas. Reload the page if the guide is temporarily unavailable.'),
        actions(link('Start the journey', { view: 'learn', lessonId: 'start' }), link('Explore wines', { view: 'explore' })));
      byId('liveStatus').textContent = 'Beginner lesson not available.';
      return;
    }
    target.append(el('p', data.title, 'kicker'));
    if (id === 'blind') {
      const status = WineBlind.show(target, { heading, actions, link, rerender: () => WineNavigation.go({ view: 'learn', lessonId: 'blind' }, { history: 'none' }) });
      target.append(progress(id));
      byId('liveStatus').textContent = `${data.title}. ${status}`;
      return;
    } else if (id === 'aromas') {
      const status = WineAromas.show(target, { heading, actions, link, observation, clearNotes: key => scratch.delete(key), rerender: () => WineNavigation.go({ view: 'learn', lessonId: 'aromas' }, { history: 'none' }) });
      target.append(progress(id));
      byId('liveStatus').textContent = `${data.title}. ${status}`;
      return;
    } else if (id === 'taste') {
      showMethod(target);
    } else if (id === 'start') {
      target.append(heading('From your first sip to useful words'), el('p', data.intro, 'journey-lead'),
        el('p', 'Learn to separate mouth-watering acidity, drying tannin, the weight of body and the taste of sweetness. There is no right preference and no test to pass.'),
        actions(link('Learn the tasting method', { view: 'learn', lessonId: 'taste' }, 'journey-next', true)),
        actions(link('Find aroma notes', { view: 'learn', lessonId: 'aromas' }, 'journey-aromas')),
        actions(link('Try blind practice', { view: 'learn', lessonId: 'blind' }, 'journey-blind')),
        actions(link('Begin with acidity', { view: 'learn', lessonId: lessons()[0].id }, 'journey-vocabulary')),
        el('p', 'Already comfortable with those ideas? Skip straight to the comparison or use Explore and Compare as usual.', 'small'),
        actions(link('Skip to the comparison', { view: 'learn', lessonId: 'first-comparison' }, 'journey-skip'), link('Explore wines', { view: 'explore' })));
      referenceButtons(target, 'scores');
    } else if (id === 'complete') {
      target.append(heading('You have four useful questions'), el('p', 'How mouth-watering? How grippy? How weighty? How sweet? Use those questions to describe a wine before deciding whether you like it.', 'journey-lead'),
        el('p', 'Fruit aroma is separate from sugar; drying tannin is separate from acidity. Body describes weight, not quality. Reading or finishing this journey does not demonstrate tasting skill. Return to real examples when useful; your preference can change with the bottle, food and occasion.'),
        actions(link('Explore tasting flights', { view: 'flights' }, 'journey-next', true), link('Explore wines', { view: 'explore' })),
        actions(link('Practise aroma recognition', { view: 'learn', lessonId: 'aromas' }, 'journey-aromas')),
        actions(link('Try blind practice', { view: 'learn', lessonId: 'blind' }, 'journey-blind')),
        actions(link('Restart the journey', { view: 'learn', lessonId: 'start' }, 'journey-restart'), link('Back to the comparison', { view: 'learn', lessonId: 'first-comparison' })));
      referenceButtons(target, 'scores');
    } else if (id === 'first-comparison') {
      target.append(heading('Put the four ideas together'), el('p', 'Start with Sauvignon Blanc from Sancerre and Marlborough. Both atlas references are dry whites: compare how they smell and feel without equating fruit aroma with sugar.', 'journey-lead'),
        el('p', 'Before reading the expected profiles, note one aroma and your impressions of acidity, tannin, body and sweetness. If you have no wine, read the flight and use Compare to identify which differences the atlas actually models. Do not invent a difference when the scores agree.'),
        el('p', 'This is a regional learning contrast, not a controlled experiment or a quality contest. Producer and vintage can change what you notice.'));
      const flight = WineFlights.resolve(data.firstFlight);
      if (flight) target.append(actions(link('Try the Sauvignon Blanc flight', { view: 'flight', flightId: flight.id, lessonId: id }, 'journey-flight')));
      else target.append(el('p', 'The guided flight is temporarily unavailable. You can still finish the journey or explore wines individually.', 'small'));
      target.append(actions(link('Finish the journey', { view: 'learn', lessonId: 'complete' }, 'journey-next', true), link('Back to sweetness', { view: 'learn', lessonId: lessons().at(-1).id })));
      referenceButtons(target, 'scores');
    } else {
      const index = lessons().findIndex(lesson => lesson.id === id);
      target.append(el('p', `Idea ${index + 1} of 4`, 'small'), heading(step.title), el('p', step.cue, 'journey-lead'));
      const exercise = el('section', null, 'journey-exercise');
      exercise.append(el('h3', 'Try noticing this'), el('p', step.exercise));
      target.append(exercise, el('p', step.takeaway));
      showPractice(target, id);
      const next = lessons()[index + 1];
      target.append(actions(link(next ? `Next: ${label(next)}` : 'Next: try a comparison', { view: 'learn', lessonId: next?.id || 'first-comparison' }, 'journey-next', true),
        link('Back', { view: 'learn', lessonId: lessons()[index - 1]?.id || 'taste' }, 'journey-back')));
      const examples = el('details', null, 'journey-more');
      examples.id = 'journeyExamples';
      examples.append(el('summary', 'Explore an example'));
      const links = [];
      const profile = WineAtlas.combinedProfile(step.profile.grape, step.profile.region);
      if (profile) links.push(link(`${WineModel.profileName(profile)} · ${profile.region.name}`, { view: 'profile', grapeId: profile.grapeId, regionId: profile.regionId, lessonId: id }, 'journey-profile'));
      const flight = WineFlights.resolve(step.flight);
      if (flight) links.push(link(flight.title, { view: 'flight', flightId: flight.id, lessonId: id }, 'journey-flight'));
      examples.append(links.length ? actions(...links) : el('p', 'The example is unavailable, but you can continue with the observation above.'));
      target.append(examples);
      referenceButtons(target, step.guideSection, step.glossary);
    }
    target.append(progress(id));
    byId('liveStatus').textContent = `${data.title}. ${id === 'complete' ? 'Journey complete.' : id === 'start' ? 'Ready to begin.' : id === 'first-comparison' ? 'Try a guided comparison.' : id === 'taste' ? 'Tasting method.' : step.title}`;
  }
  function renderReturn(route) {
    const target = byId('journeyReturn');
    const id = contextId(route);
    if (id && target.dataset.lessonId === id) { target.classList.remove('hidden'); return; }
    target.replaceChildren();
    target.dataset.lessonId = id || '';
    target.classList.toggle('hidden', !id);
    if (!id) return;
    const step = resolve(id);
    target.append(el('p', 'Your First Glass · Continue learning', 'kicker'),
      link(`Back to ${id === 'first-comparison' ? 'your first comparison' : label(step)}`, { view: 'learn', lessonId: id }, 'journey-return-link'));
  }
  document.addEventListener('wineatlas:ready', () => {
    document.querySelectorAll('[data-journey-open]').forEach(button => button.addEventListener('click', () => WineNavigation.go({ view: 'learn', lessonId: 'start' })));
  });
  return Object.freeze({ load: () => promise, get loaded() { return loaded; }, resolve, contextId, carry, show, hide, showLoading, renderReturn });
})();
