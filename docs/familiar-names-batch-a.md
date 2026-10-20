# R5 batch A — Familiar regional contrasts

Implemented 2026-10-20. This is the first six-profile batch of the R5 program. Batches B–D remain planned. Existing grape IDs, profile IDs, baseline scores and regional modifiers are preserved.

## Coverage

| Profile | Canonical route | Selected expression / evidence |
| --- | --- | --- |
| Chablis AOC | `chardonnay / chablis` | Dry, steel-led Chardonnay with little overt oak. BIVB explains appellation levels and drinking context; Ropiteau documents mostly steel with a small barrel fraction. The profile does not call every Chablis unoaked. |
| Primitivo di Manduria DOC, Puglia | `zinfandel / primitivo-manduria` | Selected dry DOC expression, based on the Lirica technical sheet. “Primitivo (Zinfandel)” is a local display name; the existing verified grape identity and Primitivo alias remain shared with US profiles. |
| Valpolicella Classico DOC | `corvina / valpolicella` | Young, fresh-grape Corvina-led blend, supported by Speri and Allegrini producer material. It is neither Ripasso nor Amarone. |
| Amarone della Valpolicella Classico DOCG | `corvina / amarone` | Selected dry Corvina-led blend using appassimento before fermentation. Zenato and Allegrini document differing blend/maturation choices; their examples do not establish one compulsory recipe. |
| Rueda DO Verdejo | `verdejo / rueda` | Fresh dry Verdejo reference with aromatic fruit, herbal notes and optional lees texture. The DO body and José Pariente establish grape/style context and demonstrate that vessels vary. |
| Stellenbosch Pinotage | `pinotage / stellenbosch` | Structured dry oak-aged estate-style reference. Kanonkop 2023 provides a directly usable blend/analysis/production sheet; its cellaring estimate is expressly producer/vintage-specific. |

The catalog now contains **126 profiles, 97 region/style entries, 50 grape/blend baselines and 22 countries**. Six profiles add five region/style records: Pinotage uses the existing Stellenbosch region. Valpolicella and Amarone share a geographic zone and locator but represent separate expressions; this is not a claim of five wholly new geographic wine areas.

New Corvina, Verdejo and Pinotage baselines are approximate editorial judgments. Existing profiles are not numerically adjusted to manufacture contrast. Producer ABV and residual sugar inform the selected expression but are not copied into a claim that all bottles have that chemistry. Pinotage is not given an automatic indigenous/discovery flag or rarity claim.

## Evidence and advice

Reviewed records provide specific URLs, publisher/authority, page/section locators and access/review dates in `sources.json`. The source drawer associates them with claim groups. Consortium publisher text for the Amarone/style and regional-varieties summaries was available through indexing, while direct consortium pages timed out; those limitations are recorded. Independently accessible producer technical material supports the important production and dry-style distinctions.

The UC Davis Zinfandel/Primitivo reference was rechecked and promoted from a legacy metadata lead to a reviewed identity reference. Current source status is **31 reviewed references and 58 background records still needing claim-level metadata review**. A reviewed reference does not mean the whole profile has been verified. Every new profile states its remaining evidence limits. Regional identities stay modest where site-specific evidence is missing, and location dots are approximate reference points, not appellation boundaries.

Serving, pairings and decanting combine sourced examples with explicitly editorial practical guidance. Chablis has an appropriately bounded young-drinking reference; Manduria and Rueda do not acquire invented long-ageing windows. Amarone is ready only after producer maturation and has no universal extra-cellaring promise. Kanonkop’s cited Pinotage window is identified by producer/vintage rather than applied to all Stellenbosch bottles. No optional maturity/vessel sections were filled with boilerplate. Appassimento has a sourced glossary entry because it explains the key new production distinction.

## Search and presentation

`WineModel.profileName()` provides the regional display name where present, otherwise the canonical grape name. Explore titles, search results, live status, place-specific grape options, Gallery, discovery cards and Compare use it. IDs and the shared grape remain unchanged. Thus `Primitivo Italy` now finds the actual Manduria profile, while `Primitivo Lodi` continues to identify a US Zinfandel expression. Country-coverage notices update dynamically.

Appellation rules keep the named expressions precise:

- `Chablis` selects Chablis AOC, not the old broad Burgundy reference.
- `Valpolicella` selects the fresh-grape Classico reference; `Amarone` and its longer names select the separate dried-grape profile. `Corvina` can find both modeled blends.
- `Rueda` selects the represented Verdejo expression, not every permitted Rueda wine type.
- `appassimento` filters the structured `dried-grape-red` production class rather than matching prose that says “without appassimento”.

Explicit `unavailable` rules return no substitute and explain the coverage gap for Ripasso, Recioto, Primitivo Dolce Naturale, Petit Chablis and Chablis Premier/Grand Cru. Longer phrases take precedence over a shorter represented appellation. These are catalog-coverage statements, not claims that such wines do not exist. The same notices appear in Explore and Compare; unsupported expressions cannot be smuggled into results through explanatory prose.

## Comparison and discovery

Amarone remains a dry still red for broad educational comparison. Its `dried-grape-red` production class separates it from fresh-grape Valpolicella in the stricter R4 close-style test. The same-grape route is explicitly a contrast and names appassimento. Compare displays that production difference alongside the editorial scores. New white and red profiles use the existing colour/sweetness rules; dry fortified compatibility is deliberately deferred until R5 batch B introduces such an expression.

## Validation

`npm run validate` includes the existing suites plus `tests/familiar-names.mjs`: all six deep links, coverage counts, reviewed sources/gaps, pairings/locators, exact and unsupported names, display-name consistency, appassimento glossary links, related-profile navigation, discovery contrast, Compare and Explore/Compare search parity. Data-contract fixtures reject invalid display names, missing unavailable-query explanations and an invalid white/dried-red production combination.

Desktop Chrome smoke checks verify the deployed new profiles, search coverage notices and the Valpolicella/Amarone distinction. iPhone/iPad Safari and physical touch-device checks remain unverified.
