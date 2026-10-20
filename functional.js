/*
 * RagDollLabs Wine Atlas — practical discovery enhancements
 * --------------------------------------------------------
 * Keeps style metadata and profile-specific winemaking context separate
 * from the core profile engine. Both renderers consume validated data and use
 * the public WineAtlas profile API; this module never recomputes profile rules.
 *
 * Optional enrichment JSON is intentionally fail-soft. If an optional file
 * cannot be fetched, the affected section stays hidden for that page session
 * and the error is logged. Core browsing remains usable; reload is the retry.
 */

let winemakingPromise = null;
let lastProfile = null;

function renderSpecialStyle(profile) {
  document.getElementById("specialStyle")?.remove();
  const style = profile?.regional?.style;
  if (!style) return;
  const anchor = document.getElementById("winemaking") || document.querySelector("#exploreView .content2");
  if (!anchor) return;

  const section = document.createElement("section");
  section.id = "specialStyle";
  section.className = "identity";
  section.setAttribute("aria-labelledby", "specialStyleHeading");
  const heading = document.createElement("h3");
  heading.id = "specialStyleHeading";
  heading.textContent = "Wine style & production";

  const grid = document.createElement("dl");
  grid.className = "identity-grid";
  const rows = [
    ["Style", style.label],
    ["Family", style.family],
    ["Colour", WineModel.colorLabel(style.color)],
    ["Composition", style.composition?.text],
    ["Sweetness", style.sweetness],
    ["Method", style.method]
  ];
  for (const [term, value] of rows) {
    if (!value) continue;
    const row = document.createElement("div");
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    dt.textContent = term;
    dd.textContent = value;
    row.append(dt, dd);
    grid.appendChild(row);
  }
  const effect = document.createElement("p");
  effect.className = "small";
  effect.textContent = style.effect || "";
  section.append(heading, grid, effect);
  for (const related of profile.regional.related || []) {
    const button = WineDOM.element("button", related.label, "score-help");
    button.type = "button";
    button.addEventListener("click", () => WineAtlas.selectProfile(related.grape, related.region, true));
    section.append(button);
  }
  anchor.insertAdjacentElement("beforebegin", section);
  document.dispatchEvent(new CustomEvent("wineatlas:special-style-rendered", { detail: { profile } }));
}

function loadWinemaking() {
  if (!winemakingPromise) winemakingPromise = WineData.json("./data/winemaking.json", { optional: true });
  return winemakingPromise;
}

function signalWinemakingRendered(profile, visible) {
  document.dispatchEvent(new CustomEvent("wineatlas:winemaking-rendered", { detail: { profile, visible } }));
}

async function renderWinemaking(profile) {
  const section = document.getElementById("winemaking");
  const choicesTarget = document.getElementById("winemakingChoices");
  if (!section || !choicesTarget || !profile) return;
  const data = await loadWinemaking();
  if (lastProfile !== profile) return;

  const entry = data?.[profile.regionId]?.[profile.grapeId];
  const choices = entry?.choices || [];
  choicesTarget.replaceChildren();
  if (!choices.length) {
    section.classList.add("hidden");
    signalWinemakingRendered(profile, false);
    return;
  }

  for (const choice of choices) {
    const card = document.createElement("article");
    card.className = "winemaking-choice";
    const heading = document.createElement("div");
    heading.className = "winemaking-choice-head";
    const vessel = document.createElement("strong");
    vessel.textContent = choice.vessel;
    const prevalence = document.createElement("span");
    prevalence.className = "winemaking-prevalence";
    prevalence.textContent = choice.prevalence;
    heading.append(vessel, prevalence);
    card.appendChild(heading);

    if (choice.context) {
      const context = document.createElement("div");
      context.className = "winemaking-context";
      context.textContent = choice.context;
      card.appendChild(context);
    }

    const effect = document.createElement("p");
    effect.textContent = choice.effect;
    card.appendChild(effect);
    choicesTarget.appendChild(card);
  }
  section.classList.remove("hidden");
  signalWinemakingRendered(profile, true);
}

document.addEventListener("wineatlas:ready", () => {
  void loadWinemaking();
});

document.addEventListener("wineatlas:profile-selected", event => {
  lastProfile = event.detail.profile;
  renderSpecialStyle(lastProfile);
  void renderWinemaking(lastProfile);
});

document.addEventListener("wineatlas:selection-needed", () => {
  lastProfile = null;
  document.getElementById("specialStyle")?.remove();
  document.getElementById("winemaking")?.classList.add("hidden");
});
