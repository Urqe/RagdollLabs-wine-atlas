# RagDollLabs Wine Atlas

A static, data-driven wine reference app for exploring how grape variety, region and climate shape a wine's typical style.

Live site: https://urqe.github.io/RagdollLabs-wine-atlas/

## Brand naming

The project originally used **RagLabs** as its working product name, while the repository already used the longer `RagdollLabs` naming. The visible product brand is now **RagDollLabs** for consistency across the project family. The repository and GitHub Pages path remain `RagdollLabs-wine-atlas` so existing links do not change.

## Features

- **Welcome experience** — first-time visitors start from a minimal landing page instead of an arbitrary default wine profile
- **Five entry paths** — start by grape, explore by place, search, surprise me, or compare regions
- **Wine-color cues** — red / white grape indicators appear in selectors, profile headers, search results, featured discoveries and recommendations
- **Wine Explorer** — browse either **by grape** or through a **Country → Region → Grape** hierarchy
- **Atlas search** — search grapes, regions, countries, climate/style descriptions, flavor notes and discovery labels
- **Sensory profile** — body, acidity, tannin, sweetness, alcohol, fruit, oak and earthiness on a 0–5 scale
- **Locator maps** — recognizable world landmass maps with approximate regional markers, rendered locally with no tile service or tracking dependency
- **Regional identity** — concise climate, terrain, soil and influence context
- **Why does it taste like this?** — cautious cause → effect explanations connecting growing conditions and winemaking to style
- **Similar Wines** — three nearest profiles calculated from the same sensory metrics shown in the charts
- **Categorized flavor notes** — Fruit, Floral, Spice, Earth / savory, Oak / ageing and Mineral / herbal
- **Serve It Tonight** — serving temperature, decanting, glassware, ageing potential and food pairing guidance
- **Compare mode** — compare one grape across 2–3 regions, with ranked **Biggest differences**
- **Discovery labels** — Classic, Discovery, Emerging region and grape-specific Indigenous grape badges
- **Surprise me** — discovery/emerging regions are weighted 3× over classics
- **Mood discovery** — Light & elegant, Big & ripe, Earthy & savoury, Fresh & mineral, Aromatic, Something unusual
- **Shareable URLs** — `?grape=...&region=...` opens a profile directly and bypasses the landing screen
- **Sources & methodology** — per-profile reference drawer resolved through `data/sources.json`

## Discovery expansion

The atlas includes additional discovery profiles beyond the original Mexico / Bulgaria / Ukraine / Russia set, including:

- **Georgia / Kakheti** — Saperavi, Rkatsiteli
- **Greece / Santorini** — Assyrtiko
- **Greece / Naoussa** — Xinomavro
- **Hungary / Tokaj** — Furmint
- **Portugal / Douro** — Touriga Nacional
- **Uruguay / Canelones** — Tannat
- **Armenia / Vayots Dzor** — Areni Noir
- **Romania / Dealu Mare** — Fetească Neagră
- **Spain / Canary Islands (Tenerife)** — Listán Negro

## Tech

HTML, CSS and vanilla JavaScript only. No backend, build step, framework, analytics or external API is required at runtime. Wine knowledge lives in structured JSON.

## Architecture

```text
/
├── index.html
├── styles.css                       # core visual system
├── ux.css                           # welcome / wine-color UX layer
├── app.js                           # core Wine Atlas behavior
├── ux.js                            # landing-state and UX orchestration
├── assets/
│   ├── world-map.svg                # simplified physical world landmass
│   └── vineyard-welcome.svg         # local decorative welcome artwork
├── data/
│   ├── grapes.json
│   ├── regions-classics-west.json
│   ├── regions-classics-expanded.json
│   ├── regions-discovery.json
│   ├── regions-discovery-expanded.json
│   ├── locators.json
│   └── sources.json
├── scripts/
│   └── validate.py
└── README.md
```

A rendered profile is calculated as:

**grape baseline + regional modifiers / overrides**

### UX architecture

`app.js` remains the source of profile-selection, comparison, search and recommendation behavior. `ux.js` deliberately sits on top of it and does not duplicate wine knowledge. This separation keeps the new welcome flow reviewable and easy to revise.

On a clean visit with no valid `?grape=...&region=...` pair, the app shows the welcome screen and removes the internal default profile from the visible URL. A valid shared profile URL bypasses the welcome screen and opens the requested profile directly.

The welcome artwork is a local SVG with a dark overlay so it remains lightweight and consistent with the existing wine-cellar palette. Decorative imagery is not required to understand or operate the app.

The HTML references `styles.css`, `ux.css`, `app.js` and `ux.js` with release-version query strings. `ux.css` also version-tags `world-map.svg`. These cache-busting tokens are intentionally changed for visible releases so GitHub Pages visitors do not receive a stale CSS/image combination after deployment.

### Data conventions

- Sensory metrics use a 0–5 scale. Regional `mods` are offsets and are clamped to 0–5.
- `grapes.json` stores explicit `color` and `indigenous` metadata. UI logic must not infer these from sensory numbers.
- Wine-color cues use that explicit metadata: burgundy for red grapes and warm straw/gold for white grapes. Text labels remain present so color is never the only signal.
- Region entries contain only grape combinations intended to be plausible for that region.
- `identity`, `why`, `badges` and `sources` are optional region metadata.
- `Indigenous grape` is rendered from grape metadata, not inherited blindly from a multi-grape region.
- Profile-level `regional.why` can override region-wide explanations when a future profile needs grape-specific reasoning.
- Soil and landscape language is intentionally cautious: it describes drainage, water availability, vine growth and regional associations rather than claiming that minerals or nearby plants literally transfer flavor into wine.
- `locators.json` contains approximate latitude/longitude points for educational locator diagrams, not GIS-grade boundaries.

### Locator map source and political labeling

`assets/world-map.svg` is a simplified physical landmass derived from the public-domain **Natural Earth** low-resolution dataset. The base artwork deliberately shows landmasses without political borders; this keeps the locator focused on geography while region/country naming remains controlled by Wine Atlas metadata.

For politically sensitive territories, Wine Atlas follows the official position of the **Finnish Government** rather than de facto control. In particular, **Crimea and Sevastopol are treated as part of Ukraine**, so any future wine profile located there must use `"country": "Ukraine"`, not Russia. The validator contains an explicit guard for these labels so the rule cannot be changed accidentally by a future data addition.

Reference: https://valtioneuvosto.fi/en/ukraine

### Behavior notes for reviewers

- Every feature that selects a wine profile resolves through `combinedProfile()` so invalid grape-region pairs cannot leak into the UI.
- Region-file merging uses a single `Set` across all region files; duplicate IDs fail before `Object.assign()` can overwrite them.
- Browse-by-place is only an alternate navigation path over the same profile state; it does not maintain a separate wine dataset.
- Search indexes structured content already shipped in the app and never makes network calls.
- Similar Wines uses Euclidean distance across the eight 0–5 profile metrics, with a tiny penalty for returning the identical grape in another region so the list can surface genuinely adjacent styles when appropriate.
- Locator markers use the same equirectangular coordinate system as the local world-map asset, so marker placement remains deterministic and dependency-free.
- Compare selectors are rebuilt whenever the grape changes; stale IDs cannot survive from the previous grape.
- Single-region grapes remain available in Explore mode and show **“More regional expressions coming soon.”** in Compare.
- `ux.js` waits for `app.js` data initialization before deciding whether to show the welcome view or honor a shared profile URL.

## Validation

Run the dependency-free integrity checks locally with:

```bash
python3 scripts/validate.py
node --check app.js
node --check ux.js
```

The validator checks JSON parsing, duplicate region IDs, grape/source references, required profile fields, metric/modifier contracts, locator coverage and the documented geopolitical-labeling guard. `.github/workflows/validate.yml` runs the same checks in GitHub Actions.

## Running locally

Because JSON is loaded with `fetch()`, run a local server instead of opening `index.html` with `file://`:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## GitHub Pages

The app uses relative paths and is designed for a project Pages URL:

```text
Settings → Pages → Deploy from branch → main → / (root)
```

## Disclaimer

> Wine profiles describe typical regional and varietal characteristics. Individual wines may differ substantially by vintage, producer, vineyard and winemaking. Terroir descriptions summarize growing conditions and common regional associations; they should not be read as claims that soil minerals or nearby plants directly transfer specific flavors into wine.
