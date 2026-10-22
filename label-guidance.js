/* Optional label reading for a deliberately small set of modeled expressions.
 * It never infers bottle composition from an appellation or changes search IDs. */
window.WineLabels = (() => {
  const el = WineDOM.element;
  const target = () => document.getElementById('labelGuidance');
  const text = value => typeof value === 'string' && Boolean(value.trim());
  let data = {};
  const load = WineData.json('./data/label-guidance.json', { optional: true, fallback: {} }).then(value => {
    data = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    render(WineAtlas.getActiveProfile());
  });
  function entry(profile) {
    if (!profile) return null;
    const value = data[`${profile.regionId}/${profile.grapeId}`];
    if (!value || typeof value !== 'object' || Array.isArray(value) ||
        !['example', 'match', 'limit', 'check'].every(field => text(value[field])) ||
        !Array.isArray(value.sources) || !value.sources.length ||
        !value.sources.every(id => text(id) && WineAtlas.getSource(id)?.reviewStatus === 'reviewed') ||
        !Array.isArray(value.terms || []) || !(value.terms || []).every(text) ||
        !Array.isArray(value.alternatives) || !value.alternatives.every(item =>
          item && text(item.grape) && text(item.region) && text(item.label) && WineAtlas.combinedProfile(item.grape, item.region))) return null;
    return value;
  }
  function profileLink(item) {
    const link = el('a', item.label, 'flight-link');
    link.href = `?grape=${encodeURIComponent(item.grape)}&region=${encodeURIComponent(item.region)}`;
    link.addEventListener('click', event => {
      if (event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      WineAtlas.selectProfile(item.grape, item.region, true);
    });
    return link;
  }
  function render(profile) {
    const node = target();
    if (!node) return;
    const item = entry(profile);
    node.replaceChildren();
    node.classList.toggle('hidden', !item);
    node.open = false;
    if (!item) return;
    const summary = el('summary');
    summary.append(el('span', 'Recognize it on the label'), el('small', 'What to look for · what to check'));
    const content = el('div', null, 'profile-learning-content label-guide-content');
    content.append(el('p', 'If the label or wine list says:', 'small'), el('p', item.example, 'label-example'));
    for (const [heading, copy] of [['What it points to', item.match], ['What it does not settle', item.limit], ['Before choosing a bottle', item.check]]) {
      const section = el('section', null, 'learning-section');
      section.append(el('h3', heading), el('p', copy)); content.append(section);
    }
    if (item.alternatives.length) {
      const section = el('section', null, 'learning-section');
      section.append(el('h3', 'Different expression, same broad area'), ...item.alternatives.map(profileLink));
      content.append(section);
    }
    if (item.terms?.length) {
      const section = el('section', null, 'learning-section');
      section.append(el('h3', 'Useful terms'));
      for (const id of item.terms) {
        const button = el('button', `Define ${id.replaceAll('-', ' ')}`, 'journey-link');
        button.type = 'button';
        button.addEventListener('click', () => WineLearning.showEntry(id, button));
        section.append(button);
      }
      content.append(section);
    }
    const references = el('details', null, 'sources');
    references.append(el('summary', 'Sources for these label cues'));
    const list = el('ul', null, 'source-list');
    for (const id of [...new Set(item.sources)]) {
      const source = WineAtlas.getSource(id);
      const row = el('li'); row.append(WineDOM.referenceLink(source)); list.append(row);
    }
    references.append(list); content.append(references);
    node.append(summary, content);
  }
  document.addEventListener('wineatlas:profile-selected', event => render(event.detail.profile));
  return Object.freeze({ load: () => load, render });
})();
