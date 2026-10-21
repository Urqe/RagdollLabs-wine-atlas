# Wine Atlas release plan

Status: R1–R5 complete (R5 batch D implemented 2026-10-21). R6–R7 remain planned.
Created: 2026-10-19.  
Review baseline: main at `d819d99505b188f2319c37f0f4aa01153278438b` (120 profiles, 92 region entries, 47 grape/blend baselines).  
Release IDs below are planning identifiers, not published semantic versions.

## Priorities and sequencing

Fix misleading behavior and content before increasing the catalog. Preserve the static, curated reference model and existing canonical profile links wherever practical.

| Order | Release | Priority | Main outcome | Depends on |
| --- | --- | --- | --- | --- |
| R1 | Search with Meaning | P1 — high | Wine styles and qualified queries return relevant results | None |
| R2 | Find Your Place | P2 — medium | Predictable navigation, accessible focus and readable detail layouts | None; scheduled after R1 |
| R3 | Profiles You Can Trust | P2 — medium | Explicit modeled expressions, credible guidance and traceable evidence | R1/R2 for final integrated checks |
| R4 | Honest Discovery | P2 — medium | Recommendations explain meaningful similarities and contrasts | R3 |
| R5 | Familiar Names, Better Coverage | P3 — low | Close prominent grape, appellation and wine-style gaps in small batches | R1–R4 |
| R6 | America Beyond California | P3 — low | Focused US regions outside California, including smaller AVAs | R1–R4; normally follows R5's first batch |
| R7 | Canada: Frozen on the Vine | P3 — low | Canadian icewine with accurate production and comparison context | R1–R4; normally follows R6's first batch |

R5–R7 are independent content programs once the quality foundation is complete. Their first batches follow the order above; remaining candidates can be reprioritized without delaying bug fixes. No target dates are assigned.

## Working rules for every release

- Reproduce each relevant finding against the then-current main branch before implementing a fix; another change may already have addressed it.
- Keep scope small enough to review. Do not combine every expansion candidate into one large data update.
- Retain one shared profile computation, search engine and comparison model. Prefer existing data contracts to parallel implementations.
- Keep canonical grape IDs stable when adding synonyms. Model distinct expressions without silently breaking shared URLs; document any required migration or redirect.
- Use structured semantics for colour, sweetness, production and blend identity. Avoid inferring them from tasting prose.
- Preserve the existing cautious soil/terroir language. Do not imply literal transfer of rock or nearby-plant flavours into wine.
- Keep optional winemaking and maturity sections selective; missing useful evidence is a reason to omit a section, not fill it with boilerplate.
- Run the existing `npm run validate` checks and add regression coverage for the behavior being changed. UI releases also need real-browser checks; jsdom cannot validate layout, scrolling or Safari behavior.
- Check iPhone and iPad Safari as well as desktop Chrome, keyboard navigation and touch use. Record untested environments honestly.
- A release is complete only when its acceptance criteria and applicable checks pass. Completed release tasks are checked below; later releases remain unchecked.

## R1 — Search with Meaning

**Goal:** A request for a wine style should search wine attributes; an aroma query should search aromas.

**Review findings:** F01, F02, F06.

**Likely files:** `wine-search.js`, `data/wine-search.json`, `data/grapes.json`, `search-enhance.js`, `compare-discovery.js`, relevant tests and validators.

Implementation notes: see [Search semantics](docs/search-semantics.md). The R1 changes add search semantics and evidence-backed aliases; they do not add regions or change wine scores.

Validation: the full automated validation/regression suite covers the R1 acceptance criteria. iPhone/iPad Safari and physical touch-device checks remain unverified in this environment; they are not claimed as passed.

### Scope

- [x] Recognize rosé, orange/amber, red, white, sweet, dry, sparkling and fortified as structured search intents, with an explicit policy for ambiguous words such as rose/orange.
- [x] Keep sensory searches possible through an explicit aroma context or a clearly distinguished fallback. Rose-petal notes must not masquerade as rosé wine.
- [x] Combine family, colour, sweetness, grape, place and food constraints consistently. Structured qualifiers must remain available after an appellation or family rule consumes part of a query.
- [x] Use boundary-aware matching for identity terms rather than incidental substrings in unrelated prose.
- [x] Add a maintainable synonym mechanism. Initial aliases include Spätburgunder/Spaetburgunder for Pinot Noir, Primitivo for Zinfandel and Alvarinho for Albariño. Verify and document synonyms before adding them.
- [x] Separate grape identity from regional coverage: recognizing Primitivo does not imply that Puglia is already represented.
- [x] Review the broad `moscato` alias, currently restricted to Moscato d'Asti, so generic grape searches do not accidentally hide other represented Muscat expressions.
- [x] Keep Explore and Compare on the same semantics and retain accent-insensitive matching.

### Acceptance criteria

- [x] `rosé` excludes still Gewürztraminer; `white` excludes still red Burgundy Pinot Noir.
- [x] `sweet` does not include a dry wine merely because its prose says “sweet oak”.
- [x] `orange wine` finds skin-contact wines without matching dessert wines solely for orange-fruit notes.
- [x] `sparkling dry` finds appropriate dry sparkling profiles; `sparkling sweet` finds Moscato d'Asti.
- [x] Existing Champagne, crémant, Cava and Prosecco constraints and food aliases remain correct.
- [x] Synonym queries resolve the intended existing grape identities and honestly expose regional coverage limits.
- [x] Equivalent queries produce consistent candidates in Explore and Compare.

## R2 — Find Your Place

**Goal:** Every view transition leaves users oriented, including on smaller screens and with a keyboard.

**Review findings:** F03, F04, F05, F09.

**Likely files:** `app.js`, `ux.js`, `gallery.js`, `advanced-compare.js`, `compare-state.js`, `functional.js`, `styles.css`, `ux.css`.

Implementation notes: see [Navigation and history](docs/navigation.md). Automated regression tests cover view restoration, legacy links, comparison validation, focus, and status messages. Desktop Chrome checks cover layout and navigation; iPhone/iPad Safari and physical touch-device checks remain unverified.

### Scope

- [x] Fix gallery-to-profile scroll behavior. Bring the new profile heading into view and give keyboard/screen-reader users a meaningful focus destination.
- [x] Apply an explicit scroll/focus policy to recommendation, search and comparison transitions. Preserve expected browser Back/Forward restoration.
- [x] Fix the identity/production definition-list grid to match the renderer's actual row wrappers. Verify long descriptions and narrow screens.
- [x] Represent Gallery and Compare in navigable state. Restore the visible view and valid comparison selections after refresh and Back/Forward; provide a shareable comparison URL.
- [x] Keep existing `?grape=...&region=...` links working and validate unknown, duplicate or incompatible comparison keys.
- [x] Ensure live-status messages describe the visible selection rather than an earlier empty state.
- [x] Add a user-facing label for `white-gold` and check every allowed colour value has a consistent display label.

### Acceptance criteria

- [x] Gallery → USA → Napa Cabernet opens at the profile heading, not near the footer; focus is not abandoned on a hidden card or document body.
- [x] Regional identity and production fields remain readable at phone, tablet and desktop widths, without alternating 84/96-pixel content columns.
- [x] Profile → Gallery → another profile → Back returns to Gallery with useful position restoration.
- [x] A comparison can be refreshed/shared and restored without silently reverting to a previous Explore profile.
- [x] Remove controls and subsequent keyboard actions retain useful focus.
- [x] Sweet white profiles display a readable colour label rather than `white-gold`.

## R3 — Profiles You Can Trust

**Goal:** Make clear what each profile represents, what the guidance means and which evidence supports it.

**Review findings:** F08, F10, F11, F12, F13, F14.

**Likely files:** `data/regions.json`, `data/grapes.json`, `data/sources.json`, `data/taste-basics.json`, `data/maturity.json`, `scripts/validate.py`, `scripts/content_audit.py`, source rendering and documentation.

Implementation notes: see [Modeled expressions and evidence](docs/profile-methodology.md) and the [prioritized evidence audit](docs/evidence-audit.md). R3 names all 120 modeled expressions while preserving existing scores and IDs. It addresses the priority factual conflicts with 16 reviewed targeted references; 59 legacy records remain background leads pending claim-level metadata review, with gaps explicitly recorded for every profile. Missing book editions/pages remain flagged rather than invented.

Validation: full automated regression/data checks, including expression and evidence-contract fixtures. Deployed desktop Chrome smoke checks cover expression labels, linked styles, sources and comparison context. iPhone/iPad Safari and physical touch-device checks remain unverified.

### Scope

- [x] Give each profile an explicit modeled expression. Initial corrections: Vouvray's selected sweetness/style, dry Tokaj Furmint and white-vinified Kakheti Rkatsiteli.
- [x] Align scores, expectation copy, production metadata, serving advice and comparison context. Link to separately represented amber/sweet expressions where useful.
- [x] Identify representative blends clearly: review Cabernet-led and Merlot-led Bordeaux, Grenache-led Southern Rhône and the represented Cava expression. Distinguish a grape-led reference from a guaranteed monovarietal bottle.
- [x] Review ageing ranges, starting with Bordeaux and Burgundy. Distinguish ordinary regional examples from selected ageworthy wines, and specify whether time is from vintage, bottling or release as appropriate.
- [x] Make storage and producer/vintage dependence clear where they change the advice. Review decanting guidance for young versus fragile mature examples.
- [x] Replace the blocking “identical scores for the same grape” rule with an advisory editorial check. Retain blocking checks for invalid metrics, broken references and other genuine data-contract failures.
- [x] Document editorial scores as approximate typical-style judgments. Do not introduce unsupported numeric differences solely to make Compare look more informative.
- [x] Correct the beginner explainer: common second-fermentation methods are not universal; Moscato d'Asti uses an interrupted single fermentation. Include direct pressing alongside short skin contact for rosé.
- [x] Improve source records with specific pages/technical sheets, publisher or authority, access/review dates, and book edition/chapter/page details where available.
- [x] Associate evidence with modeled expressions or claim groups, particularly production, ageing and factual regional claims. Separate editorial score judgments from factual citations.
- [x] Audit existing references in risk order. The review found 38 of 56 URLs pointed to website roots; this is an auditability concern, not proof that their claims are false.
- [x] Provide understandable methodology/source presentation without making the main profile hard to read.

### Acceptance criteria

- [x] A reader can identify the modeled sweetness, colour, production style and blend status without reconciling contradictory sections.
- [x] Kakheti's white reference no longer describes its low-tannin score as representing amber skin-contact wine.
- [x] Broad Bordeaux/Burgundy profiles do not imply all bottles warrant premium-wine cellaring windows.
- [x] Identical rounded scores are allowed when evidence and other content justify the profiles.
- [x] The beginner guide agrees with the app's Moscato and rosé production entries.
- [x] High-risk factual claims have usable supporting references; remaining evidence gaps are tracked explicitly.
- [x] Revised labels/data preserve existing links or provide a documented compatibility path.

## R4 — Honest Discovery

**Goal:** Recommendations should explain either a real similarity or a deliberate contrast.

**Review finding:** F07.

**Likely files:** `smart-discovery.js`, `wine-model.js`, comparison presentation, structured metadata if justified, regression tests.

Implementation notes: see [Honest Discovery](docs/discovery-methodology.md). Close routes now require matching selected style semantics and a documented structural threshold. Sparse catalogs can show fewer cards or explicit contrasts. No regions, profile IDs, metric scores or broad comparison rules change; the R3 evidence backlog remains open.

Validation: full automated regression suite, including threshold boundaries, sparse fixtures, explanation checks and catalog-wide invariants. Deployed desktop Chrome smoke checks cover Moscato and Pinot Noir contrasts, coverage labels, profile navigation and comparison context. iPhone/iPad Safari and physical touch-device checks remain unverified.

### Scope

- [x] Evaluate sweetness, production method and pressure/style where meaningful in addition to broad family and numeric distance.
- [x] Keep “can be compared” separate from “is a close substitute”. Broad comparison families may remain useful for learning.
- [x] Define a defensible similarity threshold; do not force three similar recommendations when no convincing candidates exist.
- [x] Present fewer recommendations or label a contrast explicitly when the catalog is sparse.
- [x] Replace generic “comparable production context” copy with the actual common ground and material differences.
- [x] Check that “same grape, different place” does not conceal a major change in colour or production.
- [x] Verify “adventurous” reflects a meaningful discovery rather than automatically treating every native grape as unusual.

### Acceptance criteria

- [x] Moscato d'Asti → dry Cava/Prosecco is explained as a contrast where appropriate, not an interchangeable sweetness/production match.
- [x] Pinot Noir blanc de noirs → Pinot Noir sparkling rosé acknowledges colour/production differences.
- [x] Similarity reasons mention useful shared characteristics rather than only incidental zero scores.
- [x] Sparse families remain honest about the number and strength of available recommendations.

## R5 — Familiar Names, Better Coverage

**Goal:** Close prominent gaps in recognizable wines before pursuing completeness.

**Priority:** Low; start after R1–R4. Use multiple small content batches, each normally 4–8 new profiles with its own evidence review.

### Ordered candidate batches

| Batch | Candidates | Main learning value |
| --- | --- | --- |
| A — Familiar regional contrasts | Chablis Chardonnay; Primitivo/Puglia; Corvina-led Valpolicella and Amarone as distinct expressions; Verdejo/Rueda; Pinotage/South Africa | Recognizable labels, varietal synonyms, production-driven differences |
| B — Missing classic families | Sherry/Jerez with selected distinct styles; Madeira with an explicitly selected grape/sweetness style; Vinho Verde with Alvarinho and/or Loureiro | Dry versus sweet fortified wines, oxidative ageing, Atlantic whites |
| C — Broader everyday coverage | Montepulciano/Abruzzo; Nero d'Avola/Sicily; Monastrell/Jumilla; Mencía/Bierzo; white Rioja | High-value gaps in commonly encountered grapes and regions |
| D — Further regional identity | Châteauneuf-du-Pape; Bandol/Mourvèdre; Muscadet/Melon; Torrontés/Argentina; dry Sémillon/Hunter Valley | Regional blends, savoury reds, fresh/aromatic whites and bottle evolution |

### Batch progress

- [x] A — Familiar regional contrasts: six profiles implemented. See [batch notes, sources and validation](docs/familiar-names-batch-a.md).
- [x] B — Missing classic families: five profiles implemented. See [batch notes, sources and validation](docs/classic-families-batch-b.md).
- [x] C — Broader everyday coverage: five profiles implemented. See [batch notes, sources and validation](docs/everyday-coverage-batch-c.md).
- [x] D — Further regional identity: five profiles implemented. See [batch notes, sources and validation](docs/regional-identity-batch-d.md).

Current coverage: 141 profiles, 112 region/style records, 59 grape/blend baselines, 22 countries. All four planned R5 batches are implemented. R6 America Beyond California is next, followed by R7 Canadian icewine; later content candidates remain subject to evidence and priority.

### Requirements and acceptance criteria

The completed checks below apply to all four implemented R5 batches and should be repeated for future content expansions.

- [x] Confirm the intended appellation/style and evidence before finalizing every candidate. These are a queue, not claims that all regional wines share one style.
- [x] Use proper blend and production modeling; do not present Amarone as generic Corvina or Sherry/Madeira as uniformly sweet.
- [x] Review colour and sweetness compatibility when dry fortified expressions are introduced. Broad educational Compare remains; explicit sweetness/colour/production contrasts and stricter discovery prevent substitute claims.
- [x] Resolve consumer-facing names in search; distinguish an exact represented profile from a broader related regional reference.
- [x] Each profile has sources, a locator, useful pairings, practical serving guidance and a specific reason to exist.
- [x] Expand maturity/winemaking sections only when genuinely useful.
- [x] Recheck search, comparison and discovery after every batch. Update coverage counts in the same content release.


## R6 — America Beyond California

**Goal:** Add focused US appellations outside California, including smaller and less familiar regions. The existing Willamette Valley entry remains; do not count it again as new coverage.

**Priority:** Low. First batch target: five region entries and six profiles, subject to sufficient evidence.

### First batch

| Region | State(s) | Initial modeled expression | Comparison opportunity |
| --- | --- | --- | --- |
| Red Mountain AVA | Washington | Cabernet Sauvignon | Existing Napa, Bordeaux and Coonawarra profiles |
| Walla Walla Valley AVA | Washington / Oregon | Syrah | Existing Northern Rhône, Barossa and Swartland profiles |
| Finger Lakes AVA | New York | Explicitly dry Riesling | Existing dry Riesling profiles; distinguish the off-dry Mosel reference |
| Monticello AVA | Virginia | Cabernet Franc and Viognier | Chinon and Condrieu respectively |
| Old Mission Peninsula AVA | Michigan | Explicitly dry Riesling | Finger Lakes and other dry Riesling expressions |

These comparisons are editorial questions to investigate, not predetermined numerical differences. Red Mountain and Old Mission provide small-AVA coverage; Finger Lakes and Walla Walla are broader focused regions, not micro-appellations.

### Later candidates, in small batches

- [ ] North Fork of Long Island, New York — Merlot.
- [ ] Snake River Valley, Idaho / Oregon — Syrah; consider Eagle Foothills as a smaller subregion only if the evidence supports a distinct expression.
- [ ] Texas Hill Country — investigate a locally grown Tempranillo expression. Distinguish vineyard/appellation origin from a winery's address; do not treat Texas High Plains fruit as Hill Country fruit.
- [ ] Umpqua Valley / Applegate Valley, Oregon — select an evidence-supported expression that adds value beyond existing Willamette Pinot Noir.
- [ ] Leelanau Peninsula, Michigan — assess whether a second Michigan profile teaches enough to warrant a separate entry.

### Requirements and acceptance criteria

- [ ] Verify AVA boundaries, canonical names and grape relevance using regional bodies, official appellation material and representative producer technical sheets.
- [ ] Reflect cross-state AVAs correctly, including Walla Walla and Snake River Valley. Avoid labeling the whole appellation as belonging to only one state.
- [ ] Keep state names searchable and visible where useful without turning country into inconsistent values such as “USA — Virginia”.
- [ ] Do not assign numerical contrasts in advance or generalize an unusually famous producer/subregion to an entire AVA.
- [ ] Ensure US discovery has meaningful coverage outside California without duplicating existing entries.
- [ ] Apply R3's evidence and expression rules and run all applicable content/search checks.

## R7 — Canada: Frozen on the Vine

**Goal:** Introduce Canadian icewine as a distinct sweet-wine production story.

**Priority:** Low. First batch: Niagara Peninsula, Ontario, with Vidal and Riesling icewine. Consider Cabernet Franc icewine as a third profile if evidence and presentation are ready.

### Scope

- [ ] Add Canada to the existing country/gallery/locator flows through normal data-driven mechanisms.
- [ ] Add a properly sourced Vidal/Vidal Blanc grape baseline. Identify it accurately as a hybrid; do not imply it is an indigenous Canadian vinifera variety.
- [ ] Add Niagara Vidal icewine and Niagara Riesling icewine as explicitly sweet expressions; optionally add Cabernet Franc icewine with its correct appearance and production context.
- [ ] Confirm whether the current one-grape/one-region key can express all selected profiles cleanly. Use explicit expression modeling if necessary rather than overwriting a future dry Niagara profile.
- [ ] Explain naturally frozen-on-the-vine grapes and pressing while frozen, concentration, retained sugar and acidity.
- [ ] Distinguish Canadian icewine from artificially frozen-grape wines, late-harvest wines, botrytised wines and fortified wines. Verify terminology and requirements against current provincial authorities at implementation.
- [ ] Add icewine / ice wine search aliases, glossary/taste-guide context and appropriate serving, dessert/cheese pairing and ageing guidance.
- [ ] Compare within the sweet family: highlight freeze concentration versus noble rot or shriveling, rather than describing all sweet wines as equivalent.
- [ ] Consider a later Okanagan Valley, British Columbia, Riesling icewine profile. Reconfirm current regional production and availability before committing; Ontario's rules must not be assumed to apply unchanged in BC.
- [ ] Keep German/Austrian Eiswein as a later optional comparison, not a prerequisite for this Canadian release.

### Acceptance criteria

- [ ] Searches for Canada, Canadian icewine, ice wine, Niagara and Vidal find appropriate profiles.
- [ ] Scores and wording distinguish icewine from dry Riesling and explain sweetness balanced by acidity.
- [ ] No guidance implies fortification, noble rot or artificial freezing is the defining Canadian icewine process.
- [ ] Vidal identity, production terminology and province-specific factual claims have direct authoritative sources.
- [ ] Colour, comparison compatibility, discovery and glossary behavior work for the new expressions.
- [ ] Ageing advice is qualified by grape, producer and storage rather than promising every icewine decades of improvement.

## Review finding traceability

| Finding | Review issue | Planned release |
| --- | --- | --- |
| F01 | Style searches return misleading prose matches | R1 |
| F02 | Qualified queries such as “sparkling dry” return no results | R1 |
| F03 | Gallery-to-profile scroll/focus disorientation | R2 |
| F04 | Definition-list grid mismatch | R2 |
| F05 | Gallery/Compare history, refresh and sharing state | R2 |
| F06 | Missing familiar grape synonyms | R1; regional expressions added in R5 |
| F07 | Recommendations overstate similarity | R4 |
| F08 | Validation requires artificial score uniqueness | R3 |
| F09 | Raw white-gold badge value | R2 |
| F10 | Multiple styles presented through one ambiguous profile | R3 |
| F11 | Overbroad ageing guidance | R3 |
| F12 | Blend-based profiles need clearer identity | R3 |
| F13 | Overly absolute beginner production explanations | R3 |
| F14 | Sources are difficult to audit at claim/expression level | R3 |
| Gaps | Original review's missing grapes, regions and wine families | R5 |
| New request | Smaller US regions outside California | R6 |
| New request | Canadian icewine | R7 |

## Research starting points

These are starting references, not approval of every proposed tasting score or regional generalization. Recheck them during implementation and add exact technical evidence for each final expression.

### Corrections and methodology

- [Bordeaux: red-wine styles, serving and ageing](https://www.bordeaux.com/en/choosing-a-wine/red/)
- [Bordeaux: grape varieties and blending](https://www.bordeaux.com/en/grape-varieties/)
- [Consorzio Asti: Moscato d'Asti](https://astidocg.it/en/wines/moscato-dasti-docg/)
- [WSET: Asti production and single fermentation (PDF)](https://www.wsetglobal.com/media/1426/articles-2013_-asti.pdf)
- [Vins de Provence: rosé production](https://www.vinsdeprovence.com/en/le-rose/l-elaboration-du-rose)
- [UC Davis: Zinfandel and Primitivo](https://fps.ucdavis.edu/grapebook/winebook.cfm?chap=Zinfandel)
- [Wines of Germany: Spätburgunder](https://winesofgermany.co.uk/grape/spatburgunder/)

### US regional expansion

- [Washington State Wine Commission: Red Mountain](https://www.washingtonwine.org/resource/red-mountain/)
- [Washington State Wine Commission: AVA boundaries and regional profiles](https://www.washingtonwine.org/regions-and-avas/)
- [New York Wine & Grape Foundation: grape varieties](https://newyorkwines.org/grapes/)
- [Virginia Wine: grape varieties](https://pages.virginiawine.org/varietals/)
- [Virginia tourism: Monticello Wine Trail](https://www.virginia.org/blog/post/charlottesville-wineries/)
- [Michigan tourism: Old Mission Peninsula](https://www.michigan.org/article/trip-idea/things-to-do-old-mission-peninsula-ultimate-pure-michigan-guide)
- [Idaho Wine Commission: regional grape varieties](https://idahowines.org/idahos-top-wine-varietals/)

### Canadian icewine

- [Wine Country Ontario: icewine production](https://winecountryontario.ca/icewine/)
- [Wine Country Ontario: Canadian wine overview (historical PDF)](https://winecountryontario.ca/wp-content/uploads/2019/05/wines_of_canada_brochure_2016.pdf)
- [Wines of British Columbia: historical icewine harvest and production context](https://winebc.com/industry/media_releases/freezing-temperatures-bring-icewine-harvest-to-bc-wineries/)

Consult current provincial appellation/regulatory material for exact icewine requirements. Historical references establish context and must not be used as evidence of current harvest volumes, availability or unchanged regulations.
