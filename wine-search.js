/* Shared Explore/Compare search: structured wine intent, explicit aroma search,
 * and food vocabulary. Longest whole phrases win; constraints are always ANDed.
 */
window.WineSearch = (() => {
  const normalize = value => WineModel.normalize(value).replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ").trim();
  const words = value => normalize(value).split(" ").filter(Boolean);
  const includesWords = (text, terms, prefix = false) => {
    const tokens = words(text);
    return terms.every((term, i) => tokens.some(token => token === term ||
      (prefix && i === terms.length - 1 && term.length >= 2 && token.startsWith(term))));
  };
  const longestFirst = (a, b) => b.tokens.length - a.tokens.length || b.phrase.length - a.phrase.length;
  const phraseEntry = (phrase, extra = {}) => ({ phrase, tokens: words(phrase), ...extra });

  let index;
  function searchIndex() {
    if (!index) {
      const entries = WineAtlas.getSearchRules().flatMap(rule => rule.aliases.map(alias => phraseEntry(alias, { rule })));
      for (const [id, grape] of Object.entries(WineAtlas.getData().grapes)) {
        const rule = { id: `grape:${id}`, label: grape.name, grapeIds: [id] };
        for (const name of grape.name.split("/")) entries.push(phraseEntry(name, { rule }));
        for (const alias of grape.aliases || []) entries.push(phraseEntry(alias, { rule, aliasGrape: id }));
      }
      entries.sort(longestFirst);
      const profiles = WineAtlas.allPairs().map(item => ({ item, identity: identity(item), haystack: haystack(item),
        notes: normalize(Object.values(item.regional.notes || {}).flat().join(" ")),
        grape: normalize(item.grape.name), region: normalize(item.region.name), country: normalize(item.region.country) }));
      const pairings = [...new Set(profiles.flatMap(row => row.item.regional.pairings || []))];
      index = { entries, profiles, pairings };
    }
    return index;
  }
  document.addEventListener("wineatlas:data-loaded", () => { index = null; });

  // Claim matching token spans, so a short rule cannot consume part of a longer
  // grape/appellation or a food such as "white pizza" or "sweet and sour pork".
  function claim(tokens, entry, occupied, visit) {
    for (let start = 0; start <= tokens.length - entry.tokens.length; start += 1) {
      if (!entry.tokens.length || !entry.tokens.every((term, offset) =>
        !occupied.has(start + offset) && tokens[start + offset] === term)) continue;
      entry.tokens.forEach((_, offset) => occupied.add(start + offset));
      visit?.();
    }
  }

  function parse(rawQuery) {
    const raw = String(rawQuery || "");
    const marker = /\b(?:aroma|aromas|notes)\s*:/i.exec(raw);
    const sensory = Boolean(marker);
    const aromaQuery = marker ? normalize(raw.slice(marker.index + marker[0].length)) : "";
    const tokens = words(marker ? raw.slice(0, marker.index) : raw);
    const protectedFood = new Set();
    const foods = [...new Set([...searchIndex().pairings, ...FoodDiscovery.phrases()])]
      .map(phrase => phraseEntry(phrase)).sort(longestFirst);
    foods.forEach(entry => claim(tokens, entry, protectedFood));
    const occupied = new Set(protectedFood);
    const constraints = [];
    const aliases = [];
    for (const entry of searchIndex().entries) {
      claim(tokens, entry, occupied, () => {
        if (!constraints.some(rule => rule.id === entry.rule.id)) constraints.push(entry.rule);
        if (entry.aliasGrape && !aliases.some(alias => alias.grapeId === entry.aliasGrape)) {
          aliases.push({ grapeId: entry.aliasGrape, phrase: entry.phrase });
        }
      });
    }
    const remainder = tokens.filter((token, position) => (!occupied.has(position) || protectedFood.has(position)) &&
      (protectedFood.has(position) || !["wine", "wines"].includes(token))).join(" ");
    return { constraints, aliases, remainder, sensory, aromaQuery };
  }

  function sweetness(item) {
    // Explicit expression metadata wins. Still profiles use the documented
    // editorial score anchors, not words such as "sweet oak" in their prose.
    if (item.regional.style?.sweetness) return item.regional.style.sweetness;
    const score = item.profile.sweetness;
    return score <= 1 ? "dry" : score < 3 ? "off-dry" : "sweet";
  }
  function allows(item, intent) {
    return intent.constraints.every(rule =>
      (!rule.family || (item.regional.style?.family || "still") === rule.family) &&
      (!rule.regions || rule.regions.includes(item.regionId)) &&
      (!rule.grapeIds || rule.grapeIds.includes(item.grapeId)) &&
      (!rule.colors || rule.colors.includes(WineModel.color(item))) &&
      (!rule.sweetness || rule.sweetness.includes(sweetness(item))));
  }
  function identity(item) {
    // Blend components mentioned only in prose are not profile identities.
    return normalize([item.grape.name, ...(item.grape.aliases || []), item.region.name, item.region.country,
      item.regional.style?.label].filter(Boolean).join(" "));
  }
  function haystack(item) {
    const style = item.regional.style || {};
    return normalize([identity(item), item.region.climate, item.region.summary,
      item.regional.expect, ...Object.values(item.regional.notes || {}).flat(),
      ...(item.regional.pairings || []), ...(item.region.badges || []),
      style.family, style.color, style.sweetness, style.method, style.effect].filter(Boolean).join(" "));
  }
  function matchedPairings(pairings, foodQuery) {
    return (pairings || []).filter(label => FoodDiscovery.score([label], foodQuery) > 0);
  }
  async function rank(rawQuery, limit = 10) {
    if (normalize(rawQuery).length < 2) return [];
    let intent = parse(rawQuery);
    let candidates = searchIndex().profiles.filter(({ item }) => allows(item, intent));
    // Pure wine/identity/aroma queries do not wait for optional food requests.
    // Reparse after loading aliases: a previously unknown dish may contain a
    // reserved word, and must be protected as a whole food phrase.
    if (intent.remainder && !candidates.some(row => includesWords(row.identity, words(intent.remainder), true))) {
      await FoodDiscovery.load();
      intent = parse(rawQuery);
      candidates = searchIndex().profiles.filter(({ item }) => allows(item, intent));
    }
    if (intent.sensory && !intent.aromaQuery) return [];
    const query = intent.remainder;
    const terms = words(query);
    const foodKnown = FoodDiscovery.known(query);
    const textOf = row => intent.constraints.length ? row.identity : row.haystack;
    const exactTextExists = candidates.some(row => includesWords(textOf(row), terms));
    return candidates.map(row => {
      const { item } = row;
      const pairingScore = query ? FoodDiscovery.score(item.regional.pairings, query) : 0;
      const textMatch = includesWords(textOf(row), terms) || (!exactTextExists && includesWords(row.identity, terms, true));
      const aromaMatch = !intent.sensory || includesWords(row.notes, words(intent.aromaQuery));
      const matched = aromaMatch && (!query || pairingScore > 0 || (!foodKnown && textMatch));
      let score = pairingScore;
      if (query && !foodKnown) {
        if (includesWords(row.grape, terms)) score += 60;
        if (includesWords(row.region, terms)) score += 60;
        if (includesWords(row.country, terms)) score += 50;
        score += terms.filter(term => includesWords(textOf(row), [term])).length * 5;
      }
      return { item, matched, score, pairingScore, pairingMatch: pairingScore > 0, foodQuery: query };
    }).filter(row => row.matched)
      .sort((a, b) => b.score - a.score || a.item.region.name.localeCompare(b.item.region.name) || a.item.grape.name.localeCompare(b.item.grape.name))
      .slice(0, limit);
  }
  function describe(rawQuery) {
    const intent = parse(rawQuery);
    return [...intent.constraints.map(rule => rule.label),
      ...(intent.sensory ? [`aroma notes: ${intent.aromaQuery || "…"}`] : [])].join(" · ");
  }
  function notices(rawQuery) {
    return parse(rawQuery).aliases.map(({ grapeId, phrase }) => {
      const grape = WineAtlas.getData().grapes[grapeId];
      const countries = [...new Set(searchIndex().profiles.filter(row => row.item.grapeId === grapeId)
        .map(row => row.item.region.country))].sort((a, b) => a.localeCompare(b));
      return `${phrase} → ${grape.name}. Showing represented regions in ${countries.join(", ")}.`;
    });
  }
  return { parse, allows, rank, describe, notices, matchedPairings };
})();
