/*
 * Accent-insensitive Atlas search
 * --------------------------------
 * Re-renders the main Atlas search after core search so users can type plain
 * ASCII on keyboards without easy access to accents (for example
 * "creme brulee" instead of "crème brûlée"). Pairings and special-style
 * metadata are included in the haystack as well.
 */

function atlasNormalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function atlasFlattenNotes(notes) {
  return Object.values(notes || {}).flat().join(" ");
}

function atlasSearchProfiles() {
  const { grapes, regions } = WineAtlas.getData();
  const profiles = [];
  for (const [regionId, region] of Object.entries(regions)) {
    for (const [grapeId, regional] of Object.entries(region.grapes || {})) {
      const grape = grapes[grapeId];
      if (!grape) continue;
      profiles.push({ grapeId, regionId, grape, region, regional });
    }
  }
  return profiles;
}

function atlasEnhancedHaystack(item) {
  const style = item.regional.style || {};
  return atlasNormalize([
    item.grape.name,
    item.region.name,
    item.region.country,
    item.region.climate,
    item.region.summary,
    item.regional.expect,
    atlasFlattenNotes(item.regional.notes),
    ...(item.regional.pairings || []),
    ...(item.region.badges || []),
    style.family,
    style.color,
    style.sweetness,
    style.label,
    style.method,
    style.effect
  ].filter(Boolean).join(" "));
}

function renderEnhancedAtlasSearch() {
  const input = document.getElementById("searchInput");
  const container = document.getElementById("searchResults");
  if (!input || !container) return;
  const query = atlasNormalize(input.value);
  if (query.length < 2) return;
  const terms = query.split(/\s+/).filter(Boolean);

  const matches = atlasSearchProfiles().map(item => {
    const haystack = atlasEnhancedHaystack(item);
    const matched = terms.every(term => haystack.includes(term));
    let score = 0;
    const grape = atlasNormalize(item.grape.name);
    const region = atlasNormalize(item.region.name);
    const country = atlasNormalize(item.region.country);
    const pairings = atlasNormalize((item.regional.pairings || []).join(" "));
    if (grape.includes(query)) score += 6;
    if (region.includes(query)) score += 6;
    if (country.includes(query)) score += 5;
    if (pairings.includes(query)) score += 7;
    score += terms.filter(term => haystack.includes(term)).length;
    return { item, matched, score };
  }).filter(result => result.matched)
    .sort((a, b) => b.score - a.score || a.item.region.name.localeCompare(b.item.region.name))
    .slice(0, 10);

  container.replaceChildren();
  if (!matches.length) {
    const empty = document.createElement("div");
    empty.className = "search-empty";
    empty.textContent = "No matching profiles yet.";
    container.appendChild(empty);
    return;
  }

  for (const { item } of matches) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "search-result";
    button.dataset.grape = item.grapeId;
    button.dataset.region = item.regionId;
    const title = document.createElement("strong");
    const dot = document.createElement("span");
    const displayColor = item.regional.style?.color || item.grape.color;
    dot.className = `wine-color-dot ${displayColor}`;
    dot.setAttribute("aria-hidden", "true");
    title.append(dot, document.createTextNode(`${item.grape.name} · ${item.region.name}`));
    const meta = document.createElement("span");
    const styleLabel = item.regional.style?.label ? ` · ${item.regional.style.label}` : "";
    meta.textContent = `${item.region.country} · ${item.region.climate}${styleLabel}`;
    button.append(title, meta);
    button.addEventListener("click", () => {
      WineAtlas.selectProfile(item.grapeId, item.regionId, true);
      input.value = "";
      container.replaceChildren();
    });
    container.appendChild(button);
  }
}

document.addEventListener("wineatlas:ready", () => {
  document.getElementById("searchInput")?.addEventListener("input", renderEnhancedAtlasSearch);
});
