/* Optional household aroma practice. Journey owns routing/focus; this component
 * owns only the current tab's reference round, never a wine identification model. */
window.WineAromas = (() => {
  const el = WineDOM.element;
  let data = null;
  let round = null;
  const load = WineData.json('./data/aroma-practice.json', { optional: true, fallback: null }).then(value => { data = value; });
  const text = value => typeof value === 'string' && value.trim();
  function valid() {
    if (!Array.isArray(data?.families) || !Array.isArray(data?.samples) || !Array.isArray(data?.sources)) return false;
    const families = data.families, samples = data.samples;
    const id = value => typeof value === 'string' && /^[a-z][a-z0-9-]*$/.test(value);
    return families.length === 6 && samples.length === 6 && data.sources.length > 0 &&
      new Set(families.map(item => item?.id)).size === 6 && new Set(samples.map(item => item?.id)).size === 6 &&
      families.every(item => item && id(item.id) && text(item.name) && text(item.examples)) &&
      samples.every(item => item && id(item.id) && ['name', 'prepare', 'reflection'].every(key => text(item[key])) && families.some(family => family.id === item.family)) &&
      data.sources.every(source => {
        if (!source || !['label', 'url', 'scope', 'reviewedOn'].every(key => text(source[key]))) return false;
        try { return new URL(source.url).protocol === 'https:'; } catch { return false; }
      });
  }
  const sample = id => data.samples.find(item => item.id === id);
  function button(label, id, action) {
    const node = el('button', label, 'journey-link'); node.id = id; node.type = 'button';
    node.addEventListener('click', action); return node;
  }
  function choices(parent, label, id, selected = '', onchange) {
    const wrapper = el('div', null, 'aroma-choice');
    const caption = el('label', label); caption.htmlFor = id;
    const select = el('select'); select.id = id;
    const empty = el('option', 'Not selected / uncertain'); empty.value = ''; select.append(empty);
    for (const item of data.samples) { const option = el('option', item.name); option.value = item.id; select.append(option); }
    select.value = selected;
    if (onchange) select.addEventListener('change', () => onchange(select.value));
    wrapper.append(caption, select); parent.append(wrapper); return select;
  }
  function reading(target) {
    const details = el('details', null, 'journey-more'); details.append(el('summary', 'Further reading'));
    for (const source of data.sources) { const a = el('a', source.label, 'journey-link'); a.href = source.url; details.append(a); }
    target.append(details);
  }
  function coded(target, api) {
    const { heading, actions, observation, rerender } = api;
    target.append(heading(round.revealed ? 'Compare your reference matches' : 'Match two aroma references'),
      el('p', 'Smell the partner-prepared samples A and B. Write your impressions first, then choose a possible match or leave it uncertain. The choices are the six household references you practised, not wine identities.', 'journey-lead'));
    observation(target, 'aromas-coded');
    if (!round.revealed) {
      for (const code of ['A', 'B']) choices(target, `Sample ${code} · your match`, `aroma-guess-${code}`, round.guesses[code], value => { round.guesses[code] = value; });
      target.append(actions(button('Reveal recorded references', 'aroma-reveal', () => { round.revealed = true; rerender(); })));
    } else {
      const result = el('section'); result.id = 'aroma-feedback';
      for (const code of ['A', 'B']) {
        const actual = sample(round.actual[code]), guess = sample(round.guesses[code]);
        const card = el('article', null, 'journey-exercise');
        card.append(el('h3', `Sample ${code}: ${actual.name}`),
          el('p', guess ? `You selected ${guess.name}. ${guess.id === actual.id ? 'Your selection matches the recorded sample.' : 'Compare the two references again and describe where their smells overlap or differ.'}` : 'You left this uncertain. Smell the named reference again and find one word that helps you remember it.'), el('p', actual.reflection));
        result.append(card);
      }
      result.append(el('p', 'These are the contents recorded by your partner; the app cannot verify a glass. If a reference was substituted or mislabeled, discuss the actual sample. A household match is not proof you can identify that note in wine.', 'small'));
      target.append(result, actions(button('Practise again with new codes', 'aroma-reset', () => { round = null; api.clearNotes('aromas-coded'); rerender(); })));
    }
    if (!round.revealed) target.append(actions(button('End this reference round', 'aroma-end', () => { round = null; api.clearNotes('aromas-coded'); rerender(); })));
  }
  function show(target, api) {
    const { heading, actions, link, observation, rerender } = api;
    if (!valid()) {
      target.append(heading('Aroma practice unavailable'), el('p', 'The aroma references could not be loaded. Continue with the tasting method or reload to try again.'), actions(link('Tasting method', { view: 'learn', lessonId: 'taste' })));
      return 'Aroma practice unavailable.';
    }
    if (round) coded(target, api);
    else {
      target.append(heading('Find the Notes'), el('p', 'Smell first. Write what it reminds you of before opening the word suggestions. A broad description, your own familiar comparison or “I cannot identify it yet” is enough.', 'journey-lead'),
        el('p', 'Use a wine you already have, a familiar food aroma, or simply read the method. Reading words alone does not train recognition. There is no wine or kit to buy.'));
      observation(target, 'aromas');
      const vocabulary = el('details', null, 'journey-more'); vocabulary.id = 'aroma-vocabulary';
      vocabulary.append(el('summary', 'Need a word? Start broad'));
      for (const family of data.families) {
        const details = el('details', null, 'journey-more'); details.append(el('summary', family.name), el('p', family.examples)); vocabulary.append(details);
      }
      vocabulary.append(el('p', 'Use words from your own food culture. Similar memories can overlap, and people differ in sensitivity and familiarity. A descriptor is an association, not proof of an added ingredient or literal soil flavour.'));
      target.append(vocabulary);
      const technique = el('details', null, 'journey-more'); technique.append(el('summary', 'Connect smelling with flavour'),
        el('p', 'Smelling above the glass is called orthonasal smelling. With a small sip, aromas can also reach your nose from your mouth: retronasal perception. After spitting or swallowing, gently breathe out through your nose and notice what remains. Sweetness, acidity and drying texture are separate observations.'),
        el('p', 'If you are only smelling household references, no tasting is needed. Compare the aroma memory with a later glass of wine without expecting an exact replica.'));
      target.append(technique);
      const references = el('details', null, 'journey-more'); references.id = 'aroma-references'; references.append(el('summary', 'Build familiar aroma memories'),
        el('p', 'Start with two familiar materials, in separate clean glasses. Use only foods you normally handle; skip anything unsuitable for you. These are smelling references, not ingredients to add to wine. Avoid perfume or other strong smells, take gentle sniffs and pause when aromas blur.'));
      for (const item of data.samples) {
        const card = el('article', null, 'journey-exercise'); card.append(el('h3', item.name), el('p', item.prepare)); references.append(card);
      }
      references.append(el('p', 'Read each name, smell the actual material and record a word of your own. Revisit it later without its label, then check. On another occasion, repeat with fresh references and compare which words still help. Materials, freshness and your own sensitivity can change the result.'));
      target.append(references);
      const setup = el('details', null, 'journey-more'); setup.id = 'aroma-setup'; setup.append(el('summary', 'With a partner: try coded matching'),
        el('p', 'Practise the named references first. Then let a partner prepare two different references from that set in similar opaque containers labeled A and B, with contents out of sight. The partner privately records each actual reference below, starts the round, then hands over. The learner should not watch setup. Use the listed ingredients for coded rounds; a substituted material needs a new agreed reference outside this exercise.'),
        el('p', 'The round and notes stay only in this tab. Reload ends the round. This is reference practice, not a blind wine test.', 'small'));
      const a = choices(setup, 'Partner setup · actual sample A', 'aroma-actual-A');
      const b = choices(setup, 'Partner setup · actual sample B', 'aroma-actual-B');
      const error = el('p'); error.id = 'aroma-setup-error'; error.setAttribute('role', 'alert'); setup.append(error);
      setup.append(actions(button('Start reference matching', 'aroma-start', () => {
        if (!sample(a.value) || !sample(b.value) || a.value === b.value) { error.textContent = 'Record two different prepared references before starting.'; (!a.value ? a : b).focus(); return; }
        round = { actual: { A: a.value, B: b.value }, guesses: { A: '', B: '' }, revealed: false };
        api.clearNotes('aromas-coded'); rerender();
      })));
      target.append(setup);
      reading(target);
    }
    target.append(actions(link('Back to the tasting method', { view: 'learn', lessonId: 'taste' }), link('Explore wines', { view: 'explore' })));
    return round ? round.revealed ? 'Reference identities revealed.' : 'Reference matching. Identities concealed.' : 'Find the Notes. Observe before choosing words.';
  }
  return Object.freeze({ load: () => load, show });
})();
