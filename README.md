# RagDollLabs Wine Atlas

A static, data-driven wine reference app for exploring how grape variety, region and climate shape a wine's typical style.

Live site: https://urqe.github.io/RagdollLabs-wine-atlas/

## Brand naming

The project originally used **RagLabs** as its working product name, while the repository already used the longer `RagdollLabs` naming. The visible product brand is now **RagDollLabs** for consistency across the project family. The repository and GitHub Pages path remain `RagdollLabs-wine-atlas` so existing links do not change.

The small **RagDollLabs reference tools** kicker keeps one typeface and one word, but visually separates **RagDoll** in a light wine tone from **Labs** in gold so the three adjacent `L` letterforms do not visually collapse together.

## Features

- **Welcome experience** — first-time visitors start from a minimal landing page instead of an arbitrary default wine profile
- **Five entry paths** — start by grape / represented blend, explore by place, search, surprise me, or compare regions
- **Only-choice auto-selection** — when a grape has exactly one regional expression, it opens automatically; place browsing also auto-advances when a region or grape is the only valid choice
- **Wine-color cues** — red / white grape indicators appear in selectors, profile headers, search results, featured discoveries and recommendations
- **Wine Explorer** — browse either **by grape / represented blend** or through a **Country → Region → Grape / blend** hierarchy
- **Atlas search** — search grapes, regions, countries, climate/style descriptions, flavor notes and discovery labels
- **Food-first discovery** — search what you are eating and rank profiles from the pairing data already attached to each grape-region profile, including desserts and cheese
- **Beyond Still Wine** — sparkling, sweet and fortified profiles carry structured production-method and style metadata rather than being forced into the dry-still model
- **Sensory profile** — body, acidity, tannin, sweetness, alcohol, fruit, oak and earthiness on a 0–5 scale
- **Locator maps** — recognizable world landmass maps with approximate regional markers, rendered locally with no tile service or tracking dependency
- **Regional identity** — concise climate, terrain, soil and influence context
- **Why does it taste like this?** — explicit data-driven cause → effect explanations connecting growing conditions and winemaking to style
- **Winemaking choices** — only profiles where vessel choice is genuinely educational show curated oak, steel, qvevri or related alternatives with prevalence and taste impact
- **Maturity & vintage evolution** — selected age-worthy profiles explain how a young wine can develop through mature stages and how vintage conditions may change the pace or expression
- **Learning layer** — technical wine terms such as qvevri, marl, schist, terra rossa, lees and malolactic fermentation can be tapped for concise definitions and “why it matters” context
- **Full glossary** — the same curated learning data is available as a compact browseable glossary from the Wine Explorer controls
- **Similar Wines** — three nearest profiles calculated from the same sensory metrics shown in the charts
- **Categorized flavor notes** — Fruit, Floral, Spice, Earth / savory, Oak / ageing and Mineral / herbal
- **Serve It Tonight** — serving temperature, decanting, glassware, ageing potential and food pairing guidance
- **Compare mode** — compare one grape / represented blend across 2–3 regions, with country-aware selectors, ranked **Biggest differences**, and feedback for duplicate selections
- **Discovery labels** — Classic, Discovery, Emerging region and grape-specific Indigenous grape badges
- **Surprise me** — discovery/emerging regions are weighted 3× over classics
- **Mood discovery** — Light & elegant, Big & ripe, Earthy & savoury, Fresh & mineral, Aromatic, Something unusual
- **Shareable URLs** — `?grape=...&region=...` opens a profile directly and bypasses the landing screen
- **Sources & methodology** — per-profile reference drawer resolved through `data/sources.json`

## Beyond still wine

The atlas now represents production families that do not fit the default dry-still model. These profiles expose an additional **Wine style & production** section with family, sweetness, method and likely sensory impact.

- **Champagne — Blanc de Blancs / Chardonnay** — traditional-method sparkling
- **Prosecco DOC / Glera** — Martinotti tank-method sparkling
- **Cava / Macabeo** — traditional-method sparkling
- **Sauternes / Sémillon** — botrytised sweet wine
- **Tokaj — Aszú / Furmint** — botrytised sweet wine
- **Douro — Ruby / LBV Port** — sweet fortified, fruit-preserving style
- **Douro — Tawny Port** — sweet fortified, oxidatively cask-aged style
- **Setúbal — Moscatel / Moscatel de Alexandria** — aromatic sweet fortified wine

Dessert discovery is expanded alongside those profiles. Examples include dark chocolate and chocolate mousse for Ruby/LBV Port; crème brûlée, almond tart and walnut desserts for Tawny Port; and crème brûlée, almond, chocolate, coffee and Pavlova-style desserts for Moscatel de Setúbal.

This metadata is intentionally being added **before** the planned Advanced Compare redesign, so future comparison rules can use meaningful style compatibility rather than relying only on red/white color.

## Regional expansion

The atlas includes classic, discovery and emerging profiles across established and less-covered wine regions. Recent additions deliberately add second regional expressions for grapes that previously had only one profile, so Compare mode becomes more useful.

- **Mexico / Cananea, Sonora** — Syrah, Cabernet Sauvignon
- **United States / Lodi** — old-vine Zinfandel
- **United States / Amador County / Sierra Foothills** — heritage Zinfandel
- **Greece / Amyndeon** — Xinomavro
- **Greece / Drama** — Assyrtiko
- **France / Madiran** — Tannat
- **Portugal / Dão** — Touriga Nacional
- **Romania / Drăgășani** — Fetească Neagră
- **Spain / La Palma, Canary Islands** — Listán Negro
- **Hungary / Somló** — Furmint
- **Georgia / Kartli** — Rkatsiteli

Earlier discovery additions include:

- **Georgia / Kakheti** — Saperavi, Rkatsiteli
- **Greece / Santorini** — Assyrtiko
- **Greece / Naoussa** — Xinomavro
- **Hungary / Tokaj** — Furmint
- **Portugal / Douro** — Touriga Nacional
- **Uruguay / Canelones** — Tannat
- **Armenia / Vayots Dzor** — Areni Noir
- **Romania / Dealu Mare** — Fetească Neagră
- **Spain / Tenerife, Canary Islands** — Listán Negro

## Tech

The runtime is HTML, CSS and vanilla JavaScript only. No backend, framework, analytics or external API is required at runtime. Wine knowledge lives in structured JSON. CI additionally installs **jsdom** as a development-only dependency for DOM-level regression tests.

## Architecture

```text
/
├── index.html
├── styles.css                       # core visual system
├── ux.css                           # welcome / wine-color / compare / functional UX styling
├── maturity.css                     # maturity-stage presentation
├── learning.css                     # brand split + contextual glossary UI
├── app.js                           # data, state, rendering and app events
├── ux.js                            # welcome and instructional-state subscriber
├── compare-country.js               # progressive compare-listbox enhancement
├── functional.js                    # food discovery, style metadata + winemaking-choice enhancement
├── maturity.js                      # optional maturity / vintage evolution renderer
├── learning.js                      # glossary loader, contextual term annotation and dialog
├── assets/
│   ├── world-map.svg                # simplified physical world landmass
│   └── vineyard-welcome.svg         # local decorative welcome artwork
├── data/
│   ├── grapes.json                  # varietal / represented-blend sensory baselines
│   ├── regions-classics-west.json
│   ├── regions-classics-expanded.json
│   ├── regions-discovery.json
│   ├── regions-discovery-expanded.json
│   ├── why-rules.json               # explicit scope / wording metadata for region Why entries
│   ├── winemaking.json              # sparse profile-specific vessel choices and taste effects
│   ├── maturity.json                # sparse Young → Developing → Mature editorial guidance
│   ├── glossary.json                # definitions, aliases, contextual notes and source refs
│   ├── locators.json
│   └── sources.json
├── scripts/
│   └── validate.py
├── tests/
│   └── dom-smoke.mjs                # jsdom user-flow regression checks
├── package.json                     # development-only test dependency
└── README.md
```

A rendered profile is calculated as:

**grape / represented-blend baseline + regional modifiers / overrides**

### Runtime coordination

`app.js` is the owner of application state. Selection paths resolve through the same guarded `selectProfile()` / `combinedProfile()` flow, and presentation layers subscribe to explicit `wineatlas:*` `CustomEvent`s.

Important events include:

- `wineatlas:ready` — structured data and core controls are initialized
- `wineatlas:profile-selected` — a valid grape-region profile is now active
- `wineatlas:selection-needed` — the UI needs another user choice and should show an instructional empty state
- `wineatlas:mode-changed` — Explore / Compare changed
- `wineatlas:compare-controls` — native comparison controls were rebuilt and may be progressively enhanced
- `wineatlas:winemaking-rendered` — optional asynchronous winemaking content finished rendering
- `wineatlas:maturity-rendered` — optional asynchronous maturity content finished rendering
- `wineatlas:special-style-rendered` — a sparkling / sweet / fortified production section was rendered

These events let feature layers cooperate without polling, MutationObservers or timing-based `setTimeout()` coordination.

`ux.js`, `functional.js`, `maturity.js` and `learning.js` remain presentation/feature layers around the same core selection API. A valid shared profile URL remains authoritative and bypasses the welcome screen.

### Selection behavior

Wine Atlas does not ask the user to make a choice when there is only one valid choice:

- grape / represented blend → **one region**: select and open that region automatically
- country → **one region**: advance to that region automatically
- region → **one grape / represented blend**: select and open it automatically
- multiple valid choices: show a placeholder and wait for the user
- Compare still requires at least two regional expressions; a single-region grape shows **“More regional expressions coming soon.”**

### Rendering and safety

Repository-controlled wine data is treated as data, not markup. Dynamic text inserted through HTML templates is escaped with the shared `escapeHtml()` / `escapeAttr()` helpers; feature layers generally use DOM nodes and `textContent`.

Search results are ordinary keyboard-focusable buttons rather than a partial ARIA listbox. The country-aware Compare selector intentionally uses the full listbox pattern, including Arrow keys, Home/End, Enter/Space and Escape, with the hidden native select retained as the comparison state source.

The learning layer only replaces matching text nodes with accessible glossary buttons. It skips links, buttons, form controls, hidden decorative content and the glossary dialog itself, so glossary enhancement cannot recursively annotate its own definitions.

### “Why does it taste like this?” data

The renderer does **not** parse English prose to guess which grape a sentence belongs to, and it does not use soil/garrigue regexes to replace hand-written explanations.

Regional `why` entries remain the base editorial content. `data/why-rules.json` adds explicit metadata where required:

- `grapes` scopes a regional explanation to one or more valid grape profiles
- `cause` / `effect` can replace wording that needs a more careful scientific formulation

Profile-level `regional.why` remains available when an explanation belongs entirely to one grape-region profile. The validator checks every `why-rules.json` region, index and grape reference so a typo cannot silently hide or misapply an explanation.

Soil and landscape language is intentionally cautious: the atlas can describe drainage, water availability, heat storage, vine vigor and regional sensory associations without claiming that minerals or nearby plants literally transfer flavors into wine.

### Winemaking-choice data

`data/winemaking.json` is intentionally sparse rather than generating generic barrel/tank commentary for every wine. A profile appears there only when the vessel or maturation choice is a meaningful part of understanding the style. Each choice records a vessel/approach, prevalence, optional context, a cautious sensory effect and source references.

The initial curated set covers Santorini Assyrtiko, Kakheti Rkatsiteli, Napa Cabernet Sauvignon and Rioja Tempranillo. Profiles without relevant vessel choices show no section at all.

### Maturity data

`data/maturity.json` is similarly sparse. Each curated profile contains a short overview, exactly three editorial stages (**Young → Developing → Mature**), a vintage note and source references. It does not infer maturity from the existing free-text ageing-range field.

### Learning-layer data

`data/glossary.json` stores a canonical term, aliases, a concise definition, a **Why it matters** explanation, source references and an `inline` flag. Common terms such as tannin can remain available in the full glossary while opting out of automatic inline annotation, preventing the profile from becoming visually noisy.

The initial glossary covers advanced terms including amphora, botrytis, diurnal range, galets roulés, lees, malolactic fermentation, marl, neutral oak, Nykteri, qvevri, schist, skin contact, terra rossa and tertiary aromas.

### Beyond-still style data

Profiles can optionally define a structured `style` object. Its current contract contains:

- `family` — `sparkling`, `sweet`, or `fortified`
- `color` — presentation/context such as white, red, tawny or amber
- `sweetness` — a constrained style descriptor
- `label` — compact human-readable style label
- `method` — defining production method
- `effect` — cautious explanation of how that method typically changes the wine

If `style` is absent, the profile keeps the existing still-wine behavior. The separate metadata lets a future Advanced Compare release make compatibility decisions using style family and production context instead of assuming that color alone is enough.

`grapes.json` can also mark an entry as `kind: "blend"` when the atlas needs an explicit represented blend rather than pretending a multi-variety wine is monovarietal. The initial example is **Port blend**.

### Data conventions

- Sensory metrics use a 0–5 scale. Regional `mods` are offsets and are clamped to 0–5.
- `grapes.json` stores explicit `color` and `indigenous` metadata. UI logic must not infer these from sensory numbers.
- Wine-color cues use burgundy for red bases and warm straw/gold for white bases. Text labels remain present so color is never the only signal.
- Region entries contain only combinations intended to be plausible for that region and style.
- `identity`, `why`, `badges`, `sources` and profile `style` are optional metadata.
- `Indigenous grape` is rendered from grape metadata, not inherited blindly from a multi-grape region.
- `locators.json` contains approximate latitude/longitude points for educational locator diagrams, not GIS-grade boundaries.

### Locator map source

`assets/world-map.svg` is a simplified physical landmass derived from the public-domain **Natural Earth** low-resolution dataset. The base artwork deliberately shows landmasses without political borders; region and country naming comes from the Wine Atlas data.

### Cache behavior

Visible release assets use a shared release token in `index.html` so a freshly deployed HTML page is not paired with stale CSS or JavaScript.

## Validation

Run the integrity checks and DOM smoke suite locally with:

```bash
python3 scripts/validate.py
node --check app.js
node --check compare-country.js
node --check ux.js
node --check functional.js
node --check maturity.js
node --check learning.js
npm install
npm test
```

The structured validator checks JSON parsing, duplicate region IDs, grape/source references, required profile fields, metric/modifier contracts, locator coverage, explicit Why-rule references, winemaking metadata, maturity metadata, glossary aliases/source references and the beyond-still `style` contract. The jsdom suite exercises guarded profile selection, conditional feature rendering, food-first discovery including dessert matches, sparkling/Port/Moscatel profiles, contextual glossary annotation/dialog behavior, only-choice auto-selection and rapid Compare rebuilding. `.github/workflows/validate.yml` runs both layers in GitHub Actions.

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


### Landing scene and modern food discovery (October 2026)

The vineyard background contains the ragdoll as inline vector geometry before the
foreground glassware. Do not replace it with an external SVG `<image>` dependency:
CSS background SVGs cannot load that dependency. Mobile reserves an illustration
strip below the copy, keeping the mascot visible without sacrificing legibility.

`food-discovery.js` owns normalization, one cached vocabulary load, canonical alias
resolution and pairing scores for Explore, Compare and the legacy food helper.
Aliases are search-only; canonical labels live in regional `pairings` arrays.
Known dish aliases resolve only to their explicit targets, never to arbitrary
protein substrings. Generic `ramen` and `tacos` searches span preparation variants;
specific queries remain distinct. Regional profiles cover different bottles:
off-dry recommendations require checking the actual bottle's sweetness.

`data/food-dishes.json` records preparation guidance, references and editorial basis
for 14 dishes/variants. Profile selections are editorial style matches informed by
those references, not claims that a reference recommends every regional profile.
Guidance appears with a reference in both search workspaces. Optional vocabulary
or guidance failures preserve direct pairing search. Validation checks references,
canonical targets and self-contained artwork; DOM tests cover alias equivalence,
dish coverage and preparation boundaries. Browser visual checks are still needed
when changing the background composition or responsive CSS.


### Food vocabulary and constrained wine search

All canonical food pairing labels are lowercase in data and accessible UI text.
The curated dish vocabulary now covers 28 dishes/preparation variants. Search-only
aliases include spelling variants, accents, singular/plural forms and selected
Finnish/Spanish names. Result summaries show the food labels that matched rather
than every pairing attached to a wine.

`wine-search.js` owns ranking for both Explore and Compare. `data/wine-search.json`
is validated core data: aliases for sparkling wine, crémant, Champagne, Cava and
Prosecco impose hard family/appellation constraints before ranking. Complete grape
names in constrained searches must match the actual displayed grape expression;
permitted blend varieties mentioned in explanatory prose cannot create a match.
Examples: `cremant pinot noir`, `crémant d’Alsace`, `sparkling fried chicken` and
`kuohuviini chardonnay`. Contradictory appellations yield no results, and Champagne
is never substituted for crémant. Core input handling delegates to the enhanced
renderer once, preserving a basic fallback if the enhancement script is absent.

Five crémant expressions cover Bourgogne (Chardonnay-led blanc de blancs and
Pinot Noir-led blanc de noirs), Alsace (Pinot Blanc-led white and Pinot Noir rosé)
and Loire (Chenin-led white). These are curated style expressions, not an exhaustive
list of permitted grapes or all regional blends. Numeric style bars remain
editorial estimates, not appellation rules or laboratory measurements.
