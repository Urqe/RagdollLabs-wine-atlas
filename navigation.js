/* URL owns the view and comparison; history entries own scroll and focus.
 * Feature modules render through the existing APIs under a re-entry guard.
 */
window.WineNavigation = (() => {
  let rendering = false;
  let restoring = false;
  let epoch = 0;
  let transition = 0;
  const byId = id => document.getElementById(id);
  const visible = node => node && !node.closest('.hidden, [hidden]');
  function focusKey(node) {
    if (node?.id) return { id: node.id };
    if (node?.matches('.gallery-card')) return { grape: node.dataset.grape, region: node.dataset.region };
    return null;
  }
  function save() {
    if (rendering || restoring) return;
    window.history.replaceState({ ...window.history.state, wineAtlas: {
      x: window.scrollX, y: window.scrollY, focus: focusKey(document.activeElement),
      sidebar: document.querySelector('.layout > aside')?.scrollTop || 0,
      details: [...document.querySelectorAll('details[id][open]')].map(node => node.id)
    } }, '', window.location.href);
  }
  function urlFor(route) {
    const url = new URL(window.location.href);
    for (const key of ['view', 'grape', 'region', 'compare', 'biggest', 'action', 'flight']) url.searchParams.delete(key);
    if (route.view === 'profile') {
      url.searchParams.set('grape', route.grapeId);
      url.searchParams.set('region', route.regionId);
    } else if (route.view !== 'home') {
      url.searchParams.set('view', route.view === 'invalid' ? 'explore' : route.view);
      if (route.view === 'compare') {
        const state = WineComparison.snapshot();
        const keys = state.keys.join(',').replace(/,+$/, '');
        if (keys) url.searchParams.set('compare', keys);
        if (state.biggestOnly) url.searchParams.set('biggest', '1');
      } else if (route.view === 'explore' && ['place', 'search'].includes(route.action)) {
        url.searchParams.set('action', route.action);
      }
    }
    if (route.flightId && (['flight', 'worksheet'].includes(route.view) || WineFlights.contextId(route))) url.searchParams.set('flight', route.flightId);
    return url;
  }
  function write(route, method = 'push') {
    const url = urlFor(route);
    if (method === 'none' || url.href === location.href) return;
    window.history[method === 'replace' ? 'replaceState' : 'pushState'](null, '', url);
  }
  function read() {
    const params = new URL(location.href).searchParams;
    const view = params.get('view');
    if (view === 'compare') {
      const state = params.has('compare') ? { keys: params.get('compare').split(',').slice(0, 3), biggestOnly: params.get('biggest') === '1' } : params.has('flight') ? null : { keys: [], biggestOnly: false };
      return { view, flightId: params.get('flight'), state };
    }
    if (WineFlights.isView(view)) return { view, flightId: params.get('flight') };
    if (view === 'gallery') return { view };
    if (view === 'explore') return { view, action: params.get('action') };
    if (params.has('grape') || params.has('region')) {
      const grapeId = params.get('grape'), regionId = params.get('region');
      return WineAtlas.combinedProfile(grapeId, regionId) ? { view: 'profile', grapeId, regionId, flightId: params.get('flight') } : { view: 'invalid' };
    }
    return { view: 'home' };
  }
  function destination(route) {
    if (WineFlights.isView(route.view)) return byId(route.view === 'worksheet' ? 'worksheetHeading' : 'flightsHeading');
    if (route.view === 'compare' && WineFlights.contextId(route)) return byId('flightCompareHeading');
    return byId(route.view === 'profile' ? 'profileHeading' : route.view === 'gallery' ? 'galleryHeading' : route.view === 'compare' ? 'compareDiscoveryInput' : route.view === 'home' ? 'welcomeTitle' : route.action === 'search' ? 'searchInput' : route.action === 'place' ? 'country' : 'grape');
  }
  function orient(node, scroll = true) {
    if (!visible(node)) return;
    if (!node.matches('button, input, select, a[href], textarea')) node.tabIndex = -1;
    node.focus({ preventScroll: true });
    if (scroll) node.scrollIntoView?.({ block: 'start' });
  }
  function restorePosition(route, saved, token) {
    const apply = () => {
      if (epoch !== token) return;
      for (const node of document.querySelectorAll('details[id]')) node.open = Boolean(saved?.details?.includes(node.id));
      let node = saved?.focus?.id ? byId(saved.focus.id) : null;
      if (saved?.focus?.grape) node = [...document.querySelectorAll('.gallery-card')].find(card => card.dataset.grape === saved.focus.grape && card.dataset.region === saved.focus.region);
      orient(visible(node) ? node : destination(route), !saved);
      if (saved) {
        const sidebar = document.querySelector('.layout > aside');
        if (sidebar) sidebar.scrollTop = saved.sidebar || 0;
        // JSDOM has no layout or scrollTo implementation.
        if (window.scrollTo && !navigator.userAgent.includes('jsdom')) window.scrollTo(saved.x || 0, saved.y || 0);
      }
    };
    apply();
    restoring = false;
    // Lazy profile panels can change page height after the initial render.
    if (!saved) { save(); return; }
    WineData.whenIdle().then(() => {
      if (epoch !== token) return;
      apply();
      restoring = false;
      save();
    });
  }
  function go(route, options = {}) {
    const token = ++epoch;
    const transitionToken = ++transition;
    if (!options.restore) { restoring = false; if (!options.skipSave) save(); }
    restoring = Boolean(options.restore);
    rendering = true;
    try {
      const dialog = byId('glossaryDialog');
      if (dialog?.open) {
        if (typeof dialog.close === 'function') dialog.close();
        else dialog.removeAttribute('open');
      }
      WineGallery.hide();
      WineFlights.hide();
      if (WineFlights.needsData(route) && !WineFlights.loaded) {
        WineFlights.showLoading();
        WineFlights.load().then(() => {
          if (transition === transitionToken) go(route, { ...options, skipSave: true });
        });
        return true;
      }
      if (route.view === 'home') {
        WineAtlas.clearActiveProfile();
        WineUX.showWelcome();
        byId('liveStatus').textContent = 'Wine Atlas. Choose how to explore.';
      } else {
        WineUX.showAppShell();
        if (WineFlights.isView(route.view)) {
          WineAtlas.clearActiveProfile();
          WineAtlas.setMode('explore');
          WineFlights.show(route);
        } else if (route.view === 'profile') WineAtlas.selectProfile(route.grapeId, route.regionId, true, { history: 'none' });
        else if (route.view === 'gallery') {
          WineAtlas.setMode('explore');
          WineGallery.show();
        } else if (route.view === 'compare') {
          if (route.state) WineComparison.restore(route.state);
          else if (route.flightId) {
            const flight = WineFlights.resolve(route.flightId);
            WineComparison.replace(flight ? flight.profiles : [], { biggestOnly: false });
          }
          WineAtlas.setMode('compare');
          byId('liveStatus').textContent = route.flightId && !WineFlights.contextId(route) ? 'Flight not available for this selection. You can compare wines manually or browse guided tasting flights.' : `Compare wines. ${WineComparison.profiles().length} selected.`;
        } else {
          WineAtlas.clearActiveProfile();
          WineAtlas.begin(route.action || 'grape');
          if (route.view === 'invalid') WineUX.showInvalidInitialRoute();
        }
      }
      if (['compare', 'profile'].includes(route.view)) WineFlights.renderContext(route);
      write(route, options.history || 'push');
    } finally { rendering = false; }
    if (options.restore) restorePosition(route, options.saved, token);
    else { orient(options.pointer && route.view === 'home' ? document.querySelector('.welcome-ragdoll-link') : destination(route)); save(); }
    return true;
  }
  function recordExplore(replace) {
    save();
    write({ view: 'explore' }, replace ? 'replace' : 'push');
  }
  document.addEventListener('wineatlas:comparison-changing', save);
  document.addEventListener('wineatlas:comparison-changed', () => {
    if (rendering || restoring || new URL(location.href).searchParams.get('view') !== 'compare') return;
    const route = { view: 'compare', flightId: new URL(location.href).searchParams.get('flight') };
    WineFlights.renderContext(route);
    write(route);
    byId('liveStatus').textContent = `Compare wines. ${WineComparison.profiles().length} selected.`;
    save();
  });
  window.addEventListener('scroll', save, { passive: true });
  document.addEventListener('focusin', () => {
    if (!rendering && !restoring) ++epoch;
    save();
  });
  window.addEventListener('popstate', event => go(read(), { restore: true, saved: event.state?.wineAtlas, history: 'replace' }));
  document.addEventListener('wineatlas:ready', () => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    go(read(), { history: 'replace', restore: true, saved: history.state?.wineAtlas });
  });
  return Object.freeze({ go, recordExplore, get rendering() { return rendering; }, get restoring() { return restoring; } });
})();
