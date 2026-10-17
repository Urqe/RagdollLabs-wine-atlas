/* Shared food vocabulary for Explore, Compare and the legacy food helper.
 * Aliases are search-only. Canonical dish names stay in profile pairings.
 * Optional data fails soft; direct pairing search always remains available.
 */
window.FoodDiscovery = (() => {
  let pending;
  let aliases = {};
  let dishes = {};
  let sources = {};
  const normalize = value => String(value || "").normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/\s+/g, " ");

  function load() {
    if (!pending) {
      const json = path => fetch(path, { cache: "no-cache" }).then(response => {
        if (!response.ok) throw new Error(`Food discovery data unavailable: ${path}`);
        return response.json();
      }).catch(error => { console.warn(error); return {}; });
      pending = Promise.all([json("./data/food-aliases.json"), json("./data/food-dishes.json")])
        .then(([vocabulary, curated]) => {
          aliases = {};
          for (const [alias, targets] of Object.entries(vocabulary)) {
            const key = normalize(alias);
            aliases[key] = [...new Set([...(aliases[key] || []), ...targets])];
          }
          dishes = curated.dishes || {};
          sources = curated.sources || {};
          return aliases;
        });
    }
    return pending;
  }
  function terms(query) {
    const key = normalize(query);
    return [...new Set([key, ...(aliases[key] || []).map(normalize)].filter(Boolean))];
  }
  function score(pairings, query) {
    const key = normalize(query);
    if (!key) return 0;
    // Known aliases resolve only to their canonical targets. A dish containing
    // "pork" must never accidentally match every generic pork pairing.
    const targets = aliases[key]?.map(normalize);
    let best = 0;
    for (const pairing of pairings || []) {
      const value = normalize(pairing);
      if (value === key || targets?.includes(value)) best = Math.max(best, 100);
      else if (!targets && (` ${value} `).includes(` ${key} `)) best = Math.max(best, 75);
    }
    return best;
  }
  function guidance(query) {
    const targets = terms(query);
    const exact = Object.entries(dishes).find(([label]) => targets.includes(normalize(label)));
    if (!exact) return null;
    const [label, dish] = exact;
    const multiple = Object.keys(dishes).filter(name => targets.includes(normalize(name))).length > 1;
    return multiple ? { label: "Choose a preparation", guidance: "These dishes vary by broth, filling and sauce. Search a specific preparation for a closer pairing.", source: null }
      : { label, guidance: dish.guidance, source: sources[dish.source] };
  }
  function appendGuidance(container, query) {
    const info = guidance(query);
    if (!info) return;
    const p = document.createElement("p");
    p.className = "food-guidance";
    const title = document.createElement("strong");
    title.textContent = `${info.label}: `;
    p.append(title, document.createTextNode(info.guidance));
    if (info.source) {
      const link = document.createElement("a");
      link.href = info.source.url;
      link.textContent = " Pairing reference";
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.setAttribute("aria-label", info.source.name);
      p.append(link);
    }
    container.append(p);
  }
  return { load, normalize, terms, score, guidance, appendGuidance,
    known: query => Boolean(aliases[normalize(query)]) };
})();
