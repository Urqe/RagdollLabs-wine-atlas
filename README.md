# RagdollLabs Wine Atlas

A static, data-driven wine reference app for exploring how grape variety, region and climate shape a wine's typical style.

Live site: https://urqe.github.io/RagdollLabs-wine-atlas/

## Features

- **Wine Explorer** — pick a grape and a relevant region to see the typical style
- **Sensory profile** — body, acidity, tannin, sweetness, alcohol, fruit, oak and earthiness on a 0–5 scale, shown as bars with numeric alternatives
- **Regional identity** — concise terroir summary: climate, terrain, soils and key influences
- **Why does it taste like this?** — cautious cause → effect explanations connecting climate, geography and winemaking to what's in the glass
- **Categorized flavor notes** — Fruit, Floral, Spice, Earth / savory, Oak / ageing and Mineral / herbal, each with a decorative inline-SVG icon
- **Serve It Tonight** — serving temperature, decanting guidance, glassware, ageing potential and food pairings
- **Compare mode** — compare one grape across 2–3 regions, with a **Biggest differences** panel that ranks the largest metric spreads in plain language
- **Discovery labels** — Classic, Discovery, Emerging region and grape-specific Indigenous grape badges
- **Surprise me** — jump to a random valid profile, weighting discovery/emerging regions 3× over classics
- **Mood-based discovery** — start from a taste (Light & elegant, Big & ripe, Earthy & savoury, Fresh & mineral, Aromatic, Something unusual) instead of a grape name
- **Shareable URLs** — every profile linkable via `?grape=...&region=...`; invalid parameters normalize to the valid fallback profile
- **Sources & methodology** — expandable per-profile reference list resolved through `data/sources.json`
- Responsive layout for desktop, tablet and mobile, with accessibility basics (labels, focus states, ARIA toggle state, live-region announcements, decorative-only imagery)

## Tech

HTML, CSS and vanilla JavaScript only. No backend, no build step, no frameworks, no analytics, no external APIs. Wine knowledge lives entirely in `data/*.json`.

## Architecture

```text
/
├── index.html      # semantic structure only
├── styles.css      # presentation and responsive behavior
├── app.js          # loading, state, guarded lookups and rendering
├── data/
│   ├── grapes.json                  # grape baselines (0–5 metrics)
│   ├── regions-classics-west.json   # classic Old/New World regions
│   ├── regions-classics-expanded.json
│   ├── regions-discovery.json       # emerging and less familiar regions
│   └── sources.json                 # reference registry per region
└── README.md
```

A rendered profile is calculated as:

**grape baseline + regional modifiers / overrides**

### Data conventions

- Sensory metrics use a 0–5 scale. Region `mods` are offsets applied to the grape baseline and clamped to 0–5.
- Region entries contain only grape combinations intended to be plausible for that region.
- `identity` (terroir), `why` (cause → effect pairs), `badges` and `sources` are optional per region; the UI renders each section only where useful.
- `Indigenous grape` is treated as grape-specific at render time so a multi-grape region cannot incorrectly label Cabernet, Merlot or Chardonnay as indigenous. In this app the label means an indigenous/local traditional variety rather than an international variety; it does not claim the grape originated in the currently selected region.
- "Why" text prefers future profile-level `regional.why` entries when present. Region-level explanations that explicitly name another grape are filtered out for the selected profile.
- Soil and landscape explanations are presented cautiously: they describe effects on drainage, water availability, vine growth and regional associations rather than claiming that rocks or nearby vegetation literally transfer flavor into wine.
- Grapes with fewer than two regional expressions remain available in Explore mode; Compare mode displays "More regional expressions coming soon." instead of a meaningless comparison.

### Behavior notes for reviewers

- Region selectors are recreated whenever the grape changes. Keeping old DOM values here previously allowed stale region IDs to reach `combinedProfile()` and crash Compare mode; `combinedProfile()` also guards all lookups as a second line of defense.
- Region-file merging uses one `Set` across every data file, so a duplicate id between any pair of region files fails loudly before `Object.assign()` can overwrite it.
- Compare's Biggest differences panel finds the highest and lowest region per metric, ranks by spread, and shows only differences ≥ 0.5 on the 0–5 scale.
- Surprise me builds its candidate pool from `combinedProfile()` over all pairs, so it can never surface an invalid combination. Discovery regions are weighted 3×.
- Mood filters are predicates over combined profiles. The Aromatic mood explicitly restricts itself to white grapes rather than inferring wine colour from sensory metrics.
- Shareable URLs validate both ids and the grape-region pair before rendering. Invalid query state is normalized to the fallback profile actually shown on screen.
- Mood discovery is hidden in Compare mode to avoid an Explore-only control unexpectedly switching modes.

## Running locally

Because the app loads JSON with `fetch()`, run a small local web server rather than opening `index.html` directly with `file://`.

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## GitHub Pages

The app uses relative paths and is designed for a project Pages URL.

In GitHub:

```text
Settings → Pages → Deploy from branch → main → / (root)
```

## Disclaimer

> Wine profiles in this project describe typical regional and varietal characteristics. Individual wines may differ substantially depending on vintage, producer, vineyard, climate and winemaking choices. Terroir descriptions summarize growing conditions and common regional associations; they should not be read as claims that soil minerals or nearby plants directly transfer specific flavors into wine.
