/* Discovery routes distinguish a close modeled style from an educational contrast.
 * Comparison compatibility stays broad; no recommendation promises substitution.
 */
const SMART_WEIGHTS = Object.freeze({ body: 1.5, acidity: 1.5, tannin: 1.5, sweetness: 2, alcohol: 1, fruit: 1, oak: .75, earth: .75 });
const SMART_MAX_DISTANCE = .8; // weighted RMS on the existing 0–5 editorial scale
const smartKey = item => `${item.grapeId}::${item.regionId}`;

function smartDistance(a, b) {
  const weights = Object.entries(SMART_WEIGHTS);
  return Math.sqrt(weights.reduce((sum, [key, weight]) => sum + weight * (a.profile[key] - b.profile[key]) ** 2, 0) / weights.reduce((sum, [, weight]) => sum + weight, 0));
}
function smartAppearance(item) { return WineModel.color(item); }
function smartIsDiscovery(item, current) {
  return item.grapeId !== current.grapeId && item.region.country !== current.region.country &&
    (item.region.badges || []).some(tag => ["Discovery", "Emerging region"].includes(tag));
}
function smartIsClose(a, b) {
  if (!WineModel.compatible(a, b) || WineModel.styleDifferences(a, b).length) return false;
  if (Math.abs(a.profile.sweetness - b.profile.sweetness) > .5) return false;
  if (["body", "acidity", "tannin", "alcohol"].some(key => Math.abs(a.profile[key] - b.profile[key]) > 1.5)) return false;
  return smartDistance(a, b) <= SMART_MAX_DISTANCE;
}
function smartSharedTraits(a, b) {
  // Incidental zeros (no oak or tannin) are not useful similarity reasons.
  const features = [
    ["body", 4, "full body"], ["body", 0, "light body"],
    ["acidity", 3.5, "bright acidity"], ["tannin", 3.5, "firm tannin"],
    ["fruit", 3.5, "fruit-forward character"], ["earth", 3, "savoury character"]
  ];
  return features.filter(([key, minimum]) => Math.abs(a.profile[key] - b.profile[key]) <= .5 &&
    (minimum ? Math.min(a.profile[key], b.profile[key]) >= minimum : Math.max(a.profile[key], b.profile[key]) <= 2))
    .map(([, , label]) => label).slice(0, 2);
}
function smartNumericDifferences(a, b) {
  return WineModel.metrics.filter(metric => Math.abs(a.profile[metric.key] - b.profile[metric.key]) >= 1)
    .sort((x, y) => Math.abs(a.profile[y.key] - b.profile[y.key]) - Math.abs(a.profile[x.key] - b.profile[x.key]))
    .slice(0, 2).map(metric => `${metric.label} score: ${a.profile[metric.key]} → ${b.profile[metric.key]} / 5`);
}
function smartReason(current, item, relation, sameGrape = false, discovery = false) {
  const context = WineModel.discoveryContext(current);
  const changes = WineModel.styleDifferences(current, item);
  const traits = smartSharedTraits(current, item);
  const shared = relation === "similar" ?
    `Both ${context.sweetness} ${WineModel.colorLabel(context.color).toLowerCase()} references; production: ${WineModel.productionLabel(context.production)}.${traits.length ? ` Shared traits: ${traits.join(" and ")}.` : ""}` :
    `${sameGrape ? "Same grape reference" : WineModel.compatible(current, item) ? "Comparable family" : "Same grape, different family"}; a contrast, not a close style match.`;
  const differences = changes.length ? changes : smartNumericDifferences(current, item);
  return `${discovery ? `Explore ${item.region.country}, beyond ${current.region.country}. ` : ""}${shared}${differences.length ? ` ${differences.join("; ")}.` : ""}${relation === "similar" && context.family === "still" ? " Vessel choices are not matched." : ""}`;
}
function smartRecommendations(current) {
  const candidates = WineAtlas.allPairs().filter(item => smartKey(item) !== smartKey(current))
    .map(item => ({ ...item, distance: smartDistance(current, item) }));
  const byDistance = (a, b) => a.distance - b.distance || smartKey(a).localeCompare(smartKey(b));
  const compatible = candidates.filter(item => WineModel.compatible(current, item));
  const close = compatible.filter(item => smartIsClose(current, item));
  const used = new Set(), picks = [];
  function add(item, kind, label, discovery = false) {
    if (!item) return;
    const relation = smartIsClose(current, item) ? "similar" : "contrast";
    used.add(smartKey(item));
    picks.push({ item, kind, label: relation === "contrast" && kind === "same-grape" ? "Same grape, different expression · Contrast" : label,
      relation, reason: smartReason(current, item, relation, kind === "same-grape", discovery) });
  }
  const sameGrapes = candidates.filter(item => item.grapeId === current.grapeId);
  // Prefer a genuinely close same-grape route, then a comparable expression.
  sameGrapes.sort((a, b) => Number(!smartIsClose(current, a)) - Number(!smartIsClose(current, b)) ||
    Number(!WineModel.compatible(current, a)) - Number(!WineModel.compatible(current, b)) || byDistance(a, b));
  add(sameGrapes[0], "same-grape", "Same grape, close modeled style");
  const pickClose = predicate => close.filter(item => !used.has(smartKey(item)) && predicate(item)).sort(byDistance)[0];
  add(pickClose(item => item.grapeId !== current.grapeId), "similar-structure", "Close in modeled style");
  add(pickClose(item => smartIsDiscovery(item, current)), "adventurous", "Discover another region", true);
  // A sparse family may offer one useful contrast. Never fill three slots just
  // because the broad comparison family has enough candidates.
  if (picks.length < 2) {
    const contrast = compatible.filter(item => !used.has(smartKey(item)) && !smartIsClose(current, item)).sort(byDistance)[0];
    add(contrast, "contrast", "Explore a contrast");
  }
  return picks;
}

function smartRender(current) {
  const container = document.getElementById("similarWines");
  if (!container || !current) return;
  const picks = smartRecommendations(current);
  container.replaceChildren();

  const closeCount = picks.filter(pick => pick.relation === "similar").length;
  const coverage = WineDOM.element("p", closeCount ?
    `${closeCount} close modeled-style ${closeCount === 1 ? "route" : "routes"}${picks.length > closeCount ? "; contrasts are labeled separately" : ""}. These are curated learning routes; producers and vintages vary.` :
    picks.length ? "No close modeled-style matches are available in the current atlas. These routes explore contrasts." : "No useful discovery route is currently represented for this profile.", "small discovery-coverage");
  container.append(coverage);
  for (const { item, kind, label, reason, relation } of picks) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "similar-item smart-similar-item";
    button.dataset.grape = item.grapeId;
    button.dataset.region = item.regionId;
    button.dataset.discoveryKind = kind;
    button.dataset.discoveryRelation = relation;

    const eyebrow = document.createElement("span");
    eyebrow.className = "smart-discovery-label";
    eyebrow.textContent = label;

    const title = document.createElement("strong");
    const dot = document.createElement("span");
    dot.className = `wine-color-dot ${smartAppearance(item)}`;
    dot.setAttribute("aria-hidden", "true");
    title.append(dot, document.createTextNode(item.grape.name));

    const region = document.createElement("span");
    region.className = "similar-region";
    region.textContent = `${item.region.name} · ${item.region.country}`;

    const why = document.createElement("span");
    why.className = "similar-reason";
    why.textContent = reason;

    button.append(eyebrow, title, region, why);
    button.addEventListener("click", () => WineAtlas.selectProfile(item.grapeId, item.regionId, true));
    container.appendChild(button);
  }
}

document.addEventListener("wineatlas:ready", () => {
  const intro = document.querySelector(".similar-card > p.small");
  if (intro) intro.textContent = "Follow a close modeled style, explore another region, or learn from an explicitly labeled contrast.";
});
