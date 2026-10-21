# RagDollLabs Wine Atlas

A static, data-driven wine reference app for exploring how grape variety, region, climate and winemaking shape a wine's typical style.

Live site: https://urqe.github.io/RagdollLabs-wine-atlas/

The visible brand is **RagDollLabs**; the repository and GitHub Pages path keep the original `RagdollLabs-wine-atlas` spelling so existing links do not change. The kicker shows **RagDoll** in a light wine tone and **Labs** in gold so the adjacent `L` letterforms stay distinct.

## Features

- **Welcome experience** — first-time visitors start from a minimal landing page, including a **New to wine?** route into the taste explainer
- **Wine Explorer** — browse by grape / represented blend, or through **Country → Region → Grape / blend**; when only one choice is valid it opens automatically
- **Atlas search** — grapes, regions, countries, climate and style descriptions, flavour notes, discovery labels and food, with structured colour/sweetness filters, grape synonyms and constrained appellation searches (Champagne, crémant, Cava, Prosecco, Moscato d'Asti)
- **Sensory profile** — body, acidity, tannin, sweetness, alcohol, fruit, oak and earth on a 0–5 scale (see [Scores](#scores))
- **Why does it taste like this?** — explicit cause → effect explanations connecting growing conditions and winemaking to style
- **How wine gets its taste** — a beginner explainer covering climate, grape, fermentation, skins, oak, lees, bubbles, ageing and minerality, with links to profiles that show each effect
- **Wine glossary** — beginner basics (acidity, body, dry vs sweet, oak, vintage) and technical terms (qvevri, botrytis, dosage, carbonic maceration); technical terms are tappable inside profiles
- **Beyond still wine** — sparkling, sweet, fortified, rosé and orange profiles carry structured production-method metadata
- **Winemaking choices** and **maturity & vintage evolution** — sparse, curated sections only where they genuinely teach something
- **Compare** — up to three wines side by side: still wines within the same colour, other styles within their family (sparkling, sweet, fortified, rosé, orange), with ranked biggest differences
- **Similar Wines** — same grape elsewhere, similar structure, and a more adventurous pick
- **Mood discovery** — Light & elegant, Big & ripe, Earthy & savoury, Fresh & mineral, Aromatic, Something unusual
- **Food-first discovery** — search what you are eating, including desserts, cheese and modern dishes
- **Regional identity**, **locator maps**, **Serve It Tonight** guidance and **sources** for every region
- **Shareable URLs and history** — `?grape=...&region=...` opens a profile directly; Gallery and Compare have shareable routes, and Back/Forward restore views, comparison selections, scroll and focus (see [navigation](docs/navigation.md))

## Searching by style, grape or aroma

Use `sparkling dry`, `sparkling sweet`, `rosé`, `orange wine` or `dry Riesling Germany` to filter the modeled wine attributes. For tasting notes rather than wine colour/style, use `aroma: rose` or `notes: orange`; filters can precede the marker, such as `dry aroma: rose`.

Spätburgunder/Spaetburgunder, Primitivo and Alvarinho resolve to their existing Pinot Noir, Zinfandel and Albariño identities. Alias results state which countries are actually represented. R5 batch A adds a specific dry Primitivo di Manduria DOC profile from Puglia, displayed as Primitivo (Zinfandel), alongside existing US Zinfandel expressions. Generic Moscato/Muscat searches span the represented Muscat family; Moscato d'Asti stays appellation-specific.

Sweetness uses explicit expression metadata, or the existing editorial score anchors when absent. Dry-to-off-dry ranges appear under off-dry, not guaranteed dry. Food phrases such as “white pizza” remain intact. See [Search semantics](docs/search-semantics.md) for the matching policy, evidence and regression coverage.

## Coverage

107 region/style entries and 136 grape-expression profiles across 22 countries, built on 57 grape or represented-blend baselines. Coverage deliberately combines the classics a newcomer is most likely to buy (Bordeaux, Burgundy, Rioja, Napa, Marlborough, Mendoza Malbec, Pinot Grigio, Prosecco, Champagne, Beaujolais, Rías Baixas Albariño, Chablis, Primitivo di Manduria, Valpolicella, Amarone, Rueda Verdejo, Stellenbosch Pinotage, Fino/dry Oloroso/sweet PX Sherry, medium-sweet Boal Madeira and dry Alvarinho Vinho Verde) with discovery regions and indigenous grapes (Georgia, Greece, Armenia, Romania, Bulgaria, Ukraine, the Canary Islands, Uruguay and Mexico).

R5 batches B/C add selected classic families and everyday wines; see [batch B](docs/classic-families-batch-b.md) and [batch C scope, evidence limits and validation](docs/everyday-coverage-batch-c.md). Fortified Compare permits dry/sweet learning contrasts while displaying actual wine colour and production differences; discovery remains stricter.

Many grapes appear in two or more regions so Compare can show how place changes a grape: for example Malbec in Mendoza, Salta and Cahors, Chenin Blanc in Stellenbosch and Swartland, Sauvignon Blanc in Sancerre, Marlborough and Steiermark, Pinot Gris in Alto Adige and Alsace, Riesling in the Mosel, Rheingau, Wachau, Alsace and Clare Valley.

See [R5 batch A](docs/familiar-names-batch-a.md) for the six new modeled expressions, primary evidence and exact-versus-unrepresented search coverage. Later R5 batches remain queued.

## Scores

A rendered profile is **grape / represented-blend baseline + regional modifiers**, clamped to 0–5 and kept to half-point steps.

All scores are approximate editorial judgments for the named modeled expression, not laboratory measurements or quality ratings. Alcohol and sweetness use the following broad anchors:

| Score | Alcohol (typical ABV) | Sweetness |
| --- | --- | --- |
| 0 | under ~6% | bone dry (e.g. Brut Nature) |
| 1 | ~8.5% | dry (including Brut sparkling) |
| 2 | ~10.5% | off-dry |
| 3 | ~12.5% | medium-sweet |
| 4 | ~13.75% | sweet |
| 5 | 15% or more, including fortified | lusciously sweet |

The alcohol scale interpolates between approximate anchors; it does not report a bottle’s measured ABV. Sweetness is a broad sensory category, not measured residual sugar. Body, acidity, tannin, fruit, oak and earth are relative judgments; producer, vintage and bottle age vary.

Identical rounded scores are allowed and reported by the advisory content audit; no numeric difference should be invented just to populate Compare. See [modeled expressions and evidence](docs/profile-methodology.md) and the [remaining evidence audit](docs/evidence-audit.md).

Every profile declares its selected style, production scope, composition status and ageing time basis. Sources distinguish reviewed claim groups from legacy background leads and explicitly track evidence gaps. R3 preserves all existing wine scores and profile URLs.

## Discovery routes

“Where to go next” distinguishes close modeled styles from explicitly labeled contrasts. Close matches must agree on colour, selected sweetness, production class and qualitative bubble style and pass a conservative structural-distance threshold. The atlas may show fewer than three routes; indigenous grapes receive no automatic adventurous bonus. Compare remains broad enough for learning from contrasts. See [Honest Discovery](docs/discovery-methodology.md) for the policy and regression coverage.

## Tech

The runtime is HTML, CSS and vanilla JavaScript only. No backend, framework, analytics or external API is required at runtime. Wine knowledge lives in structured JSON. CI installs **jsdom** as a development-only dependency for DOM regression tests.

## Architecture

```text
/
├── index.html
├── styles.css / ux.css / maturity.css / learning.css / advanced-compare.css / home-brand.css
├── wine-model.js          # shared metrics, normalization and compatibility
├── dom-utils.js           # plain-text DOM construction and HTTPS references
├── data-loader.js         # cached, bounded JSON requests
├── app.js                 # core data, profile selection, Explore rendering and events
├── compare-state.js       # atomic comparison state and notifications
├── advanced-compare.js    # comparison controls and cards
├── compare-discovery.js   # ranked comparison search
├── food-discovery.js      # pairing vocabulary, scoring and dish guidance
├── wine-search.js         # cached search index and constrained ranking
├── search-enhance.js      # Explore search presentation
├── smart-discovery.js     # Similar Wines and mood discovery
├── ux.js                  # welcome and instructional states
├── functional.js          # style metadata and winemaking choices
├── maturity.js            # maturity / vintage evolution
├── learning.js            # glossary, contextual terms and the taste explainer
├── home-brand.js          # landing artwork link
├── assets/                # world map, landing artwork
├── data/
│   ├── grapes.json        # grape / represented-blend baselines and metadata
│   ├── regions.json       # every region, its identity, Why entries and grape profiles
│   ├── taste-basics.json  # "How wine gets its taste" sections and profile examples
│   ├── glossary.json      # definitions, aliases, why-it-matters notes, sources
│   ├── winemaking.json    # sparse profile-specific vessel choices
│   ├── maturity.json      # sparse Young → Developing → Mature guidance
│   ├── locators.json      # approximate coordinates for locator maps
│   ├── food-aliases.json  # search-only food aliases → canonical pairing labels
│   ├── food-dishes.json   # dish preparation guidance and references
│   ├── wine-search.json   # constrained appellation / style search rules
│   └── sources.json       # reference names and HTTPS URLs
├── scripts/
│   ├── validate.py        # blocking data contracts
│   ├── content_audit.py   # advisory editorial checks
│   └── check-syntax.mjs   # JavaScript syntax check
└── tests/                 # jsdom regression suites and shared harness
```

### Runtime coordination

`app.js` owns core data, the active profile and the Explore / Compare mode. `compare-state.js` owns comparison selections. Feature layers subscribe to `wineatlas:*` `CustomEvent`s rather than polling or replacing core functions:

- `wineatlas:data-loaded` — core data is available; cached search indexes are invalidated
- `wineatlas:ready` — data and core controls are initialized
- `wineatlas:profile-selected` — a valid grape-region profile is active
- `wineatlas:selection-needed` — the UI needs another user choice
- `wineatlas:mode-changed` — Explore / Compare changed
- `wineatlas:comparison-changed` — a validated comparison transaction committed
- `wineatlas:winemaking-rendered`, `wineatlas:maturity-rendered`, `wineatlas:special-style-rendered` — optional sections finished rendering

Compare and Similar Wines each have a single implementation (`advanced-compare.js`, `smart-discovery.js`). Search keeps a plain fallback in `app.js` if `search-enhance.js` is absent.

### Loading and state boundaries

`WineData.json()` caches one bounded request per local JSON path. Required data has a 10-second timeout; optional enrichment (food aliases, dish guidance, winemaking, maturity, glossary, taste basics) has 3-second timeouts and empty fallbacks, retried on reload.

`WineComparison.replace()` replaces all three slots atomically and rejects duplicate or incompatible profiles. Each transaction emits one change event; DOM selectors are views, not a second state store.

### Rendering and safety

Repository data is treated as data, not markup. New rendering uses DOM nodes and `textContent`. Retained templates use `escapeHtml()` / `escapeAttr()` only for HTML text and quoted attributes. Reference links must be absolute HTTPS URLs without credentials or control characters, enforced at runtime and by validation.

The learning layer replaces matching text nodes with accessible glossary buttons and skips links, buttons, form controls, hidden content and the dialog itself.

## Data conventions

- `grapes.json` stores explicit `color` and `indigenous` metadata; UI logic never infers them from scores.
- Indigenous grapes list their `origin` countries. The **Indigenous grape** badge appears only where the grape is native — Saperavi in Georgia, not in Kuban or Odesa.
- `aromatic: true` marks strongly aromatic varieties (Riesling, Sauvignon Blanc, Gewürztraminer, Muscat, Viognier, Albariño). The Aromatic mood uses this flag.
- `kind: "blend"` marks represented blends (Port, Provence rosé, Champagne Brut NV) so a multi-variety wine is not presented as monovarietal.
- A region's `why` items can carry `grapes` to scope an explanation to specific profiles; a profile-level `why` replaces the regional list.
- Profile `style` objects describe every selected still, sparkling, sweet, fortified, rosé and orange expression: `family`, `color`, `sweetness`, `label`, `method` and `effect`. Compare groups by style family, and by grape colour for still wines.
- Soil and landscape language is cautious: the atlas describes drainage, water supply, heat and vine vigour, and treats words such as flint, slate or garrigue as tasting descriptors, not literal flavour transfer.
- `winemaking.json` and `maturity.json` are intentionally sparse; profiles without a meaningful entry show no section.
- Optional profile `displayName` gives a consumer-facing regional name, such as Primitivo (Zinfandel), while canonical grape IDs and synonyms remain stable.
- Search rules can constrain `productionClasses`; `unavailable` expressions require a coverage note and return no substitute.
- Food pairing labels are lowercase. `food-aliases.json` maps search-only spellings and translations to canonical labels; dish guidance in `food-dishes.json` is editorial and referenced.
- `locators.json` points are approximate, for locator diagrams only. `assets/world-map.svg` derives from public-domain Natural Earth data and shows no political borders.
- The landing ragdoll is inline vector geometry inside `assets/vineyard-welcome.svg`; CSS background SVGs cannot load external `<image>` dependencies.

## Validation

```bash
npm ci --no-audit --no-fund
npm run validate
```

This runs the JavaScript syntax check, `validate.py` (references, metrics, locators, Why scoping, expression/evidence and placeholder-note checks, glossary, taste-basics links, style metadata, HTTPS sources), the advisory `content_audit.py` (including identical rounded scores), and the jsdom suites (profile selection, search constraints, food aliases, glossary, comparison transactions, hostile input, startup errors, optional-data timeouts). CI runs the same command. Browser checks remain necessary for artwork or responsive CSS changes.

Release assets share a cache token in `index.html` so fresh HTML is never paired with stale CSS or JavaScript.

## Running locally

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`. Opening `index.html` with `file://` does not work because data loads with `fetch()`.

## GitHub Pages

```text
Settings → Pages → Deploy from branch → main → / (root)
```

## Disclaimer

> Wine profiles describe typical regional and varietal characteristics. Individual wines may differ substantially by vintage, producer, vineyard and winemaking. Terroir descriptions summarize growing conditions and common regional associations; they should not be read as claims that soil minerals or nearby plants directly transfer specific flavors into wine.
