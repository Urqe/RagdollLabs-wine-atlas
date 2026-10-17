# RagDollLabs Wine Atlas

A static, data-driven wine reference app for exploring how grape variety, region and climate shape a wine's typical style.

Live site: https://urqe.github.io/RagdollLabs-wine-atlas/

## Brand naming

The project originally used **RagLabs** as its working product name, while the repository already used the longer `RagdollLabs` naming. The visible product brand is now **RagDollLabs** for consistency across the project family. The repository and GitHub Pages path remain `RagdollLabs-wine-atlas` so existing links do not change.

## Features

- **Welcome experience** — first-time visitors start from a minimal landing page instead of an arbitrary default wine profile
- **Five entry paths** — start by grape, explore by place, search, surprise me, or compare regions
- **Only-choice auto-selection** — when a grape has exactly one regional expression, it opens automatically; place browsing also auto-advances when a region or grape is the only valid choice
- **Wine-color cues** — red / white grape indicators appear in selectors, profile headers, search results, featured discoveries and recommendations
- **Wine Explorer** — browse either **by grape** or through a **Country → Region → Grape** hierarchy
- **Atlas search** — search grapes, regions, countries, climate/style descriptions, flavor notes and discovery labels
- **Sensory profile** — body, acidity, tannin, sweetness, alcohol, fruit, oak and earthiness on a 0–5 scale
- **Locator maps** — recognizable world landmass maps with approximate regional markers, rendered locally with no tile service or tracking dependency
- **Regional identity** — concise climate, terrain, soil and influence context
- **Why does it taste like this?** — explicit data-driven cause → effect explanations connecting growing conditions and winemaking to style
- **Similar Wines** — three nearest profiles calculated from the same sensory metrics shown in the charts
- **Categorized flavor notes** — Fruit, Floral, Spice, Earth / savory, Oak / ageing and Mineral / herbal
- **Serve It Tonight** — serving temperature, decanting, glassware, ageing potential and food pairing guidance
- **Compare mode** — compare one grape across 2–3 regions, with country-aware selectors, ranked **Biggest differences**, and feedback for duplicate selections
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
├── ux.css                           # welcome / wine-color / compare UX styling
├── app.js                           # data, state, rendering and app events
├── ux.js                            # welcome and instructional-state subscriber
├── compare-country.js               # progressive compare-listbox enhancement
├── assets/
│   ├── world-map.svg                # simplified physical world landmass
│   └── vineyard-welcome.svg         # local decorative welcome artwork
├── data/
│   ├── grapes.json
│   ├── regions-classics-west.json
│   ├── regions-classics-expanded.json
│   ├── regions-discovery.json
│   ├── regions-discovery-expanded.json
│   ├── why-rules.json               # explicit scope / wording metadata for region Why entries
│   ├── locators.json
│   └── sources.json
├── scripts/
│   └── validate.py
└── README.md
```

A rendered profile is calculated as:

**grape baseline + regional modifiers / overrides**

### Runtime coordination

`app.js` is the owner of application state. Selection paths resolve through the same guarded `selectProfile()` / `combinedProfile()` flow, and presentation layers subscribe to explicit `wineatlas:*` `CustomEvent`s.

Important events include:

- `wineatlas:ready` — structured data and core controls are initialized
- `wineatlas:profile-selected` — a valid grape-region profile is now active
- `wineatlas:selection-needed` — the UI needs another user choice and should show an instructional empty state
- `wineatlas:mode-changed` — Explore / Compare changed
- `wineatlas:compare-controls` — native comparison controls were rebuilt and may be progressively enhanced

This replaces the earlier polling, `setTimeout(0)` choreography and `resetCompare()` monkey-patching. `compare-country.js` subscribes to the compare-control event and enhances the already-functional native selects; if that script fails to load, comparison still works with native controls.

`ux.js` subscribes to application events rather than observing DOM mutations or sniffing `app.js` globals. A valid shared profile URL remains authoritative and bypasses the welcome screen.

### Selection behavior

Wine Atlas does not ask the user to make a choice when there is only one valid choice:

- grape → **one region**: select and open that region automatically
- country → **one region**: advance to that region automatically
- region → **one grape**: select and open that grape automatically
- multiple valid choices: show a placeholder and wait for the user
- Compare still requires at least two regional expressions; a single-region grape shows **“More regional expressions coming soon.”**

### Rendering and safety

Repository-controlled wine data is still treated as data, not markup. Dynamic text inserted through HTML templates is escaped with the shared `escapeHtml()` / `escapeAttr()` helpers; UX components that are convenient to build directly use DOM nodes and `textContent`.

Search results are ordinary keyboard-focusable buttons rather than a partial ARIA listbox. The country-aware Compare selector intentionally uses the full listbox pattern, including Arrow keys, Home/End, Enter/Space and Escape, with the hidden native select retained as the comparison state source.

The eight sensory metrics keep their display label and Compare phrasing in one definition so adding or changing a metric cannot leave a second phrasing table out of sync. `allPairs()` is memoized because the loaded wine dataset is immutable during a page session.

### “Why does it taste like this?” data

The renderer does **not** parse English prose to guess which grape a sentence belongs to, and it does not use soil/garrigue regexes to replace hand-written explanations.

Regional `why` entries remain the base editorial content. `data/why-rules.json` adds explicit metadata where required:

- `grapes` scopes a regional explanation to one or more valid grape profiles
- `cause` / `effect` can replace wording that needs a more careful scientific formulation

Profile-level `regional.why` remains available when an explanation belongs entirely to one grape-region profile. The validator checks every `why-rules.json` region, index and grape reference so a typo cannot silently hide or misapply an explanation.

Soil and landscape language is intentionally cautious: the atlas can describe drainage, water availability, heat storage, vine vigor and regional sensory associations without claiming that minerals or nearby plants literally transfer flavors into wine.

### Data conventions

- Sensory metrics use a 0–5 scale. Regional `mods` are offsets and are clamped to 0–5.
- `grapes.json` stores explicit `color` and `indigenous` metadata. UI logic must not infer these from sensory numbers.
- Wine-color cues use burgundy for red grapes and warm straw/gold for white grapes. Text labels remain present so color is never the only signal.
- Region entries contain only grape combinations intended to be plausible for that region.
- `identity`, `why`, `badges` and `sources` are optional region metadata.
- `Indigenous grape` is rendered from grape metadata, not inherited blindly from a multi-grape region.
- `locators.json` contains approximate latitude/longitude points for educational locator diagrams, not GIS-grade boundaries.

### Locator map source and political labeling

`assets/world-map.svg` is a simplified physical landmass derived from the public-domain **Natural Earth** low-resolution dataset. The base artwork deliberately shows landmasses without political borders; this keeps the locator focused on geography while region/country naming remains controlled by Wine Atlas metadata.

For politically sensitive territories, Wine Atlas follows the official position of the **Finnish Government** rather than de facto control. In particular, **Crimea and Sevastopol are treated as part of Ukraine**, so any future wine profile located there must use `"country": "Ukraine"`, not Russia. The validator contains an explicit guard for these labels so the rule cannot be changed accidentally by a future data addition.

Reference: https://valtioneuvosto.fi/en/ukraine

### Cache behavior

Visible release assets use one release token in `index.html`, and the two image references in `ux.css` use the same token. Keeping a single token avoids the previous collection of unrelated manual suffixes while still preventing a freshly deployed HTML page from being paired with stale CSS/JS/image assets.

## Validation

Run the dependency-free integrity checks locally with:

```bash
python3 scripts/validate.py
node --check app.js
node --check compare-country.js
node --check ux.js
```

The validator checks JSON parsing, duplicate region IDs, grape/source references, required profile fields, metric/modifier contracts, locator coverage, explicit Why-rule references and the documented geopolitical-labeling guard. `.github/workflows/validate.yml` runs the same checks in GitHub Actions.

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
