/*
 * RagDollLabs Wine Atlas — Smart Discovery
 * ----------------------------------------
 * Replaces the core nearest-neighbour Similar Wines output with three distinct
 * discovery intents. Profile calculation still comes from WineAtlas.allPairs();
 * this layer only chooses and explains recommendations.
 */

const SMART_METRICS = ["body", "acidity", "tannin", "sweetness", "alcohol", "fruit", "oak", "earth"];

function smartDistance(a, b) {
  return Math.sqrt(SMART_METRICS.reduce((sum, key) => sum + Math.pow((a.profile[key] || 0) - (b.profile[key] || 0), 2), 0));
}

function smartCompatibilityKey(item) {
  const family = item.regional.style?.family || "still";
  return family === "still" ? `still:${item.grape.color}` : family;
}

function smartAppearance(item) {
  return item.regional.style?.color || item.grape.color || "white";
}

function smartIsDiscovery(item) {
  return Boolean(item.grape.indigenous) || (item.region.badges || []).some(tag => ["Discovery", "Emerging region"].includes(tag));
}

function smartClosestMetrics(a, b) {
  return SMART_METRICS.map(key => ({ key, diff: Math.abs((a.profile[key] || 0) - (b.profile[key] || 0)) }))
    .sort((x, y) => x.diff - y.diff)
    .slice(0, 3)
    .map(({ key }) => key === "earth" ? "savoury character" : key)
    .join(", ");
}

function smartPick(candidates, used, predicate, score = item => item.distance) {
  return candidates
    .filter(item => !used.has(`${item.grapeId}::${item.regionId}`) && predicate(item))
    .sort((a, b) => score(a) - score(b))[0] || null;
}

function smartRecommendations(current) {
  const key = smartCompatibilityKey(current);
  const candidates = WineAtlas.allPairs()
    .filter(item => !(item.grapeId === current.grapeId && item.regionId === current.regionId))
    .map(item => ({ ...item, distance: smartDistance(current, item) }));
  const compatible = candidates.filter(item => smartCompatibilityKey(item) === key);
  const used = new Set();
  const picks = [];
  const add = (item, kind, label, reason) => {
    if (!item) return;
    used.add(`${item.grapeId}::${item.regionId}`);
    picks.push({ item, kind, label, reason });
  };

  const sameGrape = smartPick(compatible, used, item => item.grapeId === current.grapeId);
  add(sameGrape, "same-grape", "Same grape, different place", "See how the same grape changes with region, climate and local practice.");

  const family = current.regional.style?.family || "still";
  if (family !== "still") {
    const sameFamily = smartPick(compatible, used, item => item.grapeId !== current.grapeId);
    add(sameFamily, "same-style", "Same style family", `Another ${family} wine with comparable production context.`);
  } else {
    const structural = smartPick(compatible, used, item => item.grapeId !== current.grapeId);
    if (structural) add(structural, "similar-structure", "Similar structure", `Close on ${smartClosestMetrics(current, structural)}.`);
  }

  const adventurous = smartPick(
    compatible,
    used,
    item => smartIsDiscovery(item) && item.grapeId !== current.grapeId,
    item => item.distance - (item.grape.indigenous ? 0.35 : 0) - ((item.region.badges || []).includes("Emerging region") ? 0.2 : 0)
  );
  add(adventurous, "adventurous", "Something more adventurous", "A discovery-region or indigenous-grape profile that stays within a meaningful comparison context.");

  while (picks.length < 3) {
    const fallback = smartPick(compatible, used, () => true);
    if (!fallback) break;
    add(fallback, "similar-structure", "Similar structure", `Close on ${smartClosestMetrics(current, fallback)}.`);
  }

  return picks.slice(0, 3);
}

function smartRender(current) {
  const container = document.getElementById("similarWines");
  if (!container || !current) return;
  const picks = smartRecommendations(current);
  container.replaceChildren();

  for (const { item, kind, label, reason } of picks) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "similar-item smart-similar-item";
    button.dataset.grape = item.grapeId;
    button.dataset.region = item.regionId;
    button.dataset.discoveryKind = kind;

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

function smartCurrentFromEvent(event) {
  return event.detail?.profile || null;
}

document.addEventListener("wineatlas:profile-selected", event => smartRender(smartCurrentFromEvent(event)));
document.addEventListener("wineatlas:ready", () => {
  const intro = document.querySelector(".similar-card > p.small");
  if (intro) intro.textContent = "Three ways onward: follow the same grape, stay close in style, or try something more adventurous.";
});
