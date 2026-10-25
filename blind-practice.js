/* R13: optional real-bottle practice. Identities live only in this tab's memory.
 * This is teaching concealment, not security against a curious learner. */
window.WineBlind = (() => {
  const el = WineDOM.element;
  const sets = [
    { id: 'structure', name: 'Learn · broad style', candidates: [
      ['cabernet-sauvignon', 'napa'], ['pinot-noir', 'burgundy'], ['muscat-blanc', 'moscato-dasti']
    ], cue: 'Start with dry versus sweet, red versus sparkling, acidity, tannin and body. These are broad reference contrasts.' },
    { id: 'region', name: 'Practice · Pinot Noir regions', candidates: [
      ['pinot-noir', 'burgundy'], ['pinot-noir', 'willamette'], ['pinot-noir', 'central-otago']
    ], cue: 'All three references use Pinot Noir. Region is a cautious hypothesis: producer, vintage, ripeness and cellar choices can overlap.' }
  ];
  let round = null;
  const names = set => set.candidates.map(([grape, region]) => {
    const item = WineAtlas.combinedProfile(grape, region);
    return item ? `${WineModel.profileName(item)} · ${item.region.name}` : null;
  });
  const valid = () => sets.every(set => names(set).every(Boolean));
  const button = (label, id, fn) => { const b = el('button', label, 'journey-link'); b.type = 'button'; b.id = id; b.addEventListener('click', fn); return b; };
  const select = (id, label, values, blank = 'Choose or leave uncertain') => {
    const wrap = el('div', null, 'blind-field'); const l = el('label', label); l.htmlFor = id;
    const s = el('select'); s.id = id; const empty = el('option', blank); empty.value = ''; s.append(empty);
    values.forEach(([value, name]) => { const o = el('option', name); o.value = value; s.append(o); });
    wrap.append(l, s); return [wrap, s];
  };
  const field = (id, label, max = 1000) => {
    const wrap = el('div', null, 'blind-field'); const l = el('label', label); l.htmlFor = id;
    const input = el('textarea'); input.id = id; input.rows = 3; input.maxLength = max;
    wrap.append(l, input); return [wrap, input];
  };
  function setup(target, api) {
    target.append(api.heading('Taste Before the Reveal'), el('p', 'Learn with named references, then hand a real bottle to a partner for a neutral A/B or A/B/C tasting. An app cannot taste, verify or identify the liquid in a glass.', 'journey-lead'));
    const known = el('details', null, 'journey-more'); known.append(el('summary', 'Learn · inspect the named references first'));
    for (const set of sets) {
      known.append(el('h3', set.name), el('p', set.cue));
      set.candidates.forEach(([grape, region], i) => known.append(api.link(names(set)[i], { view: 'profile', grapeId: grape, regionId: region })));
    }
    target.append(known);
    if (!valid()) { target.append(el('p', 'The selected references are unavailable. Use the named tasting flights instead.')); return; }
    target.append(el('h3', 'Host setup · keep this screen private'), el('p', 'A partner chooses actual bottles from one set below, conceals the labels, pours into similar glasses and records the mapping here. Use the real bottle name and vintage; an Atlas profile is only a style reference. If you work alone, ask someone else to code the glasses. Do not watch setup.'));
    const [setWrap, setSelect] = select('blind-set', 'Practice set', sets.map(s => [s.id, s.name]), 'Choose a set');
    const [countWrap, countSelect] = select('blind-count', 'Number of samples', [['2','Two (A/B)'], ['3','Three (A/B/C)']], 'Choose two or three');
    const slots = el('div'); const error = el('p'); error.id = 'blind-error'; error.setAttribute('role', 'alert');
    function redraw() {
      slots.replaceChildren(); const set = sets.find(s => s.id === setSelect.value); if (!set) return;
      const values = names(set).map((name, i) => [String(i), name]);
      for (const code of ['A','B',...(countSelect.value === '3' ? ['C'] : [])]) {
        const card = el('section', null, 'journey-exercise'); card.append(el('h4', `Actual sample ${code}`));
        const [choice] = select(`blind-actual-${code}`, `Represented style for ${code}`, values, 'Choose actual style');
        const [bottle] = field(`blind-bottle-${code}`, `Actual bottle and vintage for ${code} (required)`, 200);
        card.append(choice, bottle); slots.append(card);
      }
    }
    setSelect.addEventListener('change', redraw); countSelect.addEventListener('change', redraw);
    target.append(setWrap, countWrap, slots, error, api.actions(button('Conceal setup and hand over', 'blind-start', () => {
      const set = sets.find(s => s.id === setSelect.value), codes = countSelect.value === '3' ? ['A','B','C'] : countSelect.value === '2' ? ['A','B'] : [];
      if (!set || !codes.length) { error.textContent = 'Choose a set and two or three samples.'; setSelect.focus(); return; }
      const actual = {}; for (const code of codes) {
        const choice = target.querySelector(`#blind-actual-${code}`), bottle = target.querySelector(`#blind-bottle-${code}`);
        if (!choice.value || !bottle.value.trim()) { error.textContent = `Record the actual style, bottle and vintage for ${code}.`; (!choice.value ? choice : bottle).focus(); return; }
        actual[code] = { index: Number(choice.value), bottle: bottle.value.trim() };
      }
      round = { setId: set.id, codes, actual, answers: Object.fromEntries(codes.map(c => [c, { clues:'', hypothesis:'', alternative:'', confidence:'', note:'' }])), phase: 'observe' };
      api.rerender();
    })));
    target.append(el('p', 'Nothing is saved to an account or browser storage. Reloading discards the mapping and notes. This is a practice screen, not a secure examination.', 'small'));
  }
  function observe(target, api) {
    const set = sets.find(s => s.id === round.setId), revealed = round.phase === 'reveal';
    target.append(api.heading(revealed ? 'Reveal · compare with the bottles' : 'Blind · observe before seeing identities'), el('p', revealed ? 'These are the bottles recorded by the host. Confirm the labels and mapping together; the app cannot verify the glass.' : `Samples ${round.codes.join(', ')} are coded. First write what you actually notice. No grape, region, expected note or answer is shown until reveal.`, 'journey-lead'));
    for (const code of round.codes) {
      const answer = round.answers[code], card = el('section', null, 'journey-exercise'); card.append(el('h3', `Sample ${code}`));
      const prompts = [['clues','Observed clues · structure, aroma and texture'], ['hypothesis','Best hypothesis and why'], ['alternative','Plausible alternative or insufficient evidence'], ['note','Other observations']];
      if (!revealed) {
        for (const [key,label] of prompts) { const [wrap, input] = field(`blind-${key}-${code}`, `${code} · ${label}`); input.value = answer[key]; input.addEventListener('input', () => { answer[key] = input.value; }); card.append(wrap); }
        const [wrap, selectNode] = select(`blind-confidence-${code}`, `${code} · confidence`, [['low','Low'],['medium','Medium'],['high','High']], 'Uncertain');
        selectNode.value = answer.confidence; selectNode.addEventListener('change', () => { answer.confidence = selectNode.value; }); card.append(wrap);
      } else {
        const identity = round.actual[code], title = names(set)[identity.index];
        card.append(el('p', `Actual bottle: ${identity.bottle}. Recorded reference: ${title}.`), el('p', `Your clues: ${answer.clues || 'No clues recorded.'}`), el('p', `Your hypothesis: ${answer.hypothesis || 'Uncertain.'} Alternative: ${answer.alternative || 'None recorded.'} Confidence: ${answer.confidence || 'Uncertain'}.`));
        card.append(el('p', 'Compare which clues fit and which conflict. Acidity, tannin, body and aromas overlap across places; a fruit or soil word alone cannot prove a region. Bottle age, vintage, producer and serving conditions may change the impression. A correct choice within this announced set is not general regional mastery.'));
        const [grape, region] = set.candidates[identity.index];
        const reference = WineAtlas.combinedProfile(grape, region);
        card.append(el('p', `Atlas reference: ${reference.regional.expect} Compare this typical expression with the clues you actually wrote. A matching clue supports a possibility; a conflicting clue may reflect this bottle or an alternative. Neither settles its origin by itself.`));
        card.append(api.actions(api.link('Read the represented style after reveal', { view:'profile', grapeId:grape, regionId:region })));
      }
      target.append(card);
    }
    if (!revealed && round.phase === 'observe') {
      target.append(api.actions(button('Show candidate set after observations', 'blind-candidate-step', () => {
        if (!round.codes.every(code => round.answers[code].clues.trim())) {
          const status = el('p', 'Write at least one observed clue for each sample first, or write “uncertain”.');
          status.setAttribute('role', 'alert'); target.append(status); return;
        }
        round.phase = 'candidates'; api.rerender();
      })));
    } else if (!revealed) {
      const candidates = el('details', null, 'journey-more'); candidates.id = 'blind-candidates';
      candidates.append(el('summary', 'After observing: show the announced candidate set'), el('p', set.cue));
      for (const name of names(set)) candidates.append(el('p', name));
      const error = el('p'); error.setAttribute('role', 'alert'); target.append(candidates, error, api.actions(button('Reveal recorded bottles', 'blind-reveal', () => {
        if (!round.codes.every(code => ['clues','hypothesis','alternative'].every(key => round.answers[code][key].trim()))) {
          error.textContent = 'For each sample, record clues, a hypothesis (or “insufficient evidence”) and a plausible alternative (or explain why none fits).'; return;
        }
        round.phase = 'reveal'; api.rerender();
      })));
    } else target.append(api.actions(button('Start another round', 'blind-reset', () => { round = null; api.rerender(); })));
    target.append(api.actions(button('End and erase this round', 'blind-end', () => { round = null; api.rerender(); }), api.link('Explore wines', { view:'explore' })));
  }
  function show(target, api) {
    if (!round) setup(target, api); else observe(target, api);
    return round ? round.phase === 'reveal' ? 'Recorded bottle identities revealed.' : 'Blind samples. Identities concealed.' : 'Host setup.';
  }
  return Object.freeze({ show });
})();
