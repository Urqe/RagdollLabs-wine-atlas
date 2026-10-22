# R11 — Learn to Taste

Implemented 2026-10-22. Extends Your First Glass; existing vocabulary URLs, flights and catalog remain available.

## Learning experience

The entry page offers a primary tasting-method route (`?view=learn&lesson=taste`), a direct vocabulary route and the existing comparison skip. The method covers setup, look, smell before/after gentle swirling, a small sip, finish and independent notes. It separates aroma, basic taste, drying texture, bitterness and warmth without an exclusive tongue map. No bottle is needed to read, but reading or imagining is not described as practical sensory recognition. There is no pace or consumption target; spitting, small pours, stopping and skipping remain optional.

Each of the four vocabulary lessons has an optional practical panel. A learner gets selection/setup cues and a neutral observation prompt, then a scratchpad before the separately collapsed guidance and profile links. These are named learning examples, not blind challenges. Sources are optional Further reading links; review metadata stays in this document/data, not the lesson prose.

| Exercise | Suggested pair | Teaching purpose and limits |
| --- | --- | --- |
| Acidity | Dry Clare Riesling / dry Condrieu Viognier | Relative mouth-watering response; sugar, warmth, temperature and production can affect impressions. Dry Riesling/Viognier substitutions need matching producer descriptions. |
| Tannin | Lightly tannic regional Bourgogne Pinot Noir / structured Tannat-led Madiran | Relative drying grip in two reds; optional cooled plain tea distinguishes grip from bitter taste. Age, extraction, oak, blend and food matter. |
| Body | Reuse lighter dry Riesling / fuller dry Viognier | Weight separately from aroma, grip and quality; not an alcohol or viscosity measurement. Choose the intended expressions rather than relying on a place name. |
| Sweetness | Confirmed dry Riesling / Ontario Riesling Icewine | Taste sugar separately from fruit aroma and salivation. Dry Niagara or generic late harvest is not the intended substitution. |

Serving suggestions are editorial setup choices, not regulatory rules. No purchase or particular brand is required. Relative lower/middle/higher, similar and uncertain responses are allowed. No score edits or artificial model differences are needed; the interface never marks sensory perception correct or incorrect.

## Architecture and scope

`data/beginner-journey.json` adds structured method, practice contrasts and scoped teaching references. The existing Journey renderer/router owns the new reserved taste step; no second learning or comparison state model is introduced. Existing profile computations supply canonical link names. Both practice-profile links retain a lesson return route.

Scratch notes are limited to 2,000 characters and held only in a renderer-owned Map keyed by lesson. They survive lesson/profile exploration during the current document lifetime, clear on reload, and are never placed in URLs, localStorage, sessionStorage or transmitted. Text renders through DOM text/value APIs. They are a disposable aid, not a persistent tasting notebook or account feature.

Malformed optional practice fails softly without blocking the four vocabulary lessons or browsing. Invalid method steps show an unavailable message with a useful next step. Source URLs require HTTPS at runtime; the blocking validator checks steps, canonical distinct wine references, two reds for tannin, teaching-source references and required fields. No new profile or score changes, new flight, blind mode or certification claim is included.

## Teaching references reviewed 2026-10-22

The following support only the practical lesson claims noted here. They do not close unrelated profile evidence gaps, confirm every bottle, or establish this app’s educational efficacy. The procedure and prompts are original; no proprietary tasting grid, aroma wheel or certification text is reproduced.

- [WSET · How to taste wine](https://www.wsetglobal.com/knowledge-centre/blog/2023/december/19/how-to-taste-wine): Look, smell, swirl, sip and finish; original beginner sequence, not a reproduced tasting grid.
- [WSET · Understanding acidity](https://www.wsetglobal.com/knowledge-centre/blog/2026/understanding-acidity-in-wine/): Mouth-watering response; Riesling versus Viognier tendencies, sugar and warmth as confounders.
- [WSET · Viognier](https://www.wsetglobal.com/knowledge-centre/blog/2021/april/26/understanding-grapes-spotlight-on-viognier): Typically dry, lower acidity and fuller body; Condrieu and oak choices vary.
- [Joseph Drouhin · Bourgogne Pinot Noir 2023](https://www.drouhin.com/en_US/wine/bourgogne-pinot-noir/2023): A producer example with light tannins, not every Burgundy bottle.
- [Madiran growers · Tannat](https://madiran-pacherenc.com/les-appellations/presentation-des-cepages/): Tannat tannin richness; does not establish an exact intensity for a bottle.
- [WSET · Mouthfeel](https://www.wsetglobal.com/knowledge-centre/blog/2026/the-secret-language-of-wine-what-is-mouthfeel): Astringency, tea analogy and texture; no score target.
- [Jim Barry · Lodge Hill Riesling 2026](https://www.jimbarry.com/wine/2026-lodge-hill-riesling): Clare Valley Riesling expression example; bottle selection must confirm dry, lighter style.
- [NIDCD · How taste works](https://www.nidcd.nih.gov/health/taste-disorders): Basic taste, aroma, texture and distributed taste receptors; no exclusive tongue map.
- [Wine Country Ontario · Icewine](https://winecountryontario.ca/icewine/): Naturally frozen grapes and sweet Ontario Icewine expression; not dry Riesling.
- [Wine Australia · Riesling](https://www.wineaustralia.com/market-insights/regions-and-varieties/riesling): Australian Riesling is typically light to medium-bodied with high acidity; includes Clare context, not a bottle guarantee.

The Pinot source is one producer/vintage example; Madiran growers establish a tannin-rich variety tendency. Pairing them is an editorial teaching choice, not a controlled experiment. The Australian Riesling and Viognier sources support broad body/acidity tendencies; users must still confirm the intended dry expressions. Existing Ontario evidence supports Icewine identity; the sweet finished expression is also described by Wine Country Ontario. Native promotional superlatives, health claims and universal ageing promises are not adopted.

## Copy review

Reviewed the journey, six flight lessons, taste guide and profile rendering for process-heavy copy in the teaching flow. Flight backlog prose was removed in the preceding copy release. R11 explains sensory scores only where useful, and keeps claim-review status in the optional Sources & methodology material. It does not delete provenance disclosures or rewrite every catalog description.

## Verification and remaining work

- Targeted practice tests cover the six-step route, optional guidance before/after observation, labeled notes, tab-memory retention across profile returns, no web storage/URL note leakage, reset on a fresh instance and malformed optional practice.
- Existing beginner tests now traverse the tasting-method step before the unchanged four-idea sequence and cover its direct URL. Validator fixtures reject unusable method steps, unknown teaching sources/profiles and white-wine tannin substitutions.
- Full `npm run validate`: passed, including all existing and new practical-learning suites. Deployed desktop Chrome entry, method, practice/profile returns and keyboard checks follow deployment.
- No novice observation or retention study has been performed. Practical usability and actual skill acquisition remain unverified; finishing the journey is explicitly not proof.
- Physical iPhone/iPad Safari, macOS Safari, real screen readers and enlarged-text/device layout remain open verification work. M2’s native landing-title correction is deployed; Chrome confirms heading focus is retained without its frame and Tab still visibly identifies Explore wines.

R12 adds aroma-reference recognition practice; R10 supplies deeper label guidance and R13 later adds actual concealed-identity practice. R11 is the practical method and structure foundation.
